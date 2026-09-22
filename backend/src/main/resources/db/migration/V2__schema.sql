-- ====================================================================
-- ORDERFLOW - Database Migration V2: Domain Schema & Seed Data
-- ====================================================================

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Inventory Table (Storage-Level Safe: available_quantity >= 0)
CREATE TABLE IF NOT EXISTS inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    available_quantity INT NOT NULL CHECK (available_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    version BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(64) NOT NULL UNIQUE,
    customer_id VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 4. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 5. Order Events Table (Lifecycle Audit Stream)
CREATE TABLE IF NOT EXISTS order_events (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT,
    order_number VARCHAR(64),
    event_type VARCHAR(64) NOT NULL,
    payload TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_created_at ON order_events(created_at);

-- 6. Dead Letter Queue Table
CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    order_number VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    payload TEXT,
    retry_count INT NOT NULL,
    failed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dlq_order_number ON dead_letter_queue(order_number);
CREATE INDEX IF NOT EXISTS idx_dlq_failed_at ON dead_letter_queue(failed_at);

-- ====================================================================
-- Deterministic Demo Seed Data
-- ====================================================================

-- Insert 5 Demo Catalog Products
INSERT INTO products (sku, name, price, created_at)
VALUES 
    ('PROD-LAPTOP', 'Laptop', 1200.00, NOW()),
    ('PROD-KEYBOARD', 'Keyboard', 80.00, NOW()),
    ('PROD-MOUSE', 'Mouse', 40.00, NOW()),
    ('PROD-MONITOR', 'Monitor', 300.00, NOW()),
    ('PROD-HEADPHONES', 'Headphones', 150.00, NOW())
ON CONFLICT (sku) DO NOTHING;

-- Insert Corresponding Inventory Stock
-- Laptop: 10 units (benchmark baseline: 10 initial inventory vs 100 concurrent orders)
INSERT INTO inventory (product_id, available_quantity, reserved_quantity, version, updated_at)
SELECT id, 10, 0, 0, NOW() FROM products WHERE sku = 'PROD-LAPTOP'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO inventory (product_id, available_quantity, reserved_quantity, version, updated_at)
SELECT id, 25, 0, 0, NOW() FROM products WHERE sku = 'PROD-KEYBOARD'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO inventory (product_id, available_quantity, reserved_quantity, version, updated_at)
SELECT id, 30, 0, 0, NOW() FROM products WHERE sku = 'PROD-MOUSE'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO inventory (product_id, available_quantity, reserved_quantity, version, updated_at)
SELECT id, 15, 0, 0, NOW() FROM products WHERE sku = 'PROD-MONITOR'
ON CONFLICT (product_id) DO NOTHING;

INSERT INTO inventory (product_id, available_quantity, reserved_quantity, version, updated_at)
SELECT id, 20, 0, 0, NOW() FROM products WHERE sku = 'PROD-HEADPHONES'
ON CONFLICT (product_id) DO NOTHING;
