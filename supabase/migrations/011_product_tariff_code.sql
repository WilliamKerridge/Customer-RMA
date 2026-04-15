-- ============================================================
-- 011: Customs tariff code on products
-- ============================================================
-- Added so the RMA approval email can include the HS/commodity
-- code for each returned item — required for international
-- shipping paperwork (customers outside the UK/US).

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tariff_code text;

COMMENT ON COLUMN products.tariff_code IS
  'Customs/HS tariff code (commodity code) used on shipping paperwork for this product.';
