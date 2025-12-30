"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { FaGithub } from "react-icons/fa";
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
    const searchParams = useSearchParams();
    const router = useRouter();

    const debounceHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isHomeActive = pathname === "/";
    const isPromptsActive = pathname?.startsWith("/prompts") ?? false;

    const dashboardHref = user ? "/dashboard" : "/login?redirect=%2Fdashboard";

    const resolvedPlaceholder = useMemo(() => {
        return searchPlaceholder ?? "Search prompts...";
    }, [searchPlaceholder]);

    const urlQuery = searchParams.get("q") ?? "";
    const inputValue = pathname === "/prompts" ? urlQuery : "";

    return (
        <header
            className="sticky top-0 z-40 flex h-[60px] w-full items-center justify-between border-b bg-background/80 backdrop-blur-md px-6"
            id="public-header"
        >
            <div className="flex-1 flex items-center gap-10" id="public-header-left">
                <Link
                    href="/"
                    className="text-lg font-extrabold tracking-tight hover:text-brand transition-colors"
                    id="public-header-brand"
                >
                    PromptManager
                </Link>

                <nav className="hidden md:flex items-center gap-2" id="public-header-nav">
                    <Link
                        href="/"
                        className={`text-[15px] font-semibold px-3 py-1.5 rounded-md transition-colors ${isHomeActive
                            ? "bg-brand/10 text-brand"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            }`}
                        id="public-nav-home"
                    >
                        Home
                    </Link>
                    <Link
                        href="/prompts"
                        className={`text-[15px] font-semibold px-3 py-1.5 rounded-md transition-colors ${isPromptsActive
                            ? "bg-brand/10 text-brand"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                            }`}
                        id="public-nav-prompts"
                    >
                        Prompts
                    </Link>
                </nav>
            </div>

            <div className="flex items-center justify-center w-full max-w-xl px-4" id="public-header-center">
                <div className="relative w-full group" id="public-search-wrapper">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-brand transition-colors" />
                    <Input
                        type="search"
                        placeholder={resolvedPlaceholder}
                        key={`${pathname}:${inputValue}`}
                        defaultValue={inputValue}
                        onChange={(e) => {
                            if (pathname !== "/prompts") return;

                            if (debounceHandleRef.current) {
                                clearTimeout(debounceHandleRef.current);
                            }

                            const q = e.target.value.trim();
                            debounceHandleRef.current = setTimeout(() => {
                                const params = new URLSearchParams(window.location.search);
                                if (q) params.set("q", q);
                                else params.delete("q");
                                router.replace(
                                    `/prompts${params.toString() ? `?${params.toString()}` : ""}`
                                );
                            }, 250);
                        }}
                        onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            const q = (e.currentTarget.value ?? "").trim();
                            router.push(q ? `/prompts?q=${encodeURIComponent(q)}` : "/prompts");
                        }}
                        className="w-full bg-muted/40 pl-11 h-9 text-base border-transparent focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand transition-all"
                        id="public-search-input"
                    />
                </div>
            </div>

            <div className="flex-1 flex items-center justify-end gap-3 sm:gap-4" id="public-header-right">
                <Link
                    href="https://github.com/sidambili/prompt-manager"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 text-sm font-medium border rounded-sm hover:bg-muted/50 transition-colors"
                    id="github-badge"
                >
                    <FaGithub className="h-4 w-4" />
                    <span>Self Host</span>
                </Link>

                {!user && (
                    <Link
                        href="/signup"
                        className="hidden sm:inline text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        id="public-signup-link"
                    >
                        Sign up
                    </Link>
                )}

                <Button
                    asChild
                    size="sm"
                    className="h-9 px-6 text-sm font-bold bg-foreground text-background hover:bg-foreground/90 transition-all rounded-sm"
                    id="public-dashboard-button"
                >
                    <Link href={dashboardHref}>Dashboard</Link>
                </Button>
            </div>
        </header>
    );
}
