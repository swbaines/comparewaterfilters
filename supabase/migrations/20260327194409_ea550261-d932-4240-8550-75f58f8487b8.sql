
-- Tighten the insert policy to only allow pending submissions with own user id
DROP POLICY "Authenticated users can submit providers" ON public.providers;

CREATE POLICY "Authenticated users can submit pending providers"
ON public.providers FOR INSERT TO authenticated
WITH CHECK (submitted_by = auth.uid() AND approval_status = 'pending');
