-- ============================================================
-- 007: Per-product workshop stage and hold state
-- ============================================================
-- Each product in a multi-product case tracks its own repair
-- progress independently. For single-product cases, advancing
-- the product stage also cascades to cases.workshop_stage
-- (handled in the API layer, not here).

ALTER TABLE case_products
  ADD COLUMN IF NOT EXISTS workshop_stage text
    CHECK (workshop_stage IN (
      'AWAITING_TEST', 'RETEST', 'REWORK', 'FINAL_TEST',
      'CLEAN_AND_LABEL', 'INSPECTION', 'WORKSHOP_COMPLETE'
    )),
  ADD COLUMN IF NOT EXISTS is_on_hold       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hold_reason      text,
  ADD COLUMN IF NOT EXISTS hold_customer_label text;

-- Index for querying active hold products per case
CREATE INDEX IF NOT EXISTS idx_case_products_hold
  ON case_products (case_id, is_on_hold) WHERE is_on_hold = true;
