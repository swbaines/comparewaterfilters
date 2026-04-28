CREATE TABLE public.abr_lookups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID,
  provider_id UUID,
  submitted_abn TEXT NOT NULL,
  submitted_business_name TEXT,
  mode TEXT NOT NULL DEFAULT 'live',
  verified BOOLEAN NOT NULL DEFAULT false,
  status TEXT,
  entity_name TEXT,
  business_names TEXT[] NOT NULL DEFAULT '{}'::text[],
  gst_registered BOOLEAN,
  review_flag TEXT,
  error_message TEXT,
  http_status INTEGER,
  duration_ms INTEGER,
  raw_response JSONB
);

CREATE INDEX idx_abr_lookups_created_at ON public.abr_lookups (created_at DESC);
CREATE INDEX idx_abr_lookups_provider_id ON public.abr_lookups (provider_id);
CREATE INDEX idx_abr_lookups_submitted_abn ON public.abr_lookups (submitted_abn);

ALTER TABLE public.abr_lookups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage abr lookups"
ON public.abr_lookups
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert abr lookups"
ON public.abr_lookups
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role'::text);
