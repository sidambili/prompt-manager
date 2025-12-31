
"use client";

import Link from "next/link";
import { Clock, Globe, Lock, MoreHorizontal, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PromptCardProps {
    prompt: {
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
    };
}

export default function PromptCard({ prompt }: PromptCardProps) {
    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(prompt.content);
    };

    return (
        <Link href={`/dashboard/prompts/${prompt.id}`}>
            <div className="group flex items-center justify-between p-3 rounded-sm border bg-card/30 hover:bg-accent/40 hover:border-brand/40 transition-all cursor-pointer">
                <div className="flex flex-1 items-center gap-4 min-w-0">
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate group-hover:text-brand transition-colors">
                                {prompt.title}
                            </span>
                            <div className="flex gap-1.5 shrink-0">
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal border-brand-border text-brand-300 bg-brand-bg/50">
                                    {prompt.subcategories?.name}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                                    {prompt.is_public ? "Public" : "Private"}
                                </Badge>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {prompt.description || "No description provided."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-muted-foreground">
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(prompt.updated_at), { addSuffix: true })}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:text-brand hover:bg-brand-bg"
                            onClick={handleCopy}
                            title="Copy prompt content"
                        >
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={`/dashboard/prompts/${prompt.id}`}>View Details</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
                                    Copy Content
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive cursor-pointer">
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </Link>
    );
}
