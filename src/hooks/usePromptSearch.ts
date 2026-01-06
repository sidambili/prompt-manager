import { useState, useRef, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type PromptSearchResult = {
    id: string;
    title: string;
    description: string | null;
    slug: string;
    is_public: boolean;
    is_listed: boolean;
    user_id: string;
};

type UsePromptSearchOptions = {
    initialQuery?: string;
    scope?: "public" | "global";
    userId?: string;
    debounceMs?: number;
};

export function usePromptSearch({
    initialQuery = "",
    scope = "public",
    userId,
    debounceMs = 250
}: UsePromptSearchOptions) {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<PromptSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const supabase = useMemo(() => {
        try {
            return createClient();
        } catch {
            return null;
        }
    }, []);

    const debounceHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const requestIdRef = useRef(0);

    const handleSearch = (newQuery: string) => {
        setQuery(newQuery);

        const q = newQuery.trim();

        if (!q) {
            if (debounceHandleRef.current) clearTimeout(debounceHandleRef.current);
            setResults([]);
            setIsLoading(false);
            return;
        }

        if (debounceHandleRef.current) clearTimeout(debounceHandleRef.current);
        const requestId = (requestIdRef.current += 1);
        setIsLoading(true);

        debounceHandleRef.current = setTimeout(async () => {
            if (!supabase) {
                setResults([]);
                setIsLoading(false);
                return;
            }

            let searchBuilder = supabase
                .from("prompts")
                .select("id, title, description, slug, is_public, is_listed, user_id");

            if (scope === "public") {
                // Public search: only listed and public
                searchBuilder = searchBuilder
                    .eq("is_public", true)
                    .eq("is_listed", true);
            } else if (scope === "global" && userId) {
                // Global search: (my prompts) OR (public AND listed)
                // Logic: user_id = me OR (is_public = true AND is_listed = true)
                searchBuilder = searchBuilder.or(
                    `user_id.eq.${userId},and(is_public.eq.true,is_listed.eq.true)`
                );
            } else {
                // Fallback to public if global requested but no userId
                searchBuilder = searchBuilder
                    .eq("is_public", true)
                    .eq("is_listed", true);
            }

            const { data, error } = await searchBuilder
                .ilike("title", `%${q}%`)
                .order("updated_at", { ascending: false })
                .limit(10);

            if (requestId !== requestIdRef.current) return;

            if (error || !data) {
                console.error("Search error:", error);
                setResults([]);
            } else {
                setResults(data as PromptSearchResult[]);
            }
            setIsLoading(false);
        }, debounceMs);
    };

    return {
        query,
        setQuery: handleSearch,
        results,
        isLoading,
        isSupabaseConfigured: !!supabase
    };
}
