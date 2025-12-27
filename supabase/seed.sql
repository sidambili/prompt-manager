
-- Seed Categories
INSERT INTO public.categories (name, slug, sort_rank, is_system) VALUES 
('Software Engineering', 'software-engineering', 10, true),
('Content Creation', 'content-creation', 20, true),
('Business', 'business', 30, true),
('Education', 'education', 40, true),
('Other', 'other', 999, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Subcategories (Assuming IDs are generated, we subquery)
INSERT INTO public.subcategories (category_id, name, slug, sort_rank) 
SELECT id, 'Code Review', 'code-review', 10 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Refactoring', 'refactoring', 20 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Blog Posts', 'blog-posts', 10 FROM public.categories WHERE slug = 'content-creation';
