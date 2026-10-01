export const POSTGRES_MIGRATION_SQL = `-- Retail & Supply-Driven Inventory Engine: PostgreSQL Database Migration
-- Auto-generated Implied Sales Ledger triggered by Restock Batches

-- 1. MERCHANTS / WORKSPACES
CREATE TABLE IF NOT EXISTS merchants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) DEFAULT 'Retail / Mini-mart',
    currency VARCHAR(10) DEFAULT 'KSh',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MASTER INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    merchant_id INT REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_type VARCHAR(50) NOT NULL, -- packets, bales, bottles, crates
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_retail NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    low_stock_threshold NUMERIC(10, 2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SUPPLY DELIVERY BATCHES (RESTOCK TRIGGERS)
CREATE TABLE IF NOT EXISTS supply_batches (
    id SERIAL PRIMARY KEY,
    merchant_id INT REFERENCES merchants(id) ON DELETE CASCADE,
    item_id INT REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_qty NUMERIC(10, 2) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL,
    unit_retail NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, CLOSED_SOLD
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 4. IMPLIED SALES LEDGER (AUTO-GENERATED ON RESTOCK)
CREATE TABLE IF NOT EXISTS sales_ledger (
    id SERIAL PRIMARY KEY,
    merchant_id INT REFERENCES merchants(id) ON DELETE CASCADE,
    item_id INT REFERENCES inventory_items(id) ON DELETE CASCADE,
    batch_id INT REFERENCES supply_batches(id) ON DELETE SET NULL,
    qty_sold NUMERIC(10, 2) NOT NULL,
    unit_retail NUMERIC(10, 2) NOT NULL,
    total_revenue NUMERIC(10, 2) NOT NULL,
    gross_profit NUMERIC(10, 2) NOT NULL,
    turnover_hours NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. SEED INITIAL SHOP
INSERT INTO merchants (id, name, business_type) 
VALUES (1, 'Alacio Mini Shop', 'Retail / Mini-mart') 
ON CONFLICT DO NOTHING;
`;
