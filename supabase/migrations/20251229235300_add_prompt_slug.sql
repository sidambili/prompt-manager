-- Add slug support for canonical prompt URLs.
-- Canonical URLs use `/prompts/{slug}--{id}` where `id` is authoritative.

alter table public.prompts
add column if not exists slug text;

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

update public.prompts
set slug = public.slugify(title)
where slug is null;

alter table public.prompts
alter column slug set not null;

create index if not exists idx_prompts_slug on public.prompts (slug);
create index if not exists idx_prompts_public_listed_slug on public.prompts (is_public, is_listed, slug);
