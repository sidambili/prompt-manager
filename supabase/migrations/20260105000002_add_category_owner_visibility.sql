-- Add owner scoping and public/private visibility to categories

ALTER TABLE public.categories
    ADD COLUMN user_id uuid,
    ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Backfill existing rows to seed user owner
UPDATE public.categories
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

ALTER TABLE public.categories
    ALTER COLUMN user_id SET NOT NULL;
