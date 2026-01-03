-- RPC to update a prompt and attach a commit message to the revision trigger
-- This must be a single transaction so the trigger can read the session setting.

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
begin
    if not exists (
        select 1 from public.prompts
        where id = p_prompt_id
          and user_id = auth.uid()
    ) then
        raise exception 'not authorized';
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
end;
$$;
