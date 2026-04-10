
-- Fix critical: Remove anon direct access to providers table (use providers_public view instead)
DROP POLICY IF EXISTS "Anon can read approved providers limited" ON public.providers;

-- Grant anon SELECT on the providers_public view (which already excludes sensitive fields)
GRANT SELECT ON public.providers_public TO anon;

-- Fix: Add DELETE policy for vendor-logos bucket scoped to owner + admins
CREATE POLICY "Vendors can delete own logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'vendor-logos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Fix: Add DELETE policy for certification-files bucket
CREATE POLICY "Vendors can delete own certification files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'certification-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

-- Fix: Add UPDATE policy for certification-files bucket
CREATE POLICY "Vendors can update own certification files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'certification-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);
