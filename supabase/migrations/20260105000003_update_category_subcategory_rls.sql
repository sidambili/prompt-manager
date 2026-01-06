-- Update RLS policies for owner-scoped categories with optional public visibility

-- Categories
DROP POLICY IF EXISTS "Categories are publicly readable" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON public.categories;

CREATE POLICY "Categories are readable if public or owner"
    ON public.categories FOR SELECT
    USING (
        is_public = true
        OR auth.uid() = user_id
    );

CREATE POLICY "Users can insert their own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Subcategories
DROP POLICY IF EXISTS "Subcategories are publicly readable" ON public.subcategories;
DROP POLICY IF EXISTS "Authenticated users can insert subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Authenticated users can update subcategories" ON public.subcategories;
DROP POLICY IF EXISTS "Authenticated users can delete subcategories" ON public.subcategories;

CREATE POLICY "Subcategories are readable if parent category public or owner"
    ON public.subcategories FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.categories c
            WHERE c.id = subcategories.category_id
              AND (c.is_public = true OR c.user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert subcategories in their own categories"
    ON public.subcategories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.categories c
            WHERE c.id = subcategories.category_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update subcategories in their own categories"
    ON public.subcategories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.categories c
            WHERE c.id = subcategories.category_id
              AND c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.categories c
            WHERE c.id = subcategories.category_id
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete subcategories in their own categories"
    ON public.subcategories FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.categories c
            WHERE c.id = subcategories.category_id
              AND c.user_id = auth.uid()
        )
    );
