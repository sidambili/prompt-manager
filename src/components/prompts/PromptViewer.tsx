'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, GitFork, Edit, Globe, Lock } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { buildSlugId, slugify } from '@/lib/slug';

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
    created_at: string;
    updated_at: string;
    user_id: string;
    subcategory:
      | {
          name: string;
          categories: { name: string }[];
        }
      | {
          name: string;
          categories: { name: string }[];
        }[];
  };
}

export default function PromptViewer({ prompt }: PromptViewerProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isForking, setIsForking] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const isOwner = user?.id === prompt.user_id;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = prompt.content;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const handleFork = async () => {
    if (!user) return;
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

      // Redirect to edit page for the new fork
      if (data) {
        router.push(`/prompts/${buildSlugId(forkSlug, data.id)}/edit`);
      }
    } catch (error) {
      console.error('Failed to fork prompt:', error);
    } finally {
      setIsForking(false);
    }
  };

  const canonicalUrl = `/prompts/${buildSlugId(prompt.slug, prompt.id)}`;
  const editUrl = `${canonicalUrl}/edit`;

  const subcategory = Array.isArray(prompt.subcategory) ? prompt.subcategory[0] : prompt.subcategory;
  const category = subcategory?.categories?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{category?.name}</span>
          <span>/</span>
          <span>{subcategory?.name}</span>
          <span>•</span>
          <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{prompt.title}</h1>
        {prompt.description && (
          <p className="text-lg text-muted-foreground">{prompt.description}</p>
        )}
      </div>

      {/* Visibility badge */}
      <div className="flex items-center gap-2">
        {prompt.is_public ? (
          <>
            <Globe className="h-4 w-4" />
            <span className="text-sm">
              {prompt.is_listed ? 'Public & Listed' : 'Public & Unlisted'}
            </span>
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            <span className="text-sm">Private</span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          {copied ? 'Copied!' : 'Copy'}
        </Button>

        {user && !isOwner && prompt.is_public && (
          <Button variant="outline" size="sm" onClick={handleFork} disabled={isForking}>
            <GitFork className="h-4 w-4 mr-2" />
            {isForking ? 'Forking...' : 'Fork'}
          </Button>
        )}

        {isOwner && (
          <Button variant="outline" size="sm" asChild>
            <a href={editUrl}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </a>
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm font-mono">
          {prompt.content}
        </pre>
      </div>
    </div>
  );
}
