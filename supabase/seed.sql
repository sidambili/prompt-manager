-- Seed Categories
INSERT INTO public.categories (user_id, name, slug, sort_rank, is_system, is_public) VALUES 
('00000000-0000-0000-0000-000000000000', 'Software Engineering', 'software-engineering', 10, true, true),
('00000000-0000-0000-0000-000000000000', 'Content Creation', 'content-creation', 20, true, true),
('00000000-0000-0000-0000-000000000000', 'Business & Sales', 'business-sales', 30, true, true),
('00000000-0000-0000-0000-000000000000', 'Marketing', 'marketing', 40, true, true),
('00000000-0000-0000-0000-000000000000', 'Data & Analytics', 'data-analytics', 50, true, true),
('00000000-0000-0000-0000-000000000000', 'Education & Learning', 'education-learning', 60, true, true),
('00000000-0000-0000-0000-000000000000', 'Customer Support', 'customer-support', 70, true, true),
('00000000-0000-0000-0000-000000000000', 'Personal Productivity', 'personal-productivity', 80, true, true),
('00000000-0000-0000-0000-000000000000', 'Other', 'other', 999, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed Subcategories
INSERT INTO public.subcategories (category_id, name, slug, sort_rank) 
SELECT id, 'Code Review', 'code-review', 10 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Refactoring', 'refactoring', 20 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Debugging', 'debugging', 30 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'API Design', 'api-design', 40 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Database Design', 'database-design', 50 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Testing', 'testing', 60 FROM public.categories WHERE slug = 'software-engineering'
UNION ALL
SELECT id, 'Blog Posts', 'blog-posts', 10 FROM public.categories WHERE slug = 'content-creation'
UNION ALL
SELECT id, 'Social Media', 'social-media', 20 FROM public.categories WHERE slug = 'content-creation'
UNION ALL
SELECT id, 'Video Scripts', 'video-scripts', 30 FROM public.categories WHERE slug = 'content-creation'
UNION ALL
SELECT id, 'Email Writing', 'email-writing', 40 FROM public.categories WHERE slug = 'content-creation'
UNION ALL
SELECT id, 'Sales Scripts', 'sales-scripts', 10 FROM public.categories WHERE slug = 'business-sales'
UNION ALL
SELECT id, 'Proposals', 'proposals', 20 FROM public.categories WHERE slug = 'business-sales'
UNION ALL
SELECT id, 'Cold Outreach', 'cold-outreach', 30 FROM public.categories WHERE slug = 'business-sales'
UNION ALL
SELECT id, 'Business Plans', 'business-plans', 40 FROM public.categories WHERE slug = 'business-sales'
UNION ALL
SELECT id, 'Ad Copy', 'ad-copy', 10 FROM public.categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'SEO Content', 'seo-content', 20 FROM public.categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'Product Descriptions', 'product-descriptions', 30 FROM public.categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'Landing Pages', 'landing-pages', 40 FROM public.categories WHERE slug = 'marketing'
UNION ALL
SELECT id, 'Data Analysis', 'data-analysis', 10 FROM public.categories WHERE slug = 'data-analytics'
UNION ALL
SELECT id, 'Reporting', 'reporting', 20 FROM public.categories WHERE slug = 'data-analytics'
UNION ALL
SELECT id, 'SQL Queries', 'sql-queries', 30 FROM public.categories WHERE slug = 'data-analytics'
UNION ALL
SELECT id, 'Teaching', 'teaching', 10 FROM public.categories WHERE slug = 'education-learning'
UNION ALL
SELECT id, 'Course Creation', 'course-creation', 20 FROM public.categories WHERE slug = 'education-learning'
UNION ALL
SELECT id, 'Study Guides', 'study-guides', 30 FROM public.categories WHERE slug = 'education-learning'
UNION ALL
SELECT id, 'Response Templates', 'response-templates', 10 FROM public.categories WHERE slug = 'customer-support'
UNION ALL
SELECT id, 'FAQ Generation', 'faq-generation', 20 FROM public.categories WHERE slug = 'customer-support'
UNION ALL
SELECT id, 'Troubleshooting', 'troubleshooting', 30 FROM public.categories WHERE slug = 'customer-support'
UNION ALL
SELECT id, 'Meeting Notes', 'meeting-notes', 10 FROM public.categories WHERE slug = 'personal-productivity'
UNION ALL
SELECT id, 'Task Management', 'task-management', 20 FROM public.categories WHERE slug = 'personal-productivity'
UNION ALL
SELECT id, 'Research', 'research', 30 FROM public.categories WHERE slug = 'personal-productivity';

-- Seed Prompts
DO $$
DECLARE
    v_user_id uuid := '00000000-0000-0000-0000-000000000000';
    v_code_review_id uuid;
    v_refactoring_id uuid;
    v_debugging_id uuid;
    v_api_design_id uuid;
    v_database_design_id uuid;
    v_testing_id uuid;
    v_blog_posts_id uuid;
    v_social_media_id uuid;
    v_video_scripts_id uuid;
    v_email_writing_id uuid;
    v_sales_scripts_id uuid;
    v_proposals_id uuid;
    v_cold_outreach_id uuid;
    v_business_plans_id uuid;
    v_ad_copy_id uuid;
    v_seo_content_id uuid;
    v_product_descriptions_id uuid;
    v_landing_pages_id uuid;
    v_data_analysis_id uuid;
    v_reporting_id uuid;
    v_sql_queries_id uuid;
    v_teaching_id uuid;
    v_course_creation_id uuid;
    v_study_guides_id uuid;
    v_response_templates_id uuid;
    v_faq_generation_id uuid;
    v_troubleshooting_id uuid;
    v_meeting_notes_id uuid;
    v_task_management_id uuid;
    v_research_id uuid;
BEGIN
    -- Ensure seed user exists
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
    SELECT id INTO v_debugging_id FROM public.subcategories WHERE slug = 'debugging';
    SELECT id INTO v_api_design_id FROM public.subcategories WHERE slug = 'api-design';
    SELECT id INTO v_database_design_id FROM public.subcategories WHERE slug = 'database-design';
    SELECT id INTO v_testing_id FROM public.subcategories WHERE slug = 'testing';
    SELECT id INTO v_blog_posts_id FROM public.subcategories WHERE slug = 'blog-posts';
    SELECT id INTO v_social_media_id FROM public.subcategories WHERE slug = 'social-media';
    SELECT id INTO v_video_scripts_id FROM public.subcategories WHERE slug = 'video-scripts';
    SELECT id INTO v_email_writing_id FROM public.subcategories WHERE slug = 'email-writing';
    SELECT id INTO v_sales_scripts_id FROM public.subcategories WHERE slug = 'sales-scripts';
    SELECT id INTO v_proposals_id FROM public.subcategories WHERE slug = 'proposals';
    SELECT id INTO v_cold_outreach_id FROM public.subcategories WHERE slug = 'cold-outreach';
    SELECT id INTO v_business_plans_id FROM public.subcategories WHERE slug = 'business-plans';
    SELECT id INTO v_ad_copy_id FROM public.subcategories WHERE slug = 'ad-copy';
    SELECT id INTO v_seo_content_id FROM public.subcategories WHERE slug = 'seo-content';
    SELECT id INTO v_product_descriptions_id FROM public.subcategories WHERE slug = 'product-descriptions';
    SELECT id INTO v_landing_pages_id FROM public.subcategories WHERE slug = 'landing-pages';
    SELECT id INTO v_data_analysis_id FROM public.subcategories WHERE slug = 'data-analysis';
    SELECT id INTO v_reporting_id FROM public.subcategories WHERE slug = 'reporting';
    SELECT id INTO v_sql_queries_id FROM public.subcategories WHERE slug = 'sql-queries';
    SELECT id INTO v_teaching_id FROM public.subcategories WHERE slug = 'teaching';
    SELECT id INTO v_course_creation_id FROM public.subcategories WHERE slug = 'course-creation';
    SELECT id INTO v_study_guides_id FROM public.subcategories WHERE slug = 'study-guides';
    SELECT id INTO v_response_templates_id FROM public.subcategories WHERE slug = 'response-templates';
    SELECT id INTO v_faq_generation_id FROM public.subcategories WHERE slug = 'faq-generation';
    SELECT id INTO v_troubleshooting_id FROM public.subcategories WHERE slug = 'troubleshooting';
    SELECT id INTO v_meeting_notes_id FROM public.subcategories WHERE slug = 'meeting-notes';
    SELECT id INTO v_task_management_id FROM public.subcategories WHERE slug = 'task-management';
    SELECT id INTO v_research_id FROM public.subcategories WHERE slug = 'research';

    -- SOFTWARE ENGINEERING PROMPTS
    INSERT INTO public.prompts (user_id, subcategory_id, title, slug, content, description, tags, is_public, is_listed) VALUES
    (v_user_id, v_code_review_id, 'Senior React Reviewer', 'senior-react-reviewer',
     'You are a senior React developer. Review the following code for performance, accessibility, and best practices: {{code}}',
     'Detailed code review for React components focusing on performance and accessibility.',
     ARRAY['react', 'typescript', 'performance'], true, true),
    
    (v_user_id, v_code_review_id, 'Python Code Auditor', 'python-code-auditor',
     'Review this Python code for PEP 8 compliance, performance issues, and potential bugs: {{code}}',
     'Python code review with focus on standards and optimization.',
     ARRAY['python', 'pep8', 'code-review'], true, true),
    
    (v_user_id, v_refactoring_id, 'Clean Code Refactor', 'clean-code-refactor',
     'Refactor the following code to improve readability and maintainability, following SOLID principles: {{code}}',
     'Improve code quality using SOLID principles.',
     ARRAY['refactoring', 'clean-code', 'solid'], true, true),
    
    (v_user_id, v_refactoring_id, 'Legacy Code Modernizer', 'legacy-code-modernizer',
     'Modernize this legacy code to use current best practices and design patterns. Explain each change: {{code}}',
     'Transform old code into modern, maintainable solutions.',
     ARRAY['refactoring', 'modernization', 'patterns'], true, true),
    
    (v_user_id, v_debugging_id, 'Bug Detective', 'bug-detective',
     'Analyze this code and error message to identify the root cause and suggest fixes: Code: {{code}} Error: {{error}}',
     'Debug issues by analyzing code and error messages.',
     ARRAY['debugging', 'troubleshooting', 'errors'], true, true),
    
    (v_user_id, v_api_design_id, 'REST API Architect', 'rest-api-architect',
     'Design a RESTful API for {{feature}}. Include endpoints, request/response formats, authentication, and error handling.',
     'Create well-structured REST APIs with complete specifications.',
     ARRAY['api', 'rest', 'architecture'], true, true),
    
    (v_user_id, v_database_design_id, 'Database Schema Designer', 'database-schema-designer',
     'Design a normalized database schema for {{application}}. Include tables, relationships, indexes, and explain design decisions.',
     'Create efficient database schemas with proper normalization.',
     ARRAY['database', 'schema', 'sql'], true, true),
    
    (v_user_id, v_testing_id, 'Test Case Generator', 'test-case-generator',
     'Generate comprehensive unit tests for this function: {{code}}. Include edge cases, error scenarios, and mocking where needed.',
     'Create thorough test coverage for your code.',
     ARRAY['testing', 'unit-tests', 'tdd'], true, true),

    -- CONTENT CREATION PROMPTS
    (v_user_id, v_blog_posts_id, 'Tech Blog Writer', 'tech-blog-writer',
     'Write a technical blog post about {{topic}}. Target audience is mid-level developers. Include code examples where relevant.',
     'Create engaging technical articles with practical examples.',
     ARRAY['writing', 'blogging', 'tech'], true, true),
    
    (v_user_id, v_blog_posts_id, 'SEO Blog Optimizer', 'seo-blog-optimizer',
     'Write a 1500-word blog post about {{topic}} optimized for the keyword {{keyword}}. Include H2/H3 headers, meta description, and internal linking suggestions.',
     'SEO-optimized blog content with proper structure.',
     ARRAY['seo', 'blogging', 'content'], true, true),
    
    (v_user_id, v_social_media_id, 'LinkedIn Post Creator', 'linkedin-post-creator',
     'Create an engaging LinkedIn post about {{topic}}. Make it professional but conversational. Include a hook, value, and call-to-action.',
     'Professional LinkedIn content that drives engagement.',
     ARRAY['linkedin', 'social-media', 'b2b'], true, true),
    
    (v_user_id, v_social_media_id, 'Twitter Thread Builder', 'twitter-thread-builder',
     'Create a 5-7 tweet thread explaining {{topic}}. Start with a hook, provide value in each tweet, and end with engagement.',
     'Compelling Twitter threads that educate and engage.',
     ARRAY['twitter', 'threads', 'social-media'], true, true),
    
    (v_user_id, v_video_scripts_id, 'YouTube Script Writer', 'youtube-script-writer',
     'Write a YouTube video script about {{topic}}. Length: {{duration}} minutes. Include hook, main points, transitions, and outro with CTA.',
     'Engaging video scripts with proper pacing and structure.',
     ARRAY['youtube', 'video', 'scripting'], true, true),
    
    (v_user_id, v_email_writing_id, 'Professional Email Writer', 'professional-email-writer',
     'Write a professional email about {{purpose}} to {{recipient}}. Tone: {{tone}}. Keep it clear, concise, and action-oriented.',
     'Clear business emails that get responses.',
     ARRAY['email', 'business', 'communication'], true, true),

    -- BUSINESS & SALES PROMPTS
    (v_user_id, v_sales_scripts_id, 'Sales Call Script', 'sales-call-script',
     'Create a sales call script for {{product}} targeting {{audience}}. Include opening, discovery questions, handling objections, and close.',
     'Structured sales scripts that convert.',
     ARRAY['sales', 'cold-calling', 'script'], true, true),
    
    (v_user_id, v_sales_scripts_id, 'Discovery Questions', 'discovery-questions',
     'Generate 10 powerful discovery questions for selling {{product}} to {{industry}}. Focus on pain points and business impact.',
     'Uncover customer needs with strategic questions.',
     ARRAY['sales', 'discovery', 'questions'], true, true),
    
    (v_user_id, v_proposals_id, 'Business Proposal Writer', 'business-proposal-writer',
     'Write a comprehensive business proposal for {{service}} to {{client}}. Include executive summary, scope, pricing, timeline, and next steps.',
     'Professional proposals that win deals.',
     ARRAY['proposals', 'business', 'sales'], true, true),
    
    (v_user_id, v_cold_outreach_id, 'Cold Email Template', 'cold-email-template',
     'Write a cold outreach email for {{product}} to {{prospect}}. Personalize with {{detail}}. Keep it under 100 words with clear value prop.',
     'Short, personalized cold emails that get replies.',
     ARRAY['cold-email', 'outreach', 'sales'], true, true),
    
    (v_user_id, v_business_plans_id, 'Lean Business Plan', 'lean-business-plan',
     'Create a one-page business plan for {{business}}. Include problem, solution, market, revenue model, costs, and key metrics.',
     'Concise business plans focused on execution.',
     ARRAY['business-plan', 'strategy', 'startup'], true, true),

    -- MARKETING PROMPTS
    (v_user_id, v_ad_copy_id, 'Facebook Ad Copy', 'facebook-ad-copy',
     'Write 3 variations of Facebook ad copy for {{product}}. Target audience: {{audience}}. Include headline, primary text, and CTA.',
     'High-converting ad copy for Facebook campaigns.',
     ARRAY['ads', 'facebook', 'copywriting'], true, true),
    
    (v_user_id, v_ad_copy_id, 'Google Ads Headlines', 'google-ads-headlines',
     'Generate 10 Google Ads headlines (max 30 chars) for {{product}} targeting {{keyword}}. Focus on benefits and urgency.',
     'Optimized headlines for Google Ads campaigns.',
     ARRAY['google-ads', 'ppc', 'headlines'], true, true),
    
    (v_user_id, v_seo_content_id, 'SEO Content Brief', 'seo-content-brief',
     'Create an SEO content brief for keyword {{keyword}}. Include search intent, outline, related keywords, and competitor analysis.',
     'Data-driven content briefs for SEO success.',
     ARRAY['seo', 'content-strategy', 'keywords'], true, true),
    
    (v_user_id, v_product_descriptions_id, 'E-commerce Product Description', 'ecommerce-product-description',
     'Write a compelling product description for {{product}}. Highlight features, benefits, and use cases. Optimize for conversion and SEO.',
     'Product descriptions that sell.',
     ARRAY['ecommerce', 'copywriting', 'product'], true, true),
    
    (v_user_id, v_landing_pages_id, 'Landing Page Copy', 'landing-page-copy',
     'Write landing page copy for {{offer}}. Include headline, subheadline, bullet points, social proof section, and CTA. Focus on benefits.',
     'Conversion-focused landing page content.',
     ARRAY['landing-page', 'conversion', 'copywriting'], true, true),

    -- DATA & ANALYTICS PROMPTS
    (v_user_id, v_data_analysis_id, 'Data Insights Analyzer', 'data-insights-analyzer',
     'Analyze this dataset and provide key insights, trends, and actionable recommendations: {{data}}',
     'Extract meaningful insights from raw data.',
     ARRAY['data-analysis', 'insights', 'analytics'], true, true),
    
    (v_user_id, v_reporting_id, 'Executive Summary Report', 'executive-summary-report',
     'Create an executive summary of {{data}} for leadership. Focus on key metrics, trends, and business impact. Keep it under 300 words.',
     'Clear summaries for decision-makers.',
     ARRAY['reporting', 'executive', 'analytics'], true, true),
    
    (v_user_id, v_sql_queries_id, 'SQL Query Builder', 'sql-query-builder',
     'Write an optimized SQL query to {{goal}} from these tables: {{tables}}. Include indexes and explain the query plan.',
     'Efficient SQL queries with performance tips.',
     ARRAY['sql', 'database', 'queries'], true, true),

    -- EDUCATION PROMPTS
    (v_user_id, v_teaching_id, 'Concept Explainer', 'concept-explainer',
     'Explain {{concept}} to a {{level}} student. Use analogies, examples, and simple language. Break it into digestible parts.',
     'Make complex topics easy to understand.',
     ARRAY['teaching', 'education', 'explanation'], true, true),
    
    (v_user_id, v_course_creation_id, 'Course Outline Builder', 'course-outline-builder',
     'Create a course outline for {{subject}}. Include modules, lessons, learning objectives, and practical exercises.',
     'Structured course content for online learning.',
     ARRAY['course', 'education', 'curriculum'], true, true),
    
    (v_user_id, v_study_guides_id, 'Study Guide Generator', 'study-guide-generator',
     'Create a study guide for {{topic}}. Include key concepts, definitions, practice questions, and summary.',
     'Comprehensive study materials for learners.',
     ARRAY['study', 'education', 'learning'], true, true),

    -- CUSTOMER SUPPORT PROMPTS
    (v_user_id, v_response_templates_id, 'Support Response Template', 'support-response-template',
     'Write a customer support response for {{issue}}. Be empathetic, provide clear steps, and set expectations.',
     'Professional support responses that help customers.',
     ARRAY['support', 'customer-service', 'templates'], true, true),
    
    (v_user_id, v_faq_generation_id, 'FAQ Generator', 'faq-generator',
     'Generate 10 frequently asked questions and answers for {{product}}. Cover common issues, features, and setup.',
     'Comprehensive FAQs that reduce support tickets.',
     ARRAY['faq', 'documentation', 'support'], true, true),
    
    (v_user_id, v_troubleshooting_id, 'Troubleshooting Guide', 'troubleshooting-guide',
     'Create a troubleshooting guide for {{issue}}. Include symptoms, causes, step-by-step fixes, and when to escalate.',
     'Clear guides for resolving common problems.',
     ARRAY['troubleshooting', 'support', 'documentation'], true, true),

    -- PRODUCTIVITY PROMPTS
    (v_user_id, v_meeting_notes_id, 'Meeting Notes Summarizer', 'meeting-notes-summarizer',
     'Summarize these meeting notes: {{notes}}. Extract key decisions, action items with owners, and next steps.',
     'Turn messy notes into clear action plans.',
     ARRAY['meetings', 'productivity', 'notes'], true, true),
    
    (v_user_id, v_task_management_id, 'Project Task Breakdown', 'project-task-breakdown',
     'Break down {{project}} into actionable tasks. Include subtasks, estimated time, dependencies, and priority.',
     'Turn big projects into manageable tasks.',
     ARRAY['project-management', 'tasks', 'planning'], true, true),
    
    (v_user_id, v_research_id, 'Research Summarizer', 'research-summarizer',
     'Summarize research on {{topic}}. Include key findings, methodologies, and practical applications. Cite sources.',
     'Quick summaries of research and articles.',
     ARRAY['research', 'summary', 'productivity'], true, true)

    ON CONFLICT DO NOTHING;
END $$;
