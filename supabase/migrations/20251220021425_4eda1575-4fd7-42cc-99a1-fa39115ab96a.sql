-- Insert API key for All-In-One Home Solutions
INSERT INTO public.api_keys (organization_name, api_key, is_active)
VALUES ('All-In-One Home Solutions', 'aihs_allinone_' || encode(gen_random_bytes(16), 'hex'), true);