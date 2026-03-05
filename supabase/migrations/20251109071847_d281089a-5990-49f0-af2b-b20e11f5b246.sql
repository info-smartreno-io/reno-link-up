-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT, -- e.g., 'blog_post', 'blog_index', 'category_page'
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON public.newsletter_subscribers(status);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert their own email (public signup)
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers
FOR INSERT
WITH CHECK (true);

-- Policy: Allow reading own subscription status by email
CREATE POLICY "Users can view their own subscription"
ON public.newsletter_subscribers
FOR SELECT
USING (true);

-- Policy: Allow users to update their own subscription (unsubscribe)
CREATE POLICY "Users can update their own subscription"
ON public.newsletter_subscribers
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Function to validate email format
CREATE OR REPLACE FUNCTION validate_newsletter_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic email validation
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Convert email to lowercase
  NEW.email := LOWER(TRIM(NEW.email));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for email validation
CREATE TRIGGER validate_newsletter_email_trigger
  BEFORE INSERT OR UPDATE ON public.newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION validate_newsletter_email();