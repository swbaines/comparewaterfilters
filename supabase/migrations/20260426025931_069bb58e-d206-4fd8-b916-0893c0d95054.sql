CREATE TABLE public.stripe_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  level TEXT NOT NULL,
  code TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL,
  event_id TEXT,
  event_type TEXT,
  stripe_object_id TEXT,
  request_id TEXT,
  message TEXT,
  detail JSONB
);

ALTER TABLE public.stripe_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read stripe webhook logs"
ON public.stripe_webhook_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage stripe webhook logs"
ON public.stripe_webhook_logs
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

CREATE INDEX idx_stripe_webhook_logs_created_at ON public.stripe_webhook_logs (created_at DESC);
CREATE INDEX idx_stripe_webhook_logs_event_id ON public.stripe_webhook_logs (event_id);
CREATE INDEX idx_stripe_webhook_logs_code ON public.stripe_webhook_logs (code);
CREATE INDEX idx_stripe_webhook_logs_outcome ON public.stripe_webhook_logs (outcome);