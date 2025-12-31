'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import PromptEditor from '@/components/prompts/PromptEditor';
import { Loader2 } from 'lucide-react';

export default function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();
    const [prompt, setPrompt] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user === undefined) return; // Auth loading
        if (user === null) {
            router.push('/login');
            return;
        }

        const fetchPrompt = async () => {
            const { data, error } = await supabase
                .from('prompts')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                router.push('/dashboard');
                return;
            }

            // Check ownership
            if (data.user_id !== user.id) {
                router.push(`/dashboard/prompts/${id}`);
                return;
            }

            setPrompt(data);
            setIsLoading(false);
        };

        fetchPrompt();
    }, [id, user, supabase, router]);

    if (isLoading || !user) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
        );
    }

    if (!prompt) return null;

    return <PromptEditor prompt={prompt} ownerId={user.id} />;
}
