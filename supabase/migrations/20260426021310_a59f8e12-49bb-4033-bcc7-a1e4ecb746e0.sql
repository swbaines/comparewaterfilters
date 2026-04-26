-- 1. Add new columns to providers
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS insurance_certificate_url text,
  ADD COLUMN IF NOT EXISTS insurance_expiry_date date,
  ADD COLUMN IF NOT EXISTS insurance_paused_at timestamptz;

-- 2. Create private storage bucket for insurance certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-insurance-certificates', 'vendor-insurance-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies on storage.objects for the new bucket
-- Path convention: <provider_id>/<filename>

-- Vendors can read their own certificate
DROP POLICY IF EXISTS "Vendors can read own insurance certificate" ON storage.objects;
CREATE POLICY "Vendors can read own insurance certificate"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-insurance-certificates'
  AND EXISTS (
    SELECT 1 FROM public.vendor_accounts va
    WHERE va.user_id = auth.uid()
      AND va.provider_id::text = (storage.foldername(name))[1]
  )
);

-- Vendors can upload to their own provider folder
DROP POLICY IF EXISTS "Vendors can upload own insurance certificate" ON storage.objects;
CREATE POLICY "Vendors can upload own insurance certificate"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-insurance-certificates'
  AND EXISTS (
    SELECT 1 FROM public.vendor_accounts va
    WHERE va.user_id = auth.uid()
      AND va.provider_id::text = (storage.foldername(name))[1]
  )
);

-- Vendors can replace (update) their own certificate
DROP POLICY IF EXISTS "Vendors can update own insurance certificate" ON storage.objects;
CREATE POLICY "Vendors can update own insurance certificate"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-insurance-certificates'
  AND EXISTS (
    SELECT 1 FROM public.vendor_accounts va
    WHERE va.user_id = auth.uid()
      AND va.provider_id::text = (storage.foldername(name))[1]
  )
);

-- Pending applicants (provider not yet linked via vendor_accounts) — allow upload during registration
DROP POLICY IF EXISTS "Applicants can upload insurance certificate during signup" ON storage.objects;
CREATE POLICY "Applicants can upload insurance certificate during signup"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-insurance-certificates'
  AND EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.submitted_by = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
);

DROP POLICY IF EXISTS "Applicants can read own insurance certificate" ON storage.objects;
CREATE POLICY "Applicants can read own insurance certificate"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-insurance-certificates'
  AND EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.submitted_by = auth.uid()
      AND p.id::text = (storage.foldername(name))[1]
  )
);

-- Admins can read every certificate
DROP POLICY IF EXISTS "Admins can read all insurance certificates" ON storage.objects;
CREATE POLICY "Admins can read all insurance certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-insurance-certificates'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can manage (update / delete) certificates
DROP POLICY IF EXISTS "Admins can manage insurance certificates" ON storage.objects;
CREATE POLICY "Admins can manage insurance certificates"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'vendor-insurance-certificates'
  AND public.has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'vendor-insurance-certificates'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);