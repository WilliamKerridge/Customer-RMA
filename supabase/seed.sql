-- ============================================================
-- Cosworth RMA Portal — Seed Data
-- ============================================================
-- HOW TO USE:
--
-- 1. Register the three demo accounts via the app at /login
--    (Register tab), using these emails and password Demo1234!:
--
--      demo.customer@btsport.com
--      demo.staff@cosworth.com
--      demo.admin@cosworth.com
--
-- 2. Run this seed — paste into the Supabase SQL editor, or run:
--      npx supabase db seed
--
-- This seed finds users by email (no hardcoded IDs), so it works
-- regardless of what ID better-auth assigned when you registered.
-- Safe to re-run: all writes use ON CONFLICT or existence checks.
-- ============================================================


-- ============================================================
-- 1. USER PROFILES
-- Updates the public.users rows that better-auth created on
-- registration. Sets the correct name, company, role and office.
-- ============================================================

UPDATE users SET
  full_name = 'Will Kerridge',
  company   = 'BT Sport Motorsport',
  role      = 'customer',
  office    = NULL
WHERE email = 'demo.customer@btsport.com';

UPDATE users SET
  full_name = 'Service Manager',
  company   = 'Cosworth Electronics',
  role      = 'staff_uk',
  office    = 'UK'
WHERE email = 'demo.staff@cosworth.com';

UPDATE users SET
  full_name = 'Service Admin',
  company   = 'Cosworth Electronics',
  role      = 'admin',
  office    = 'UK'
WHERE email = 'demo.admin@cosworth.com';


-- ============================================================
-- 2. PRODUCTS
-- ============================================================

INSERT INTO products (part_number, display_name, category, active, test_fee, standard_repair_fee, major_repair_fee) VALUES

-- Engine Management Systems (700 / 1500 / 3500)
('01E-501120', 'Antares 8 TLA',             'Engine Management Systems', true, 700.00, 1500.00, 3500.00),
('01E-501085', 'MQ12Di',                    'Engine Management Systems', true, 700.00, 1500.00, 3500.00),
('01E-500720', 'SQ6M ECU',                  'Engine Management Systems', true, 700.00, 1500.00, 3500.00),
('01E-500700', 'SQ6 ECU',                   'Engine Management Systems', true, 700.00, 1500.00, 3500.00),

-- Displays (350 / 750 / 1800)
('01D-640060', 'CDU 10.3',                  'Displays', true, 350.00, 750.00, 1800.00),
('01D-640040', 'CDU 7.0',                   'Displays', true, 350.00, 750.00, 1800.00),
('01D-640030', 'CDU 4.3',                   'Displays', true, 350.00, 750.00, 1800.00),
('01D-640050', 'ICD MK2',                   'Displays', true, 350.00, 750.00, 1800.00),
('01D-640080', 'Firefly TLA',               'Displays', true, 350.00, 750.00, 1800.00),

-- Loggers (450 / 950 / 2200)
('01L-650115-P',     'Badenia 4 Porsche',      'Loggers', true, 450.00, 950.00, 2200.00),
('01L-650111-P-CUP', 'Badenia 3 Porsche Cup',  'Loggers', true, 450.00, 950.00, 2200.00),
('01L-650001',       'CLU Plus',               'Loggers', true, 450.00, 950.00, 2200.00),
('01L-650030',       'RLU',                    'Loggers', true, 450.00, 950.00, 2200.00),
('01L-650050',       'SJU',                    'Loggers', true, 450.00, 950.00, 2200.00),

-- Power Systems (550 / 1200 / 2800)
('01I-610100',   'Centaurus 5 TLA',            'Power Systems', true, 550.00, 1200.00, 2800.00),
('01I-610110-P', 'Centaurus 4 Porsche',        'Power Systems', true, 550.00, 1200.00, 2800.00),
('01I-610083',   'IPS32 Mk2',                  'Power Systems', true, 550.00, 1200.00, 2800.00),

-- Steering Wheels (200 / 450 / 950)
('01D-641350-PSA',  'CCW Mk3 PSA',             'Steering Wheels', true, 200.00, 450.00, 950.00),
('01D-641150-8STA', 'CCW Mk2 8STA',            'Steering Wheels', true, 200.00, 450.00, 950.00),
('01D-641390',      'CCW Mk3 Analogue Paddle', 'Steering Wheels', true, 200.00, 450.00, 950.00)

ON CONFLICT (part_number) DO UPDATE SET
  display_name        = EXCLUDED.display_name,
  category            = EXCLUDED.category,
  active              = EXCLUDED.active,
  test_fee            = EXCLUDED.test_fee,
  standard_repair_fee = EXCLUDED.standard_repair_fee,
  major_repair_fee    = EXCLUDED.major_repair_fee;


-- ============================================================
-- 3. CUSTOMER ACCOUNT (Will Kerridge)
-- credit_terms=true, po_required=true
-- ============================================================

INSERT INTO customer_accounts (user_id, company_name, credit_terms, po_required, account_active)
SELECT id, 'BT Sport Motorsport', true, true, true
FROM users WHERE email = 'demo.customer@btsport.com'
  AND NOT EXISTS (
    SELECT 1 FROM customer_accounts ca
    JOIN users u ON u.id = ca.user_id
    WHERE u.email = 'demo.customer@btsport.com'
  );


-- ============================================================
-- 4. DEMO CASES
-- Looks up real user IDs by email — no hardcoded IDs.
-- Skips gracefully if accounts haven't been registered yet.
-- ============================================================

DO $$
DECLARE
  v_customer_id  text;
  v_staff_id     text;
  v_case1_id     uuid;
  v_case2_id     uuid;
  v_product_cdu  uuid;
  v_product_ecm  uuid;
BEGIN
  -- Find user IDs
  SELECT id INTO v_customer_id FROM users WHERE email = 'demo.customer@btsport.com';
  SELECT id INTO v_staff_id    FROM users WHERE email = 'demo.staff@cosworth.com';

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'demo.customer@btsport.com not found — skipping case seed. Register the account first.';
    RETURN;
  END IF;

  IF v_staff_id IS NULL THEN
    RAISE NOTICE 'demo.staff@cosworth.com not found — skipping case seed. Register the account first.';
    RETURN;
  END IF;

  -- Find product IDs
  SELECT id INTO v_product_cdu FROM products WHERE part_number = '01D-640060';
  SELECT id INTO v_product_ecm FROM products WHERE part_number = '01E-501120';

  -- ── CASE 1: CASE-202604-0047 — IN_REPAIR / FINAL_TEST ────────────────────

  IF NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-202604-0047') THEN

    v_case1_id := gen_random_uuid();

    INSERT INTO cases (
      id, case_number, customer_id, office, status, fault_type,
      workshop_stage, rma_number,
      sap_repair_order, sap_sales_order, sap_works_order,
      sap_order_value, sap_spent_hours, sap_days_open,
      sap_estimated_completion, required_return_date,
      po_number, fault_description,
      payment_required, payment_status
    ) VALUES (
      v_case1_id,
      'CASE-202604-0047',
      v_customer_id,
      'UK', 'IN_REPAIR', 'repair', 'FINAL_TEST',
      'RMA-202604-0047',
      'REP-2026-04471', '4500012847', 'REP-2026-04471',
      340.00, 2.5, 10,
      (CURRENT_DATE + INTERVAL '14 days')::date,
      (CURRENT_DATE + INTERVAL '45 days')::date,
      'BT-2026-0441',
      'Unit powering on intermittently. Display flickering and losing comms with ECU during high vibration.',
      false, 'waived'
    );

    IF v_product_cdu IS NOT NULL THEN
      INSERT INTO case_products (case_id, product_id, serial_number, quantity, fault_notes, test_fee_applied, repair_fee_applied)
      VALUES (v_case1_id, v_product_cdu, 'CEL-20250112', 1, 'Screen flickering at startup, intermittent CAN comms loss', 350.00, 750.00);
    END IF;

    INSERT INTO case_updates (case_id, author_id, content, is_internal, status_change_to, created_at) VALUES
    (
      v_case1_id, v_staff_id,
      'Case approved. RMA number RMA-202604-0047 issued. Please ship your unit to: Cosworth Electronics Ltd, Acorn House, Bakers Road, Uxbridge, UB8 1RG, United Kingdom. Quote your RMA number on the outer packaging.',
      false, 'RMA_ISSUED',
      now() - INTERVAL '12 days'
    ),
    (
      v_case1_id, v_staff_id,
      'Unit received and booked in to workshop. Initial visual inspection complete — no physical damage noted. Proceeding to fault test.',
      false, 'PARTS_RECEIVED',
      now() - INTERVAL '10 days'
    ),
    (
      v_case1_id, v_staff_id,
      'Fault confirmed on test rig. CAN transceiver showing marginal performance on channel 2. Capacitor C142 replaced. Unit re-routed to rework.',
      false, 'IN_REPAIR',
      now() - INTERVAL '6 days'
    ),
    (
      v_case1_id, v_staff_id,
      'Rework complete. Unit now in final test — running full 4-hour soak cycle on CAN comms and display validation. Estimated completion on schedule.',
      false, null,
      now() - INTERVAL '1 day'
    );

    RAISE NOTICE 'CASE-202604-0047 created.';
  ELSE
    RAISE NOTICE 'CASE-202604-0047 already exists — skipped.';
  END IF;

  -- ── CASE 2: CASE-202604-0051 — SUBMITTED ─────────────────────────────────

  IF NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-202604-0051') THEN

    v_case2_id := gen_random_uuid();

    INSERT INTO cases (
      id, case_number, customer_id, office, status, fault_type,
      required_return_date, fault_description,
      payment_required, payment_status
    ) VALUES (
      v_case2_id,
      'CASE-202604-0051',
      v_customer_id,
      'UK', 'SUBMITTED', 'repair',
      (CURRENT_DATE + INTERVAL '60 days')::date,
      'Unit not powering on after impact. No response on CAN bus.',
      false, 'pending'
    );

    IF v_product_ecm IS NOT NULL THEN
      INSERT INTO case_products (case_id, product_id, serial_number, quantity, fault_notes)
      VALUES (v_case2_id, v_product_ecm, NULL, 1, 'No power after impact during race');
    END IF;

    RAISE NOTICE 'CASE-202604-0051 created.';
  ELSE
    RAISE NOTICE 'CASE-202604-0051 already exists — skipped.';
  END IF;

END $$;


-- ============================================================
-- ADDITIONAL DEMO DATA (Phase 9)
-- Three more customers and cases for a full range of statuses.
-- ============================================================

-- User profiles for additional demo customers
UPDATE users SET
  full_name = 'Alex Hartley',
  company   = 'TF Sport',
  role      = 'customer',
  office    = NULL
WHERE email = 'demo.customer2@tfsport.com';

UPDATE users SET
  full_name = 'Sarah Monks',
  company   = 'Porsche Motorsport',
  role      = 'customer',
  office    = NULL
WHERE email = 'demo.customer3@porsche.com';

UPDATE users SET
  full_name = 'Dale Hinton',
  company   = 'IndyCar',
  role      = 'customer',
  office    = NULL
WHERE email = 'demo.customer4@indycar.com';

-- Customer account for demo.customer2 — no credit terms (triggers payment stub)
INSERT INTO customer_accounts (user_id, company_name, credit_terms, po_required, account_active)
SELECT id, 'TF Sport', false, false, true
FROM users WHERE email = 'demo.customer2@tfsport.com'
  AND NOT EXISTS (
    SELECT 1 FROM customer_accounts ca
    JOIN users u ON u.id = ca.user_id
    WHERE u.email = 'demo.customer2@tfsport.com'
  );

-- Customer account for demo.customer3 — credit terms, no PO required
INSERT INTO customer_accounts (user_id, company_name, credit_terms, po_required, account_active)
SELECT id, 'Porsche Motorsport', true, false, true
FROM users WHERE email = 'demo.customer3@porsche.com'
  AND NOT EXISTS (
    SELECT 1 FROM customer_accounts ca
    JOIN users u ON u.id = ca.user_id
    WHERE u.email = 'demo.customer3@porsche.com'
  );

-- Customer account for demo.customer4 — credit terms, no PO required
INSERT INTO customer_accounts (user_id, company_name, credit_terms, po_required, account_active)
SELECT id, 'IndyCar', true, false, true
FROM users WHERE email = 'demo.customer4@indycar.com'
  AND NOT EXISTS (
    SELECT 1 FROM customer_accounts ca
    JOIN users u ON u.id = ca.user_id
    WHERE u.email = 'demo.customer4@indycar.com'
  );

DO $$
DECLARE
  v_customer2_id text;
  v_customer3_id text;
  v_customer4_id text;
  v_staff_id     text;
  v_case3_id     uuid;
  v_case4_id     uuid;
  v_case5_id     uuid;
  v_product_ecm  uuid;  -- Antares 8 TLA
  v_product_bad  uuid;  -- Badenia 4 Porsche
  v_product_clu  uuid;  -- CLU Plus
BEGIN
  SELECT id INTO v_customer2_id FROM users WHERE email = 'demo.customer2@tfsport.com';
  SELECT id INTO v_customer3_id FROM users WHERE email = 'demo.customer3@porsche.com';
  SELECT id INTO v_customer4_id FROM users WHERE email = 'demo.customer4@indycar.com';
  SELECT id INTO v_staff_id     FROM users WHERE email = 'demo.staff@cosworth.com';

  SELECT id INTO v_product_ecm FROM products WHERE part_number = '01E-501120'; -- Antares 8 TLA
  SELECT id INTO v_product_bad FROM products WHERE part_number = '01L-650115-P'; -- Badenia 4 Porsche
  SELECT id INTO v_product_clu FROM products WHERE part_number = '01L-650001'; -- CLU Plus

  -- ── CASE 3: CASE-202604-0053 — SUBMITTED (Alex Hartley, TF Sport) ─────────
  IF v_customer2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-202604-0053') THEN
    v_case3_id := gen_random_uuid();
    INSERT INTO cases (
      id, case_number, customer_id, office, status, fault_type,
      required_return_date, fault_description,
      payment_required, payment_status
    ) VALUES (
      v_case3_id, 'CASE-202604-0053', v_customer2_id,
      'UK', 'SUBMITTED', 'repair',
      (CURRENT_DATE + INTERVAL '30 days')::date,
      'Unit overheating and shutting down under race conditions.',
      true, 'stub_notified'
    );
    IF v_product_ecm IS NOT NULL THEN
      INSERT INTO case_products (case_id, product_id, quantity, fault_notes)
      VALUES (v_case3_id, v_product_ecm, 1, 'Thermal shutdown fault, intermittent under load');
    END IF;
    RAISE NOTICE 'CASE-202604-0053 created.';
  ELSE
    RAISE NOTICE 'CASE-202604-0053 skipped.';
  END IF;

  -- ── CASE 4: CASE-202604-0050 — UNDER_REVIEW (Sarah Monks, Porsche) ────────
  IF v_customer3_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-202604-0050') THEN
    v_case4_id := gen_random_uuid();
    INSERT INTO cases (
      id, case_number, customer_id, office, status, fault_type,
      required_return_date, fault_description,
      payment_required, payment_status
    ) VALUES (
      v_case4_id, 'CASE-202604-0050', v_customer3_id,
      'UK', 'UNDER_REVIEW', 'repair',
      (CURRENT_DATE + INTERVAL '21 days')::date,
      'Logger not recording GPS data. File corruption on download.',
      false, 'waived'
    );
    IF v_product_bad IS NOT NULL THEN
      INSERT INTO case_products (case_id, product_id, quantity, fault_notes)
      VALUES (v_case4_id, v_product_bad, 1, 'GPS dropout and corrupt log files');
    END IF;
    IF v_staff_id IS NOT NULL THEN
      INSERT INTO case_updates (case_id, author_id, content, is_internal, status_change_to, created_at)
      VALUES (v_case4_id, v_staff_id, 'Case received and under initial review. Checking against known GPS firmware issues.',
              false, 'UNDER_REVIEW', now() - INTERVAL '2 days');
    END IF;
    RAISE NOTICE 'CASE-202604-0050 created.';
  ELSE
    RAISE NOTICE 'CASE-202604-0050 skipped.';
  END IF;

  -- ── CASE 5: CASE-202604-0044 — IN_REPAIR / AWAITING_PARTS hold ───────────
  IF v_customer4_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-202604-0044') THEN
    v_case5_id := gen_random_uuid();
    INSERT INTO cases (
      id, case_number, customer_id, office, status, fault_type,
      workshop_stage, rma_number,
      is_on_hold, hold_reason, hold_customer_label,
      required_return_date, fault_description,
      sap_estimated_completion,
      payment_required, payment_status
    ) VALUES (
      v_case5_id, 'CASE-202604-0044', v_customer4_id,
      'UK', 'IN_REPAIR', 'repair', 'RETEST',
      'RMA-202604-0044',
      true, 'AWAITING_PARTS', 'On Hold — Awaiting Parts',
      (CURRENT_DATE + INTERVAL '28 days')::date,
      'Unit losing logging data mid-session. Suspected memory fault.',
      (CURRENT_DATE + INTERVAL '21 days')::date,
      false, 'waived'
    );
    IF v_product_clu IS NOT NULL THEN
      INSERT INTO case_products (case_id, product_id, serial_number, quantity, fault_notes, test_fee_applied)
      VALUES (v_case5_id, v_product_clu, 'CEL-20241208', 1, 'Random session data loss, memory fault suspected', 450.00);
    END IF;
    IF v_staff_id IS NOT NULL THEN
      INSERT INTO case_updates (case_id, author_id, content, is_internal, status_change_to, created_at) VALUES
      (v_case5_id, v_staff_id, 'Case approved. RMA-202604-0044 issued.',
       false, 'RMA_ISSUED', now() - INTERVAL '18 days'),
      (v_case5_id, v_staff_id, 'Unit received. Initial test confirms intermittent memory read error on channel 3.',
       false, 'IN_REPAIR', now() - INTERVAL '14 days'),
      (v_case5_id, v_staff_id, 'Replacement NAND flash module ordered. Repair paused until parts arrive.',
       false, null, now() - INTERVAL '10 days');
    END IF;
    RAISE NOTICE 'CASE-202604-0044 created.';
  ELSE
    RAISE NOTICE 'CASE-202604-0044 skipped.';
  END IF;

END $$;


-- ============================================================
-- 5. PER-PRODUCT DATA BACKFILL (migrations 006 + 007)
-- Sets workshop_stage and SAP fields on existing IN_REPAIR
-- case_products so the product-scoped stage tabs work correctly.
-- Safe to re-run — uses UPDATE … WHERE workshop_stage IS NULL.
-- ============================================================

-- CASE-202604-0047: CDU 10.3 in FINAL_TEST, Works Order REP-2026-04471
UPDATE case_products SET
  workshop_stage  = 'FINAL_TEST',
  sap_works_order = 'REP-2026-04471',
  sap_order_value = 340.00,
  sap_spent_hours = 2.5,
  sap_estimated_completion = (CURRENT_DATE + INTERVAL '14 days')::date
WHERE case_id = (SELECT id FROM cases WHERE case_number = 'CASE-202604-0047')
  AND workshop_stage IS NULL;

-- CASE-202604-0044: CLU Plus in RETEST, awaiting parts
UPDATE case_products SET
  workshop_stage  = 'RETEST',
  sap_order_value = 450.00,
  sap_spent_hours = 1.5,
  sap_estimated_completion = (CURRENT_DATE + INTERVAL '21 days')::date
WHERE case_id = (SELECT id FROM cases WHERE case_number = 'CASE-202604-0044')
  AND workshop_stage IS NULL;


-- ============================================================
-- 6. MULTI-PRODUCT DEMO CASE (CASE-202604-0056)
-- Two products at different workshop stages — exercises the
-- per-product tab UI on the admin case detail page.
-- Customer: Will Kerridge (demo.customer@btsport.com)
-- ============================================================

DO $$
DECLARE
  v_customer_id  text;
  v_staff_id     text;
  v_case6_id     uuid;
  v_cp1_id       uuid;
  v_cp2_id       uuid;
  v_product_cdu  uuid;  -- CDU 7.0
  v_product_ecm  uuid;  -- SQ6M ECU
BEGIN
  SELECT id INTO v_customer_id FROM users WHERE email = 'demo.customer@btsport.com';
  SELECT id INTO v_staff_id    FROM users WHERE email = 'demo.staff@cosworth.com';
  SELECT id INTO v_product_cdu FROM products WHERE part_number = '01D-640040'; -- CDU 7.0
  SELECT id INTO v_product_ecm FROM products WHERE part_number = '01E-500720'; -- SQ6M ECU

  IF v_customer_id IS NULL OR v_staff_id IS NULL THEN
    RAISE NOTICE 'Users not found — skipping CASE-202604-0056. Register demo accounts first.';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM cases WHERE case_number = 'CASE-202604-0056') THEN

    v_case6_id := gen_random_uuid();
    v_cp1_id   := gen_random_uuid();
    v_cp2_id   := gen_random_uuid();

    INSERT INTO cases (
      id, case_number, customer_id, office, status, fault_type,
      workshop_stage, rma_number,
      sap_sales_order,
      required_return_date, fault_description,
      payment_required, payment_status
    ) VALUES (
      v_case6_id,
      'CASE-202604-0056',
      v_customer_id,
      'UK', 'IN_REPAIR', 'repair', 'REWORK',
      'RMA-202604-0055',
      '4500013201',
      (CURRENT_DATE + INTERVAL '30 days')::date,
      'End of season service. CDU display brightness degraded and ECU comms intermittent.',
      false, 'waived'
    );

    -- Product 1: CDU 7.0 — further along (REWORK stage)
    IF v_product_cdu IS NOT NULL THEN
      INSERT INTO case_products (
        id, case_id, product_id, serial_number, quantity, fault_notes,
        test_fee_applied, repair_fee_applied,
        workshop_stage,
        sap_works_order, sap_order_value, sap_spent_hours,
        sap_estimated_completion
      ) VALUES (
        v_cp1_id, v_case6_id, v_product_cdu,
        'CEL-20230816', 1,
        'Screen brightness reduced to ~30% at startup, recovers after 10 mins warm-up',
        350.00, 750.00,
        'REWORK',
        'REP-2026-05601', 310.00, 3.0,
        (CURRENT_DATE + INTERVAL '10 days')::date
      );
    END IF;

    -- Product 2: SQ6M ECU — earlier stage (AWAITING_TEST)
    IF v_product_ecm IS NOT NULL THEN
      INSERT INTO case_products (
        id, case_id, product_id, serial_number, quantity, fault_notes,
        test_fee_applied,
        workshop_stage,
        sap_works_order, sap_order_value,
        sap_estimated_completion
      ) VALUES (
        v_cp2_id, v_case6_id, v_product_ecm,
        'CEL-20221103', 1,
        'Intermittent loss of comms on CAN channel 1 under high engine load',
        700.00,
        'AWAITING_TEST',
        'REP-2026-05602', 180.00,
        (CURRENT_DATE + INTERVAL '18 days')::date
      );
    END IF;

    -- Case-level timeline entries
    INSERT INTO case_updates (case_id, author_id, content, is_internal, status_change_to, created_at) VALUES
    (v_case6_id, v_staff_id,
     'Case approved. RMA-202604-0055 issued. Please ship both units to: Cosworth Electronics Ltd, Acorn House, Bakers Road, Uxbridge, UB8 1RG. Quote RMA number on packaging.',
     false, 'RMA_ISSUED', now() - INTERVAL '8 days'),
    (v_case6_id, v_staff_id,
     'Both units received and booked in. Visual inspection complete — no physical damage on either unit. Proceeding to test.',
     false, 'PARTS_RECEIVED', now() - INTERVAL '6 days');

    -- Product-tagged timeline entries (product_id column added in migration 006)
    INSERT INTO case_updates (case_id, product_id, author_id, content, is_internal, status_change_to, created_at) VALUES
    (v_case6_id, v_cp1_id, v_staff_id,
     'CDU 7.0 fault confirmed: backlight driver circuit degraded, replacement driver IC sourced. Routed to rework.',
     false, null, now() - INTERVAL '3 days'),
    (v_case6_id, v_cp2_id, v_staff_id,
     'SQ6M ECU booked on to test rig. CAN comms fault intermittent — extended soak test scheduled.',
     false, null, now() - INTERVAL '2 days');

    RAISE NOTICE 'CASE-202604-0056 (multi-product) created.';
  ELSE
    RAISE NOTICE 'CASE-202604-0056 already exists — skipped.';
  END IF;

END $$;


-- ============================================================
-- 7. SEQUENCE INITIALISATION
-- Ensures generated numbers don't collide with seeded cases.
-- ============================================================

INSERT INTO case_number_sequences (prefix, month_key, last_seq) VALUES
  ('CASE', '202604', 57),
  ('RMA',  '202604', 56)
ON CONFLICT (prefix, month_key)
DO UPDATE SET last_seq = GREATEST(case_number_sequences.last_seq, EXCLUDED.last_seq);
