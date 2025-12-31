"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/layout/AuthProvider";
import { parseSlugId } from "@/lib/slug";
import PromptViewer from "@/components/prompts/PromptViewer";

export default function PromptDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [prompt, setPrompt] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrompt = async () => {
            const { id: actualId } = parseSlugId(id) || { id };
            const { data, error } = await supabase
                .from("prompts")
                .select("*, subcategory:subcategories(name, category:categories(name))")
                .eq("id", actualId)
                .single();

            if (error || !data) {
                // If error or not found, redirect to dashboard
                console.error("Error fetching prompt:", error);
                router.push("/dashboard");
                return;
            }

            setPrompt(data);
            setIsLoading(false);
        };

        fetchPrompt();
    }, [id, supabase, router]);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
            </div>
        );
    }

    if (!prompt) return null;

    return <PromptViewer prompt={prompt} />;
}
