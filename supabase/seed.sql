
-- Seed Categories
INSERT INTO public.categories (user_id, name, slug, sort_rank, is_system, is_public) VALUES 
('00000000-0000-0000-0000-000000000000', 'Software Engineering', 'software-engineering', 10, true, false),
('00000000-0000-0000-0000-000000000000', 'Content Creation', 'content-creation', 20, true, false),
('00000000-0000-0000-0000-000000000000', 'Business', 'business', 30, true, false),
('00000000-0000-0000-0000-000000000000', 'Education', 'education', 40, true, false),
('00000000-0000-0000-0000-000000000000', 'Other', 'other', 999, true, false)
ON CONFLICT (slug) DO NOTHING;

-- Seed Subcategories (Assuming IDs are generated, we subquery)
INSERT INTO public.subcategories (category_id, name, slug, sort_rank) 
SELECT id, 'Code Review', 'code-review', 10 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Refactoring', 'refactoring', 20 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Blog Posts', 'blog-posts', 10 FROM public.categories WHERE slug = 'content-creation';

-- Seed Prompts
-- Note: In a real environment, user_id should be a valid auth.users.id. 
-- For seeding local development, we'll create a default user if they don't exist.
DO $$
DECLARE
    v_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- Default placeholder
    v_code_review_id uuid;
    v_refactoring_id uuid;
    v_blog_posts_id uuid;
BEGIN
    -- Ensure seed user exists in auth.users
    -- This is required because of the foreign key constraint on prompts.user_id
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (
        v_user_id,
        'seed-user@example.com',
        crypt('password123', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Seed User"}',
        now(),
        now(),
        'authenticated',
        '',
        '',
        '',
        ''
    ) ON CONFLICT (id) DO NOTHING;

    -- Get subcategory IDs
    SELECT id INTO v_code_review_id FROM public.subcategories WHERE slug = 'code-review';
    SELECT id INTO v_refactoring_id FROM public.subcategories WHERE slug = 'refactoring';
    SELECT id INTO v_blog_posts_id FROM public.subcategories WHERE slug = 'blog-posts';

    -- Insert seed prompts
    INSERT INTO public.prompts (user_id, subcategory_id, title, slug, content, description, tags, is_public, is_listed) VALUES
    (
        v_user_id, 
        v_code_review_id, 
        'Senior React Reviewer', 
        'senior-react-reviewer',
        'You are a senior React developer. Review the following code for performance, accessibility, and best practices: {{code}}', 
        'Detailed code review prompt for React components.', 
        ARRAY['react', 'typescript', 'performance'], 
        true, 
        true
    ),
    (
        v_user_id, 
        v_refactoring_id, 
        'Clean Code Refactor', 
        'clean-code-refactor',
        'Refactor the following code to improve readability and maintainability, following SOLID principles: {{code}}', 
        'Improve code quality using SOLID principles.', 
        ARRAY['refactoring', 'clean-code', 'solid'], 
        true, 
        true
    ),
    (
        v_user_id, 
        v_blog_posts_id, 
        'Tech Blog Writer', 
        'tech-blog-writer',
        'Write a technical blog post about {{topic}}. Target audience is mid-level developers. Include code examples where relevant.', 
        'Assistant for writing technical articles.', 
        ARRAY['writing', 'blogging', 'tech'], 
        true, 
        true
    ),
    (
        v_user_id, 
        v_code_review_id, 
        'Security Auditor', 
        'security-auditor',
        'Analyze the following code for potential security vulnerabilities, specifically focusing on SQL injection and XSS: {{code}}', 
        'Focuses on security best practices.', 
        ARRAY['security', 'audit'], 
        false, 
        false
    )
    ON CONFLICT DO NOTHING;
END $$;
