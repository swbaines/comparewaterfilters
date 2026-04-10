
-- Fix: Restrict vendor_accounts INSERT to approved providers only
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
    AND p.approval_status = 'approved'
  )
);

-- Fix: Scope vendor-logos DELETE policy to authenticated role only
DROP POLICY IF EXISTS "Vendors can delete own logos" ON storage.objects;

CREATE POLICY "Vendors can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-logos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);
