"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

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

    const defaultAccordionValue = useMemo(() => {
        return selectedCategoryId ? `cat-${selectedCategoryId}` : undefined;
    }, [selectedCategoryId]);

    return (
        <aside className="w-full lg:w-[280px]" id="public-sidebar">
            <div
                className="rounded-xl border bg-card/50 shadow-sm overflow-hidden"
                id="public-sidebar-card"
            >
                <div className="bg-muted/30 px-5 py-3 border-b" id="public-sidebar-header">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Categories
                    </h3>
                </div>

                <div className="p-3" id="public-sidebar-content">
                    <Accordion
                        type="single"
                        collapsible
                        defaultValue={defaultAccordionValue}
                        className="w-full"
                        id="public-sidebar-accordion"
                    >
                        {categories.map((cat) => {
                            const itemValue = `cat-${cat.id}`;
                            const isActiveCategory = selectedCategoryId === cat.id;

                            return (
                                <AccordionItem
                                    key={cat.id}
                                    value={itemValue}
                                    className="border-b border-border/60 last:border-b-0"
                                    id={`public-sidebar-item-${cat.id}`}
                                >
                                    <AccordionTrigger
                                        className="px-3 py-2.5 hover:no-underline"
                                        id={`public-sidebar-trigger-${cat.id}`}
                                    >
                                        <div
                                            className="flex items-center justify-between w-full"
                                            id={`public-sidebar-trigger-row-${cat.id}`}
                                        >
                                            <Link
                                                href={buildPromptsHref({
                                                    categoryId: cat.id,
                                                    searchQuery,
                                                })}
                                                className={`text-xs font-semibold transition-colors ${
                                                    isActiveCategory
                                                        ? "text-brand"
                                                        : "text-foreground hover:text-brand"
                                                }`}
                                                id={`public-sidebar-cat-link-${cat.id}`}
                                            >
                                                {cat.name}
                                            </Link>
                                            <ChevronDown
                                                className="h-3.5 w-3.5 text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent id={`public-sidebar-panel-${cat.id}`}>
                                        <div
                                            className="pl-3 pr-2 pb-2 pt-1 space-y-1"
                                            id={`public-sidebar-sub-list-${cat.id}`}
                                        >
                                            {cat.subcategories.map((sub) => {
                                                const isActiveSub = selectedSubcategoryId === sub.id;
                                                return (
                                                    <Link
                                                        key={sub.id}
                                                        href={buildPromptsHref({
                                                            categoryId: cat.id,
                                                            subcategoryId: sub.id,
                                                            searchQuery,
                                                        })}
                                                        className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                                                            isActiveSub
                                                                ? "bg-brand/10 text-brand"
                                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                                        }`}
                                                        id={`public-sidebar-sub-link-${sub.id}`}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </div>
            </div>
        </aside>
    );
}
