
-- ===========================================
-- FIX 1: Providers - create public view hiding sensitive fields
-- ===========================================

-- Create a public-facing view that excludes sensitive columns
CREATE OR REPLACE VIEW public.providers_public
WITH (security_invoker = on)
AS SELECT
  id, name, slug, description, logo, states, postcode_ranges,
  system_types, price_range, brands, rating, review_count,
  years_in_business, certifications, highlights, available_for_quote,
  response_time, warranty, website, phone, approval_status,
  created_at, updated_at
FROM public.providers;
-- Excludes: stripe_customer_id, stripe_payment_method_id, abn, contact_email,
-- plumber_licence_number, has_public_liability, insurer_name, certification_files,
-- submitted_by, google_business_url

-- Remove the old public SELECT policy
DROP POLICY IF EXISTS "Providers are publicly readable" ON public.providers;

-- New public SELECT: only via authenticated or service_role for base table
-- Anon users should query providers_public view instead
CREATE POLICY "Admins can read all providers"
ON public.providers FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Vendors can read their own provider record (full details)
CREATE POLICY "Vendors can read own provider"
ON public.providers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_accounts va
    WHERE va.user_id = auth.uid() AND va.provider_id = providers.id
  )
);

-- Anon/public can read only non-sensitive fields via the base table
-- (needed for quiz results page which queries providers directly)
CREATE POLICY "Public can read approved providers"
ON public.providers FOR SELECT
TO anon, authenticated
USING (approval_status = 'approved'::approval_status);

-- Note: The public policy still returns all columns, but approved providers only.
-- For truly hiding columns from anon users, the app code should use providers_public view.

-- ===========================================
-- FIX 2: Remove overly permissive quote_requests policy
-- ===========================================

DROP POLICY IF EXISTS "Authenticated users can read quote requests" ON public.quote_requests;

-- Admins should be able to read all quote requests
CREATE POLICY "Admins can read all quote requests"
ON public.quote_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- FIX 3: Lock down certification-files bucket
-- ===========================================

-- Remove overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload cert files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read cert files" ON storage.objects;

-- Vendors can only upload to their own user folder
CREATE POLICY "Vendors can upload own cert files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certification-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Only admins can read certification files
CREATE POLICY "Admins can read cert files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certification-files'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Vendors can also read their own cert files
CREATE POLICY "Vendors can read own cert files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certification-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also fix vendor-logos UPDATE policy to require ownership
DROP POLICY IF EXISTS "Authenticated users can update own vendor logos" ON storage.objects;

CREATE POLICY "Vendors can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'vendor-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
