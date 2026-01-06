'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Save,
  X,
  Home,
  Globe,
  Lock,
  Check,
  GitFork,
  Trash2,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { slugify, buildSlugId } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { normalizeVisibility } from '@/lib/visibility';

import { PromptVariables } from './editor/PromptVariables';
import { PromptSettings } from './editor/PromptSettings';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required'),
  description: z.string().max(500, 'Description is too long').default(''),
  subcategory_id: z.string().nullable(),
  category_id: z.string().nullable(),
  is_public: z.boolean().default(false),
  is_listed: z.boolean().default(true),
  tags: z.array(z.string()).max(10, 'Max 10 tags').default([]),
  commit_message: z
    .string()
    .max(200, 'Commit message is too long'),
});

type PromptEditorFormValues = z.input<typeof formSchema>;

interface Category {
  id: string;
  name: string;
  is_public: boolean;
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
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

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

function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, raw) => {
    const key = normalizeVarName(raw.trim());
    const value = values[key]?.trim();
    return value ? value : match;
  });
}

type PromptEditorProps = {
  prompt: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    slug: string;
    is_public: boolean;
    is_listed: boolean;
    tags: string[];
    subcategory_id: string | null;
    category_id: string | null;
    user_id?: string;
  };
  ownerId: string;
};

export default function PromptEditor({ prompt, ownerId }: PromptEditorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<PromptEditorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: prompt.title,
      content: prompt.content,
      description: prompt.description || '',
      subcategory_id: prompt.subcategory_id,
      category_id: prompt.category_id,
      is_public: prompt.is_public,
      is_listed: prompt.is_public ? prompt.is_listed : false,
      tags: prompt.tags || [],
      commit_message: '',
    },
  });

  const watchedContent = form.watch('content');
  const watchedTitle = form.watch('title');
  const watchedCommitMessage = form.watch('commit_message');

  const variables = useMemo(() => {
    return extractVariables(watchedContent);
  }, [watchedContent]);

  const filledOutput = useMemo(() => {
    return fillTemplate(watchedContent, values);
  }, [watchedContent, values]);

  const missingCount = useMemo(() => {
    return variables.filter((v) => !values[v.key]?.trim()).length;
  }, [variables, values]);

  const watchedIsPublic = form.watch('is_public');

  useEffect(() => {
    if (!watchedIsPublic) {
      form.setValue('is_listed', false, { shouldDirty: true, shouldValidate: true });
    }
  }, [form, watchedIsPublic]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('categories')
        .select('id, name, is_public, subcategories(id, name)')
        .order('sort_rank', { ascending: true });
      if (data) {
        setCategories(data as unknown as Category[]);
      }
      setIsLoading(false);
    };
    fetchCategories();
  }, [supabase]);

  const onSubmit = async (formValues: PromptEditorFormValues) => {
    setIsSaving(true);

    try {
      const parsedValues = formSchema.parse(formValues);
      const normalizedVisibility = normalizeVisibility({
        is_public: parsedValues.is_public,
        is_listed: parsedValues.is_listed,
      });

      const newSlug =
        parsedValues.title !== prompt.title ? slugify(parsedValues.title) : prompt.slug;

      const { error } = await supabase.rpc('update_prompt_with_commit_message', {
        p_prompt_id: prompt.id,
        p_title: parsedValues.title,
        p_content: parsedValues.content,
        p_description: parsedValues.description,
        p_subcategory_id: parsedValues.subcategory_id,
        p_category_id: parsedValues.category_id,
        p_is_public: normalizedVisibility.is_public,
        p_is_listed: normalizedVisibility.is_listed,
        p_tags: parsedValues.tags,
        p_slug: newSlug,
        p_commit_message: parsedValues.commit_message,
      });

      if (error) throw error;

      showToast('Saved successfully');
      router.push(`/dashboard/prompts/${buildSlugId(newSlug, prompt.id)}`);
      router.refresh();
    } catch (error) {
      console.error('Failed to update prompt:', error);
      showToast('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const { error } = await supabase.from('prompts').delete().eq('id', prompt.id);

      if (error) throw error;
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const canonicalUrl = `/dashboard/prompts/${buildSlugId(prompt.slug, prompt.id)}`;

  return (
    <div
      className="flex flex-col h-full bg-background selection:bg-brand-bg selection:text-brand"
      id="prompt-editor-page"
    >
      {/* Toast */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2"
          id="global-toast"
        >
          <div className="bg-popover border border-border shadow-2xl rounded-sm px-4 py-2.5 flex items-center gap-2.5">
            <div className="h-4 w-4 rounded-sm bg-brand/10 flex items-center justify-center">
              <Check className="h-3 w-3 text-brand" />
            </div>
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
          {/* Header Bar */}
          <div
            className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6"
            id="editor-header-bar"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-widest" id="breadcrumb-navigation">
                <Link
                  href="/dashboard"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                  id="breadcrumb-home"
                >
                  <Home className="h-3 w-3" />
                  Library
                </Link>
                <span id="breadcrumb-sep-1">/</span>
                <Link
                  href={canonicalUrl}
                  className="hover:text-foreground transition-colors"
                  id="breadcrumb-prompt"
                >
                  {prompt.title}
                </Link>
                <span id="breadcrumb-sep-2">/</span>
                <span className="text-foreground" id="breadcrumb-edit">Edit</span>
              </div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        {...field}
                        className="text-2xl font-bold h-9 px-0 border-none shadow-none focus-visible:ring-0 bg-transparent tracking-tight"
                        placeholder="Prompt title..."
                        id="edit-title-field"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-2" id="primary-controls">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                asChild
                className="h-8 text-xs font-medium"
                id="btn-cancel"
              >
                <Link href={canonicalUrl}>Cancel</Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs text-destructive hover:bg-destructive/10 border-transparent transition-all"
                    id="btn-delete-trigger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border shadow-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg">
                      Delete Prompt?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm">
                      This will permanently remove the prompt and all its revisions. This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete forever'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="h-8 bg-brand text-brand-foreground hover:bg-brand/90 transition-all text-xs font-semibold px-4"
                id="btn-save"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3.5 w-3.5" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Main Stage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="editor-main-stage">
            {/* Editor Column */}
            <div className="lg:col-span-8 space-y-4" id="content-column">
              <Tabs
                defaultValue="source"
                className="w-full flex flex-col"
                id="content-tabs"
              >
                <div className="flex items-center justify-between border-b mb-4">
                  <TabsList className="bg-transparent h-auto p-0 gap-8 justify-start" id="tabs-list">
                    <TabsTrigger
                      value="source"
                      className="h-9 px-0 rounded-sm border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:bg-transparent text-xs font-semibold uppercase tracking-wider transition-all"
                      id="tab-source"
                    >
                      Template
                    </TabsTrigger>
                    <TabsTrigger
                      value="preview"
                      className="h-9 px-0 rounded-sm border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:bg-transparent text-xs font-semibold uppercase tracking-wider transition-all"
                      id="tab-preview"
                    >
                      Output
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-brand/5 border border-brand/10" id="editing-indicator">
                    <div className="h-1.5 w-1.5 rounded-sm bg-brand animate-pulse" id="editing-pulse" />
                    <span className="text-[10px] text-brand-400 font-mono" id="editing-label">EDITING</span>
                  </div>
                </div>

                <TabsContent
                  value="source"
                  className="mt-0 ring-offset-background focus-visible:outline-none"
                  id="pane-source"
                >
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="min-h-[500px] font-mono text-[13px] leading-relaxed resize-none bg-muted/20 border-border/50 focus:border-brand/40 focus:ring-0 transition-all p-6 rounded-xl"
                            id="edit-content-pane"
                            placeholder="Start typing your template..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent
                  value="preview"
                  className="mt-0 ring-offset-background focus-visible:outline-none overflow-visible"
                  id="pane-preview"
                >
                  <div
                    className="min-h-[500px] rounded-xl border bg-muted/30 p-6"
                    id="preview-view-content"
                  >
                    <pre
                      className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-foreground/90"
                      id="preview-text"
                    >
                      {filledOutput || (
                        <span className="text-muted-foreground italic">
                          No output generated yet.
                        </span>
                      )}
                    </pre>
                  </div>
                  <div className="mt-4 flex justify-between items-center bg-card/50 border rounded-sm p-3" id="preview-footer">
                    <div className="text-[11px] text-muted-foreground" id="preview-stats">
                      Filled with{' '}
                      <span className="font-mono text-brand" id="stat-filled-count">
                        {variables.length - missingCount}
                      </span>{' '}
                      / <span className="font-mono" id="stat-total-count">{variables.length}</span> variables
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Inspector Column */}
            <div className="lg:col-span-4 space-y-6" id="inspector-column">
              <div className="rounded-sm border bg-card p-4 space-y-4" id="commit-message-section">
                <div className="space-y-1" id="commit-header">
                  <div className="text-sm font-medium" id="commit-title">Revision Note</div>
                  <div className="text-xs text-muted-foreground" id="commit-desc">
                    Describe what changed in this version. (Optional)
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="commit_message"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          maxLength={200}
                          placeholder="e.g. Added safety checks..."
                          className="min-h-[90px] text-xs bg-muted/20 border-border/50 focus:border-brand transition-all resize-none"
                          id="edit-commit-input"
                        />
                      </FormControl>
                      <div
                        className="text-[10px] text-muted-foreground text-right"
                        id="edit-commit-counter"
                      >
                        {(watchedCommitMessage ?? '').length}/200
                      </div>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Variables Inspector */}
              <PromptVariables
                variables={variables}
                values={values}
                onValueChange={(key, value) => setValues({ ...values, [key]: value })}
                missingCount={missingCount}
              />

              <PromptSettings
                categories={categories}
                isLoading={isLoading}
              />
            </div>
          </div>
        </form>
      </Form>
    </div >
  );
}
