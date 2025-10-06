-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  google_calendar_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Users can view all approved events
CREATE POLICY "Anyone can view approved events"
ON public.events
FOR SELECT
TO authenticated
USING (status = 'approved');

-- Users can view their own event requests
CREATE POLICY "Users can view their own events"
ON public.events
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Users can create their own events
CREATE POLICY "Users can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can update their own pending events
CREATE POLICY "Users can update their own pending events"
ON public.events
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by AND status = 'pending');

-- Users can delete their own pending events
CREATE POLICY "Users can delete their own pending events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() = created_by AND status = 'pending');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();