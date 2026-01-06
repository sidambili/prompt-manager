import { notFound, permanentRedirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClientOrNull, createClientOrRedirect } from '@/lib/supabase/server-rsc';
import { parseSlugId, buildSlugId } from '@/lib/slug';
import PromptViewer from '@/components/prompts/PromptViewer';

interface Props {
  params: Promise<{ slugId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId } = await params;
  const parsed = parseSlugId(slugId);
  if (!parsed) return { title: 'Prompt Not Found' };

  const supabase = await createClientOrNull();
  if (!supabase) return { title: 'Prompt Not Found' };

  const { data: prompt } = await supabase
    .from('prompts')
    .select('title, description, slug, is_public, is_listed')
    .eq('id', parsed.id)
    .single();

  if (!prompt) return { title: 'Prompt Not Found' };

  if (!prompt.is_public) {
    return { title: 'Prompt Not Found' };
  }

  const robots = prompt.is_listed
    ? undefined
    : {
        index: false,
        follow: false,
      };

  return {
    title: prompt.title,
    description: prompt.description || undefined,
    robots,
  };
}

export default async function PromptPage({ params }: Props) {
  const { slugId } = await params;
  const parsed = parseSlugId(slugId);

  // Invalid slugId format
  if (!parsed) {
    notFound();
  }

  const supabase = await createClientOrRedirect();

  // Fetch prompt by id (authoritative)
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      description,
      content,
      slug,
      subcategory_id,
      is_public,
      is_listed,
      tags,
      created_at,
      updated_at,
      user_id,
      subcategory:subcategories!prompts_subcategory_id_fkey(
        name,
        categories(name, is_public)
      )
    `)
    .eq('id', parsed.id)
    .single();

  if (error || !prompt) {
    notFound();
  }

  // Private prompts: only owner can view
  if (!prompt.is_public) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== prompt.user_id) {
      notFound();
    }
  }

  // If slug in URL doesn't match current slug, redirect to canonical
  if (prompt.slug !== parsed.slug) {
    const canonical = buildSlugId(prompt.slug, prompt.id);
    permanentRedirect(`/prompts/${canonical}`);
  }

  return <PromptViewer prompt={prompt} />;
}
