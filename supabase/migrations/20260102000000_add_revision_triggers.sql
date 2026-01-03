-- Function to handle automatic revision creation
create or replace function public.handle_prompt_revision()
returns trigger as $$
declare
    revision_author uuid;
begin
    -- Determine the author of the revision
    if (TG_OP = 'INSERT') then
        revision_author := new.user_id;
    else
        -- For updates, updated_by should have been set by the set_updated_fields trigger
        -- Fallback to user_id if null (though it shouldn't be with the trigger)
        revision_author := coalesce(new.updated_by, new.user_id);
    end if;

    insert into public.prompt_revisions (
        prompt_id,
        title,
        content,
        description,
        tags,
        created_by
    ) values (
        new.id,
        new.title,
        new.content,
        new.description,
        new.tags,
        revision_author
    );
    return new;
end;
$$ language plpgsql;

-- Trigger for INSERT (Captures v0)
create trigger trg_prompt_revision_insert
    after insert on public.prompts
    for each row
    execute function public.handle_prompt_revision();

-- Trigger for UPDATE (Captures v1, v2...)
create trigger trg_prompt_revision_update
    after update on public.prompts
    for each row
    execute function public.handle_prompt_revision();
