CREATE POLICY "Vendors can update own lead status"
ON public.quote_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_accounts va
    WHERE va.user_id = auth.uid() AND va.provider_id = quote_requests.provider_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendor_accounts va
    WHERE va.user_id = auth.uid() AND va.provider_id = quote_requests.provider_id
  )
);