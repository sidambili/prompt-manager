"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useOAuthProviders } from "@/lib/auth/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const isLocalDev = (): boolean => {
    if (typeof window === "undefined") return false;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return (
        supabaseUrl.includes("localhost") ||
        supabaseUrl.includes("127.0.0.1") ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
    );
};

export default function SignUpPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") ?? "/";
    const supabase = createClient();
    const { providers: oauthProviders, isLoading: oauthLoading } = useOAuthProviders();

    const handleOAuthLogin = async (provider: "google" | "github") => {
        if (!oauthProviders[provider]) {
            alert(
                `OAuth with ${provider === "google" ? "Google" : "GitHub"} is not configured. ` +
                `Please use email/password authentication or configure OAuth in your Supabase instance.`
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
            alert(`Failed to sign in with ${provider}.`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
                },
            });

            if (error) throw error;

            if (data.user && data.session) {
                // User is immediately signed in (auto-confirmed)
                window.location.href = redirectTo;
            } else if (data.user) {
                // User created but needs email confirmation
                if (isLocalDev()) {
                    alert(
                        "Account created! Please check InBucket at http://localhost:54324 " +
                        "for the confirmation email link, or sign in directly if email confirmation is disabled."
                    );
                } else {
                    alert("Account created! Please check your email for the confirmation link.");
                }
            } else {
                alert("Signup completed but user data is missing. Please try signing in.");
            }
        } catch (error) {
            console.error("Signup error:", error);
            const errorMessage = error instanceof Error ? error.message : "Signup failed.";
            alert(`Signup failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
                <h1 className="text-4xl font-bold mb-8">Create an Account</h1>
                <p className="mb-8 text-muted-foreground">Join PromptManager to start organizing your prompts.</p>

                <form onSubmit={handleSignUp} className="flex flex-col gap-4 w-full max-w-xs mb-8 text-left">
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
                            minLength={6}
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Creating Account..." : "Sign Up"}
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
                            type="button"
                        >
                            {loading ? "Loading..." : "GitHub"}
                        </Button>
                    </div>
                    <div className="relative">
                        <Button
                            onClick={() => handleOAuthLogin("google")}
                            disabled={loading || !oauthProviders.google || oauthLoading}
                            className="w-full"
                            variant="outline"
                            type="button"
                        >
                            {loading ? "Loading..." : "Google"}
                        </Button>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="underline hover:text-primary">
                        Sign In
                    </Link>
                </p>
            </main>
        </div>
    );
}
