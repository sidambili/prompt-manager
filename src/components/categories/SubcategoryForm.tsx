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

const subcategorySchema = z.object({
    name: z.string().min(1, "Name is required").max(50),
    slug: z.string().min(1, "Slug is required").max(50),
    category_id: z.string().uuid("Category is required"),
    sort_rank: z.number().int().default(0),
});

type SubcategoryFormValues = z.input<typeof subcategorySchema>;

interface Subcategory {
    id: string;
    name: string;
    slug: string;
    category_id: string;
    sort_rank: number;
}

interface SubcategoryFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    categoryId: string | null;
    editingSubcategory: Subcategory | null;
}

/**
 * Modal form for creating and editing subcategories
 * @param {SubcategoryFormProps} props - Component props including open state, callbacks, parent category ID, and editing data
 * @returns {JSX.Element} Dialog component with subcategory form
 */
export default function SubcategoryForm({
    isOpen,
    onClose,
    onSuccess,
    categoryId,
    editingSubcategory,
}: SubcategoryFormProps) {
    const hasValidCategory = !!categoryId || !!editingSubcategory?.category_id;
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const form = useForm<SubcategoryFormValues>({
        resolver: zodResolver(subcategorySchema),
        defaultValues: {
            name: "",
            slug: "",
            category_id: categoryId || "",
            sort_rank: 0,
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (editingSubcategory) {
                form.reset({
                    name: editingSubcategory.name,
                    slug: editingSubcategory.slug,
                    category_id: editingSubcategory.category_id,
                    sort_rank: editingSubcategory.sort_rank,
                });
            } else {
                form.reset({
                    name: "",
                    slug: "",
                    category_id: categoryId || "",
                    sort_rank: 0,
                });
            }
        }
    }, [editingSubcategory, categoryId, form, isOpen]);

    const onSubmit = async (values: SubcategoryFormValues) => {
        setIsLoading(true);
        try {
            if (editingSubcategory) {
                const { error } = await supabase
                    .from("subcategories")
                    .update(values)
                    .eq("id", editingSubcategory.id);

                if (error) throw error;
                toast.success("Subcategory updated successfully");
            } else {
                const { error } = await supabase
                    .from("subcategories")
                    .insert([values]);

                if (error) throw error;
                toast.success("Subcategory created successfully");
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
        if (!editingSubcategory) {
            form.setValue("slug", generateSlug(name));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]" id="subcategory-form-dialog">
                <DialogHeader>
                    <DialogTitle id="subcategory-form-title">
                        {editingSubcategory ? "Edit Subcategory" : "New Subcategory"}
                    </DialogTitle>
                    <DialogDescription id="subcategory-form-desc">
                        Subcategories provide granular organization for your prompts.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="subcategory-form">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input 
                                            {...field} 
                                            id="subcategory-name-input"
                                            placeholder="e.g. Email Campaigns" 
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
                                            id="subcategory-slug-input"
                                            placeholder="e.g. email-campaigns" 
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
                                            id="subcategory-rank-input"
                                            type="number" 
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose} id="subcategory-cancel-btn">
                                Cancel
                            </Button>
                            <div className="flex flex-col gap-1">
                                <Button
                                    type="submit"
                                    disabled={isLoading || !hasValidCategory}
                                    id="subcategory-submit-btn"
                                    title={!hasValidCategory && !isLoading ? "Select a valid category to enable saving" : undefined}
                                    aria-describedby={!hasValidCategory && !isLoading ? "category-required-hint" : undefined}
                                >
                                    {isLoading ? "Saving..." : "Save Subcategory"}
                                </Button>
                                {!hasValidCategory && !isLoading && (
                                    <p id="category-required-hint" className="text-[11px] text-muted-foreground text-right">
                                        Select a valid category to enable saving
                                    </p>
                                )}
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
