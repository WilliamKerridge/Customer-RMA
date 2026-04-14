-- ============================================================
-- 008: Add created_at to case_products
-- ============================================================
-- case_products was created without a created_at column.
-- Required for ordering products in submission sequence on the
-- admin case detail page, and for the audit trail.

ALTER TABLE case_products
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
