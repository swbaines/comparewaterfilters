
-- Fix critical: Remove overly broad authenticated SELECT on providers
DROP POLICY IF EXISTS "Authenticated can read approved providers" ON public.providers;

-- Grant authenticated users SELECT on providers_public view instead
GRANT SELECT ON public.providers_public TO authenticated;

-- Fix critical: Restrict vendor_accounts INSERT to only allow linking to providers the user submitted
DROP POLICY IF EXISTS "Users can create own vendor account" ON public.vendor_accounts;

CREATE POLICY "Users can create own vendor account"
ON public.vendor_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = provider_id
    AND p.submitted_by = auth.uid()
  )
);

-- Fix warning: Scope certification-files storage policies to authenticated role
DROP POLICY IF EXISTS "Vendors can delete own certification files" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can update own certification files" ON storage.objects;

CREATE POLICY "Vendors can delete own certification files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'certification-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

CREATE POLICY "Vendors can update own certification files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'certification-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);
