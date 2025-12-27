
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleLogin = async (provider: "google" | "github") => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Authentication error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
                <h1 className="text-4xl font-bold mb-8">Sign in to PromptManager</h1>
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <Button
                        onClick={() => handleLogin("github")}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                    >
                        {loading ? "Loading..." : "Sign in with GitHub"}
                    </Button>
                    <Button
                        onClick={() => handleLogin("google")}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                    >
                        {loading ? "Loading..." : "Sign in with Google"}
                    </Button>
                </div>
            </main>
        </div>
    );
}
