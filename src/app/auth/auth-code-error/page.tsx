import Link from "next/link";

import { Button } from "@/components/ui/button";

type AuthCodeErrorPageProps = {
    searchParams?: {
        reason?: string;
        next?: string;
    };
};

export default function AuthCodeErrorPage({ searchParams }: AuthCodeErrorPageProps) {
    const reason = searchParams?.reason;
    const next = searchParams?.next;

    const title = "Sign-in failed";

    const description = (() => {
        if (reason === "missing_code") {
            return "We couldn’t complete sign-in because the authorization code was missing from the callback URL.";
        }

        if (reason === "exchange_failed") {
            return "We couldn’t complete sign-in because the session exchange failed. This can happen if the link expired or was already used.";
        }

        return "We couldn’t complete sign-in. Please try again.";
    })();

    const loginHref = next ? `/login?redirect=${encodeURIComponent(next)}` : "/login";

    return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
            <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
            <p className="mb-6 text-sm text-muted-foreground">{description}</p>

            <div id="auth-code-error-actions" className="flex flex-col gap-3">
                <Button asChild className="w-full">
                    <Link href={loginHref}>Go to login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/signup">Create an account</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                    <Link href="/">Back to home</Link>
                </Button>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
                If this keeps happening, verify your Supabase site URL / redirect URLs and try again.
            </p>
        </main>
    );
}
