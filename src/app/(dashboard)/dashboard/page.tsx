"use client";

import { useAuth } from "@/components/layout/AuthProvider";
import { Database, Star, Clock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { useState, useEffect } from "react";
import PromptList from "@/components/prompts/PromptList";
import CreatePromptModal from "@/components/prompts/CreatePromptModal";
import { createClient } from "@/lib/supabase/client";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

type DashboardPrompt = {
    id: string;
    title: string;
    description: string | null;
    content: string;
    subcategory_id: string;
    is_public: boolean;
    updated_at: string;
    subcategories: {
        name: string;
        categories: {
            name: string;
        };
    };
};

export default function DashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [prompts, setPrompts] = useState<DashboardPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchPrompts = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from("prompts")
                .select("*, subcategories(name, categories(name))")
                .order("updated_at", { ascending: false })
                .limit(10);

            if (!error && data) {
                setPrompts(data);
            }
            setIsLoading(false);
        };

        if (!user) return;
        fetchPrompts();
    }, [user, supabase]);

    const isDashboardLoading = isAuthLoading || (user ? isLoading : false);

    const metrics = [
        { name: "Total Prompts", value: prompts.length.toString(), icon: Database, color: "text-brand" },
        { name: "Favorites", value: "0", icon: Star, color: "text-orange" },
        { name: "Activity", value: prompts.length > 0 ? "Live" : "Idle", icon: Clock, color: "text-blue" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
                <p className="text-sm text-muted-foreground">
                    Manage and monitor your prompt library.
                </p>
            </div>

            <div className="flex flex-wrap gap-4">
                {metrics.map((metric) => (
                    <div key={metric.name} className="flex items-center gap-3 px-4 py-2 border rounded-lg bg-card/50 min-w-[160px]">
                        <div className={cn("p-2 rounded-md bg-background border", metric.color)}>
                            <metric.icon className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{metric.name}</p>
                            <p className="text-xl font-bold">{metric.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Prompts</h2>
                        <Link href="/dashboard/prompts" className="text-xs text-brand hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="min-h-[400px]">
                        {isDashboardLoading ? (
                            <PromptList prompts={prompts} isLoading />
                        ) : !user ? (
                            <Empty className="bg-card/50">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Database />
                                    </EmptyMedia>
                                    <EmptyTitle>Sign in to view your dashboard</EmptyTitle>
                                    <EmptyDescription>
                                        Your prompts are private to your account. Sign in to view and manage them.
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Button size="sm" asChild>
                                        <Link href="/login">Sign in</Link>
                                    </Button>
                                </EmptyContent>
                            </Empty>
                        ) : prompts.length === 0 ? (
                            <Empty className="bg-card/50">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Database />
                                    </EmptyMedia>
                                    <EmptyTitle>No prompts yet</EmptyTitle>
                                    <EmptyDescription>
                                        Create your first prompt to start building your library.
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <CreatePromptModal
                                        trigger={
                                            <Button size="sm">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create prompt
                                            </Button>
                                        }
                                    />
                                </EmptyContent>
                            </Empty>
                        ) : (
                            <PromptList prompts={prompts} isLoading={false} />
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Technical Summary</h2>
                        <div className="rounded-lg border bg-card/50 p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Active Subcategories</span>
                                <span className="font-mono font-medium">{new Set(prompts.map(p => p.subcategory_id)).size}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Public Prompts</span>
                                <span className="font-mono font-medium text-brand">{prompts.filter(p => p.is_public).length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Private Prompts</span>
                                <span className="font-mono font-medium">{prompts.filter(p => !p.is_public).length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b pb-2">Quick Access</h2>
                        <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" asChild>
                                <Link href="/dashboard/categories">
                                    <Plus className="mr-2 h-3.5 w-3.5" /> Explore Collections
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" className="w-full justify-start h-9 text-xs" asChild>
                                <Link href="/dashboard/settings">
                                    <Plus className="mr-2 h-3.5 w-3.5" /> System Configuration
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
