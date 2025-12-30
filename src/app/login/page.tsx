
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") ?? "/";
    const router = useRouter();
    const { providers: oauthProviders, isLoading: oauthLoading } = useOAuthProviders();

    const redirectToConfigError = () => {
        const missing: string[] = [];
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
        if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
        router.push(`/auth/config-error?missing=${encodeURIComponent(missing.join(","))}`);
    };

    const handleOAuthLogin = async (provider: "google" | "github") => {
        // Check if provider is available
        if (!oauthProviders[provider]) {
            setErrorMessage(
                `OAuth with ${provider === "google" ? "Google" : "GitHub"} is not configured. ` +
                `Please use email/password authentication or configure OAuth in your Supabase instance.`
            );
            return;
        }

        try {
            setErrorMessage(null);
            setLoading(true);

            let supabase;
            try {
                supabase = createClient();
            } catch {
                redirectToConfigError();
                return;
            }

            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error("Authentication error:", error);
            setErrorMessage(
                `Failed to sign in with ${provider === "google" ? "Google" : "GitHub"}. ` +
                `Please try email/password authentication or check your OAuth configuration.`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters.");
            return;
        }

        try {
            setErrorMessage(null);
            setLoading(true);

            let supabase;
            try {
                supabase = createClient();
            } catch {
                redirectToConfigError();
                return;
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            // Redirect happens via middleware/auth state change usually, or manually:
            router.push(redirectTo);
        } catch (error) {
            console.error("Login error:", error);
            if (error instanceof Error && error.message.trim().length > 0) {
                setErrorMessage(error.message);
                return;
            }

            setErrorMessage("Sign-in failed. Please check your email and password and try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-2">
            <main className="flex w-full flex-1 flex-col items-center justify-center px-20 text-center">
                <h1 className="text-4xl font-bold mb-8">Sign in to PromptManager</h1>

                {errorMessage && (
                    <p className="text-sm text-destructive mb-4" role="alert">
                        {errorMessage}
                    </p>
                )}

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
                            minLength={6}
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
