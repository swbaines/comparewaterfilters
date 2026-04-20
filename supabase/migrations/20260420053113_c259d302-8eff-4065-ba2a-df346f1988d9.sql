CREATE POLICY "Vendors can update own account"
ON public.vendor_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);