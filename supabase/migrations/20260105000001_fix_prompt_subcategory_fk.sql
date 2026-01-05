-- Make prompts.subcategory_id nullable and update FK behavior to 'on delete set null'
-- This allows deleting subcategories/categories even if prompts are assigned to them

ALTER TABLE public.prompts 
    ALTER COLUMN subcategory_id DROP NOT NULL;

ALTER TABLE public.prompts
    DROP CONSTRAINT prompts_subcategory_id_fkey,
    ADD CONSTRAINT prompts_subcategory_id_fkey 
        FOREIGN KEY (subcategory_id) 
        REFERENCES public.subcategories(id) 
        ON DELETE SET NULL;
