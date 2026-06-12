-- ============================================================
-- Migration: 013_rls_hardening.sql
-- Security-audit fixes for the RLS layer.
--
--   1. Enable RLS on case_number_sequences (the only table that had
--      it disabled — it was readable/writable via PostgREST).
--   2. Pin search_path on the number-generator functions.
--   3. Tie the cases INSERT policy to the row's customer_id (the old
--      check accepted any non-empty app.current_user_id, so a caller
--      could insert rows with a forged customer_id).
--   4. Add WITH CHECK to users_update_own so a customer cannot change
--      their own role or office (privilege self-escalation).
--   5. Drop blanket WITH CHECK (true) / USING (true) write policies.
--      All application writes go through the service-role client or
--      the better-auth pg pool (table owner), both of which are exempt
--      from RLS — these policies only widened access for anon/
--      authenticated PostgREST callers.
--   6. Replace the inert import_logs SELECT policy (it referenced
--      auth.uid(), which is always NULL under better-auth).
--   7. Drop the inert/over-broad storage.objects policies:
--      - the upload policy referenced auth.email() (always NULL) and
--        never worked;
--      - the download policy granted every authenticated user read
--        access to ALL case attachments.
--      Uploads and downloads go through server routes using the
--      service client and short-lived signed URLs, which do not
--      depend on these policies.
-- ============================================================

BEGIN;

-- ── 1. case_number_sequences: enable RLS, no policies ──────────────────────
-- Only the service role (RLS-exempt) may touch the sequence table.
ALTER TABLE case_number_sequences ENABLE ROW LEVEL SECURITY;

-- ── 2. Pin search_path on number generators ─────────────────────────────────
ALTER FUNCTION generate_case_number() SET search_path = public;
ALTER FUNCTION generate_rma_number()  SET search_path = public;
ALTER FUNCTION generate_int_number()  SET search_path = public;

-- ── 3. cases INSERT must match the caller's identity ───────────────────────
-- Guest submissions (customer_id NULL) are created by the API route via the
-- service client, which bypasses RLS, so they are unaffected.
DROP POLICY IF EXISTS "cases_insert_authenticated" ON cases;

CREATE POLICY "cases_insert_own" ON cases
  FOR INSERT
  WITH CHECK (customer_id = current_setting('app.current_user_id', true));

-- ── 4. users_update_own: block role/office self-escalation ─────────────────
-- current_user_role()/current_user_office() are STABLE SECURITY DEFINER and
-- read the pre-update row, so the new values must equal the existing ones.
DROP POLICY IF EXISTS "users_update_own" ON users;

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (id = current_setting('app.current_user_id', true))
  WITH CHECK (
    id = current_setting('app.current_user_id', true)
    AND role = current_user_role()
    AND office IS NOT DISTINCT FROM current_user_office()
  );

-- ── 5. Drop blanket write policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "users_insert_service_role"    ON users;
DROP POLICY IF EXISTS "accounts_insert_service_role" ON customer_accounts;
DROP POLICY IF EXISTS "case_products_insert"         ON case_products;
DROP POLICY IF EXISTS "case_updates_insert"          ON case_updates;
DROP POLICY IF EXISTS "case_attachments_insert"      ON case_attachments;
DROP POLICY IF EXISTS "response_tokens_update"       ON case_response_tokens;
DROP POLICY IF EXISTS "email_notifications_insert"   ON email_notifications;

-- ── 6. import_logs: working staff-only SELECT policy ───────────────────────
DROP POLICY IF EXISTS "Staff and admin can view import logs" ON import_logs;

CREATE POLICY "import_logs_read_staff" ON import_logs
  FOR SELECT
  USING (current_user_role() IN ('staff_uk', 'staff_us', 'admin'));

-- ── 7. Remove inert/over-broad storage policies ─────────────────────────────
DROP POLICY IF EXISTS "Staff can upload attachments"        ON storage.objects;
DROP POLICY IF EXISTS "Users can download case attachments" ON storage.objects;

COMMIT;
