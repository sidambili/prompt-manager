"use client";

import { useSearchParams } from "next/navigation";
import CategoryFilter from "./sidebar/CategoryFilter";
import ToolFilter from "./sidebar/ToolFilter";
import ModelFilter from "./sidebar/ModelFilter";

type PublicSubcategory = {
    id: string;
    name: string;
};

type PublicCategory = {
    id: string;
    name: string;
    subcategories: PublicSubcategory[];
};

type PublicSidebarProps = {
    categories: PublicCategory[];
};

function buildPromptsHref({
    categoryId,
    subcategoryId,
    searchQuery,
}: {
    categoryId?: string;
    subcategoryId?: string;
    searchQuery?: string;
}) {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (categoryId) params.set("category", categoryId);
    if (subcategoryId) params.set("subcategory", subcategoryId);

    const qs = params.toString();
    return qs ? `/prompts?${qs}` : "/prompts";
}

export default function PublicSidebar({
    categories,
}: PublicSidebarProps) {
    const searchParams = useSearchParams();

    // Sidebar state is derived from the URL so links are shareable and refresh-safe.
    const selectedCategoryId = searchParams.get("category") ?? undefined;
    const selectedSubcategoryId = searchParams.get("subcategory") ?? undefined;
    const searchQuery = searchParams.get("q") ?? undefined;

    return (
        <aside className="w-full flex flex-col gap-10" id="public-sidebar">
            <CategoryFilter
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                selectedSubcategoryId={selectedSubcategoryId}
                searchQuery={searchQuery}
                buildPromptsHref={buildPromptsHref}
            />

            <ToolFilter />

            <ModelFilter />
        </aside>
    );
}
