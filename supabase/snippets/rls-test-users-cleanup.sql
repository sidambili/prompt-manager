-- First, delete any rows that reference the test users
DELETE FROM public.prompts WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com'
);
DELETE FROM public.categories WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com'
);

-- Then delete the auth users
DELETE FROM auth.users WHERE email LIKE 'test_%@example.com';