from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="YuBiFlo Core Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/yubiflo")

def get_db():
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    try:
        yield conn
    finally:
        conn.close()

# Pydantic Schemas
class RestockPayload(BaseModel):
    merchant_id: int
    item_id: int
    quantity: float
    unit_cost: float
    unit_retail: float

class NewProductPayload(BaseModel):
    merchant_id: int
    name: str
    category: str
    unit_type: str
    unit_cost: float
    unit_retail: float
    initial_stock: float

# 1. Get Dashboard Summary & Inventory Table
@app.get("/api/v1/dashboard/{merchant_id}")
def get_dashboard(merchant_id: int, db=Depends(get_db)):
    with db.cursor() as cur:
        # Fetch items
        cur.execute("""
            SELECT id, name, category, unit_type, unit_cost, unit_retail, current_stock,
                   (unit_retail - unit_cost) AS expected_margin,
                   (current_stock * unit_retail) AS total_shelf_value,
                   (CASE WHEN current_stock <= low_stock_threshold THEN 'Low Stock Alert' ELSE 'Normal' END) AS velocity_badge
            FROM inventory_items
            WHERE merchant_id = %s
            ORDER BY id ASC;
        """, (str(merchant_id),))
        items = cur.fetchall()

        # Compute KPI Aggregations
        cur.execute("""
            SELECT 
                COALESCE(SUM(current_stock * unit_retail), 0.00) AS total_active_shelf_retail_value,
                COALESCE(SUM(current_stock * unit_cost), 0.00) AS total_capital_invested,
                COALESCE(SUM(current_stock * (unit_retail - unit_cost)), 0.00) AS locked_in_potential_gross_profit
            FROM inventory_items
            WHERE merchant_id = %s;
        """, (str(merchant_id),))
        kpis = cur.fetchone()

        avg_markup = 0.0
        if kpis["total_capital_invested"] > 0:
            avg_markup = round(float((kpis["locked_in_potential_gross_profit"] / kpis["total_capital_invested"]) * 100), 1)

        return {
            "kpis": {
                "total_active_shelf_retail_value": float(kpis["total_active_shelf_retail_value"]),
                "total_capital_invested": float(kpis["total_capital_invested"]),
                "locked_in_potential_gross_profit": float(kpis["locked_in_potential_gross_profit"]),
                "avg_markup_percentage": avg_markup,
                "total_active_items": len(items)
            },
            "inventory": items
        }

# 2. Restock-Trigger Engine Endpoint
@app.post("/api/v1/restock")
def restock_item(payload: RestockPayload, db=Depends(get_db)):
    with db.cursor() as cur:
        # A. Find active batch for this item to close out and calculate implied sales
        cur.execute("""
            SELECT id, batch_qty, unit_retail, unit_cost, received_at 
            FROM supply_batches 
            WHERE item_id = %s AND status = 'ACTIVE' 
            ORDER BY id DESC LIMIT 1;
        """, (str(payload.item_id),))
        active_batch = cur.fetchone()

        if active_batch:
            # Implied Sales Trigger: Previous batch was completely consumed
            qty_sold = float(active_batch["batch_qty"])
            revenue = qty_sold * float(active_batch["unit_retail"])
            profit = revenue - (qty_sold * float(active_batch["unit_cost"]))
            
            elapsed_hours = (datetime.now() - active_batch["received_at"]).total_seconds() / 3600.0

            # Log implied sales into ledger
            cur.execute("""
                INSERT INTO sales_ledger (merchant_id, item_id, batch_id, qty_sold, unit_retail, total_revenue, gross_profit, turnover_hours)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """, (str(payload.merchant_id), str(payload.item_id), str(active_batch["id"]), qty_sold, active_batch["unit_retail"], revenue, profit, elapsed_hours))

            # Mark batch as closed
            cur.execute("""
                UPDATE supply_batches 
                SET status = 'CLOSED_SOLD', closed_at = NOW() 
                WHERE id = %s;
            """, (str(active_batch["id"]),))

        # B. Create the new active batch
        cur.execute("""
            INSERT INTO supply_batches (merchant_id, item_id, batch_qty, unit_cost, unit_retail, status)
            VALUES (%s, %s, %s, %s, %s, 'ACTIVE');
        """, (str(payload.merchant_id), str(payload.item_id), payload.quantity, payload.unit_cost, payload.unit_retail))

        # C. Update item master table
        cur.execute("""
            UPDATE inventory_items 
            SET current_stock = %s, unit_cost = %s, unit_retail = %s 
            WHERE id = %s;
        """, (payload.quantity, payload.unit_cost, payload.unit_retail, str(payload.item_id)))

        db.commit()
        return {"status": "SUCCESS", "message": "Restock recorded, past batch auto-logged to sales."}

# 3. Create New Product
@app.post("/api/v1/products")
def create_product(payload: NewProductPayload, db=Depends(get_db)):
    with db.cursor() as cur:
        cur.execute("""
            INSERT INTO inventory_items (merchant_id, name, category, unit_type, unit_cost, unit_retail, current_stock)
            VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id;
        """, (str(payload.merchant_id), payload.name, payload.category, payload.unit_type, payload.unit_cost, payload.unit_retail, payload.initial_stock))
        new_id = cur.fetchone()["id"]

        if payload.initial_stock > 0:
            cur.execute("""
                INSERT INTO supply_batches (merchant_id, item_id, batch_qty, unit_cost, unit_retail, status)
                VALUES (%s, %s, %s, %s, %s, 'ACTIVE');
            """, (str(payload.merchant_id), str(new_id), payload.initial_stock, payload.unit_cost, payload.unit_retail))

        db.commit()
        return {"status": "SUCCESS", "item_id": new_id}
