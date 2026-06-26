CREATE TABLE public.quiz_funnel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  step_number INTEGER,
  step_title TEXT,
  session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quiz_funnel_events_created_at ON public.quiz_funnel_events (created_at DESC);
CREATE INDEX idx_quiz_funnel_events_event_name ON public.quiz_funnel_events (event_name);
CREATE INDEX idx_quiz_funnel_events_step_number ON public.quiz_funnel_events (step_number);
CREATE INDEX idx_quiz_funnel_events_session_id ON public.quiz_funnel_events (session_id);

GRANT INSERT ON public.quiz_funnel_events TO anon, authenticated;
GRANT SELECT ON public.quiz_funnel_events TO authenticated;
GRANT ALL ON public.quiz_funnel_events TO service_role;

ALTER TABLE public.quiz_funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz funnel events"
  ON public.quiz_funnel_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view quiz funnel events"
  ON public.quiz_funnel_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));