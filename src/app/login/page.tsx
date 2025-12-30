
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOAuthProviders } from "@/lib/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") ?? "/";
    const supabase = createClient();
    const { providers: oauthProviders, isLoading: oauthLoading } = useOAuthProviders();

    const handleOAuthLogin = async (provider: "google" | "github") => {
        // Check if provider is available
        if (!oauthProviders[provider]) {
            alert(
                `OAuth with ${provider === "google" ? "Google" : "GitHub"} is not configured. ` +
                `Please use email/password authentication or configure OAuth in your Supabase instance. ` +
                `See documentation for self-hosting setup.`
            );
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Authentication error:", error);
            alert(
                `Failed to sign in with ${provider === "google" ? "Google" : "GitHub"}. ` +
                `Please try email/password authentication or check your OAuth configuration.`
            );
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
            window.location.href = redirectTo;
        } catch (error) {
            console.error("Login error:", error);
            alert("Login failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

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
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "..." : "Sign In"}
                    </Button>
                </form>

                <div className="relative w-full max-w-xs mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-xs mb-8">
                    <div className="relative">
                        <Button
                            onClick={() => handleOAuthLogin("github")}
                            disabled={loading || !oauthProviders.github || oauthLoading}
                            className="w-full"
                            variant="outline"
                            title={
                                !oauthProviders.github
                                    ? "GitHub OAuth is not configured. See self-hosting documentation for setup instructions."
                                    : undefined
                            }
                        >
                            {loading ? "Loading..." : "GitHub"}
                        </Button>
                        {!oauthProviders.github && !oauthLoading && (
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                                GitHub OAuth not configured
                            </p>
                        )}
                    </div>
                    <div className="relative">
                        <Button
                            onClick={() => handleOAuthLogin("google")}
                            disabled={loading || !oauthProviders.google || oauthLoading}
                            className="w-full"
                            variant="outline"
                            title={
                                !oauthProviders.google
                                    ? "Google OAuth is not configured. See self-hosting documentation for setup instructions."
                                    : undefined
                            }
                        >
                            {loading ? "Loading..." : "Google"}
                        </Button>
                        {!oauthProviders.google && !oauthLoading && (
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                                Google OAuth not configured
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="underline hover:text-primary">
                        Sign Up
                    </Link>
                </p>
            </main>
        </div>
    );
}
