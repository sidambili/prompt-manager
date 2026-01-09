CREATE OR REPLACE FUNCTION public.delete_subcategory_reassign_prompts(
    p_subcategory_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_category_id uuid;
BEGIN
    SELECT category_id
    INTO v_category_id
    FROM public.subcategories
    WHERE id = p_subcategory_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'subcategory not found';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.categories c
        WHERE c.id = v_category_id
          AND c.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'not authorized';
    END IF;

    UPDATE public.prompts
    SET
        category_id = v_category_id,
        subcategory_id = NULL
    WHERE subcategory_id = p_subcategory_id;

    DELETE FROM public.subcategories
    WHERE id = p_subcategory_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_subcategory_reassign_prompts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_subcategory_reassign_prompts(uuid) TO authenticated;
