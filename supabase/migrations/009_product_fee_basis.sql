-- ============================================================
-- 009: Per-product fee basis (standard / warranty / FOC)
-- ============================================================
-- Allows staff to mark individual products as warranty or
-- free-of-charge so no fee is required for that product.
--
-- standard — normal repair fees apply
-- warranty  — covered under manufacturer warranty, no charge
-- foc       — free of charge (goodwill / commercial decision)

ALTER TABLE case_products
  ADD COLUMN IF NOT EXISTS fee_basis text NOT NULL DEFAULT 'standard'
    CHECK (fee_basis IN ('standard', 'warranty', 'foc'));

-- Index for finance reporting: count of warranty/FOC products
CREATE INDEX IF NOT EXISTS idx_case_products_fee_basis
  ON case_products (fee_basis) WHERE fee_basis <> 'standard';
