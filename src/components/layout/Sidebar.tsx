
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, LayoutDashboard, Database, Star, Clock, Trash2, Folder, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/layout/AuthProvider";
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
    const { user } = useAuth();
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
        <aside className="z-40 flex w-[64px] flex-col border-r bg-card h-screen sticky top-0 shrink-0">
            <div className="flex h-[56px] items-center justify-center border-b">
                <div className="h-8 w-8 rounded-sm bg-brand flex items-center justify-center text-primary-foreground font-bold">
                    P
                </div>
            </div>

            <ScrollArea className="flex-1 w-full">
                <div className="flex flex-col items-center gap-4 py-4">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={item.name}
                                className={cn(
                                    "relative group flex h-10 w-10 items-center justify-center rounded-sm transition-all",
                                    isActive
                                        ? "bg-brand-bg text-brand"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {isActive && (
                                    <div className="absolute left-[-1px] h-5 w-[3px] rounded-r-full bg-brand" />
                                )}
                                <div className="absolute left-14 z-50 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border">
                                    {item.name}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="flex flex-col items-center gap-4 py-4 border-t">
                <Link
                    href="/dashboard/settings"
                    title="Settings"
                    className={cn(
                        "relative group flex h-10 w-10 items-center justify-center rounded-sm transition-all text-muted-foreground hover:bg-accent hover:text-foreground",
                        pathname === "/dashboard/settings" && "bg-brand-bg text-brand"
                    )}
                >
                    <Settings className="h-5 w-5" />
                    <div className="absolute left-14 z-50 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border">
                        Settings
                    </div>
                </Link>
                <Link
                    href="/dashboard/trash"
                    title="Trash"
                    className={cn(
                        "relative group flex h-10 w-10 items-center justify-center rounded-sm transition-all text-muted-foreground hover:bg-accent hover:text-foreground",
                        pathname === "/dashboard/trash" && "bg-brand-bg text-brand"
                    )}
                >
                    <Trash2 className="h-5 w-5" />
                    <div className="absolute left-14 z-50 rounded-md bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border">
                        Trash
                    </div>
                </Link>
            </div>
        </aside>
    );
}
