
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/layout/AuthProvider";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
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

const formSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    content: z.string().min(1, "Content is required"),
    description: z.string().max(500, "Description is too long").default(""),
    subcategory_id: z.string().min(1, "Category is required"),
    is_public: z.boolean().default(false),
});

interface Category {
    id: string;
    name: string;
    subcategories: { id: string; name: string }[];
}

type CreatePromptFormValues = z.input<typeof formSchema>;

export default function CreatePromptModal({ trigger }: { trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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
        },
    });

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
            const { data, error } = await supabase
                .from("prompts")
                .insert({
                    user_id: user.id,
                    title: parsedValues.title,
                    content: parsedValues.content,
                    description: parsedValues.description,
                    subcategory_id: parsedValues.subcategory_id,
                    is_public: parsedValues.is_public,
                })
                .select()
                .single();

            if (error) throw error;

            setOpen(false);
            form.reset();
            router.refresh();
            if (data) {
                router.push(`/dashboard/prompts/${data.id}`);
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
                    <Button className="rounded-lg bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm transition-all h-8 px-3 text-xs font-semibold">
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> New Prompt
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-border bg-card">
                <DialogHeader className="px-6 py-4 border-b bg-muted/30">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-brand/10 border border-brand/20 flex items-center justify-center">
                            <Plus className="h-3.5 w-3.5 text-brand" />
                        </div>
                        <DialogTitle className="text-lg font-semibold tracking-tight">Create New Prompt</DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground ml-8">
                        Define a new prompt template. You can add variables and versions later.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
                        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x border-b">
                            {/* Metadata Section */}
                            <div className="md:col-span-2 p-6 space-y-4 bg-muted/10">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Title</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Summarizer v2"
                                                    className="h-8 text-sm bg-background border-border/50 focus:border-brand transition-all"
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
                                        <FormItem>
                                            <FormLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Collection</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-8 text-sm bg-background border-border/50 focus:border-brand transition-all">
                                                        <SelectValue placeholder="Select collection" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-card border-border">
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
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Optional context for this prompt..."
                                                    className="min-h-[80px] text-xs bg-background border-border/50 focus:border-brand transition-all resize-none"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Content Section */}
                            <div className="md:col-span-3 p-6 bg-background space-y-4">
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem className="h-full flex flex-col">
                                            <FormLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground flex justify-between items-center">
                                                Prompt Content
                                                <span className="text-[10px] lowercase font-normal italic opacity-60">
                                                    Use {"{{var}}"} for variables
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Paste or write your prompt template here..."
                                                    className="flex-1 min-h-[240px] font-mono text-xs bg-muted/20 border-border/50 focus:border-brand transition-all resize-none p-4"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 bg-muted/30 gap-3 sm:gap-0">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs h-8">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                size="sm"
                                className="h-8 bg-brand text-brand-foreground hover:bg-brand/90 transition-all text-xs font-semibold px-4"
                            >
                                {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                                Create Prompt
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
