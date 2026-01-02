
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import { slugify, buildSlugId } from "@/lib/slug";
import { PromptVariables } from "@/components/prompts/editor/PromptVariables";
import {
    Dialog,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    FullscreenDialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TagsInput } from "@/components/ui/tags-input";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    content: z.string().min(10, "Content must be at least 10 characters"),
    description: z.string().max(500, "Description is too long").default(""),
    subcategory_id: z.string().min(1, "Category is required"),
    is_public: z.boolean().default(false),
    is_listed: z.boolean().default(true),
    tags: z.array(z.string()).max(10, "Max 10 tags allowed").default([]),
});

interface Category {
    id: string;
    name: string;
    subcategories: { id: string; name: string }[];
}

interface Variable {
    key: string;
    raw: string;
}

function normalizeVarName(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
}

function extractVariables(content: string): Variable[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...content.matchAll(regex)];
    const seen = new Set<string>();
    const vars: Variable[] = [];

    for (const match of matches) {
        const raw = match[1].trim();
        const key = normalizeVarName(raw);
        if (!key) continue;
        if (!seen.has(key)) {
            seen.add(key);
            vars.push({ key, raw });
        }
    }

    return vars;
}

type CreatePromptFormValues = z.input<typeof formSchema>;

export default function CreatePromptModal({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [values, setValues] = useState<Record<string, string>>({});
    const { user } = useAuth();
    const supabase = createClient();
    const router = useRouter();

    const form = useForm<CreatePromptFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            content: "",
            description: "",
            subcategory_id: "",
            is_public: false,
            is_listed: true,
            tags: [],
        },
    });

    const isPublic = form.watch("is_public");
    const watchedContent = form.watch("content");

    const variables = useMemo(() => {
        return extractVariables(watchedContent || "");
    }, [watchedContent]);

    const missingCount = useMemo(() => {
        return variables.filter((v) => !values[v.key]?.trim()).length;
    }, [variables, values]);

    useEffect(() => {
        if (open) {
            const fetchCategories = async () => {
                const { data } = await supabase
                    .from("categories")
                    .select("id, name, subcategories(id, name)")
                    .order("sort_rank", { ascending: true });

                if (!data) return;
                setCategories(data as unknown as Category[]);
            };
            fetchCategories();
        }
    }, [open, supabase]);

    async function onSubmit(values: CreatePromptFormValues) {
        if (!user) return;
        setIsLoading(true);

        const parsedValues = formSchema.parse(values);

        try {
            const slug = slugify(parsedValues.title);
            const { data, error } = await supabase
                .from("prompts")
                .insert({
                    user_id: user.id,
                    title: parsedValues.title,
                    content: parsedValues.content,
                    description: parsedValues.description,
                    subcategory_id: parsedValues.subcategory_id,
                    is_public: parsedValues.is_public,
                    is_listed: parsedValues.is_listed,
                    tags: parsedValues.tags,
                    slug,
                })
                .select()
                .single();

            if (error) throw error;

            setOpen(false);
            form.reset();
            setValues({});
            router.refresh();
            if (data) {
                router.push(`/prompts/${buildSlugId(slug, data.id)}`);
            }
        } catch (error) {
            console.error("Error creating prompt:", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button
                        className="rounded-sm bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm transition-all h-8 px-3 text-xs font-semibold"
                        id="create-prompt-trigger"
                    >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> New Prompt
                    </Button>
                )}
            </DialogTrigger>
            <FullscreenDialogContent className="!z-[100]" id="create-prompt-dialog-content">
                <DialogHeader
                    className="px-8 py-6 border-b bg-muted/30 app-safe-area-pt"
                    id="create-prompt-dialog-header"
                >
                    <div className="flex items-start justify-between gap-3" id="create-prompt-header-row">
                        <div className="flex items-center gap-2" id="create-prompt-header-left">
                            <div
                                className="h-8 w-8 rounded-md bg-brand/10 border border-brand/20 flex items-center justify-center"
                                id="create-prompt-header-icon"
                            >
                                <Plus className="h-3.5 w-3.5 text-brand" />
                            </div>
                            <div className="space-y-1" id="create-prompt-header-text">
                                <DialogTitle className="text-xl font-bold tracking-tight" id="create-prompt-title">
                                    Create New Prompt
                                </DialogTitle>
                                <DialogDescription
                                    className="text-sm text-muted-foreground"
                                    id="create-prompt-description"
                                >
                                    Design and test your prompt template. Use <span className="font-mono text-brand">{"{{variable}}"}</span> for dynamic values.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0" id="create-prompt-form">
                        <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden" id="create-prompt-body-container">
                            <div
                                className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x border-b md:h-full"
                                id="create-prompt-grid"
                            >
                                {/* Metadata Section */}
                                <div className="md:col-span-2 p-8 space-y-8 bg-muted/5 md:overflow-y-auto" id="create-prompt-metadata-section">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem id="create-prompt-title-field">
                                                <FormLabel className="text-sm font-medium" id="create-prompt-title-label">Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Summarizer v2"
                                                        className="h-10 text-sm bg-background border-border/50 focus:border-brand transition-all"
                                                        id="create-prompt-title-input"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="subcategory_id"
                                        render={({ field }) => (
                                            <FormItem id="create-prompt-category-field">
                                                <FormLabel className="text-sm font-medium" id="create-prompt-category-label">Collection</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger
                                                            className="h-10 text-sm bg-background border-border/50 focus:border-brand transition-all"
                                                            id="create-prompt-category-trigger"
                                                        >
                                                            <SelectValue placeholder="Select collection" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="bg-card border-border z-[110]" id="create-prompt-category-content">
                                                        {categories.map((cat) => (
                                                            <div key={cat.id} id={`create-prompt-category-group-${cat.id}`}>
                                                                <div
                                                                    className="px-2 py-2 text-[11px] font-semibold text-muted-foreground uppercase bg-muted/30"
                                                                    id={`create-prompt-category-group-label-${cat.id}`}
                                                                >
                                                                    {cat.name}
                                                                </div>
                                                                {cat.subcategories.map((sub) => (
                                                                    <SelectItem
                                                                        key={sub.id}
                                                                        value={sub.id}
                                                                        className="text-sm"
                                                                        id={`create-prompt-subcategory-${sub.id}`}
                                                                    >
                                                                        {sub.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </div>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tags"
                                        render={({ field }) => (
                                            <FormItem id="create-prompt-tags-field">
                                                <FormLabel className="text-sm font-medium" id="create-prompt-tags-label">Tags</FormLabel>
                                                <FormControl>
                                                    <TagsInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="e.g. coding, v1..."
                                                        className="bg-background"
                                                    />
                                                </FormControl>
                                                <div className="text-xs text-muted-foreground" id="create-prompt-tags-hint">
                                                    Press Enter or comma to add tags.
                                                </div>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-2" id="create-prompt-visibility-section">
                                        <div className="rounded-sm border bg-background/50 p-4 space-y-4" id="create-prompt-visibility-card">
                                            <div className="space-y-1" id="create-prompt-visibility-header">
                                                <div className="text-sm font-medium" id="create-prompt-visibility-title">Visibility</div>
                                                <div className="text-xs text-muted-foreground" id="create-prompt-visibility-description">
                                                    Control who can view and discover this prompt.
                                                </div>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="is_public"
                                                render={({ field }) => (
                                                    <FormItem
                                                        className="flex flex-row items-center justify-between gap-4"
                                                        id="create-prompt-public-toggle"
                                                    >
                                                        <div className="space-y-1" id="create-prompt-public-copy">
                                                            <FormLabel className="text-sm font-medium" id="create-prompt-public-label">
                                                                Public
                                                            </FormLabel>
                                                            <div className="text-xs text-muted-foreground" id="create-prompt-public-hint">
                                                                Anyone with the link can view this prompt.
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value ?? false}
                                                                onCheckedChange={field.onChange}
                                                                className="origin-right"
                                                                id="create-prompt-public-switch"
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
                                                            "flex flex-row items-center justify-between gap-4 transition-all",
                                                            !isPublic && "opacity-50 pointer-events-none"
                                                        )}
                                                        id="create-prompt-listed-toggle"
                                                    >
                                                        <div className="space-y-1" id="create-prompt-listed-copy">
                                                            <FormLabel className="text-sm font-medium" id="create-prompt-listed-label">Listed</FormLabel>
                                                            <div className="text-xs text-muted-foreground" id="create-prompt-listed-hint">
                                                                Show in public directories and search.
                                                            </div>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value ?? true}
                                                                onCheckedChange={field.onChange}
                                                                disabled={!isPublic}
                                                                className="origin-right"
                                                                id="create-prompt-listed-switch"
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem id="create-prompt-description-field">
                                                <FormLabel className="text-sm font-medium" id="create-prompt-description-label">Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Optional context for this prompt..."
                                                        className="min-h-[90px] text-sm bg-background border-border/50 focus:border-brand transition-all resize-none"
                                                        id="create-prompt-description-input"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Content Section */}
                                <div className="md:col-span-3 flex flex-col bg-background md:overflow-hidden" id="create-prompt-content-section">
                                    <div className="flex-1 flex flex-col p-8 space-y-6 min-h-0 md:overflow-hidden" id="create-prompt-editor-container">
                                        <FormField
                                            control={form.control}
                                            name="content"
                                            render={({ field }) => (
                                                <FormItem className="flex-1 flex flex-col min-h-0" id="create-prompt-content-field">
                                                    <FormLabel
                                                        className="text-sm font-medium flex justify-between items-center shrink-0"
                                                        id="create-prompt-content-label"
                                                    >
                                                        Prompt
                                                        <span className="text-xs font-normal text-muted-foreground" id="create-prompt-content-hint-inline">
                                                            Use {"{{var}}"} for variables
                                                        </span>
                                                    </FormLabel>
                                                    <FormControl className="flex-1 min-h-0">
                                                        <Textarea
                                                            placeholder="Paste or write your prompt template here..."
                                                            className="flex-1 min-h-0 font-mono text-[13px] leading-relaxed bg-muted/20 border-border/50 focus:border-brand transition-all resize-none p-4 overflow-y-auto"
                                                            id="create-prompt-content-input"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <div className="text-xs text-muted-foreground shrink-0" id="create-prompt-content-hint">
                                                        Tip: add placeholders like {"{{customer_name}}"} or {"{{service_date}}"}.
                                                    </div>
                                                    <FormMessage className="text-[10px] shrink-0" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="px-8 pb-8 pt-0 shrink-0 border-t bg-muted/5" id="create-prompt-variables-panel">
                                        <div className="mt-4 max-h-none overflow-visible md:overflow-y-auto md:max-h-[350px]" id="create-prompt-variables-scroll">
                                            <PromptVariables
                                                variables={variables}
                                                values={values}
                                                onValueChange={(key, value) => setValues({ ...values, [key]: value })}
                                                missingCount={missingCount}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter
                            className="px-8 py-6 bg-muted/30 border-t app-safe-area-pb"
                            id="create-prompt-footer"
                        >
                            <div className="flex items-center justify-end gap-3 w-full" id="create-prompt-footer-row">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setOpen(false)}
                                    className="h-8 text-xs font-semibold px-4"
                                    id="create-prompt-cancel"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    size="sm"
                                    className="h-8 bg-brand text-brand-foreground hover:bg-brand/90 border border-brand/20 transition-all text-xs font-semibold px-4 shadow-sm"
                                    id="create-prompt-submit"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                    Create Prompt
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </FullscreenDialogContent>
        </Dialog>
    );
}
