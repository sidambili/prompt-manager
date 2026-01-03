-- Backfill script to create initial revisions for prompts that have none
-- This ensures existing prompts (seed data) have at least a "v0" snapshot

do $$
declare
    p record;
    revision_count integer;
begin
    for p in select * from public.prompts loop
        select count(*) into revision_count from public.prompt_revisions where prompt_id = p.id;
        
        if revision_count = 0 then
            insert into public.prompt_revisions (
                prompt_id,
                title,
                content,
                description,
                tags,
                created_by,
                created_at -- Use prompt creation time for the initial revision
            ) values (
                p.id,
                p.title,
                p.content,
                p.description,
                p.tags,
                p.user_id,
                p.created_at
            );
        end if;
    end loop;
end;
$$;
