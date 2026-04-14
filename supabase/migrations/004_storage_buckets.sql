-- Create case attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-attachments',
  'case-attachments',
  false,
  20971520,
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
);

-- RLS: staff and admin can upload
CREATE POLICY "Staff can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-attachments'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE email = auth.email()
    AND role IN ('staff_uk', 'staff_us', 'admin')
  )
);

-- RLS: authenticated users can download their own case attachments
CREATE POLICY "Users can download case attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-attachments');
