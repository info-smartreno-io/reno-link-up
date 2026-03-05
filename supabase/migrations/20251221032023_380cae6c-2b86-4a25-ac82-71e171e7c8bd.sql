-- Service bookings table for daily revenue services
CREATE TABLE public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL CHECK (service_type IN ('drain_cleaning', 'gutter_cleaning', 'handyman')),
  service_options JSONB DEFAULT '[]'::jsonb,
  add_ons JSONB DEFAULT '[]'::jsonb,
  total_price NUMERIC(10,2) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_address TEXT NOT NULL,
  city TEXT,
  state TEXT DEFAULT 'NJ',
  zip_code TEXT,
  preferred_date DATE,
  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening')),
  access_notes TEXT,
  status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  smartreno_homeowner_id TEXT,
  smartreno_job_id TEXT,
  smartreno_payment_url TEXT,
  source TEXT DEFAULT 'allinonehome.com',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Service waitlist for pre-launch capture
CREATE TABLE public.service_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  zip_code TEXT,
  service_interest TEXT CHECK (service_interest IN ('drain_cleaning', 'gutter_cleaning', 'handyman', 'all')),
  source TEXT DEFAULT 'allinonehome.com',
  notify_on_launch BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email, service_interest)
);

-- Enable RLS
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_waitlist ENABLE ROW LEVEL SECURITY;

-- Public insert policy for service_bookings (customers submitting bookings)
CREATE POLICY "Anyone can create service bookings"
ON public.service_bookings
FOR INSERT
WITH CHECK (true);

-- Admin can view all bookings (using user_roles table with correct enum values)
CREATE POLICY "Admins can view all service bookings"
ON public.service_bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'general_manager', 'business_operations')
  )
);

-- Admin can update bookings
CREATE POLICY "Admins can update service bookings"
ON public.service_bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'general_manager', 'business_operations')
  )
);

-- Public insert policy for waitlist
CREATE POLICY "Anyone can join service waitlist"
ON public.service_waitlist
FOR INSERT
WITH CHECK (true);

-- Admin can view waitlist
CREATE POLICY "Admins can view service waitlist"
ON public.service_waitlist
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'general_manager', 'business_operations')
  )
);

-- Create updated_at trigger for service_bookings
CREATE TRIGGER update_service_bookings_updated_at
BEFORE UPDATE ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_service_bookings_status ON public.service_bookings(status);
CREATE INDEX idx_service_bookings_service_type ON public.service_bookings(service_type);
CREATE INDEX idx_service_bookings_created_at ON public.service_bookings(created_at DESC);
CREATE INDEX idx_service_waitlist_service_interest ON public.service_waitlist(service_interest);
CREATE INDEX idx_service_waitlist_created_at ON public.service_waitlist(created_at DESC);