-- ============================================================================
-- YuBiFlo Core Database Schema & Migration Script
-- Production-ready PostgreSQL / SQLite3 Compatible DDL
-- Core Philosophy: Reverse Inventory & Supply-Driven Accounting for MSMEs
-- ============================================================================

-- 1. MERCHANTS
CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(64) PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    currency VARCHAR(16) NOT NULL DEFAULT 'KSh',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. INVENTORY ITEMS (With Bulk-to-Micro Conversion Ratio)
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL DEFAULT 'General',
    
    -- Bulk-to-Micro Non-Discrete Packaging Split Engine
    -- e.g. supply_unit: 'Bag' (50kg), retail_unit: 'Quarter-Kg', conversion_ratio: 200.0
    -- e.g. supply_unit: 'Box' (Sweets), retail_unit: 'Piece', conversion_ratio: 100.0
    -- e.g. supply_unit: 'Crate' (Soda), retail_unit: 'Bottle', conversion_ratio: 24.0
    supply_unit VARCHAR(64) NOT NULL DEFAULT 'Unit',
    retail_unit VARCHAR(64) NOT NULL DEFAULT 'Unit',
    conversion_ratio NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (conversion_ratio > 0),
    
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Current stock in terms of retail_units (micro units)
    current_stock_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    low_stock_threshold NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_merchant ON inventory_items(merchant_id);

-- 3. SUPPLY LOGS (Quick 5-Second Incoming Wholesale Deliveries)
CREATE TABLE IF NOT EXISTS supply_logs (
    id SERIAL PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    -- Logged in supply_units (e.g. 2 bags, 5 crates)
    supply_qty_received NUMERIC(10, 2) NOT NULL,
    
    -- Auto-converted retail micro units (e.g. 2 bags * 200 = 400 quarter-kgs)
    retail_units_added NUMERIC(10, 2) NOT NULL,
    
    total_cost NUMERIC(10, 2) NOT NULL,
    unit_cost_at_delivery NUMERIC(10, 2) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL DEFAULT 'Wholesale Delivery',
    invoice_chit_ref VARCHAR(128),
    payment_mode VARCHAR(32) NOT NULL DEFAULT 'CASH' CHECK (payment_mode IN ('CASH', 'MPESA', 'CREDIT', 'PENDING')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supply_merchant ON supply_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_supply_timestamp ON supply_logs(timestamp);

-- 4. STOCK AUDITS (Morning Bookend & Evening Physical Stock Counts)
CREATE TABLE IF NOT EXISTS stock_audits (
    id SERIAL PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    item_id INT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    opening_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    supply_added_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    closing_counted_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- MATHEMATICAL MODEL: Implied Sold = (Opening + Supply) - Closing
    implied_sold_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    item_expected_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_audits_date ON stock_audits(merchant_id, audit_date);

-- 5. RECONCILIATIONS (Evening Financial Health Match)
CREATE TABLE IF NOT EXISTS reconciliations (
    id SERIAL PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    reconciliation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    expected_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_mpesa NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    actual_cash NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_actual_collected NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- unrecorded_gap = total_actual_collected - expected_revenue
    -- Negative = Cash Leakage or Unlogged Deni; Positive = Cash Surplus
    unrecorded_gap NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'MATCHED' CHECK (status IN ('MATCHED', 'LEAKAGE_DETECTED', 'SURPLUS_DETECTED')),
    notes TEXT,
    sealed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recon_date ON reconciliations(merchant_id, reconciliation_date);

-- 6. PENDING DRAFTS QUEUE (Ambient Speech & Credit Staging Buffer)
CREATE TABLE IF NOT EXISTS pending_drafts (
    id SERIAL PRIMARY KEY,
    draft_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    
    intent_type VARCHAR(32) NOT NULL CHECK (intent_type IN ('SUPPLIER_DELIVERY', 'CREDIT_RECORD', 'ADVANCE_PAYMENT', 'UNKNOWN')),
    
    -- Raw transcribed Swahili / Sheng conversation snippet
    raw_transcript TEXT NOT NULL,
    
    -- Structured JSON extracted by NLP compiler
    payload_json JSONB NOT NULL,
    
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'DISMISSED')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_drafts_status ON pending_drafts(merchant_id, status);

-- ============================================================================
-- SEED DATA FOR ALACIO MINI SHOP (MSME TEST HARNESS)
-- ============================================================================
INSERT INTO merchants (id, business_name, phone_number, currency)
VALUES ('alacio_mini_shop', 'Alacio Mini Shop', '254712345678', 'KSh')
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory_items 
    (merchant_id, name, category, supply_unit, retail_unit, conversion_ratio, cost_price, retail_price, current_stock_qty)
VALUES 
    ('alacio_mini_shop', 'Mumias Sugar', 'Dry Foods', 'Bag (50kg)', 'Quarter-Kg (250g)', 200.00, 6800.00, 40.00, 180.00),
    ('alacio_mini_shop', 'Brookside Fresh Milk 500ml', 'Dairy', 'Crate (24pkts)', 'Packet', 24.00, 1320.00, 65.00, 24.00),
    ('alacio_mini_shop', 'Tropical Sweets Box', 'Confectionery', 'Box (100pcs)', 'Piece (Sweet)', 100.00, 350.00, 5.00, 85.00),
    ('alacio_mini_shop', 'Unga Jogoo 2kg', 'Flour', 'Bale (12pkts)', 'Packet', 12.00, 1800.00, 170.00, 16.00)
ON CONFLICT DO NOTHING;
