
-- Add approval_status to providers
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.providers ADD COLUMN approval_status public.approval_status NOT NULL DEFAULT 'approved';
ALTER TABLE public.providers ADD COLUMN submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing providers to approved
UPDATE public.providers SET approval_status = 'approved' WHERE approval_status IS NOT NULL;

-- Allow authenticated users to insert providers (for self-registration)
CREATE POLICY "Authenticated users can submit providers"
ON public.providers FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow users to update their own pending providers
CREATE POLICY "Users can update own pending providers"
ON public.providers FOR UPDATE TO authenticated
USING (submitted_by = auth.uid() AND approval_status = 'pending')
WITH CHECK (submitted_by = auth.uid() AND approval_status = 'pending');

-- Allow vendors to read their own provider (even if pending)
CREATE POLICY "Users can read own submitted providers"
ON public.providers FOR SELECT TO authenticated
USING (submitted_by = auth.uid());
