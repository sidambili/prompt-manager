
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const supabase = createClient();

    const handleOAuthLogin = async (provider: "google" | "github") => {
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

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            // Redirect happens via middleware/auth state change usually, or manually:
            window.location.href = "/";
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            alert("Check your email for the confirmation link (or console if local dev).");
        } catch (error) {
            console.error("Signup error:", error);
            alert("Signup failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
                <h1 className="text-4xl font-bold mb-8">Sign in to PromptManager</h1>

                <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 w-full max-w-xs mb-8 text-left">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? "..." : "Sign In"}
                        </Button>
                        <Button type="button" variant="secondary" disabled={loading} onClick={handleSignUp} className="flex-1">
                            Sign Up
                        </Button>
                    </div>
                </form>

                <div className="relative w-full max-w-xs mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <Button
                        onClick={() => handleOAuthLogin("github")}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                    >
                        {loading ? "Loading..." : "GitHub"}
                    </Button>
                    <Button
                        onClick={() => handleOAuthLogin("google")}
                        disabled={loading}
                        className="w-full"
                        variant="outline"
                    >
                        {loading ? "Loading..." : "Google"}
                    </Button>
                </div>
            </main>
        </div>
    );
}
