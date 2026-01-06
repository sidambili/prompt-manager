"use client";

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

export function PromptSettings({ categories, isLoading }: PromptSettingsProps) {
    const form = useFormContext();

    const watchedIsPublic = Boolean(form.watch("is_public"));
    const selectedSubcategoryId = form.watch("subcategory_id") as string | null;
    const selectedCategory = (() => {
        if (!selectedSubcategoryId || selectedSubcategoryId === "none") return null;
        return (
            categories.find((cat) =>
                cat.subcategories.some((sub) => sub.id === selectedSubcategoryId)
            ) ?? null
        );
    })();

    return (
        <div className="space-y-6">
            {/* Settings Card */}
            <div className="rounded-sm border bg-card p-5 space-y-4 shadow-sm" id="settings-inspector">
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="subcategory_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">
                                    Category
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || "none"}>
                                    <FormControl>
                                        <SelectTrigger disabled={isLoading} className="h-8 text-xs">
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="none" className="text-xs">
                                            No Collection
                                        </SelectItem>
                                        {categories.map((cat) => (
                                            <div key={cat.id}>
                                                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase bg-muted/30">
                                                    {cat.name}
                                                </div>
                                                {cat.subcategories.map((sub) => (
                                                    <SelectItem key={sub.id} value={sub.id} className="text-xs">
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
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">
                                    Tags
                                </FormLabel>
                                <FormControl>
                                    <TagsInput
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Add tags..."
                                        className="bg-background"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-[10px] uppercase font-semibold text-muted-foreground">
                                    Description
                                </FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        placeholder="Optional description..."
                                        className="resize-none text-xs min-h-[60px]"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            {/* Visibility Card */}
            <div className="rounded-sm border bg-card p-5 space-y-4 shadow-sm" id="visibility-inspector">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Visibility
                </h3>
                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="is_public"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-sm border border-border/50 p-3 bg-muted/10">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-xs font-medium flex items-center gap-1.5">
                                        {field.value ? (
                                            <Globe className="h-3 w-3 text-brand" />
                                        ) : (
                                            <Lock className="h-3 w-3" />
                                        )}
                                        {field.value ? "Public" : "Private"}
                                    </FormLabel>
                                    <div className="text-[10px] text-muted-foreground">
                                        {field.value
                                            ? "Viewable without login"
                                            : "Only you can view this prompt"}
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
                                                form.setValue("is_listed", false, {
                                                    shouldDirty: true,
                                                    shouldValidate: true,
                                                });
                                            }
                                        }}
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
                                    !form.watch("is_public") && "opacity-50 pointer-events-none"
                                )}
                            >
                                <div className="space-y-0.5">
                                    <FormLabel className="text-xs font-medium">Listed</FormLabel>
                                    <div className="text-[10px] text-muted-foreground">
                                        Shown publicly and eligible for Google indexing
                                    </div>
                                </div>
                                <FormControl>
                                    <Switch
                                        checked={field.value ?? false}
                                        onCheckedChange={field.onChange}
                                        disabled={!form.watch("is_public")}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
        </div>
    );
}
