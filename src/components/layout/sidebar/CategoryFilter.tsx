"use client";

import Link from "next/link";
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

type CategoryFilterProps = {
    categories: PublicCategory[];
    selectedCategoryId?: string;
    selectedSubcategoryId?: string;
    searchQuery?: string;
    buildPromptsHref: (params: { categoryId?: string; subcategoryId?: string; searchQuery?: string }) => string;
};

export default function CategoryFilter({
    categories,
    selectedCategoryId,
    selectedSubcategoryId,
    searchQuery,
    buildPromptsHref,
}: CategoryFilterProps) {
    const defaultAccordionValue = selectedCategoryId ? `cat-${selectedCategoryId}` : undefined;

    return (
        <div className="flex flex-col gap-3" id="category-filter-root">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70 px-3" id="category-filter-label">
                Categories
            </h3>
            <Accordion
                type="single"
                collapsible
                defaultValue={defaultAccordionValue}
                className="w-full space-y-1"
                id="category-filter-accordion"
            >
                {categories.map((cat) => {
                    const itemValue = `cat-${cat.id}`;
                    const isActiveCategory = selectedCategoryId === cat.id;

                    return (
                        <AccordionItem
                            key={cat.id}
                            value={itemValue}
                            className="border-none"
                            id={`category-filter-item-${cat.id}`}
                        >
                            <AccordionTrigger
                                className="px-3 py-2 hover:bg-muted/40 rounded-md transition-all group hover:no-underline [&[data-state=open]>svg]:rotate-180"
                                id={`category-filter-trigger-${cat.id}`}
                                hideDefaultChevron
                            >
                                <div
                                    className="flex items-center justify-between w-full"
                                    id={`category-filter-trigger-row-${cat.id}`}
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
                                        id={`category-filter-cat-link-${cat.id}`}
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
                                id={`category-filter-panel-${cat.id}`}
                            >
                                <div
                                    className="mt-1 ml-4 border-l border-border/50 pl-3 space-y-0.5"
                                    id={`category-filter-sub-list-${cat.id}`}
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
                                                id={`category-filter-sub-link-${sub.id}`}
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
    );
}
