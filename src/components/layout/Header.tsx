
"use client";

import Link from "next/link";
import { Search, User, LogOut, Settings, HelpCircle, Plus } from "lucide-react";
import { useAuth } from "@/components/layout/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CreatePromptModal from "@/components/prompts/CreatePromptModal";

import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function Header() {
    const { user } = useAuth();
    const supabase = createClient();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-30 flex h-[56px] w-full items-center justify-between border-b bg-background/80 backdrop-blur-md px-4">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="text-muted-foreground">Personal</span>
                    <span className="text-muted-foreground/50">/</span>
                    <Link href="/dashboard" className="hover:text-brand transition-colors">
                        prompt-manager
                    </Link>
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center max-w-xl px-4">
                <div className="relative w-full group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-brand transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search prompts... (⌘K)"
                        className="w-full bg-muted/40 pl-9 h-8 text-sm border-transparent focus-visible:ring-1 focus-visible:ring-brand focus-visible:border-brand transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <CreatePromptModal
                    trigger={
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-dashed hover:border-brand hover:text-brand transition-all">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">New</span>
                        </Button>
                    }
                />

                <ThemeToggle />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-sm p-0 hover:bg-accent">
                            <Avatar className="h-7 w-7 rounded-sm">
                                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email ?? ""} />
                                <AvatarFallback className="rounded-sm text-[10px] bg-brand/10 text-brand">
                                    {user?.email?.charAt(0).toUpperCase() ?? "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.user_metadata?.full_name ?? user?.email}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/dashboard/profile">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/dashboard/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href="/dashboard/help">
                                <HelpCircle className="mr-2 h-4 w-4" />
                                <span>Help</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
