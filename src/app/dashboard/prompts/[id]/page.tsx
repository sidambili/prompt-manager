"use client";

import { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
    Copy,
    Edit2,
    Save,
    X,
    Loader2,
    Globe,
    Lock,
    ArrowLeft,
    Trash2,
    ChevronDown,
    ChevronUp,
    GitFork,
    Check
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/layout/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Prompt {
    id: string;
    title: string;
    content: string;
    description: string | null;
    is_public: boolean;
    updated_at: string;
    created_at: string;
    user_id: string;
    subcategory_id: string;
    subcategories: {
        name: string;
        categories: {
            name: string;
        };
    };
}

interface Revision {
    id: string;
    prompt_id: string;
    title: string;
    content: string;
    description: string | null;
    created_at: string;
    created_by: string;
}

interface Variable {
    key: string;
    raw: string;
}

/**
 * Normalizes a variable name for consistent key generation.
 * Converts to lowercase, replaces spaces with underscores, removes non-alphanumeric characters.
 */
function normalizeVarName(raw: string): string {
    return raw
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
}

/**
 * Extracts variables from template content.
 * Variables are in the format {{ variable_name }}.
 */
function extractVariables(content: string): Variable[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...content.matchAll(regex)];
    const seen = new Set<string>();
    const vars: Variable[] = [];

    for (const match of matches) {
        const raw = match[1].trim();
        const key = normalizeVarName(raw);
        if (!seen.has(key)) {
            seen.add(key);
            vars.push({ key, raw });
        }
    }

    return vars;
}

/**
 * Fills template with provided values.
 * Replaces {{variable}} with values, keeps placeholder if value is missing.
 */
function fillTemplate(content: string, values: Record<string, string>): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, raw) => {
        const key = normalizeVarName(raw.trim());
        const value = values[key]?.trim();
        return value ? value : match;
    });
}

/**
 * Wraps content in markdown code block.
 */
function toMarkdownCodeBlock(text: string): string {
    return `\`\`\`\n${text}\n\`\`\``;
}

/**
 * Renders template content with variable highlighting.
 */
function PromptInline({ content, values }: { content: string; values: Record<string, string> }) {
    const parts = content.split(/(\{\{[^}]+\}\})/g);

    return (
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed" id="prompt-inline-display">
            {parts.map((part, idx) => {
                const match = part.match(/\{\{([^}]+)\}\}/);
                if (match) {
                    const raw = match[1].trim();
                    const key = normalizeVarName(raw);
                    const value = values[key]?.trim();
                    const isFilled = !!value;

                    return (
                        <span
                            key={idx}
                            className={`inline-flex items-center px-1.5 py-0.5 rounded ${isFilled
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-muted text-muted-foreground border border-border"
                                }`}
                            id={`variable-chip-${idx}`}
                        >
                            {isFilled ? value : `{{${raw}}}`}
                        </span>
                    );
                }
                return <span key={idx}>{part}</span>;
            })}
        </pre>
    );
}

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Edit state
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editDescription, setEditDescription] = useState("");

    // Variable state
    const [values, setValues] = useState<Record<string, string>>({});
    const [showHistory, setShowHistory] = useState(false);
    const [revisions, setRevisions] = useState<Revision[]>([]);
    const [isFetchingRevisions, setIsFetchingRevisions] = useState(false);

    // Toast state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Extract variables from prompt content
    const variables = useMemo(() => {
        if (!prompt) return [];
        return extractVariables(prompt.content);
    }, [prompt?.content]);

    // Calculate filled output
    const filledOutput = useMemo(() => {
        if (!prompt) return "";
        return fillTemplate(prompt.content, values);
    }, [prompt?.content, values]);

    // Calculate missing count
    const missingCount = useMemo(() => {
        return variables.filter((v) => !values[v.key]?.trim()).length;
    }, [variables, values]);

    const fetchRevisions = async () => {
        if (!user) return;
        setIsFetchingRevisions(true);
        const { data, error } = await supabase
            .from("prompt_revisions")
            .select("*")
            .eq("prompt_id", id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (!error && data) {
            setRevisions(data);
        }
        setIsFetchingRevisions(false);
    };

    useEffect(() => {
        const fetchPrompt = async () => {
            const { data, error } = await supabase
                .from("prompts")
                .select("*, subcategories(name, categories(name))")
                .eq("id", id)
                .single();

            if (!error && data) {
                setPrompt(data);
                setEditTitle(data.title);
                setEditContent(data.content);
                setEditDescription(data.description || "");
                // Only fetch revisions if the user is the owner
                if (user?.id === data.user_id) {
                    fetchRevisions();
                }
            } else {
                router.push("/dashboard");
            }
            setIsLoading(false);
        };

        if (user) {
            fetchPrompt();
        }
    }, [id, user, supabase, router]);

    const handleSave = async () => {
        if (!prompt || !user) return;
        setIsSaving(true);

        try {
            const { error: updateError } = await supabase
                .from("prompts")
                .update({
                    title: editTitle,
                    content: editContent,
                    description: editDescription,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", prompt.id);

            if (updateError) throw updateError;

            // Optional Revision tracking
            await supabase.from("prompt_revisions").insert({
                prompt_id: prompt.id,
                title: editTitle,
                content: editContent,
                description: editDescription,
                created_by: user.id
            });

            setPrompt({
                ...prompt,
                title: editTitle,
                content: editContent,
                description: editDescription,
                updated_at: new Date().toISOString(),
            });
            setIsEditing(false);
            showToast("Saved successfully");
            fetchRevisions(); // Refresh revisions after save
        } catch (error) {
            console.error("Error saving:", error);
            showToast("Failed to save");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestore = async (revision: Revision) => {
        if (!prompt || !user) return;
        setIsSaving(true);

        try {
            const { error: updateError } = await supabase
                .from("prompts")
                .update({
                    title: revision.title,
                    content: revision.content,
                    description: revision.description,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", prompt.id);

            if (updateError) throw updateError;

            // Create a new revision for the restore action itself
            await supabase.from("prompt_revisions").insert({
                prompt_id: prompt.id,
                title: revision.title,
                content: revision.content,
                description: revision.description,
                created_by: user.id
            });

            setPrompt({
                ...prompt,
                title: revision.title,
                content: revision.content,
                description: revision.description,
                updated_at: new Date().toISOString(),
            });

            // Update edit state too in case user toggles edit mode
            setEditTitle(revision.title);
            setEditContent(revision.content);
            setEditDescription(revision.description || "");

            showToast("Restored version");
            fetchRevisions();
            setShowHistory(false);
        } catch (error) {
            console.error("Error restoring:", error);
            showToast("Failed to restore");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!prompt || !user) return;
        setIsDeleting(true);

        try {
            const { error } = await supabase
                .from("prompts")
                .delete()
                .eq("id", prompt.id);

            if (error) throw error;
            router.push("/dashboard");
        } catch (error) {
            console.error("Error deleting:", error);
            showToast("Failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(`Copied ${label}`);
        } catch (error) {
            showToast("Copy failed");
        }
    };

    const showToast = (message: string) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center" id="loading-view">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
        );
    }

    if (!prompt) return null;

    const isOwner = user?.id === prompt.user_id;

    return (
        <div className="flex flex-col h-full bg-background selection:bg-brand-bg selection:text-brand" id="prompt-detail-sleek">
            {/* Context Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2" id="global-toast">
                    <div className="bg-popover border border-border shadow-2xl rounded-lg px-4 py-2.5 flex items-center gap-2.5">
                        <div className="h-4 w-4 rounded-full bg-brand/10 flex items-center justify-center">
                            <Check className="h-3 w-3 text-brand" />
                        </div>
                        <span className="text-xs font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}

            {/* Breadcrumbs / Header Action Bar */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6" id="detail-header-bar">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                        <Link href="/dashboard" className="hover:text-foreground transition-colors">Library</Link>
                        <span>/</span>
                        <Link href={`/dashboard/categories/${prompt.subcategories?.categories?.name.toLowerCase()}`} className="hover:text-foreground transition-colors">
                            {prompt.subcategories?.categories?.name}
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">{prompt.subcategories?.name}</span>
                    </div>
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="text-2xl font-bold h-9 px-0 border-none shadow-none focus-visible:ring-0 bg-transparent"
                                id="edit-title-field"
                            />
                        </div>
                    ) : (
                        <h1 className="text-2xl font-bold tracking-tight text-foreground" id="page-title">{prompt.title}</h1>
                    )}
                </div>

                <div className="flex items-center gap-2" id="primary-controls">
                    {isEditing ? (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs font-medium" id="btn-cancel">
                                Cancel
                            </Button>
                            <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8 bg-brand text-brand-foreground hover:bg-brand/90 transition-all text-xs font-semibold px-4" id="btn-save">
                                {isSaving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" onClick={() => handleCopy(prompt.content, "Template")} className="h-8 text-xs border-dashed gap-1.5" id="btn-copy">
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Copy
                            </Button>
                            {isOwner && (
                                <>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10 border-transparent transition-all" id="btn-delete-trigger">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-card border-border shadow-xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-lg">Drop Prompt?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-sm">
                                                    This will permanently remove the prompt and all its associated artifacts.
                                                    This action is destructive and irreversible.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-2">
                                                <AlertDialogCancel className="h-8 text-xs">Stay</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all">
                                                    Delete forever
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button size="sm" onClick={() => setIsEditing(true)} className="h-8 bg-brand text-brand-foreground hover:bg-brand/90 transition-all text-xs font-semibold px-4" id="btn-edit-mode">
                                        <Edit2 className="h-3.5 w-3.5" /> Edit
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Main Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="detail-main-stage">
                {/* Editor/Viewer Column */}
                <div className="lg:col-span-8 space-y-4" id="content-column">
                    <Tabs defaultValue="source" className="w-full flex flex-col" id="content-tabs">
                        <div className="flex items-center justify-between border-b mb-4">
                            <TabsList className="bg-transparent h-auto p-0 gap-8 justify-start">
                                <TabsTrigger value="source" className="h-9 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:bg-transparent text-xs font-semibold uppercase tracking-wider transition-all" id="tab-source">
                                    Template
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="h-9 px-0 rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:bg-transparent text-xs font-semibold uppercase tracking-wider transition-all" id="tab-preview">
                                    Output
                                </TabsTrigger>
                            </TabsList>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand/5 border border-brand/10">
                                <div className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                                <span className="text-[10px] text-brand-400 font-mono">LIVE_SYNC</span>
                            </div>
                        </div>

                        <TabsContent value="source" className="mt-0 ring-offset-background focus-visible:outline-none" id="pane-source">
                            {isEditing ? (
                                <div className="relative group">
                                    <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[500px] font-mono text-[13px] leading-relaxed resize-none bg-muted/20 border-border/50 focus:border-brand/40 focus:ring-0 transition-all p-6 rounded-xl"
                                        id="edit-content-pane"
                                        placeholder="Start typing your template..."
                                    />
                                    <div className="absolute top-4 right-4 text-[10px] text-muted-foreground/40 font-mono uppercase tracking-widest pointer-events-none group-focus-within:opacity-0 transition-opacity">
                                        Editor Mode
                                    </div>
                                </div>
                            ) : (
                                <ScrollArea className="min-h-[500px] max-h-[700px] rounded-xl border bg-card/40 backdrop-blur-sm p-6" id="source-view-scroll">
                                    <PromptInline content={prompt.content} values={values} />
                                </ScrollArea>
                            )}
                        </TabsContent>

                        <TabsContent value="preview" className="mt-0 ring-offset-background focus-visible:outline-none" id="pane-preview">
                            <ScrollArea className="min-h-[500px] max-h-[700px] rounded-xl border bg-muted/30 p-6" id="preview-view-scroll">
                                <pre className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground/90" id="preview-text">
                                    {filledOutput || <span className="text-muted-foreground italic">No output generated yet.</span>}
                                </pre>
                            </ScrollArea>
                            <div className="mt-4 flex justify-between items-center bg-card/50 border rounded-lg p-3">
                                <div className="text-[11px] text-muted-foreground">
                                    Filled with <span className="font-mono text-brand">{variables.length - missingCount}</span> / <span className="font-mono">{variables.length}</span> variables
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleCopy(filledOutput, "Output")} disabled={missingCount > 0} className="h-7 text-[11px] font-medium transition-all hover:border-brand hover:text-brand" id="btn-copy-output">
                                    Copy Raw Output
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Properties Column */}
                <div className="lg:col-span-4 space-y-6" id="inspector-column">
                    {/* Variables Inspector */}
                    {!isEditing && (
                        <div className="rounded-xl border bg-card/50 shadow-sm overflow-hidden" id="variables-inspector">
                            <div className="bg-muted/30 px-5 py-3 border-b flex items-center justify-between">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Parameters</h3>
                                <Badge variant="outline" className={cn("text-[10px] h-4 rounded-sm border-transparent", missingCount === 0 ? "bg-brand/20 text-brand" : "bg-orange/10 text-orange-400")}>
                                    {missingCount === 0 ? "READY" : `${missingCount} MISSING`}
                                </Badge>
                            </div>
                            <div className="p-5 space-y-5">
                                {variables.length === 0 ? (
                                    <div className="text-center py-6 space-y-2">
                                        <div className="h-8 w-8 rounded-full bg-muted mx-auto flex items-center justify-center opacity-40">
                                            <GitFork className="h-4 w-4" />
                                        </div>
                                        <p className="text-[11px] text-muted-foreground italic">No parameters detected</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {variables.map((variable, idx) => (
                                            <div key={variable.key} className="space-y-1.5 group" id={`param-group-${idx}`}>
                                                <div className="flex justify-between items-center px-0.5">
                                                    <label htmlFor={`field-${variable.key}`} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 group-focus-within:text-brand transition-colors">
                                                        {variable.raw}
                                                    </label>
                                                    {values[variable.key] && (
                                                        <Check className="h-3 w-3 text-brand" />
                                                    )}
                                                </div>
                                                <Input
                                                    id={`field-${variable.key}`}
                                                    value={values[variable.key] || ""}
                                                    onChange={(e) => setValues({ ...values, [variable.key]: e.target.value })}
                                                    placeholder={`Set ${variable.raw}...`}
                                                    className="h-8 text-[13px] font-mono bg-background/50 border-border/50 focus:border-brand focus:ring-0 transition-all"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Metadata Card */}
                    <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm" id="meta-inspector">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Identity</h3>
                        <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Visibility</span>
                                <Badge variant="outline" className="w-fit text-[11px] h-5 gap-1.5 px-2 border-border/50 bg-muted/20">
                                    {prompt.is_public ? <Globe className="h-3 w-3 text-brand" /> : <Lock className="h-3 w-3" />}
                                    {prompt.is_public ? "Public Access" : "Workspace Private"}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Classification</span>
                                <div className="flex flex-wrap gap-1.5">
                                    <Badge variant="secondary" className="text-[11px] h-5 rounded hover:bg-muted font-normal border-transparent">
                                        {prompt.subcategories?.categories?.name}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[11px] h-5 rounded hover:bg-muted font-normal border-transparent">
                                        {prompt.subcategories?.name}
                                    </Badge>
                                </div>
                            </div>
                            <div className="pt-2 border-t mt-4 space-y-2">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-muted-foreground">Last Synchronized</span>
                                    <span className="font-mono">{formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-muted-foreground">Original Commit</span>
                                    <span className="font-mono">{new Date(prompt.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Section Toggle */}
                    {isOwner && (
                        <div className="space-y-3">
                            <div
                                className={cn(
                                    "border border-dashed rounded-xl p-4 text-center group cursor-pointer transition-all",
                                    showHistory ? "border-brand bg-brand/5" : "hover:border-brand/40 hover:bg-brand/5"
                                )}
                                id="history-entry"
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-brand transition-colors mb-1 flex items-center justify-center gap-2">
                                    <GitFork className="h-3 w-3" /> {showHistory ? "Close History" : "Revision History"}
                                </div>
                                <p className="text-[10px] text-muted-foreground opacity-60">View and rollback previous versions of this prompt.</p>
                            </div>

                            {showHistory && (
                                <div className="rounded-xl border bg-card/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200" id="history-panel">
                                    <div className="bg-muted/30 px-4 py-2 border-b">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Revisions</span>
                                    </div>
                                    <ScrollArea className="h-[300px]">
                                        {isFetchingRevisions ? (
                                            <div className="p-8 flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                <span className="text-[10px] text-muted-foreground">Syncing history...</span>
                                            </div>
                                        ) : revisions.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <p className="text-[11px] text-muted-foreground italic">No revisions found.</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-border/50">
                                                {revisions.map((rev) => (
                                                    <div key={rev.id} className="p-4 space-y-2 hover:bg-muted/30 transition-colors group">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-0.5">
                                                                <p className="text-[11px] font-bold text-foreground line-clamp-1">{rev.title}</p>
                                                                <p className="text-[10px] text-muted-foreground">
                                                                    {formatDistanceToNow(new Date(rev.created_at), { addSuffix: true })}
                                                                </p>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-[10px] px-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand hover:text-brand-foreground"
                                                                onClick={() => handleRestore(rev)}
                                                                id={`restore-rev-${rev.id}`}
                                                            >
                                                                Restore
                                                            </Button>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground line-clamp-2 italic font-mono bg-muted/50 p-1.5 rounded border border-border/20">
                                                            {rev.content.substring(0, 100)}...
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
