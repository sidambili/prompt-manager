"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePromptSearch } from "@/hooks/usePromptSearch";
import { buildSlugId } from "@/lib/slug";
import { useAuth } from "@/components/layout/AuthProvider";

export function HeaderSearch() {
    const { user } = useAuth();
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        query,
        setQuery,
        results,
        isLoading
    } = usePromptSearch({
        scope: "global",
        userId: user?.id
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const showResults = isFocused && query.trim().length > 0;

    return (
        <div
            className="flex flex-1 items-center justify-center max-w-xl px-4"
            ref={containerRef}
            id="header-search"
        >
            <div className="relative w-full group" id="header-search-input-wrap">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-brand transition-colors" />
                <Input
                    type="search"
                    placeholder="Search prompts..."
                    className="w-full bg-muted/40 pl-9 h-8 text-sm border-transparent focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand transition-all"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    id="header-search-input"
                />

                {showResults && (
                    <div
                        className="absolute top-full left-0 right-0 mt-2 bg-popover text-popover-foreground border rounded-md shadow-md overflow-hidden z-50"
                        id="header-search-results"
                    >
                        {isLoading ? (
                            <div
                                className="p-4 flex items-center justify-center text-muted-foreground"
                                id="header-search-loading"
                            >
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm" id="header-search-loading-text">Searching...</span>
                            </div>
                        ) : results.length > 0 ? (
                            <div className="py-1 max-h-[300px] overflow-y-auto" id="header-search-results-list">
                                {results.map((p) => (
                                    (() => {
                                        const isOwned = !!user?.id && p.user_id === user.id;
                                        const href = isOwned
                                            ? `/dashboard/prompts/${p.id}`
                                            : `/prompts/${buildSlugId(p.slug, p.id)}`;

                                        return (
                                    <Link
                                        key={p.id}
                                        href={href}
                                        onClick={() => setIsFocused(false)}
                                        className="flex items-center px-4 py-2 hover:bg-muted/50 transition-colors text-sm"
                                        id={`header-search-item-${p.id}`}
                                    >
                                        <div className="flex-1 min-w-0" id={`header-search-item-text-${p.id}`}>
                                            <div className="font-medium truncate" id={`header-search-item-title-${p.id}`}>{p.title}</div>
                                            {p.description && (
                                                <div className="text-xs text-muted-foreground truncate" id={`header-search-item-description-${p.id}`}>
                                                    {p.description}
                                                </div>
                                            )}
                                        </div>
                                        {p.is_public && p.is_listed && (
                                            <span
                                                className="ml-2 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border"
                                                id={`header-search-item-badge-public-${p.id}`}
                                            >
                                                Public
                                            </span>
                                        )}
                                        {p.is_public && !p.is_listed && (
                                            <span
                                                className="ml-2 text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20"
                                                id={`header-search-item-badge-unlisted-${p.id}`}
                                            >
                                                Unlisted
                                            </span>
                                        )}
                                        {!p.is_public && (
                                            <span
                                                className="ml-2 text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded border border-amber-500/20"
                                                id={`header-search-item-badge-private-${p.id}`}
                                            >
                                                Private
                                            </span>
                                        )}
                                    </Link>
                                        );
                                    })()
                                ))}
                            </div>
                        ) : (
                            <div
                                className="p-4 text-sm text-center text-muted-foreground"
                                id="header-search-empty"
                            >
                                No prompts found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
