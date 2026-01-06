"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { Globe, Lock } from "lucide-react";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TagsInput } from "@/components/ui/tags-input";
import { cn } from "@/lib/utils";
import { normalizeVisibility } from "@/lib/visibility";

interface Category {
    id: string;
    name: string;
    is_public: boolean;
    subcategories: { id: string; name: string }[];
}

interface PromptSettingsProps {
    categories: Category[];
    isLoading: boolean;
}

interface PromptSettingsFormValues {
    is_public: boolean;
    is_listed: boolean;
    subcategory_id: string | null;
    category_id: string | null;
    tags: string[];
    description: string;
}

export function PromptSettings({ categories, isLoading }: PromptSettingsProps) {
    const form = useFormContext<PromptSettingsFormValues>();

    const watchedIsPublic = Boolean(form.watch("is_public"));
    const selectedSubcategoryId = form.watch("subcategory_id");
    const selectedCategoryId = form.watch("category_id");

    const selectedCategory = useMemo(() => {
        if (selectedCategoryId) {
            return categories.find((cat) => cat.id === selectedCategoryId) ?? null;
        }
        if (selectedSubcategoryId && selectedSubcategoryId !== "none") {
            return (
                categories.find((cat) =>
                    cat.subcategories.some((sub) => sub.id === selectedSubcategoryId)
                ) ?? null
            );
        }
        return null;
    }, [categories, selectedCategoryId, selectedSubcategoryId]);

    const collectionRef = useMemo(() => {
        if (selectedSubcategoryId) return `sub:${selectedSubcategoryId}`;
        if (selectedCategoryId) return `cat:${selectedCategoryId}`;
        return "none";
    }, [selectedSubcategoryId, selectedCategoryId]);

    const handleCollectionChange = (value: string) => {
        if (value === "none") {
            form.setValue("subcategory_id", null, { shouldDirty: true });
            form.setValue("category_id", null, { shouldDirty: true });
        } else if (value.startsWith("sub:")) {
            form.setValue("subcategory_id", value.replace("sub:", ""), { shouldDirty: true });
            form.setValue("category_id", null, { shouldDirty: true });
        } else if (value.startsWith("cat:")) {
            form.setValue("category_id", value.replace("cat:", ""), { shouldDirty: true });
            form.setValue("subcategory_id", null, { shouldDirty: true });
        }
    };

    return (
        <div className="space-y-6" id="prompt-settings-container">
            <div className="rounded-sm border bg-card p-5 space-y-4 shadow-sm" id="settings-inspector">
                <div className="space-y-4" id="settings-inspector-inner">
                    <FormItem id="collection-form-item">
                        <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground" id="collection-label">
                            Collection
                        </FormLabel>
                        <Select onValueChange={handleCollectionChange} value={collectionRef}>
                            <FormControl>
                                <SelectTrigger disabled={isLoading} className="h-8 text-xs" id="collection-select-trigger">
                                    <SelectValue placeholder="Select collection" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent id="collection-select-content">
                                <SelectItem value="none" className="text-xs" id="collection-option-none">
                                    No Collection
                                </SelectItem>
                                {categories.map((cat) => (
                                    <div key={cat.id} id={`collection-group-${cat.id}`}>
                                        <SelectItem
                                            value={`cat:${cat.id}`}
                                            className="text-xs font-bold text-muted-foreground uppercase bg-muted/30 hover:bg-muted/50"
                                            id={`collection-cat-${cat.id}`}
                                        >
                                            {cat.name}
                                        </SelectItem>
                                        {cat.subcategories.map((sub) => (
                                            <SelectItem key={sub.id} value={`sub:${sub.id}`} className="text-xs pl-6" id={`collection-sub-${sub.id}`}>
                                                {sub.name}
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedCategory && (
                            <div
                                className={cn(
                                    "mt-2 rounded-sm border px-2 py-2 text-[11px]",
                                    selectedCategory.is_public
                                        ? "border-brand/30 bg-brand/5 text-brand"
                                        : "border-border bg-muted/30 text-muted-foreground"
                                )}
                                id="edit-prompt-collection-visibility"
                            >
                                <span className="font-semibold" id="edit-prompt-collection-visibility-title">Collection:</span>{" "}
                                <span id="edit-prompt-collection-visibility-value">{selectedCategory.is_public ? "Public" : "Private"}</span>
                                {watchedIsPublic && !selectedCategory.is_public && (
                                    <div className="mt-1 text-[11px] text-destructive" id="edit-prompt-collection-visibility-warning">
                                        This prompt is public, but the selected collection is private. Category/subcategory labels will be hidden on public pages.
                                    </div>
                                )}
                            </div>
                        )}
                        <FormMessage />
                    </FormItem>

                    <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                            <FormItem id="tags-form-item">
                                <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground" id="tags-label">Tags</FormLabel>
                                <FormControl>
                                    <TagsInput value={field.value} onChange={field.onChange} placeholder="Add tags..." className="bg-background" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem id="description-form-item">
                                <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground" id="description-label">Description</FormLabel>
                                <FormControl>
                                    <Textarea {...field} placeholder="Optional description..." className="resize-none text-xs min-h-[60px]" id="description-textarea" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="rounded-sm border bg-card p-5 space-y-4 shadow-sm" id="visibility-inspector">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground" id="visibility-inspector-title">Visibility</h3>
                <div className="space-y-4" id="visibility-inspector-inner">
                    <FormField
                        control={form.control}
                        name="is_public"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-sm border border-border/50 p-3 bg-muted/10" id="is-public-form-item">
                                <div className="space-y-0.5" id="is-public-label-container">
                                    <FormLabel className="text-xs font-medium flex items-center gap-1.5" id="is-public-label">
                                        {field.value ? <Globe className="h-3 w-3 text-brand" /> : <Lock className="h-3 w-3" />}
                                        {field.value ? "Public" : "Private"}
                                    </FormLabel>
                                    <div className="text-[10px] text-muted-foreground" id="is-public-hint">
                                        {field.value ? "Viewable without login" : "Only you can view this prompt"}
                                    </div>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value ?? false}
                                        onCheckedChange={(checked) => {
                                            const normalized = normalizeVisibility({
                                                is_public: checked,
                                                is_listed: Boolean(form.getValues("is_listed")),
                                            });
                                            field.onChange(normalized.is_public);
                                            if (!normalized.is_public) {
                                                form.setValue("is_listed", false, { shouldDirty: true, shouldValidate: true });
                                            }
                                        }}
                                        id="is-public-switch"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="is_listed"
                        render={({ field }) => (
                            <FormItem
                                className={cn(
                                    "flex flex-row items-center justify-between rounded-sm border border-border/50 p-3 bg-muted/10 transition-opacity",
                                    !watchedIsPublic && "opacity-50 pointer-events-none"
                                )}
                                id="is-listed-form-item"
                            >
                                <div className="space-y-0.5" id="is-listed-label-container">
                                    <FormLabel className="text-xs font-medium" id="is-listed-label">Listed</FormLabel>
                                    <div className="text-[10px] text-muted-foreground" id="is-listed-hint">Shown publicly and eligible for Google indexing</div>
                                </div>
                                <FormControl>
                                    <Switch checked={field.value ?? false} onCheckedChange={field.onChange} disabled={!watchedIsPublic} id="is-listed-switch" />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
