-- Add commit_message column to prompt_revisions
ALTER TABLE public.prompt_revisions ADD COLUMN commit_message text;

-- Update the handle_prompt_revision function to use a session variable for commit message
CREATE OR REPLACE FUNCTION public.handle_prompt_revision()
RETURNS trigger AS $$
DECLARE
    revision_author uuid;
    session_commit_message text;
BEGIN
    -- Determine the author of the revision
    IF (TG_OP = 'INSERT') THEN
        revision_author := new.user_id;
    ELSE
        -- For updates, updated_by should have been set by the set_updated_fields trigger
        revision_author := coalesce(new.updated_by, new.user_id);
    END IF;

    -- Get commit message from session setting (if set)
    -- We use a custom configuration parameter 'app.commit_message'
    BEGIN
        session_commit_message := current_setting('app.commit_message', true);
    EXCEPTION WHEN OTHERS THEN
        session_commit_message := null;
    END;

    INSERT INTO public.prompt_revisions (
        prompt_id,
        title,
        content,
        description,
        tags,
        created_by,
        commit_message
    ) VALUES (
        new.id,
        new.title,
        new.content,
        new.description,
        new.tags,
        revision_author,
        COALESCE(session_commit_message, CASE WHEN TG_OP = 'INSERT' THEN 'Initial version' ELSE 'Updated prompt' END)
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql;
