# app/services/reconciliation_service.py

from decimal import Decimal
from datetime import date
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Numeric, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# ==========================================
# 1. DATABASE MODELS (SQLAlchemy)
# ==========================================

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, nullable=False, index=True)
    name = Column(String, nullable=False)
    cost_price = Column(Numeric(10, 2), nullable=False)
    retail_price = Column(Numeric(10, 2), nullable=False)
    current_stock_qty = Column(Numeric(10, 2), nullable=False, default=0.0)

class DailyStockAudit(Base):
    __tablename__ = "daily_stock_audits"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, nullable=False, index=True)
    audit_date = Column(Date, nullable=False, default=date.today)
    item_id = Column(Integer, ForeignKey("inventory_items.id"), nullable=False)
    
    opening_qty = Column(Numeric(10, 2), nullable=False)
    supply_added_qty = Column(Numeric(10, 2), nullable=False, default=0.0)
    closing_counted_qty = Column(Numeric(10, 2), nullable=False)
    
    implied_sold_qty = Column(Numeric(10, 2), nullable=False, default=0.0)
    item_expected_revenue = Column(Numeric(10, 2), nullable=False, default=0.0)

class ReconciliationSummary(Base):
    __tablename__ = "reconciliation_summaries"

    id = Column(Integer, primary_key=True, index=True)
    merchant_id = Column(Integer, nullable=False, index=True)
    reconciliation_date = Column(Date, nullable=False, default=date.today)
    
    total_expected_revenue = Column(Numeric(10, 2), nullable=False)
    actual_mpesa_collected = Column(Numeric(10, 2), nullable=False)
    actual_cash_collected = Column(Numeric(10, 2), nullable=False)
    total_actual_collected = Column(Numeric(10, 2), nullable=False)
    
    discrepancy_gap = Column(Numeric(10, 2), nullable=False)  # Positive = Surplus, Negative = Leakage/Deni
    status = Column(String, nullable=False)  # MATCHED, LEAKAGE_DETECTED, SURPLUS_DETECTED


# ==========================================
# 2. PYDANTIC SCHEMAS (Input Validation)
# ==========================================

class ItemCountInput(BaseModel):
    item_id: int
    opening_qty: Decimal = Field(ge=0, description="Opening shelf count at start of day")
    supply_added_qty: Decimal = Field(default=Decimal("0.0"), ge=0, description="Logged supplies received today")
    closing_counted_qty: Decimal = Field(ge=0, description="Closing shelf count at end of day")

class DailyReconciliationRequest(BaseModel):
    merchant_id: int
    reconciliation_date: Optional[date] = Field(default_factory=date.today)
    item_audits: List[ItemCountInput]
    actual_mpesa_collected: Decimal = Field(ge=0, description="Till/Paybill daily total")
    actual_cash_collected: Decimal = Field(ge=0, description="Physical drawer cash total")

class AuditItemResult(BaseModel):
    item_id: int
    item_name: str
    opening_qty: Decimal
    supply_added_qty: Decimal
    closing_counted_qty: Decimal
    implied_sold_qty: Decimal
    unit_retail_price: Decimal
    expected_revenue: Decimal

class ReconciliationResponse(BaseModel):
    merchant_id: int
    reconciliation_date: date
    audited_items: List[AuditItemResult]
    total_expected_revenue: Decimal
    actual_mpesa_collected: Decimal
    actual_cash_collected: Decimal
    total_actual_collected: Decimal
    discrepancy_gap: Decimal
    status: str
    actionable_insight: str


# ==========================================
# 3. RECONCILIATION CALCULATION SERVICE
# ==========================================

class YuBiFloReconciliationEngine:

    @staticmethod
    def calculate_daily_closing(
        db: Session, 
        request: DailyReconciliationRequest
    ) -> ReconciliationResponse:
        """
        Executes Reverse Inventory Calculation:
        Implied Sales = (Opening Stock + Supplies In) - Closing Stock
        Flags cash leaks (unrecorded credit, theft, missing money).
        """
        total_expected_revenue = Decimal("0.00")
        audited_item_results: List[AuditItemResult] = []

        # 1. Iterate through audited items and calculate implied sales
        for audit_input in request.item_audits:
            item = db.query(InventoryItem).filter(
                InventoryItem.id == audit_input.item_id,
                InventoryItem.merchant_id == request.merchant_id
            ).first()

            if not item:
                raise ValueError(f"Item ID {audit_input.item_id} not found for Merchant {request.merchant_id}")

            # REVERSE INVENTORY MATH
            # Implied Sold = (Opening + Supply) - Closing
            available_stock = audit_input.opening_qty + audit_input.supply_added_qty
            
            if audit_input.closing_counted_qty > available_stock:
                # Stock anomaly handling (e.g., unlogged supply drop)
                implied_sold = Decimal("0.00")
            else:
                implied_sold = available_stock - audit_input.closing_counted_qty

            item_expected_revenue = implied_sold * item.retail_price
            total_expected_revenue += item_expected_revenue

            # Save audit record
            db_audit = DailyStockAudit(
                merchant_id=request.merchant_id,
                audit_date=request.reconciliation_date,
                item_id=item.id,
                opening_qty=audit_input.opening_qty,
                supply_added_qty=audit_input.supply_added_qty,
                closing_counted_qty=audit_input.closing_counted_qty,
                implied_sold_qty=implied_sold,
                item_expected_revenue=item_expected_revenue
            )
            db.add(db_audit)

            # Update master stock level to closing count
            item.current_stock_qty = audit_input.closing_counted_qty

            audited_item_results.append(
                AuditItemResult(
                    item_id=item.id,
                    item_name=item.name,
                    opening_qty=audit_input.opening_qty,
                    supply_added_qty=audit_input.supply_added_qty,
                    closing_counted_qty=audit_input.closing_counted_qty,
                    implied_sold_qty=implied_sold,
                    unit_retail_price=item.retail_price,
                    expected_revenue=item_expected_revenue
                )
            )

        # 2. Financial Reconciliation
        total_actual_collected = request.actual_mpesa_collected + request.actual_cash_collected
        discrepancy_gap = total_actual_collected - total_expected_revenue

        # Status & Insight Rules
        if abs(discrepancy_gap) <= Decimal("5.00"):  # 5 KSh threshold
            status = "MATCHED"
            insight = "All stock accounts match cash and M-Pesa collected perfectly!"
        elif discrepancy_gap < Decimal("0.00"):
            status = "LEAKAGE_DETECTED"
            insight = (
                f"Unaccounted Gap of KSh {abs(discrepancy_gap):,.2f}. "
                f"Items walked out the door, but cash/M-Pesa is missing. "
                f"Check unlogged credit (deni) or till shortage."
            )
        else:
            status = "SURPLUS_DETECTED"
            insight = (
                f"Cash Surplus of KSh {discrepancy_gap:,.2f}. "
                f"You received more cash than recorded inventory drops. Check if a delivery was unlogged."
            )

        # 3. Save Summary Record
        summary = ReconciliationSummary(
            merchant_id=request.merchant_id,
            reconciliation_date=request.reconciliation_date,
            total_expected_revenue=total_expected_revenue,
            actual_mpesa_collected=request.actual_mpesa_collected,
            actual_cash_collected=request.actual_cash_collected,
            total_actual_collected=total_actual_collected,
            discrepancy_gap=discrepancy_gap,
            status=status
        )
        db.add(summary)
        db.commit()

        return ReconciliationResponse(
            merchant_id=request.merchant_id,
            reconciliation_date=request.reconciliation_date,
            audited_items=audited_item_results,
            total_expected_revenue=total_expected_revenue,
            actual_mpesa_collected=request.actual_mpesa_collected,
            actual_cash_collected=request.actual_cash_collected,
            total_actual_collected=total_actual_collected,
            discrepancy_gap=discrepancy_gap,
            status=status,
            actionable_insight=insight
        )


# ==========================================
# 4. FASTAPI ROUTE ENDPOINT
# ==========================================

from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter(prefix="/api/v1/reconciliation", tags=["Reconciliation Engine"])

# Mock DB Dependency for illustration
def get_db():
    # Substitute with standard SQLAlchemy SessionLocal generator
    pass

@router.post("/close-day", response_model=ReconciliationResponse, status_code=status.HTTP_201_CREATED)
def execute_daily_closing(
    payload: DailyReconciliationRequest, 
    db: Session = Depends(get_db)
):
    try:
        response = YuBiFloReconciliationEngine.calculate_daily_closing(db=db, request=payload)
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Reconciliation engine failure.")
