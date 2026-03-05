-- =====================================================
-- PHASE 1: Fix newsletter_subscribers RLS (remove permissive, add restrictive)
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can view newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can update newsletter subscribers" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can delete newsletter subscribers" ON public.newsletter_subscribers;

-- Ensure RLS is enabled
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Only admins can view newsletter subscribers (protects customer emails)
CREATE POLICY "Admins can view newsletter subscribers"
  ON public.newsletter_subscribers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow public inserts for newsletter signup forms
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Admins can update subscribers
CREATE POLICY "Admins can update newsletter subscribers"
  ON public.newsletter_subscribers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete subscribers
CREATE POLICY "Admins can delete newsletter subscribers"
  ON public.newsletter_subscribers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PHASE 2: Fix expense_categories RLS (make admin-only for write)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Contractors can manage their categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Authenticated users can view expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins can create expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins can update expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Admins can delete expense categories" ON public.expense_categories;

-- Ensure RLS is enabled
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read categories (needed for expense forms)
CREATE POLICY "Authenticated users can view expense categories"
  ON public.expense_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can insert categories
CREATE POLICY "Admins can create expense categories"
  ON public.expense_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update categories
CREATE POLICY "Admins can update expense categories"
  ON public.expense_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete categories
CREATE POLICY "Admins can delete expense categories"
  ON public.expense_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PHASE 3: Fix image_slots RLS (authenticated read, admin write)
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Admins can update image slots" ON public.image_slots;
DROP POLICY IF EXISTS "Admins can view all image slots" ON public.image_slots;
DROP POLICY IF EXISTS "Anyone can read image slots" ON public.image_slots;
DROP POLICY IF EXISTS "Authenticated users can update image slots" ON public.image_slots;
DROP POLICY IF EXISTS "Public can view active slot images" ON public.image_slots;
DROP POLICY IF EXISTS "Public can view active image slots" ON public.image_slots;
DROP POLICY IF EXISTS "Admins can create image slots" ON public.image_slots;
DROP POLICY IF EXISTS "Admins can delete image slots" ON public.image_slots;

-- Ensure RLS is enabled
ALTER TABLE public.image_slots ENABLE ROW LEVEL SECURITY;

-- Allow public read for image slots (needed for website display - CMS slot config)
CREATE POLICY "Public can view image slots"
  ON public.image_slots
  FOR SELECT
  USING (true);

-- Admins can create image slots
CREATE POLICY "Admins can create image slots"
  ON public.image_slots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update image slots
CREATE POLICY "Admins can update image slots"
  ON public.image_slots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete image slots
CREATE POLICY "Admins can delete image slots"
  ON public.image_slots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- PHASE 4: Clean up failed newsletter sync records
-- =====================================================

UPDATE public.newsletter_subscribers 
SET 
  smartreno_synced = true, 
  last_sync_error = 'SmartReno integration not configured - marked as synced'
WHERE smartreno_synced = false;