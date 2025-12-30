"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/layout/AuthProvider";

type PublicHeaderProps = {
    searchPlaceholder?: string;
};

export default function PublicHeader({
    searchPlaceholder,
}: PublicHeaderProps) {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const [query, setQuery] = useState("");

    const isHomeActive = pathname === "/";
    const isPromptsActive = pathname?.startsWith("/prompts") ?? false;

    const dashboardHref = user ? "/dashboard" : "/login?redirect=%2Fdashboard";

    const resolvedPlaceholder = useMemo(() => {
        return searchPlaceholder ?? "Search prompts...";
    }, [searchPlaceholder]);

    useEffect(() => {
        // Keep the header search in sync with the URL when navigating around.
        if (typeof window === "undefined") return;

        const params = new URLSearchParams(window.location.search);
        const urlQuery = params.get("q") ?? "";
        setQuery(urlQuery);
    }, [pathname]);

    useEffect(() => {
        // On /prompts, update the querystring as the user types so the list filters live.
        if (typeof window === "undefined") return;

        if (!pathname?.startsWith("/prompts")) return;

        const q = query.trim();
        const handle = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            if (q) params.set("q", q);
            else params.delete("q");
            router.replace(`/prompts${params.toString() ? `?${params.toString()}` : ""}`);
        }, 250);

        return () => clearTimeout(handle);
    }, [query, pathname, router]);

    return (
        <header
            className="sticky top-0 z-30 flex h-[56px] w-full items-center justify-between border-b bg-background/80 backdrop-blur-md px-4"
            id="public-header"
        >
            <div className="flex items-center gap-3" id="public-header-left">
                <Link
                    href="/"
                    className="text-sm font-semibold tracking-tight hover:text-brand transition-colors"
                    id="public-header-brand"
                >
                    PromptManager
                </Link>

                <nav className="hidden md:flex items-center gap-2" id="public-header-nav">
                    <Link
                        href="/"
                        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                            isHomeActive
                                ? "bg-brand/10 text-brand"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                        id="public-nav-home"
                    >
                        Home
                    </Link>
                    <Link
                        href="/prompts"
                        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                            isPromptsActive
                                ? "bg-brand/10 text-brand"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                        id="public-nav-prompts"
                    >
                        Prompts
                    </Link>
                </nav>
            </div>

            <div className="flex-1 flex items-center justify-center max-w-xl px-4" id="public-header-center">
                <div className="relative w-full group" id="public-search-wrapper">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-brand transition-colors" />
                    <Input
                        type="search"
                        placeholder={resolvedPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            const q = query.trim();
                            router.push(q ? `/prompts?q=${encodeURIComponent(q)}` : "/prompts");
                        }}
                        className="w-full bg-muted/40 pl-9 h-8 text-sm border-transparent focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand transition-all"
                        id="public-search-input"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2" id="public-header-right">
                {!user && (
                    <Link
                        href="/signup"
                        className="hidden sm:inline text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        id="public-signup-link"
                    >
                        Sign up for free
                    </Link>
                )}

                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    id="public-dashboard-button"
                >
                    <Link href={dashboardHref}>Dashboard</Link>
                </Button>
            </div>
        </header>
    );
}
