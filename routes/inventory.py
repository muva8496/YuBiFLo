# routes/inventory.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from tenant_middleware import get_current_tenant_id

router = APIRouter(prefix="/api/v1/workspace", tags=["Tenant Inventory"])

@router.get("/inventory")
def list_workspace_inventory(
    tenant_id: str = Depends(get_current_tenant_id),
    db: Session = Depends(get_db)
):
    """
    Because RLS is enforced via 'SET LOCAL app.current_tenant_id',
    this query ONLY returns rows belonging to the active tenant.
    """
    query = text("""
        SELECT id, name, category, unit_type, unit_cost, unit_retail, current_stock,
               (current_stock * unit_retail) AS total_shelf_value,
               (CASE WHEN current_stock <= low_stock_threshold THEN 'Low Stock Alert' ELSE 'Normal' END) AS velocity_badge
        FROM tenant_inventory
        ORDER BY name ASC;
    """)
    items = db.execute(query).fetchall()
    return {"tenant_id": tenant_id, "items": [dict(row._mapping) for row in items]}
