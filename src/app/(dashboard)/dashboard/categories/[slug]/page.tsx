"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import PromptList from "@/components/prompts/PromptList";
import { ChevronRight, Folder } from "lucide-react";
import Link from "next/link";
import { use } from "react";

interface PromptSubcategory {
    name: string;
    category_id: string;
    categories: {
        name: string;
        slug: string;
    };
}

interface CategoryDetailPrompt {
    id: string;
    title: string;
    description: string | null;
    content: string;
    subcategory_id: string;
    is_public: boolean;
    updated_at: string;
    subcategories: PromptSubcategory;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const [prompts, setPrompts] = useState<CategoryDetailPrompt[]>([]);
    const [category, setCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            
            // Fetch category details
            const { data: catData, error: catError } = await supabase
                .from("categories")
                .select("id, name, slug")
                .eq("slug", slug)
                .single();

            if (catError || !catData) {
                toast.error("Category not found");
                setIsLoading(false);
                return;
            }
            setCategory(catData);

            // Fetch prompts for this category
            const { data: promptData, error: promptError } = await supabase
                .from("prompts")
                .select("*, subcategories!inner(name, category_id, categories!inner(name, slug))")
                .eq("subcategories.category_id", catData.id)
                .order("updated_at", { ascending: false });

            if (promptError) {
                toast.error("Failed to fetch prompts");
            } else {
                setPrompts((promptData ?? []) as CategoryDetailPrompt[]);
            }
            setIsLoading(false);
        };

        fetchData();
    }, [slug, supabase]);

    return (
        <div className="space-y-6" id="category-detail-page">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1" id="category-breadcrumb">
                    <Link href="/dashboard/categories" className="hover:text-foreground">Categories</Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground font-medium">{category?.name || "..."}</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight" id="category-detail-title">
                    {category?.name} Prompts
                </h1>
                <p className="text-sm text-muted-foreground" id="category-detail-desc">
                    {prompts.length} prompts in this category.
                </p>
            </div>

            <div className="min-h-[400px]" id="category-prompts-container">
                {isLoading ? (
                    <PromptList prompts={[]} isLoading={true} />
                ) : prompts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border rounded-sm bg-card/50" id="category-prompts-empty">
                        <Folder className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No prompts found</h3>
                        <p className="text-sm text-muted-foreground">There are no prompts assigned to subcategories in this category.</p>
                    </div>
                ) : (
                    <PromptList prompts={prompts} isLoading={false} />
                )}
            </div>
        </div>
    );
}
