"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { slugify as generateSlug } from "@/lib/slug";

const categorySchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    slug: z.string().min(1, "Slug is required").max(50),
    sort_rank: z.number().int().default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category {
    id: string;
    name: string;
    slug: string;
    sort_rank: number;
}

interface CategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingCategory: Category | null;
}

export default function CategoryForm({
    isOpen,
    onClose,
    onSuccess,
    editingCategory,
}: CategoryFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            slug: "",
            sort_rank: 0,
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (editingCategory) {
                form.reset({
                    name: editingCategory.name,
                    slug: editingCategory.slug,
                    sort_rank: editingCategory.sort_rank,
                });
            } else {
                form.reset({
                    name: "",
                    slug: "",
                    sort_rank: 0,
                });
            }
        }
    }, [editingCategory, form, isOpen]);

    const onSubmit = async (values: CategoryFormValues) => {
        setIsLoading(true);
        try {
            if (editingCategory) {
                const { error } = await supabase
                    .from("categories")
                    .update(values)
                    .eq("id", editingCategory.id);

                if (error) throw error;
                toast.success("Category updated successfully");
            } else {
                const { error } = await supabase
                    .from("categories")
                    .insert([values]);

                if (error) throw error;
                toast.success("Category created successfully");
            }
            onSuccess();
            onClose();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Something went wrong";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        form.setValue("name", name);
        if (!editingCategory) {
            form.setValue("slug", generateSlug(name));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]" id="category-form-dialog">
                <DialogHeader>
                    <DialogTitle id="category-form-title">
                        {editingCategory ? "Edit Category" : "New Category"}
                    </DialogTitle>
                    <DialogDescription id="category-form-desc">
                        Categories help organize your prompts at the highest level.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="category-form">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            id="category-name-input"
                                            placeholder="e.g. Marketing" 
                                            onChange={handleNameChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Slug</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            id="category-slug-input"
                                            placeholder="e.g. marketing" 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sort_rank"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sort Rank</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            id="category-rank-input"
                                            type="number" 
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} id="category-cancel-btn">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading} id="category-submit-btn">
                                {isLoading ? "Saving..." : "Save Category"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
