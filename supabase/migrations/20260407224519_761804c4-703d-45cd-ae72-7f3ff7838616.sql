CREATE POLICY "Vendors can update own provider"
ON public.providers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_accounts va
    WHERE va.user_id = auth.uid() AND va.provider_id = providers.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendor_accounts va
    WHERE va.user_id = auth.uid() AND va.provider_id = providers.id
  )
);