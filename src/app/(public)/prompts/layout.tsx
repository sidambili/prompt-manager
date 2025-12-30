import { createClient } from "@/lib/supabase/server";
import PublicSidebar from "@/components/layout/PublicSidebar";

type PublicSubcategory = {
    id: string;
    name: string;
};

type PublicCategory = {
    id: string;
    name: string;
    subcategories: PublicSubcategory[];
};

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

    const typedCategories = (categories ?? []) as PublicCategory[];

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-120px)]" id="public-prompts-shell">
            {/* Sidebar Column: Fixed on desktop, relative on mobile */}
            <div
                className="w-full lg:w-[280px] lg:flex-shrink-0 lg:sticky lg:top-[88px] lg:h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar"
                id="public-prompts-sidebar-col"
            >
                <PublicSidebar
                    // Sidebar selection state is derived from the URL client-side.
                    categories={typedCategories}
                />
            </div>

            {/* Content Column */}
            <div className="flex-1 min-w-0" id="public-prompts-content-col">
                {children}
            </div>
        </div>
    );
}
