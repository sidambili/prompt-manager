"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Folder, Trash2, ChevronRight, MoreVertical, Edit2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/layout/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import CategoryForm from "@/components/categories/CategoryForm";
import SubcategoryForm from "@/components/categories/SubcategoryForm";

interface Subcategory {
    id: string;
    name: string;
    slug: string;
    category_id: string;
    sort_rank: number;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    sort_rank: number;
    is_public: boolean;
    user_id: string;
    subcategories: Subcategory[];
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

    const supabase = createClient();
    const { user } = useAuth();

    const fetchCategories = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("categories")
            .select("*, subcategories(*)")
            .order("sort_rank", { ascending: true });

        if (error) {
            toast.error("Failed to fetch categories");
        } else {
            setCategories(data || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDeleteCategory = async (id: string) => {
        if (!confirm("Are you sure? This will delete all subcategories and may affect prompts.")) return;

        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete category");
        } else {
            toast.success("Category deleted");
            fetchCategories();
        }
    };

    const handleDeleteSubcategory = async (id: string) => {
        if (!confirm("Are you sure? This may affect prompts in this subcategory.")) return;

        const { error } = await supabase.from("subcategories").delete().eq("id", id);
        if (error) {
            toast.error("Failed to delete subcategory");
        } else {
            toast.success("Subcategory deleted");
            fetchCategories();
        }
    };

    const filteredCategories = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.subcategories.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6" id="categories-page">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight" id="categories-title">Categories</h1>
                    <p className="text-sm text-muted-foreground" id="categories-desc">
                        Manage your prompt organization system.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        id="add-category-btn"
                        onClick={() => {
                            setEditingCategory(null);
                            setIsCategoryModalOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Category
                    </Button>
                </div>
            </div>

            <div className="relative" id="categories-search-container">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    id="categories-search-input"
                    placeholder="Search categories and subcategories..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="categories-grid">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse" id={`category-skeleton-${i}`}>
                            <CardHeader className="h-[100px]" />
                        </Card>
                    ))
                ) : filteredCategories.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border rounded-sm bg-card/50" id="categories-empty">
                        <Folder className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No categories found</h3>
                        <p className="text-sm text-muted-foreground">Try a different search or create a new category.</p>
                    </div>
                ) : (
                    filteredCategories.map((category) => (
                        <Card key={category.id} className="flex flex-col h-full" id={`category-card-${category.id}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Link 
                                                href={`/dashboard/categories/${category.slug}`}
                                                className="hover:text-brand hover:underline"
                                            >
                                                {category.name}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription className="text-xs font-mono">
                                            /{category.slug}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" id={`category-menu-${category.id}`}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {user?.id === category.user_id ? (
                                                <>
                                                    <DropdownMenuItem onClick={() => {
                                                        setEditingCategory(category);
                                                        setIsCategoryModalOpen(true);
                                                    }}>
                                                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        className="text-destructive"
                                                        onClick={() => handleDeleteCategory(category.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </>
                                            ) : (
                                                <DropdownMenuItem disabled>
                                                    Read-only
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subcategories</span>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 text-xs px-2"
                                            id={`add-sub-btn-${category.id}`}
                                            onClick={() => {
                                                setSelectedCategoryId(category.id);
                                                setEditingSubcategory(null);
                                                setIsSubcategoryModalOpen(true);
                                            }}
                                            disabled={user?.id !== category.user_id}
                                        >
                                            <Plus className="mr-1 h-3 w-3" /> Add
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2" id={`subcategories-list-${category.id}`}>
                                        {category.subcategories.length > 0 ? (
                                            category.subcategories.map((sub) => (
                                                <div key={sub.id} className="group relative flex items-center" id={`subcategory-item-${sub.id}`}>
                                                    <Badge variant="secondary" className="pr-6">
                                                        {sub.name}
                                                    </Badge>
                                                    <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                                                        <button 
                                                            type="button"
                                                            className="p-0.5 hover:text-brand"
                                                            onClick={() => {
                                                                setEditingSubcategory(sub);
                                                                setIsSubcategoryModalOpen(true);
                                                            }}
                                                            disabled={user?.id !== category.user_id}
                                                            id={`edit-subcategory-btn-${sub.id}`}
                                                        >
                                                            <Edit2 className="h-2.5 w-2.5" />
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            className="p-0.5 hover:text-destructive"
                                                            onClick={() => handleDeleteSubcategory(sub.id)}
                                                            disabled={user?.id !== category.user_id}
                                                            id={`delete-subcategory-btn-${sub.id}`}
                                                        >
                                                            <Trash2 className="h-2.5 w-2.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">No subcategories</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <CategoryForm 
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onSuccess={fetchCategories}
                editingCategory={editingCategory}
            />

            <SubcategoryForm 
                isOpen={isSubcategoryModalOpen}
                onClose={() => setIsSubcategoryModalOpen(false)}
                onSuccess={fetchCategories}
                categoryId={selectedCategoryId || (editingSubcategory?.category_id ?? null)}
                editingSubcategory={editingSubcategory}
            />
        </div>
    );
}
