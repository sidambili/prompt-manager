import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { parseSlugId, buildSlugId } from '@/lib/slug';
import PromptViewer from '@/components/prompts/PromptViewer';

interface Props {
  params: Promise<{ slugId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId } = await params;
  const parsed = parseSlugId(slugId);
  if (!parsed) return { title: 'Prompt Not Found' };

  const supabase = createClient();
  const { data: prompt } = await supabase
    .from('prompts')
    .select('title, description')
    .eq('id', parsed.id)
    .is('is_public', true)
    .single();

  if (!prompt) return { title: 'Prompt Not Found' };

  return {
    title: prompt.title,
    description: prompt.description || undefined,
  };
}

export default async function PromptPage({ params }: Props) {
  const { slugId } = await params;
  const parsed = parseSlugId(slugId);

  // Invalid slugId format
  if (!parsed) {
    notFound();
  }

  const supabase = createClient();

  // Fetch prompt by id (authoritative)
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select(`
      id,
      title,
      description,
      content,
      slug,
      is_public,
      is_listed,
      created_at,
      updated_at,
      user_id,
      subcategories(name, categories(name))
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
    redirect(`/prompts/${canonical}`);
  }

  return <PromptViewer prompt={prompt} />;
}
