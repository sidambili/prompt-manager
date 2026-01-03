-- Treat blank commit messages as absent so the revision trigger uses its default message.

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
        revision_author := coalesce(new.updated_by, new.user_id);
    end if;

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
        coalesce(nullif(btrim(session_commit_message), ''), case when TG_OP = 'INSERT' then 'Initial version' else 'Updated prompt' end)
    );

    return new;
end;
$$ language plpgsql;
