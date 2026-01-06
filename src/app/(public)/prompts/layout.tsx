import { Suspense } from "react";
import { createClientOrRedirect } from "@/lib/supabase/server-rsc";
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
    const supabase = await createClientOrRedirect();

    // Categories are fetched on the server for a fast first render.
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, subcategories(id, name)")
        .eq("is_public", true)
        .order("sort_rank", { ascending: true });

    const typedCategories = (categories ?? []) as PublicCategory[];

    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-56px)]" id="public-prompts-shell">
            {/* Sidebar Column: Fixed on desktop, absolute left */}
            <aside
                className="w-full lg:w-[280px] lg:flex-shrink-0 lg:sticky lg:top-[56px] lg:h-[calc(100vh-56px)] overflow-y-auto custom-scrollbar border-r border-border/40 bg-card/10 z-20"
                id="public-prompts-sidebar-col"
            >
                <div className="py-8 px-6" id="public-sidebar-inner-container">
                    <Suspense fallback={<div className="animate-pulse space-y-4 px-2 pt-4"><div className="h-4 w-24 bg-muted rounded"></div><div className="h-8 w-full bg-muted rounded"></div></div>}>
                        <PublicSidebar
                            // Sidebar selection state is derived from the URL client-side.
                            categories={typedCategories}
                        />
                    </Suspense>
                </div>
            </aside>

            {/* Content Column */}
            <main className="flex-1 min-w-0 p-6 lg:p-10" id="public-prompts-content-col">
                {children}
            </main>
        </div>
    );
}
