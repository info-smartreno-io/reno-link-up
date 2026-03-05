-- Assign admin role to info@smartreno.io
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users 
WHERE email = 'info@smartreno.io'
ON CONFLICT (user_id, role) DO NOTHING;

-- Clean up orphaned admin role
DELETE FROM user_roles 
WHERE user_id = '79e6892c-061f-4401-88d7-28e982bbc62f';