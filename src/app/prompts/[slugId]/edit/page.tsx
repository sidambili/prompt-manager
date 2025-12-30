import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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

  const supabase = createClient();

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
      subcategory_id,
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

  return <PromptEditor prompt={prompt} />;
}
