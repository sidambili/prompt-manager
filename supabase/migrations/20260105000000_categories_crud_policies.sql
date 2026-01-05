-- Categories and Subcategories CRUD RLS Policies

-- Categories: Allow authenticated users to manage categories (since this is a self-hostable/admin tool context)
-- In a multi-tenant or more restricted app, we might limit this to specific roles, 
-- but for now, we follow the "own prompts" pattern if we had user_id on categories.
-- However, categories are currently global/system-wide.
-- For v1.2.0, we'll allow authenticated users to manage them.

create policy "Authenticated users can insert categories"
    on public.categories for insert
    with check (auth.role() = 'authenticated');

create policy "Authenticated users can update categories"
    on public.categories for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete categories"
    on public.categories for delete
    using (auth.role() = 'authenticated');

-- Subcategories: Allow authenticated users to manage subcategories
create policy "Authenticated users can insert subcategories"
    on public.subcategories for insert
    with check (auth.role() = 'authenticated');

create policy "Authenticated users can update subcategories"
    on public.subcategories for update
    using (auth.role() = 'authenticated')
    with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete subcategories"
    on public.subcategories for delete
    using (auth.role() = 'authenticated');
