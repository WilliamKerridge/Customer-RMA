-- ============================================================
-- Cosworth RMA Portal — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  company text,
  phone text,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','staff_uk','staff_us','admin')),
  office text CHECK (office IN ('UK','US')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_name text,
  billing_address jsonb,
  shipping_address jsonb,
  credit_terms boolean DEFAULT false,
  po_required boolean DEFAULT false,
  account_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text UNIQUE NOT NULL,
  variant text,
  display_name text NOT NULL,
  category text NOT NULL,
  active boolean DEFAULT true,
  test_fee decimal(10,2) DEFAULT 0,
  standard_repair_fee decimal(10,2) DEFAULT 0,
  major_repair_fee decimal(10,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES users(id),
  office text NOT NULL CHECK (office IN ('UK','US')),
  status text NOT NULL DEFAULT 'SUBMITTED',
  fault_type text NOT NULL CHECK (fault_type IN ('repair','service','service_plan','loan_return','code_update')),
  fault_description text,
  fault_display_info boolean DEFAULT false,
  fault_display_details text,
  tested_on_other_unit boolean DEFAULT false,
  fault_follows text CHECK (fault_follows IN ('unit','car')),
  required_return_date date,
  shipping_address jsonb,
  rma_number text,
  sap_repair_order text,
  sap_sales_order text,
  sap_works_order text,
  sap_booked_in_date date,
  sap_estimated_completion date,
  sap_order_value decimal(10,2),
  sap_spent_hours decimal(6,2),
  sap_days_open integer,
  last_import_at timestamptz,
  workshop_stage text,
  is_on_hold boolean DEFAULT false,
  hold_reason text,
  hold_customer_label text,
  awaiting_customer_question text,
  payment_required boolean DEFAULT false,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','waived','invoiced','stub_notified')),
  stripe_payment_intent_id text,
  po_number text,
  assigned_to uuid REFERENCES users(id),
  parent_case_id uuid REFERENCES cases(id),
  is_internal_transfer boolean DEFAULT false,
  internal_po text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS case_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  serial_number text,
  quantity integer DEFAULT 1,
  fault_notes text,
  test_fee_applied decimal(10,2),
  repair_fee_applied decimal(10,2)
);

CREATE TABLE IF NOT EXISTS case_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id),
  content text NOT NULL,
  is_internal boolean DEFAULT false,
  status_change_to text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_size integer,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_response_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id),
  recipient_email text NOT NULL,
  template text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  resend_message_id text
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_cases
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_customer_accounts
  BEFORE UPDATE ON customer_accounts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- CASE NUMBER GENERATOR FUNCTIONS
-- ============================================================

-- Sequence table to track per-month sequences
CREATE TABLE IF NOT EXISTS case_number_sequences (
  prefix text NOT NULL,
  month_key text NOT NULL,  -- YYYYMM
  last_seq integer NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, month_key)
);

CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS text AS $$
DECLARE
  v_month_key text;
  v_seq integer;
  v_case_number text;
BEGIN
  v_month_key := to_char(now(), 'YYYYMM');

  INSERT INTO case_number_sequences (prefix, month_key, last_seq)
  VALUES ('CASE', v_month_key, 1)
  ON CONFLICT (prefix, month_key)
  DO UPDATE SET last_seq = case_number_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  v_case_number := 'CASE-' || v_month_key || '-' || lpad(v_seq::text, 4, '0');
  RETURN v_case_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_rma_number()
RETURNS text AS $$
DECLARE
  v_month_key text;
  v_seq integer;
BEGIN
  v_month_key := to_char(now(), 'YYYYMM');

  INSERT INTO case_number_sequences (prefix, month_key, last_seq)
  VALUES ('RMA', v_month_key, 1)
  ON CONFLICT (prefix, month_key)
  DO UPDATE SET last_seq = case_number_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN 'RMA-' || v_month_key || '-' || lpad(v_seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_int_number()
RETURNS text AS $$
DECLARE
  v_month_key text;
  v_seq integer;
BEGIN
  v_month_key := to_char(now(), 'YYYYMM');

  INSERT INTO case_number_sequences (prefix, month_key, last_seq)
  VALUES ('INT', v_month_key, 1)
  ON CONFLICT (prefix, month_key)
  DO UPDATE SET last_seq = case_number_sequences.last_seq + 1
  RETURNING last_seq INTO v_seq;

  RETURN 'INT-' || v_month_key || '-' || lpad(v_seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_response_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get current user office
CREATE OR REPLACE FUNCTION current_user_office()
RETURNS text AS $$
  SELECT office FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- users ----
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_read_staff" ON users
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_insert_service_role" ON users
  FOR INSERT WITH CHECK (true);

-- ---- customer_accounts ----
CREATE POLICY "accounts_read_own" ON customer_accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "accounts_read_staff" ON customer_accounts
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "accounts_update_staff" ON customer_accounts
  FOR UPDATE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "accounts_insert_service_role" ON customer_accounts
  FOR INSERT WITH CHECK (true);

-- ---- products ----
CREATE POLICY "products_read_all" ON products
  FOR SELECT USING (active = true OR current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "products_write_staff" ON products
  FOR INSERT WITH CHECK (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "products_update_staff" ON products
  FOR UPDATE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "products_delete_staff" ON products
  FOR DELETE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

-- ---- cases ----
CREATE POLICY "cases_read_own" ON cases
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "cases_read_staff_uk" ON cases
  FOR SELECT USING (
    current_user_role() = 'staff_uk' AND office = 'UK'
  );

CREATE POLICY "cases_read_staff_us" ON cases
  FOR SELECT USING (
    current_user_role() = 'staff_us' AND office = 'US'
  );

CREATE POLICY "cases_read_admin" ON cases
  FOR SELECT USING (current_user_role() = 'admin');

CREATE POLICY "cases_insert_authenticated" ON cases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR current_setting('role') = 'service_role');

CREATE POLICY "cases_update_staff" ON cases
  FOR UPDATE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

-- ---- case_products ----
CREATE POLICY "case_products_read_own" ON case_products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_products.case_id AND cases.customer_id = auth.uid())
  );

CREATE POLICY "case_products_read_staff" ON case_products
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "case_products_insert" ON case_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "case_products_update_staff" ON case_products
  FOR UPDATE USING (current_user_role() IN ('staff_uk','staff_us','admin'));

-- ---- case_updates ----
CREATE POLICY "case_updates_read_own" ON case_updates
  FOR SELECT USING (
    is_internal = false AND
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_updates.case_id AND cases.customer_id = auth.uid())
  );

CREATE POLICY "case_updates_read_staff" ON case_updates
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "case_updates_insert" ON case_updates
  FOR INSERT WITH CHECK (true);

-- ---- case_attachments ----
CREATE POLICY "case_attachments_read_own" ON case_attachments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_attachments.case_id AND cases.customer_id = auth.uid())
  );

CREATE POLICY "case_attachments_read_staff" ON case_attachments
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "case_attachments_insert" ON case_attachments
  FOR INSERT WITH CHECK (true);

-- ---- case_response_tokens ----
CREATE POLICY "response_tokens_read_own" ON case_response_tokens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cases WHERE cases.id = case_response_tokens.case_id AND cases.customer_id = auth.uid())
  );

CREATE POLICY "response_tokens_read_staff" ON case_response_tokens
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "response_tokens_insert_staff" ON case_response_tokens
  FOR INSERT WITH CHECK (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "response_tokens_update" ON case_response_tokens
  FOR UPDATE USING (true);

-- ---- email_notifications ----
CREATE POLICY "email_notifications_read_staff" ON email_notifications
  FOR SELECT USING (current_user_role() IN ('staff_uk','staff_us','admin'));

CREATE POLICY "email_notifications_insert" ON email_notifications
  FOR INSERT WITH CHECK (true);
