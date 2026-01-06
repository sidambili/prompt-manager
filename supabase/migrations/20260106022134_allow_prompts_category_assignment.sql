-- Allow prompts to belong to either a category or a subcategory
-- 1. Modify public.prompts table
ALTER TABLE public.prompts 
    ALTER COLUMN subcategory_id DROP NOT NULL,
    ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT;

-- 2. Add constraint: at most one of category_id or subcategory_id should be set
-- We allow both to be null for "No Collection"
ALTER TABLE public.prompts
    ADD CONSTRAINT prompts_collection_check 
    CHECK (
        (category_id IS NULL OR subcategory_id IS NULL)
    );

-- 3. Add index for performance
CREATE INDEX idx_prompts_category_id ON public.prompts(category_id);

-- 4. Update the RPC to handle category_id and new change events
CREATE OR REPLACE FUNCTION public.update_prompt_with_commit_message(
    p_prompt_id uuid,
    p_title text,
    p_content text,
    p_description text,
    p_subcategory_id uuid,
    p_category_id uuid, -- Added
    p_is_public boolean,
    p_is_listed boolean,
    p_tags text[],
    p_slug text,
    p_commit_message text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_before public.prompts%rowtype;
    v_batch_id uuid;
    v_recent_batch_id uuid;
    v_title_changed boolean;
    v_description_changed boolean;
    v_tags_changed boolean;
    v_visibility_changed boolean;
    v_subcategory_changed boolean;
    v_category_changed boolean; -- Added
    v_slug_changed boolean;
BEGIN
    -- Check ownership
    IF NOT EXISTS (
        SELECT 1 FROM public.prompts
        WHERE id = p_prompt_id
          AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'not authorized';
    END IF;

    -- Get state before update
    SELECT * INTO v_before
    FROM public.prompts
    WHERE id = p_prompt_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'prompt not found';
    END IF;

    -- Check for changes
    v_title_changed := v_before.title IS DISTINCT FROM p_title;
    v_description_changed := v_before.description IS DISTINCT FROM p_description;
    v_tags_changed := v_before.tags IS DISTINCT FROM p_tags;
    v_visibility_changed := (v_before.is_public IS DISTINCT FROM p_is_public) OR (v_before.is_listed IS DISTINCT FROM p_is_listed);
    v_subcategory_changed := v_before.subcategory_id IS DISTINCT FROM p_subcategory_id;
    v_category_changed := v_before.category_id IS DISTINCT FROM p_category_id; -- Added
    v_slug_changed := v_before.slug IS DISTINCT FROM p_slug;

    -- Determine batch_id (60s window) if any metadata changes exist.
    IF v_title_changed OR v_description_changed OR v_tags_changed OR v_visibility_changed OR v_subcategory_changed OR v_category_changed OR v_slug_changed THEN
        SELECT batch_id
        INTO v_recent_batch_id
        FROM public.prompt_change_events
        WHERE prompt_id = p_prompt_id
          AND created_by = auth.uid()
          AND created_at >= (now() - interval '60 seconds')
        ORDER BY created_at DESC
        LIMIT 1;

        v_batch_id := COALESCE(v_recent_batch_id, gen_random_uuid());
    ELSE
        v_batch_id := null;
    END IF;

    -- Set commit message for revision trigger
    PERFORM set_config('app.commit_message', p_commit_message, true);

    -- Update prompt
    UPDATE public.prompts
    SET
        title = p_title,
        content = p_content,
        description = p_description,
        subcategory_id = p_subcategory_id,
        category_id = p_category_id, -- Added
        is_public = p_is_public,
        is_listed = p_is_listed,
        tags = p_tags,
        slug = p_slug
    WHERE id = p_prompt_id;

    -- Log change events
    IF v_title_changed THEN
        INSERT INTO public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        VALUES (p_prompt_id, 'prompt.metadata.title.updated', jsonb_build_object('before', v_before.title, 'after', p_title), v_batch_id, auth.uid());
    END IF;

    IF v_description_changed THEN
        INSERT INTO public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        VALUES (p_prompt_id, 'prompt.metadata.description.updated', jsonb_build_object('before', v_before.description, 'after', p_description), v_batch_id, auth.uid());
    END IF;

    IF v_tags_changed THEN
        INSERT INTO public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        VALUES (p_prompt_id, 'prompt.metadata.tags.updated', jsonb_build_object('before', v_before.tags, 'after', p_tags), v_batch_id, auth.uid());
    END IF;

    IF v_visibility_changed THEN
        INSERT INTO public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        VALUES (
            p_prompt_id,
            'prompt.metadata.visibility.updated',
            jsonb_build_object(
                'before', jsonb_build_object('is_public', v_before.is_public, 'is_listed', v_before.is_listed),
                'after', jsonb_build_object('is_public', p_is_public, 'is_listed', p_is_listed)
            ),
            v_batch_id,
            auth.uid()
        );
    END IF;

    IF v_subcategory_changed THEN
        INSERT INTO public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        VALUES (p_prompt_id, 'prompt.metadata.subcategory.updated', jsonb_build_object('before', v_before.subcategory_id, 'after', p_subcategory_id), v_batch_id, auth.uid());
    END IF;

    -- Added category change event
    IF v_category_changed THEN
        INSERT INTO public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        VALUES (p_prompt_id, 'prompt.metadata.category.updated', jsonb_build_object('before', v_before.category_id, 'after', p_category_id), v_batch_id, auth.uid());
    END IF;

    IF v_slug_changed THEN
        INSERT INTO public.prompt_change_events (prompt_id, event_type, payload, batch_id, created_by)
        VALUES (p_prompt_id, 'prompt.metadata.slug.updated', jsonb_build_object('before', v_before.slug, 'after', p_slug), v_batch_id, auth.uid());
    END IF;
END;
$$;
