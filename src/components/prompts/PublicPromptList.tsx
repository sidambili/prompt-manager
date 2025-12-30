"use client";

import PublicPromptCard from "@/components/prompts/PublicPromptCard";

export type PublicPrompt = {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    updated_at: string;
    subcategory: {
        id: string;
        name: string;
        categories: {
            id: string;
            name: string;
        };
    };
};

type PublicPromptListProps = {
    prompts: PublicPrompt[];
};

export default function PublicPromptList({ prompts }: PublicPromptListProps) {
    if (prompts.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-card/20 border-dashed"
                id="public-prompt-empty"
            >
                <h3 className="text-sm font-medium">No prompts found</h3>
                <p className="text-xs text-muted-foreground max-w-[320px] mt-1">
                    Try a different search or browse another category.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2" id="public-prompt-list">
            {prompts.map((prompt) => (
                <PublicPromptCard key={prompt.id} prompt={prompt} />
            ))}
        </div>
    );
}
