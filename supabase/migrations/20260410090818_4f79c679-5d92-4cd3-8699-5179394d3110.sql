-- Fix: Allow vendors to create account link for their own submitted provider (pending or approved)
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