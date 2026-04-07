
-- Remove the broad public policy that exposes sensitive columns
DROP POLICY IF EXISTS "Public can read approved providers" ON public.providers;

-- Allow anon to read the base table but ONLY for approved providers
-- The app code will use explicit column selection or the view
-- We need this for the supabase client to work with the providers table
CREATE POLICY "Anon can read approved providers limited"
ON public.providers FOR SELECT
TO anon
USING (approval_status = 'approved'::approval_status);

-- Authenticated non-admin/non-vendor users can also read approved providers
CREATE POLICY "Authenticated can read approved providers"
ON public.providers FOR SELECT
TO authenticated
USING (approval_status = 'approved'::approval_status);

-- Fix vendor-logos INSERT to require ownership path
DROP POLICY IF EXISTS "Authenticated users can upload vendor logos" ON storage.objects;

CREATE POLICY "Vendors can upload own logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-logos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
