import { notFound, permanentRedirect, redirect } from 'next/navigation';
import { createClientOrRedirect } from '@/lib/supabase/server-rsc';
import { parseSlugId } from '@/lib/slug';
import PromptEditor from '@/components/prompts/PromptEditor';

interface Props {
  params: Promise<{ slugId: string }>;
}

export default async function EditPromptPage({ params }: Props) {
  const { slugId } = await params;
  const parsed = parseSlugId(slugId);

  if (!parsed) {
    notFound();
  }

  const supabase = await createClientOrRedirect();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=' + encodeURIComponent(`/prompts/${slugId}/edit`));
  }

  // Fetch prompt by id
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
      tags,
      subcategory_id,
      category_id,
      user_id
    `)
    .eq('id', parsed.id)
    .single();

  if (error || !prompt) {
    notFound();
  }

  // Owner check
  if (user.id !== prompt.user_id) {
    notFound();
  }

  // Canonical redirect for edit route
  if (prompt.slug !== parsed.slug) {
    permanentRedirect(`/prompts/${prompt.slug}--${prompt.id}/edit`);
  }

  return <PromptEditor prompt={prompt} ownerId={user.id} />;
}
