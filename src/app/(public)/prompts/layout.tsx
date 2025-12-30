import { createClient } from "@/lib/supabase/server";
import PublicSidebar from "@/components/layout/PublicSidebar";

export default async function PublicPromptsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Categories are fetched on the server for a fast first render.
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, subcategories(id, name)")
        .order("sort_rank", { ascending: true });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="public-prompts-shell">
            <div className="lg:col-span-3" id="public-prompts-sidebar-col">
                <PublicSidebar
                    // Sidebar selection state is derived from the URL client-side.
                    categories={(categories ?? []) as any}
                />
            </div>
            <div className="lg:col-span-9" id="public-prompts-content-col">
                {children}
            </div>
        </div>
    );
}
