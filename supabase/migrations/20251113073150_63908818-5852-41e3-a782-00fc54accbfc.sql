-- Add search_path to all SECURITY DEFINER functions missing this protection
-- This prevents SQL injection via search path manipulation attacks

-- Update trigger functions that are missing search_path
ALTER FUNCTION public.update_smartplan_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_foreman_tasks_updated_at() SET search_path = public;
ALTER FUNCTION public.update_team_members_updated_at() SET search_path = public;
ALTER FUNCTION public.update_subcontractors_updated_at() SET search_path = public;
ALTER FUNCTION public.update_chat_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_contractor_updated_at() SET search_path = public;
ALTER FUNCTION public.update_google_calendar_tokens_updated_at() SET search_path = public;
ALTER FUNCTION public.update_material_selections_updated_at() SET search_path = public;
ALTER FUNCTION public.update_quickbooks_tokens_updated_at() SET search_path = public;
ALTER FUNCTION public.update_vendors_updated_at() SET search_path = public;
ALTER FUNCTION public.update_purchase_orders_updated_at() SET search_path = public;
ALTER FUNCTION public.update_google_calendar_webhooks_updated_at() SET search_path = public;

-- Update trigger_welcome_email function
ALTER FUNCTION public.trigger_welcome_email() SET search_path = public;