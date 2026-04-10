
-- Drop the existing permissive INSERT policy
DROP POLICY "Users can create own vendor account" ON public.vendor_accounts;

-- Create a tighter policy: only allow linking to approved providers (or admin can do anything)
CREATE POLICY "Users can create own vendor account for approved providers"
ON public.vendor_accounts
FOR INSERT
TO authenticated
WITH CHECK (
  (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM providers p
    WHERE p.id = vendor_accounts.provider_id
      AND p.submitted_by = auth.uid()
      AND p.approval_status = 'approved'
  ))
);
