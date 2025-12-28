
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard, Database, Star, Clock, Trash2, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Subcategory {
    id: string;
    name: string;
    slug: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    subcategories: Subcategory[];
}

export default function Sidebar() {
    const pathname = usePathname();
    const [categories, setCategories] = useState<Category[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchCategories = async () => {
            const { data: categoriesData, error: categoriesError } = await supabase
                .from("categories")
                .select("*, subcategories(*)")
                .order("sort_rank", { ascending: true });

            if (!categoriesError && categoriesData) {
                setCategories(categoriesData);
            }
        };

        fetchCategories();
    }, [supabase]);

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Prompts", href: "/dashboard/prompts", icon: Database },
        { name: "Favorites", href: "/dashboard/favorites", icon: Star },
        { name: "Recent", href: "/dashboard/recent", icon: Clock },
    ];

    return (
        <aside className="fixed left-0 top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 border-r bg-background md:block">
            <ScrollArea className="h-full py-6 pr-6 lg:py-8">
                <div className="flex flex-col gap-4 px-4">
                    <div className="space-y-1">
                        <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Overview</h2>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                    pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                                )}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Categories</h2>
                        <Accordion type="single" collapsible className="w-full">
                            {categories.map((category) => (
                                <AccordionItem key={category.id} value={category.id} className="border-none">
                                    <AccordionTrigger className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground hover:no-underline py-1 h-9">
                                        <div className="flex items-center">
                                            <Folder className="mr-2 h-4 w-4" />
                                            <span>{category.name}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-1 pl-6">
                                        <div className="flex flex-col gap-1">
                                            {category.subcategories?.map((sub) => (
                                                <Link
                                                    key={sub.id}
                                                    href={`/dashboard/categories/${category.slug}/${sub.slug}`}
                                                    className={cn(
                                                        "flex items-center rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                                        pathname === `/dashboard/categories/${category.slug}/${sub.slug}`
                                                            ? "bg-accent text-accent-foreground"
                                                            : "transparent"
                                                    )}
                                                >
                                                    <ChevronRight className="mr-2 h-3 w-3" />
                                                    {sub.name}
                                                </Link>
                                            ))}
                                            {category.subcategories?.length === 0 && (
                                                <span className="text-xs text-muted-foreground px-3 py-1.5">No subcategories</span>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>

                    <div className="mt-auto space-y-1">
                        <Link
                            href="/dashboard/trash"
                            className={cn(
                                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                pathname === "/dashboard/trash" ? "bg-accent text-accent-foreground" : "transparent"
                            )}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Trash</span>
                        </Link>
                    </div>
                </div>
            </ScrollArea>
        </aside>
    );
}
