
"use client";

import PromptCard from "./PromptCard";

interface Prompt {
    id: string;
    title: string;
    description: string | null;
    content: string;
    is_public: boolean;
    updated_at: string;
    subcategories: {
        name: string;
        categories: {
            name: string;
        };
    };
}

interface PromptListProps {
    prompts: Prompt[];
    isLoading?: boolean;
}

export default function PromptList({ prompts, isLoading }: PromptListProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-[60px] rounded-lg bg-card/50 border animate-pulse" />
                ))}
            </div>
        );
    }

    if (prompts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-card/20 border-dashed">
                <div className="rounded-full bg-muted p-3 mb-3">
                    <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h3 className="text-sm font-medium">No prompts found</h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
                    Start by creating your first prompt.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {prompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
            ))}
        </div>
    );
}
