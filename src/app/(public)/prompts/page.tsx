import { createClient } from "@/lib/supabase/server";
import PublicPromptList from "@/components/prompts/PublicPromptList";

export default async function PublicPromptsPage({
    searchParams,
}: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const supabase = await createClient();
    const params = (await searchParams) ?? {};

    // Querystring-driven filters so browse pages are shareable.
    const q = typeof params.q === "string" ? params.q.trim() : "";
    const categoryId = typeof params.category === "string" ? params.category : undefined;
    const subcategoryId = typeof params.subcategory === "string" ? params.subcategory : undefined;

    let query = supabase
        .from("prompts")
        .select(
            "id, title, description, slug, updated_at, subcategories(id, name, categories(id, name))"
        )
        .eq("is_public", true)
        .eq("is_listed", true)
        .order("updated_at", { ascending: false })
        .limit(50);

    if (q) {
        query = query.ilike("title", `%${q}%`);
    }

    if (subcategoryId) {
        // Subcategory is the most specific filter.
        query = query.eq("subcategory_id", subcategoryId);
    } else if (categoryId) {
        // Category filter is applied via the joined subcategories table.
        query = query.eq("subcategories.category_id", categoryId);
    }

    const { data: prompts } = await query;

    return (
        <div className="space-y-6" id="public-prompts-page">
            <div className="flex flex-col gap-1" id="public-prompts-header">
                <h1 className="text-2xl font-semibold tracking-tight" id="public-prompts-title">
                    Browse Prompts
                </h1>
                <p className="text-sm text-muted-foreground" id="public-prompts-subtitle">
                    Discover public prompts across categories.
                </p>
            </div>

            <PublicPromptList prompts={(prompts ?? []) as any} />
        </div>
    );
}
