-- Import logs: read-only audit trail of every Power BI import
-- Never delete rows from this table.

CREATE TABLE import_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename        text NOT NULL,
  uploaded_by     text REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at     timestamptz NOT NULL DEFAULT now(),
  total_rows      int NOT NULL DEFAULT 0,
  matched_rows    int NOT NULL DEFAULT 0,
  updated_rows    int NOT NULL DEFAULT 0,
  rows_data       jsonb NOT NULL DEFAULT '[]'
);

-- Staff and admin can read import logs; only server can insert
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and admin can view import logs"
  ON import_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()) LIMIT 1)
        AND users.role IN ('staff_uk', 'staff_us', 'admin')
    )
  );
