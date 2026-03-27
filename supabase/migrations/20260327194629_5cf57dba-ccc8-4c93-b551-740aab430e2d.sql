
-- Allow authenticated users to create their own vendor account link
CREATE POLICY "Users can create own vendor account"
ON public.vendor_accounts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());
