"use client";

import Link from "next/link";
import { buildSlugId } from "@/lib/slug";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { usePromptSearch } from "@/hooks/usePromptSearch";

type HomePromptSearchProps = {
    initialQuery?: string;
};

export default function HomePromptSearch({ initialQuery }: HomePromptSearchProps) {
    const {
        query,
        setQuery,
        results,
        isLoading,
        isSupabaseConfigured
    } = usePromptSearch({
        initialQuery,
        scope: "public"
    });

    return (
        <div className="w-full max-w-[720px] mx-auto" id="home-prompt-search">
            <div className="relative" id="home-search-input-wrap">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search public prompts..."
                    className="h-12 pl-10 text-sm"
                    id="home-search-input"
                    disabled={!isSupabaseConfigured}
                />
            </div>

            <div className="mt-3" id="home-search-results-wrap">
                {!isSupabaseConfigured && (
                    <div className="rounded-sm border bg-card/50 p-4" id="home-search-config-error">
                        <p className="text-sm text-muted-foreground">
                            Search is unavailable because Supabase is not configured.
                        </p>
                    </div>
                )}

                {query.trim().length > 0 && results.length === 0 && !isLoading && (
                    <div className="rounded-sm border bg-card/50 p-4" id="home-search-empty">
                        <p className="text-sm text-muted-foreground">No prompts found.</p>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="rounded-xl border bg-card/50 overflow-hidden" id="home-search-results">
                        <div className="divide-y divide-border/60" id="home-search-results-list">
                            {results.map((p) => {
                                const href = `/prompts/${buildSlugId(p.slug, p.id)}`;
                                return (
                                    <Link
                                        key={p.id}
                                        href={href}
                                        className="block px-4 py-3 hover:bg-muted/30 transition-colors"
                                        id={`home-search-item-${p.id}`}
                                    >
                                        <div
                                            className="flex items-center justify-between gap-4"
                                            id={`home-search-item-row-${p.id}`}
                                        >
                                            <div className="min-w-0" id={`home-search-item-text-${p.id}`}>
                                                <p className="text-sm font-semibold truncate">{p.title}</p>
                                                {p.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        {p.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Button size="sm" variant="outline" className="h-7 text-[11px]" id={`home-search-open-${p.id}`}>
                                                Open
                                            </Button>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
