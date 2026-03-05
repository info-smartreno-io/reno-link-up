-- Enable RLS on exposed tables and add admin-only policies

-- contractor_referrals
ALTER TABLE IF EXISTS public.contractor_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage contractor referrals" ON public.contractor_referrals;
CREATE POLICY "Admins can manage contractor referrals" ON public.contractor_referrals
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- subcontractor_applicants
ALTER TABLE IF EXISTS public.subcontractor_applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage subcontractor applicants" ON public.subcontractor_applicants;
CREATE POLICY "Admins can manage subcontractor applicants" ON public.subcontractor_applicants
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- financing_inquiries
ALTER TABLE IF EXISTS public.financing_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage financing inquiries" ON public.financing_inquiries;
CREATE POLICY "Admins can manage financing inquiries" ON public.financing_inquiries
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Users can insert financing inquiries" ON public.financing_inquiries;
CREATE POLICY "Users can insert financing inquiries" ON public.financing_inquiries
  FOR INSERT WITH CHECK (true);

-- cost_calculator_submissions  
ALTER TABLE IF EXISTS public.cost_calculator_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage cost calculator submissions" ON public.cost_calculator_submissions;
CREATE POLICY "Admins can manage cost calculator submissions" ON public.cost_calculator_submissions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can submit cost calculator" ON public.cost_calculator_submissions;
CREATE POLICY "Anyone can submit cost calculator" ON public.cost_calculator_submissions
  FOR INSERT WITH CHECK (true);

-- homeowner_applicants
ALTER TABLE IF EXISTS public.homeowner_applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage homeowner applicants" ON public.homeowner_applicants;
CREATE POLICY "Admins can manage homeowner applicants" ON public.homeowner_applicants
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can submit homeowner application" ON public.homeowner_applicants;
CREATE POLICY "Anyone can submit homeowner application" ON public.homeowner_applicants
  FOR INSERT WITH CHECK (true);

-- estimator_applicants
ALTER TABLE IF EXISTS public.estimator_applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage estimator applicants" ON public.estimator_applicants;
CREATE POLICY "Admins can manage estimator applicants" ON public.estimator_applicants
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can submit estimator application" ON public.estimator_applicants;
CREATE POLICY "Anyone can submit estimator application" ON public.estimator_applicants
  FOR INSERT WITH CHECK (true);

-- gc_applicants
ALTER TABLE IF EXISTS public.gc_applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage gc applicants" ON public.gc_applicants;
CREATE POLICY "Admins can manage gc applicants" ON public.gc_applicants
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can submit gc application" ON public.gc_applicants;
CREATE POLICY "Anyone can submit gc application" ON public.gc_applicants
  FOR INSERT WITH CHECK (true);

-- vendor_applicants
ALTER TABLE IF EXISTS public.vendor_applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage vendor applicants" ON public.vendor_applicants;
CREATE POLICY "Admins can manage vendor applicants" ON public.vendor_applicants
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can submit vendor application" ON public.vendor_applicants;
CREATE POLICY "Anyone can submit vendor application" ON public.vendor_applicants
  FOR INSERT WITH CHECK (true);

-- partner_applicants
ALTER TABLE IF EXISTS public.partner_applicants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage partner applicants" ON public.partner_applicants;
CREATE POLICY "Admins can manage partner applicants" ON public.partner_applicants
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can submit partner application" ON public.partner_applicants;
CREATE POLICY "Anyone can submit partner application" ON public.partner_applicants
  FOR INSERT WITH CHECK (true);

-- estimate_requests
ALTER TABLE IF EXISTS public.estimate_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage estimate requests" ON public.estimate_requests;
CREATE POLICY "Admins can manage estimate requests" ON public.estimate_requests
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can submit estimate request" ON public.estimate_requests;
CREATE POLICY "Anyone can submit estimate request" ON public.estimate_requests
  FOR INSERT WITH CHECK (true);

-- interior_designer_applications
ALTER TABLE IF EXISTS public.interior_designer_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage interior designer applications" ON public.interior_designer_applications;
CREATE POLICY "Admins can manage interior designer applications" ON public.interior_designer_applications
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can submit interior designer application" ON public.interior_designer_applications;
CREATE POLICY "Anyone can submit interior designer application" ON public.interior_designer_applications
  FOR INSERT WITH CHECK (true);

-- website_chat_conversations
ALTER TABLE IF EXISTS public.website_chat_conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage chat conversations" ON public.website_chat_conversations;
CREATE POLICY "Admins can manage chat conversations" ON public.website_chat_conversations
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can create chat conversations" ON public.website_chat_conversations;
CREATE POLICY "Anyone can create chat conversations" ON public.website_chat_conversations
  FOR INSERT WITH CHECK (true);

-- conversion_events
ALTER TABLE IF EXISTS public.conversion_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage conversion events" ON public.conversion_events;
CREATE POLICY "Admins can manage conversion events" ON public.conversion_events
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can insert conversion events" ON public.conversion_events;
CREATE POLICY "Anyone can insert conversion events" ON public.conversion_events
  FOR INSERT WITH CHECK (true);

-- newsletter_subscribers
ALTER TABLE IF EXISTS public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins can manage newsletter subscribers" ON public.newsletter_subscribers
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (true);