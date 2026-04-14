-- ============================================================
-- 006: Per-product fields, SAP Works Order move, product timeline
-- ============================================================

-- 1. Per-product status, rejection, and workshop fields
ALTER TABLE case_products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason   text,
  ADD COLUMN IF NOT EXISTS workshop_findings  text,
  ADD COLUMN IF NOT EXISTS staff_notes        text;

-- 2. Move per-product SAP fields from cases to case_products
--    (each product has its own Works Order, completion date, cost, hours)
ALTER TABLE case_products
  ADD COLUMN IF NOT EXISTS sap_works_order          text,
  ADD COLUMN IF NOT EXISTS sap_estimated_completion date,
  ADD COLUMN IF NOT EXISTS sap_order_value          decimal(10,2),
  ADD COLUMN IF NOT EXISTS sap_spent_hours          decimal(6,2);

-- 3. sap_works_order, sap_estimated_completion, sap_order_value, sap_spent_hours
--    are now deprecated on cases but kept as nullable columns for backward
--    compatibility until the import and SAP card are updated.
--    Do NOT drop them yet — data migration happens in a future migration.

-- 4. Per-product timeline: add nullable product_id to case_updates
ALTER TABLE case_updates
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES case_products(id) ON DELETE SET NULL;

-- Index for per-product timeline queries
CREATE INDEX IF NOT EXISTS idx_case_updates_product_id
  ON case_updates (product_id) WHERE product_id IS NOT NULL;

-- Index for querying rejected products per case
CREATE INDEX IF NOT EXISTS idx_case_products_status
  ON case_products (case_id, status);
