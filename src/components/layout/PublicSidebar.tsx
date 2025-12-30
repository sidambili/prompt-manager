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
        <aside className="w-full flex flex-col gap-6" id="public-sidebar">
            <div className="px-3" id="public-sidebar-header-wrapper">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70" id="public-sidebar-label">
                    Categories
                </h3>
            </div>

            <div className="flex-1" id="public-sidebar-content-wrapper">
                <Accordion
                    type="single"
                    collapsible
                    defaultValue={defaultAccordionValue}
                    className="w-full space-y-1"
                    id="public-sidebar-accordion"
                >
                    {categories.map((cat) => {
                        const itemValue = `cat-${cat.id}`;
                        const isActiveCategory = selectedCategoryId === cat.id;

                        return (
                            <AccordionItem
                                key={cat.id}
                                value={itemValue}
                                className="border-none"
                                id={`public-sidebar-item-${cat.id}`}
                            >
                                <AccordionTrigger
                                    className="px-3 py-2 hover:bg-muted/40 rounded-md transition-all group hover:no-underline [&[data-state=open]>svg]:rotate-180"
                                    id={`public-sidebar-trigger-${cat.id}`}
                                    hideDefaultChevron
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
                                            className={`text-sm font-medium transition-colors ${isActiveCategory
                                                    ? "text-brand"
                                                    : "text-foreground/90 group-hover:text-foreground"
                                                }`}
                                            id={`public-sidebar-cat-link-${cat.id}`}
                                            onClick={(e) => {
                                                // Prevent accordion from toggling when clicking the link text
                                                // but allow it when clicking the chevron (handled by trigger)
                                                // Actually, in many enterprise apps, clicking the label navigates AND toggles.
                                                // Here we just let the Link handle navigation.
                                            }}
                                        >
                                            {cat.name}
                                        </Link>
                                        <ChevronDown
                                            className="h-3.5 w-3.5 text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]:rotate-180"
                                            aria-hidden="true"
                                        />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent
                                    className="pb-2 pt-0"
                                    id={`public-sidebar-panel-${cat.id}`}
                                >
                                    <div
                                        className="mt-1 ml-4 border-l border-border/50 pl-3 space-y-0.5"
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
                                                    className={`block rounded-md px-2.5 py-1.5 text-sm transition-colors ${isActiveSub
                                                            ? "bg-brand/10 text-brand font-medium"
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
        </aside>
    );
}
