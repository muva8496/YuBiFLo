-- ============================================================================
-- Muva Ambient Ledger Mode: Relational Schema & State Machine Architecture
-- Dialect: PostgreSQL (compatible with SQLite3 via standard constraints)
-- ============================================================================

-- 1. MASTER INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL,
    sku VARCHAR(64) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_retail NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Definitive physical stock currently residing on the merchant's physical shelf
    physical_stock_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Reserved stock: Items that have been paid for, but the customer left behind
    -- to collect later in the evening (is_collected = false)
    reserved_uncollected_qty NUMERIC(10, 2) NOT NULL DEFAULT 0.00,

    -- Available stock to sell to walk-ins: physical_stock_qty - reserved_uncollected_qty
    low_stock_threshold NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_merchant ON inventory_items(merchant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory_items(name);

-- 2. COMMITTED TRANSACTIONS LEDGER (Audited Single-Source-of-Truth)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    merchant_id VARCHAR(64) NOT NULL,
    intent_type VARCHAR(32) NOT NULL CHECK (intent_type IN ('SALE', 'CREDIT', 'SUPPLIER_PURCHASE', 'EXPENSE')),
    total_amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    balance_given NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('CASH', 'MOBILE_MONEY', 'CREDIT', 'SPLIT')),
    counterparty_name VARCHAR(255) DEFAULT 'Counter Walk-in',
    is_collected BOOLEAN NOT NULL DEFAULT TRUE,
    source_channel VARCHAR(32) NOT NULL DEFAULT 'AMBIENT_VAD', -- 'AMBIENT_VAD' | 'MANUAL_POS' | 'RESTOCK_TRIGGER'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

-- 3. PENDING DRAFTS QUEUE (The Ambient Staging Buffer)
-- Passively captured audio drafts live here until explicitly approved, edited, or dismissed by the shopkeeper.
CREATE TABLE IF NOT EXISTS pending_drafts (
    id SERIAL PRIMARY KEY,
    draft_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    merchant_id VARCHAR(64) NOT NULL,
    source_transcript TEXT NOT NULL,
    detected_intent VARCHAR(32) NOT NULL CHECK (detected_intent IN ('SALE', 'CREDIT', 'SUPPLIER_PURCHASE', 'UNKNOWN')),
    
    -- Normalized payload serialized as JSON
    parsed_payload JSONB NOT NULL,
    
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    balance_given NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(32) NOT NULL DEFAULT 'CASH',
    counterparty_name VARCHAR(255) DEFAULT 'Counter Walk-in',
    is_collected BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Finite State Machine Status
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN (
        'PENDING_REVIEW',   -- Awaiting merchant approval in Muva Flutter UI
        'APPROVED',         -- Confirmed by user; definitive inventory & ledgers updated
        'EDITED_APPROVED',  -- Merchant corrected item/quantity before confirming
        'DISMISSED'         -- Non-transactional noise or customer rejected
    )),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_drafts_merchant_status ON pending_drafts(merchant_id, status);

-- ============================================================================
-- 4. TRANSACTIONAL STATE MACHINE LOGIC (PostgreSQL Functions)
-- ============================================================================

/**
 * 1. INGEST_AMBIENT_DRAFT
 * Ingests an ambient voice event.
 * If is_collected = false (paid but customer left item behind):
 * It places a reservation hold (reserved_uncollected_qty) WITHOUT altering physical stock count.
 * If SUPPLIER_PURCHASE: It stages the draft without touching inventory until unboxing.
 */
CREATE OR REPLACE FUNCTION ingest_ambient_draft(
    p_merchant_id VARCHAR(64),
    p_transcript TEXT,
    p_intent VARCHAR(32),
    p_parsed_payload JSONB,
    p_total NUMERIC(10, 2),
    p_paid NUMERIC(10, 2),
    p_balance NUMERIC(10, 2),
    p_payment_method VARCHAR(32),
    p_counterparty VARCHAR(255),
    p_is_collected BOOLEAN
) RETURNS UUID AS $$
DECLARE
    v_draft_uuid UUID := gen_random_uuid();
    v_item JSONB;
    v_item_id INT;
    v_qty NUMERIC(10, 2);
BEGIN
    -- Insert into pending review buffer
    INSERT INTO pending_drafts (
        draft_uuid, merchant_id, source_transcript, detected_intent,
        parsed_payload, total_amount, amount_paid, balance_given,
        payment_method, counterparty_name, is_collected, status
    ) VALUES (
        v_draft_uuid, p_merchant_id, p_transcript, p_intent,
        p_parsed_payload, p_total, p_paid, p_balance,
        p_payment_method, p_counterparty, p_is_collected, 'PENDING_REVIEW'
    );

    -- If this is a SALE where goods are left behind, flag the reservation
    IF p_intent = 'SALE' AND p_is_collected = FALSE THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_parsed_payload->'items')
        LOOP
            v_qty := (v_item->>'quantity')::NUMERIC;
            
            -- Increment reserved stock without decreasing physical count
            UPDATE inventory_items
            SET reserved_uncollected_qty = reserved_uncollected_qty + v_qty,
                updated_at = CURRENT_TIMESTAMP
            WHERE merchant_id = p_merchant_id 
              AND name ILIKE '%' || (v_item->>'item_name') || '%';
        END LOOP;
    END IF;

    RETURN v_draft_uuid;
END;
$$ LANGUAGE plpgsql;

/**
 * 2. APPROVE_AMBIENT_DRAFT
 * Called when merchant taps [Approve] on the Muva mobile screen.
 * Transitions draft to APPROVED and performs definitive ledger write-downs.
 */
CREATE OR REPLACE FUNCTION approve_ambient_draft(
    p_draft_uuid UUID,
    p_merchant_id VARCHAR(64)
) RETURNS BOOLEAN AS $$
DECLARE
    v_draft RECORD;
    v_item JSONB;
    v_qty NUMERIC(10, 2);
BEGIN
    SELECT * INTO v_draft FROM pending_drafts 
    WHERE draft_uuid = p_draft_uuid AND merchant_id = p_merchant_id AND status = 'PENDING_REVIEW'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pending draft not found or already processed';
    END IF;

    -- 1. Create official immutable Transaction record
    INSERT INTO transactions (
        merchant_id, intent_type, total_amount, amount_paid,
        balance_given, payment_method, counterparty_name, is_collected, source_channel
    ) VALUES (
        v_draft.merchant_id, v_draft.detected_intent, v_draft.total_amount, v_draft.amount_paid,
        v_draft.balance_given, v_draft.payment_method, v_draft.counterparty_name, v_draft.is_collected, 'AMBIENT_VAD'
    );

    -- 2. Execute definitive inventory adjustments
    IF v_draft.detected_intent IN ('SALE', 'CREDIT') THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_draft.parsed_payload->'items')
        LOOP
            v_qty := (v_item->>'quantity')::NUMERIC;

            IF v_draft.is_collected = TRUE THEN
                -- Goods walked out the door: deduct from physical shelf
                UPDATE inventory_items
                SET physical_stock_qty = GREATEST(0.00, physical_stock_qty - v_qty),
                    updated_at = CURRENT_TIMESTAMP
                WHERE merchant_id = p_merchant_id 
                  AND name ILIKE '%' || (v_item->>'item_name') || '%';
            ELSE
                -- Goods were left behind: reservation was already logged; physical stock remains until pickup
                NULL;
            END IF;
        END LOOP;

    ELSIF v_draft.detected_intent = 'SUPPLIER_PURCHASE' THEN
        -- Supplier delivery verified: add batch to physical inventory
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_draft.parsed_payload->'items')
        LOOP
            v_qty := (v_item->>'quantity')::NUMERIC;
            
            UPDATE inventory_items
            SET physical_stock_qty = physical_stock_qty + v_qty,
                updated_at = CURRENT_TIMESTAMP
            WHERE merchant_id = p_merchant_id 
              AND name ILIKE '%' || (v_item->>'item_name') || '%';
        END LOOP;
    END IF;

    -- 3. Transition draft status to APPROVED
    UPDATE pending_drafts
    SET status = 'APPROVED',
        reviewed_at = CURRENT_TIMESTAMP
    WHERE draft_uuid = p_draft_uuid;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
