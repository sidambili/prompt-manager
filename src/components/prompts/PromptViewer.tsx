'use client';

import { useState, useMemo, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GitFork,
  Edit2,
  Globe,
  Lock,
  Check,
  ArrowLeft,
  Home,
  History,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { buildSlugId, slugify } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CopyButton } from '@/components/ui/copy-button';
import { RevisionHistory, type Revision } from './RevisionHistory';
import { MetadataHistory } from './MetadataHistory';
import { type JsonValue, type PromptChangeEvent } from '@/lib/promptChangeEvents';

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

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(
  (): z.ZodType<JsonValue> =>
    z.union([
      z.string(),
      z.number(),
      z.boolean(),
      z.null(),
      z.array(jsonValueSchema),
      z.record(z.string(), jsonValueSchema),
    ])
);

const promptChangeEventSchema: z.ZodType<PromptChangeEvent> = z.object({
  id: z.string(),
  prompt_id: z.string(),
  event_type: z.string(),
  payload: z.object({
    before: jsonValueSchema,
    after: jsonValueSchema,
  }),
  batch_id: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string(),
});

function PromptInline({
  content,
  values,
}: {
  content: string;
  values: Record<string, string>;
}) {
  const parts = content.split(/(\{\{[^}]+\}\})/g);

  return (
    <pre
      className="whitespace-pre-wrap font-mono text-sm leading-relaxed"
      id="prompt-inline-display"
    >
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
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-muted text-muted-foreground border border-border'
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

interface PromptViewerProps {
  prompt: {
    id: string;
    title: string;
    description: string | null;
    content: string;
    slug: string;
    subcategory_id: string;
    is_public: boolean;
    is_listed: boolean;
    tags: string[];
    created_at: string;
    updated_at: string;
    user_id: string;
    subcategory:
    | {
      name: string;
      category?: { name: string } | { name: string }[];
      categories?: { name: string } | { name: string }[];
    }
    | {
      name: string;
      category?: { name: string } | { name: string }[];
      categories?: { name: string } | { name: string }[];
    }[];
  };
}

export default function PromptViewer({ prompt }: PromptViewerProps) {
  const { user } = useAuth();
  const [isForking, setIsForking] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [metadataEvents, setMetadataEvents] = useState<PromptChangeEvent[]>([]);
  const [isLoadingMetadataEvents, setIsLoadingMetadataEvents] = useState(false);
  // Optimistic state for immediate UI updates after restore
  const [optimisticContent, setOptimisticContent] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  const isOwner = user?.id === prompt.user_id;

  const currentContent = optimisticContent || prompt.content;
  const activeContent = selectedRevision ? selectedRevision.content : currentContent;

  const variables = useMemo(() => {
    return extractVariables(activeContent);
  }, [activeContent]);

  const filledOutput = useMemo(() => {
    return fillTemplate(activeContent, values);
  }, [activeContent, values]);

  // Reset optimistic state when prompt updates from server
  useEffect(() => {
    setOptimisticContent(null);
  }, [prompt]);

  useEffect(() => {
    const fetchRevisions = async () => {
      if (!isOwner) return;
      setIsLoadingRevisions(true);

      try {
        const { data, error } = await supabase
          .from('prompt_revisions')
          .select('*')
          .eq('prompt_id', prompt.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setRevisions(data ?? []);
      } catch (error) {
        console.error('Failed to fetch revisions:', error);
        setRevisions([]);
      } finally {
        setIsLoadingRevisions(false);
      }
    };

    fetchRevisions();
  }, [prompt.id, isOwner, supabase]);

  useEffect(() => {
    const fetchMetadataEvents = async () => {
      if (!isOwner) return;
      setIsLoadingMetadataEvents(true);

      try {
        const { data, error } = await supabase
          .from('prompt_change_events')
          .select('*')
          .eq('prompt_id', prompt.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const parsed = z.array(promptChangeEventSchema).safeParse(data);
        if (!parsed.success) {
          console.error('Invalid prompt_change_events payload', parsed.error);
          setMetadataEvents([]);
          return;
        }

        setMetadataEvents(parsed.data);
      } catch (error) {
        console.error('Failed to fetch metadata events:', error);
        setMetadataEvents([]);
      } finally {
        setIsLoadingMetadataEvents(false);
      }
    };

    fetchMetadataEvents();
  }, [prompt.id, isOwner, supabase]);

  const missingCount = useMemo(() => {
    return variables.filter((v) => !values[v.key]?.trim()).length;
  }, [variables, values]);

  const handleFork = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsForking(true);

    try {
      const forkTitle = `${prompt.title} (Fork)`;
      const forkSlug = slugify(forkTitle);
      const { data, error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          title: forkTitle,
          content: prompt.content,
          description: prompt.description,
          subcategory_id: prompt.subcategory_id,
          is_public: false,
          is_listed: true,
          parent_id: prompt.id,
          slug: forkSlug,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        toast.success('Forked successfully');
        router.push(`/prompts/${buildSlugId(forkSlug, data.id)}/edit`);
      }
    } catch (error) {
      console.error('Failed to fork prompt:', error);
      toast.error('Fork failed');
    } finally {
      setIsForking(false);
    }
  };

  const handleRestoreRevision = async (revision: Revision) => {
    if (!isOwner) return;
    setIsRestoring(true);

    try {
      const { error } = await supabase
        .from('prompts')
        .update({
          title: revision.title,
          content: revision.content,
          description: revision.description,
          tags: revision.tags,
        })
        .eq('id', prompt.id);

      if (error) throw error;

      // Optimistic update
      setOptimisticContent(revision.content);
      toast.success('Version restored successfully');
      setSelectedRevision(null);
      
      // Refresh to get latest data (including new revision from trigger)
      router.refresh();
      
      // Fetch updated revisions list to show the new restore point
      const { data: newData } = await supabase
        .from('prompt_revisions')
        .select('*')
        .eq('prompt_id', prompt.id)
        .order('created_at', { ascending: false });
      if (newData) setRevisions(newData);

    } catch (error) {
      console.error('Failed to restore revision:', error);
      toast.error('Restore failed');
    } finally {
      setIsRestoring(false);
    }
  };

  const canonicalUrl = `/dashboard/prompts/${buildSlugId(prompt.slug, prompt.id)}`;
  const editUrl = `${canonicalUrl}/edit`;

  const subcategory = Array.isArray(prompt.subcategory)
    ? prompt.subcategory[0]
    : prompt.subcategory;

  // Handle nested aliased category
  const categoryData = subcategory?.category || subcategory?.categories;
  const category = Array.isArray(categoryData) ? categoryData[0] : categoryData;
  const categorySlug = (category as any)?.slug;

  return (
    <div
      className="flex flex-col bg-background selection:bg-brand-bg selection:text-brand"
      id="prompt-viewer-page"
    >
      {/* Header Bar */}
      <div
        className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6"
        id="viewer-header-bar"
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
            {category ? (
              <Link
                href={`/dashboard/categories/${categorySlug}`}
                className="hover:text-foreground transition-colors"
                id="breadcrumb-category"
              >
                {category.name}
              </Link>
            ) : (
              <span className="text-muted-foreground" id="breadcrumb-category-none">
                No Category
              </span>
            )}
            <span id="breadcrumb-sep-2">/</span>
            <span className="text-foreground" id="breadcrumb-subcategory">{subcategory?.name}</span>
          </div>
            <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            id="page-title"
          >
            {selectedRevision ? (
              <span className="flex items-center gap-2">
                <Badge variant="outline" className="h-6 bg-brand/10 text-brand border-brand/20">Snapshot</Badge>
                {selectedRevision.title}
              </span>
            ) : (
              prompt.title
            )}
          </h1>
          {prompt.description && (
            <p className="text-sm text-muted-foreground max-w-2xl" id="prompt-description">
              {prompt.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2" id="primary-controls">
          {selectedRevision ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRevision(null)}
              className="h-8 text-xs gap-1.5"
              id="btn-exit-revision"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Current
            </Button>
          ) : (
            <CopyButton
              variant="outline"
              size="sm"
              value={prompt.content}
              label="Template"
              showText
              className="h-8 text-xs border-dashed"
              id="btn-copy-template"
            />
          )}

          {prompt.is_public && !isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFork}
              disabled={isForking}
              className="h-8 text-xs gap-1.5"
              id="btn-fork"
            >
              <GitFork className="h-3.5 w-3.5" />
              {isForking ? 'Forking...' : 'Fork'}
            </Button>
          )}

          {isOwner && (
            <div className="flex items-center gap-2">
              {selectedRevision && (
                <Button
                  size="sm"
                  onClick={() => handleRestoreRevision(selectedRevision)}
                  disabled={isRestoring}
                  className="h-8 bg-brand text-brand-foreground hover:bg-brand/90 transition-all text-xs font-semibold px-4"
                  id="btn-restore-this"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restore Version
                </Button>
              )}
              {!selectedRevision && (
                <Button
                  size="sm"
                  asChild
                  className="h-8 bg-brand text-brand-foreground hover:bg-brand/90 transition-all text-xs font-semibold px-4"
                  id="btn-edit-mode"
                >
                  <Link href={editUrl}>
                    <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="viewer-main-stage">
        {/* Content Column */}
        <div className="lg:col-span-8 space-y-4" id="content-column">
          <Tabs defaultValue="source" className="w-full flex flex-col" id="content-tabs">
            <div className="flex items-center justify-between border-b mb-4" id="tabs-header">
              <TabsList className="bg-transparent h-auto p-0 gap-2 justify-start" id="tabs-list">
                <TabsTrigger
                  value="source"
                  className="h-9 px-5 rounded-sm border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:bg-transparent text-xs font-semibold uppercase tracking-wider transition-all"
                  id="tab-source"
                >
                  Template
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="h-9 px-5 rounded-sm border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:bg-transparent text-xs font-semibold uppercase tracking-wider transition-all"
                  id="tab-preview"
                >
                  Output
                </TabsTrigger>
              </TabsList>

            </div>

            <TabsContent
              value="source"
              className="mt-0 ring-offset-background focus-visible:outline-none overflow-visible"
              id="pane-source"
            >
              <div
                className="group relative rounded-sm border bg-card/40"
                id="source-view-content"
              >
                <div className="sticky top-0 z-20 flex justify-end p-2 pointer-events-none w-full">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                    <CopyButton
                      variant="outline"
                      size="icon"
                      value={activeContent}
                      label="Template"
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:border-brand hover:text-brand shadow-sm"
                      title="Copy template"
                      id="btn-floating-copy-template"
                    />
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <PromptInline content={activeContent} values={values} />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="preview"
              className="mt-0 ring-offset-background focus-visible:outline-none overflow-visible"
              id="pane-preview"
            >
              <div
                className="group relative rounded-sm border bg-muted/30"
                id="preview-view-content"
              >
                <div className="sticky top-0 z-20 flex justify-end p-2 pointer-events-none w-full">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                    <CopyButton
                      variant="outline"
                      size="icon"
                      value={filledOutput}
                      label="Output"
                      disabled={missingCount > 0}
                      className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:border-brand hover:text-brand shadow-sm"
                      title="Copy output"
                      id="btn-floating-copy-output"
                    />
                  </div>
                </div>
                <div className="p-6 pt-0">
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
              </div>
              <div className="mt-4 flex justify-between items-center bg-card/50 border rounded-sm p-3" id="preview-footer">
                <div className="text-[11px] text-muted-foreground" id="preview-stats">
                  Filled with{' '}
                  <span className="font-mono text-brand" id="stat-filled-count">
                    {variables.length - missingCount}
                  </span>{' '}
                  / <span className="font-mono" id="stat-total-count">{variables.length}</span> variables
                </div>
                <CopyButton
                  variant="outline"
                  size="sm"
                  value={filledOutput}
                  label="Output"
                  showText
                  idleText="Copy Raw Output"
                  successText="Copied Raw"
                  disabled={missingCount > 0}
                  className="h-7 text-[11px] font-medium transition-all hover:border-brand hover:text-brand"
                  id="btn-copy-raw-output"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Inspector Column */}
        <div className="lg:col-span-4 space-y-6" id="inspector-column">
          {/* Variables Inspector */}
          <div
            className="rounded-sm border bg-card/50 shadow-sm overflow-hidden"
            id="variables-inspector"
          >
            <div className="bg-muted/30 px-5 py-3 border-b flex items-center justify-between" id="variables-inspector-header">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground" id="variables-title">
                Parameters
              </h3>
              <Badge
                variant="secondary"
                className={cn(
                  'text-[10px] h-4 rounded-sm border-transparent',
                  missingCount === 0
                    ? ' '
                    : 'bg-orange/10 text-orange-400'
                )}
                id="variables-badge"
              >
                {missingCount === 0 ? 'N/A' : `${missingCount} MISSING`}
              </Badge>
            </div>
            <div className="p-5 space-y-5" id="variables-list-container">
              {variables.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <div className="h-8 w-8 rounded-sm bg-muted mx-auto flex items-center justify-center opacity-40">
                    <GitFork className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    No parameters detected
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {variables.map((variable, idx) => (
                    <div
                      key={variable.key}
                      className="space-y-1.5 group"
                      id={`param-group-${idx}`}
                    >
                      <div className="flex justify-between items-center px-0.5">
                        <label
                          htmlFor={`field-${variable.key}`}
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 group-focus-within:text-brand transition-colors"
                        >
                          {variable.raw}
                        </label>
                        {values[variable.key] && (
                          <Check className="h-3 w-3 text-brand" />
                        )}
                      </div>
                      <Input
                        id={`field-${variable.key}`}
                        value={values[variable.key] || ''}
                        onChange={(e) =>
                          setValues({ ...values, [variable.key]: e.target.value })
                        }
                        placeholder={`Set ${variable.raw}...`}
                        className="h-8 text-[13px] font-mono bg-background/50 border-border/50 focus:border-brand focus:ring-0 transition-all"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Identity Card */}
          <div
            className="rounded-sm border bg-card p-5 space-y-4 shadow-sm"
            id="meta-inspector"
          >
            <div className="space-y-4" id="meta-inspector-inner">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground" id="meta-title">
                Identity
              </h3>
              <div className="space-y-3" id="meta-sections">
                <div className="flex flex-col gap-1" id="meta-visibility-section">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold" id="label-visibility">
                    Visibility
                  </span>
                  <Badge
                    variant="outline"
                    className="w-fit text-[11px] h-5 gap-1.5 px-2 border-border/50 bg-muted/20"
                    id="badge-visibility"
                  >
                    {prompt.is_public ? (
                      <Globe className="h-3 w-3 text-brand" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {prompt.is_public
                      ? prompt.is_listed
                        ? 'Public & Listed'
                        : 'Public & Unlisted'
                      : 'Private'}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1" id="meta-classification-section">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold" id="label-classification">
                    Classification
                  </span>
                  <div className="flex flex-wrap gap-1.5" id="classification-badges">
                    <Badge
                      variant="secondary"
                      className="text-[11px] h-5 rounded hover:bg-muted font-normal border-transparent"
                      id="badge-cat"
                    >
                      {category?.name}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-[11px] h-5 rounded hover:bg-muted font-normal border-transparent"
                      id="badge-sub"
                    >
                      {subcategory?.name}
                    </Badge>
                  </div>
                </div>

                {prompt.tags && prompt.tags.length > 0 && (
                  <div className="flex flex-col gap-1" id="meta-tags-section">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold" id="label-tags">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5 opacity-90" id="tag-badges">
                      {prompt.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] h-5 rounded hover:bg-muted font-mono border-transparent bg-muted/50"
                          id={`tag-badge-${tag}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t mt-4 space-y-2" id="meta-timestamps">
                  <div className="flex justify-between items-center text-[11px]" id="row-updated">
                    <span className="text-muted-foreground" id="label-updated">Last Updated</span>
                    <span className="font-mono" id="val-updated">
                      {formatDistanceToNow(new Date(prompt.updated_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]" id="row-created">
                    <span className="text-muted-foreground" id="label-created">Created</span>
                    <span className="font-mono" id="val-created">
                      {new Date(prompt.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revision History Section (Owner Only) */}
          {isOwner && (
            <div
              className="rounded-sm border bg-card/50 p-5 shadow-sm"
              id="revisions-inspector"
            >
              {isLoadingRevisions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <RevisionHistory
                  revisions={revisions}
                  currentRevisionId={selectedRevision?.id}
                  onViewRevision={setSelectedRevision}
                  onRestoreRevision={handleRestoreRevision}
                  isRestoring={isRestoring}
                />
              )}
            </div>
          )}

          {/* Metadata History Section (Owner Only) */}
          {isOwner && (
            <div
              className="rounded-sm border bg-card/50 p-5 shadow-sm"
              id="metadata-history-inspector"
            >
              {isLoadingMetadataEvents ? (
                <div className="flex items-center justify-center py-8" id="metadata-history-loading">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <MetadataHistory events={metadataEvents} />
              )}
            </div>
          )}

          {/* Sign in prompt for anonymous users */}
          {!user && (
            <div className="rounded-sm border border-dashed bg-card/30 p-5 text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                Sign in to fork this prompt to your library
              </p>
              <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                <Link href={`/login?redirect=${encodeURIComponent(canonicalUrl)}`}>
                  Sign in
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
