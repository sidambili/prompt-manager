-- Add metadata change event log for prompts and prevent metadata-only updates from creating content revisions.

-- 1) Only create a prompt revision when content changes (updates) or on insert.
create or replace function public.handle_prompt_revision()
returns trigger as $$
declare
    revision_author uuid;
    session_commit_message text;
begin
    if (TG_OP = 'UPDATE') then
        if new.content is not distinct from old.content then
            return new;
        end if;
    end if;

    -- Determine the author of the revision
    if (TG_OP = 'INSERT') then
        revision_author := new.user_id;
    else
        -- For updates, updated_by should have been set by the set_updated_fields trigger
        revision_author := coalesce(new.updated_by, new.user_id);
    end if;

    -- Get commit message from session setting (if set)
    begin
        session_commit_message := current_setting('app.commit_message', true);
    exception when others then
        session_commit_message := null;
    end;

    insert into public.prompt_revisions (
        prompt_id,
        title,
        content,
        description,
        tags,
        created_by,
        commit_message
    ) values (
        new.id,
        new.title,
        new.content,
        new.description,
        new.tags,
        revision_author,
        coalesce(session_commit_message, case when TG_OP = 'INSERT' then 'Initial version' else 'Updated prompt' end)
    );

    return new;
end;
$$ language plpgsql;

-- 2) Metadata change event table
create table if not exists public.prompt_change_events (
    id uuid primary key default gen_random_uuid(),
    prompt_id uuid not null references public.prompts (id) on delete cascade,
    event_type text not null,
    payload jsonb not null,
    batch_id uuid null,
    created_at timestamptz not null default now(),
    created_by uuid not null references auth.users (id)
);

create index if not exists idx_prompt_change_events_prompt_id_created_at_desc
    on public.prompt_change_events (prompt_id, created_at desc);

create index if not exists idx_prompt_change_events_prompt_id_created_by_created_at_desc
    on public.prompt_change_events (prompt_id, created_by, created_at desc);

create index if not exists idx_prompt_change_events_batch_id
    on public.prompt_change_events (batch_id);

alter table public.prompt_change_events enable row level security;

drop policy if exists "Users can view metadata events for their own prompts" on public.prompt_change_events;
create policy "Users can view metadata events for their own prompts"
    on public.prompt_change_events for select
    using (
        exists (
            select 1 from public.prompts
            where prompts.id = prompt_change_events.prompt_id
            and prompts.user_id = auth.uid()
        )
    );

drop policy if exists "Users can create metadata events for their own prompts" on public.prompt_change_events;
create policy "Users can create metadata events for their own prompts"
    on public.prompt_change_events for insert
    with check (
        exists (
            select 1 from public.prompts
            where prompts.id = prompt_change_events.prompt_id
            and prompts.user_id = auth.uid()
        )
    );

-- 3) Update RPC: update prompts and create immutable metadata change events atomically.
create or replace function public.update_prompt_with_commit_message(
    p_prompt_id uuid,
    p_title text,
    p_content text,
    p_description text,
    p_subcategory_id uuid,
    p_is_public boolean,
    p_is_listed boolean,
    p_tags text[],
    p_slug text,
    p_commit_message text
)
returns void
language plpgsql
security definer
as $$
declare
    v_before public.prompts%rowtype;
    v_batch_id uuid;
    v_recent_batch_id uuid;
    v_title_changed boolean;
    v_description_changed boolean;
    v_tags_changed boolean;
    v_visibility_changed boolean;
    v_subcategory_changed boolean;
    v_slug_changed boolean;
begin
    if not exists (
        select 1 from public.prompts
        where id = p_prompt_id
          and user_id = auth.uid()
    ) then
        raise exception 'not authorized';
    end if;

    select * into v_before
    from public.prompts
    where id = p_prompt_id;

    if not found then
        raise exception 'prompt not found';
    end if;

    v_title_changed := v_before.title is distinct from p_title;
    v_description_changed := v_before.description is distinct from p_description;
    v_tags_changed := v_before.tags is distinct from p_tags;
    v_visibility_changed := (v_before.is_public is distinct from p_is_public) or (v_before.is_listed is distinct from p_is_listed);
    v_subcategory_changed := v_before.subcategory_id is distinct from p_subcategory_id;
    v_slug_changed := v_before.slug is distinct from p_slug;

    -- Determine batch_id (60s window) if any metadata changes exist.
    if v_title_changed or v_description_changed or v_tags_changed or v_visibility_changed or v_subcategory_changed or v_slug_changed then
        select batch_id
        into v_recent_batch_id
        from public.prompt_change_events
        where prompt_id = p_prompt_id
          and created_by = auth.uid()
          and created_at >= (now() - interval '60 seconds')
        order by created_at desc
        limit 1;

        v_batch_id := coalesce(v_recent_batch_id, gen_random_uuid());
    else
        v_batch_id := null;
    end if;

    perform set_config('app.commit_message', p_commit_message, true);

    update public.prompts
    set
        title = p_title,
        content = p_content,
        description = p_description,
        subcategory_id = p_subcategory_id,
        is_public = p_is_public,
        is_listed = p_is_listed,
        tags = p_tags,
        slug = p_slug
    where id = p_prompt_id;

    if not found then
        raise exception 'prompt not found';
    end if;

    if v_title_changed then
        insert into public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        values (
            p_prompt_id,
            'prompt.metadata.title.updated',
            jsonb_build_object('before', v_before.title, 'after', p_title),
            v_batch_id,
            auth.uid()
        );
    end if;

    if v_description_changed then
        insert into public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        values (
            p_prompt_id,
            'prompt.metadata.description.updated',
            jsonb_build_object('before', v_before.description, 'after', p_description),
            v_batch_id,
            auth.uid()
        );
    end if;

    if v_tags_changed then
        insert into public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        values (
            p_prompt_id,
            'prompt.metadata.tags.updated',
            jsonb_build_object('before', v_before.tags, 'after', p_tags),
            v_batch_id,
            auth.uid()
        );
    end if;

    if v_visibility_changed then
        insert into public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        values (
            p_prompt_id,
            'prompt.metadata.visibility.updated',
            jsonb_build_object(
                'before', jsonb_build_object('is_public', v_before.is_public, 'is_listed', v_before.is_listed),
                'after', jsonb_build_object('is_public', p_is_public, 'is_listed', p_is_listed)
            ),
            v_batch_id,
            auth.uid()
        );
    end if;

    if v_subcategory_changed then
        insert into public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        values (
            p_prompt_id,
            'prompt.metadata.subcategory.updated',
            jsonb_build_object('before', v_before.subcategory_id, 'after', p_subcategory_id),
            v_batch_id,
            auth.uid()
        );
    end if;

    if v_slug_changed then
        insert into public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        values (
            p_prompt_id,
            'prompt.metadata.slug.updated',
            jsonb_build_object('before', v_before.slug, 'after', p_slug),
            v_batch_id,
            auth.uid()
        );
    end if;
end;
$$;
