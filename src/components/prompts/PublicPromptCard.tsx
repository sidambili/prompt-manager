"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Clock, Globe } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buildSlugId } from "@/lib/slug";

type PublicPromptCardProps = {
    prompt: {
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
};

export default function PublicPromptCard({ prompt }: PublicPromptCardProps) {
    const href = `/prompts/${buildSlugId(prompt.slug, prompt.id)}`;

    return (
        <Link href={href} id={`public-prompt-card-link-${prompt.id}`}>
            <div
                className="group flex items-center justify-between p-3 rounded-lg border bg-card/30 hover:bg-accent/40 hover:border-brand/40 transition-all cursor-pointer"
                id={`public-prompt-card-${prompt.id}`}
            >
                <div className="flex flex-1 items-center gap-4 min-w-0" id={`public-prompt-card-main-${prompt.id}`}>
                    <div className="flex flex-col min-w-0" id={`public-prompt-card-text-${prompt.id}`}>
                        <div className="flex items-center gap-2" id={`public-prompt-card-title-row-${prompt.id}`}>
                            <span className="font-medium text-sm truncate group-hover:text-brand transition-colors">
                                {prompt.title}
                            </span>
                            <div className="flex gap-1.5 shrink-0" id={`public-prompt-card-badges-${prompt.id}`}>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] h-4 px-1.5 font-normal border-brand-border text-brand-300 bg-brand-bg/50"
                                    id={`public-prompt-subcategory-${prompt.id}`}
                                >
                                    {prompt.subcategory?.name}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="text-[10px] h-4 px-1.5 font-normal"
                                    id={`public-prompt-visibility-${prompt.id}`}
                                >
                                    <Globe className="h-3 w-3 mr-1" /> Public
                                </Badge>
                            </div>
                        </div>
                        <p
                            className="text-xs text-muted-foreground line-clamp-1 mt-0.5"
                            id={`public-prompt-desc-${prompt.id}`}
                        >
                            {prompt.description || "No description provided."}
                        </p>
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground" id={`public-prompt-updated-${prompt.id}`}>
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })}
                </div>
            </div>
        </Link>
    );
}
