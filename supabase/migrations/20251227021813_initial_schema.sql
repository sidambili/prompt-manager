-- Enable Row Level Security (RLS) support is built-in but good to keep in mind
-- Create tables based on Architecture Document

-- 1. Categories
create table public.categories (
    id uuid not null default gen_random_uuid(),
    name text not null,
    slug text not null,
    sort_rank integer not null default 0,
    is_system boolean not null default false,
    
    constraint categories_pkey primary key (id),
    constraint categories_slug_unique unique (slug)
);

-- 2. Subcategories
create table public.subcategories (
    id uuid not null default gen_random_uuid(),
    category_id uuid not null,
    name text not null,
    slug text not null,
    sort_rank integer not null default 0,
    
    constraint subcategories_pkey primary key (id),
    constraint subcategories_category_id_fkey foreign key (category_id)
        references public.categories (id) on delete cascade
);

create unique index idx_subcategories_category_slug on public.subcategories (category_id, slug);

-- 3. Prompts
create table public.prompts (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    subcategory_id uuid not null,
    title text not null check (char_length(title) >= 1 and char_length(title) <= 100),
    content text not null,
    description text check (char_length(description) <= 500),
    tags text[] default '{}'::text[],
    tool text,
    parent_id uuid,
    is_public boolean not null default false,
    is_listed boolean not null default true,
    views_count integer not null default 0,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    updated_by uuid,
    
    constraint prompts_pkey primary key (id),
    constraint prompts_user_id_fkey foreign key (user_id)
        references auth.users (id) on delete restrict,
    constraint prompts_subcategory_id_fkey foreign key (subcategory_id)
        references public.subcategories (id) on delete restrict,
    constraint prompts_parent_id_fkey foreign key (parent_id)
        references public.prompts (id) on delete set null,
    constraint prompts_updated_by_fkey foreign key (updated_by)
        references auth.users (id)
);

create index idx_prompts_user_id on public.prompts (user_id);
create index idx_prompts_subcategory_id on public.prompts (subcategory_id);
create index idx_prompts_is_public_listed on public.prompts (is_public, is_listed);
create index idx_prompts_created_at on public.prompts (created_at);
create index idx_prompts_parent_id on public.prompts (parent_id);

-- 4. Prompt Revisions
create table public.prompt_revisions (
    id uuid not null default gen_random_uuid(),
    prompt_id uuid not null,
    title text not null,
    content text not null,
    description text,
    tags text[] default '{}'::text[],
    created_at timestamp with time zone not null default now(),
    created_by uuid not null,
    
    constraint prompt_revisions_pkey primary key (id),
    constraint prompt_revisions_prompt_id_fkey foreign key (prompt_id)
        references public.prompts (id) on delete cascade,
    constraint prompt_revisions_created_by_fkey foreign key (created_by)
        references auth.users (id)
);

create index idx_revisions_prompt_id on public.prompt_revisions (prompt_id);
create index idx_revisions_created_at on public.prompt_revisions (created_at);

-- 5. Prompt Flags
create table public.prompt_flags (
    id uuid not null default gen_random_uuid(),
    prompt_id uuid not null,
    reporter_id uuid not null,
    reason text,
    created_at timestamp with time zone not null default now(),
    
    constraint prompt_flags_pkey primary key (id),
    constraint prompt_flags_prompt_id_fkey foreign key (prompt_id)
        references public.prompts (id) on delete cascade,
    constraint prompt_flags_reporter_id_fkey foreign key (reporter_id)
        references auth.users (id) on delete cascade,
    constraint prompt_flags_prompt_reporter_unique unique (prompt_id, reporter_id)
);

create index idx_flags_prompt_id on public.prompt_flags (prompt_id);

-- 6. Featured Prompts
create table public.featured_prompts (
    prompt_id uuid not null,
    featured_rank integer not null default 100,
    created_at timestamp with time zone not null default now(),
    
    constraint featured_prompts_pkey primary key (prompt_id),
    constraint featured_prompts_prompt_id_fkey foreign key (prompt_id)
        references public.prompts (id) on delete cascade
);

-- Row Level Security (RLS)
-- Enable RLS on all tables
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_revisions enable row level security;
alter table public.prompt_flags enable row level security;
alter table public.featured_prompts enable row level security;

-- Policies

-- Categories & Subcategories (Public Read)
create policy "Categories are publicly readable"
    on public.categories for select
    using (true);

create policy "Subcategories are publicly readable"
    on public.subcategories for select
    using (true);

-- Prompts
-- Read: Public (listed or unlisted) OR Own
create policy "Public listed prompts or own prompts are readable"
    on public.prompts for select
    using (
        ((is_public = true) and (is_listed = true))or
        (auth.uid() = user_id)
    );

-- Insert: Own prompts
create policy "Users can insert their own prompts"
    on public.prompts for insert
    with check (auth.uid() = user_id);

-- Update: Own prompts (SECURITY FIX: Added WITH CHECK)
create policy "Users can update their own prompts"
    on public.prompts for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Delete: Own prompts
create policy "Users can delete their own prompts"
    on public.prompts for delete
    using (auth.uid() = user_id);

-- Revisions
-- Read: Own parent prompt
create policy "Users can view revisions of their own prompts"
    on public.prompt_revisions for select
    using (
        exists (
            select 1 from public.prompts
            where prompts.id = prompt_revisions.prompt_id
            and prompts.user_id = auth.uid()
        )
    );

-- Insert: Own parent prompt
create policy "Users can create revisions for their own prompts"
    on public.prompt_revisions for insert
    with check (
        exists (
            select 1 from public.prompts
            where prompts.id = prompt_revisions.prompt_id
            and prompts.user_id = auth.uid()
        )
    );

-- Flags
-- Insert: Any authenticated user, but only 1 per prompt (handled by unique index)
create policy "Authenticated users can flag prompts"
    on public.prompt_flags for insert
    with check (auth.uid() = reporter_id);

-- Read: Users can see their own flags (SECURITY FIX: Added select policy)
create policy "Users can view their own flags"
    on public.prompt_flags for select
    using (auth.uid() = reporter_id);

-- Featured Prompts
-- Read: Public
create policy "Featured prompts are publicly readable"
    on public.featured_prompts for select
    using (true);

-- Triggers for updated_at AND updated_by (SECURITY FIX: Auto-set updated_by)

create or replace function public.set_updated_fields()
returns trigger as $$
begin
    new.updated_at = now();
    new.updated_by = auth.uid();
    return new;
end;
$$ language plpgsql;

create trigger trg_prompts_updated_fields
    before update on public.prompts
    for each row
    execute function public.set_updated_fields();
