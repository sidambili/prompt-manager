import Link from "next/link";

import { Button } from "@/components/ui/button";

type ConfigErrorPageProps = {
    searchParams?: {
        missing?: string;
    };
};

export default function ConfigErrorPage({ searchParams }: ConfigErrorPageProps) {
    const missing = (searchParams?.missing ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const missingText = missing.length > 0 ? missing.join(", ") : "required environment variables";

    return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
            <h1 className="mb-2 text-2xl font-semibold">Configuration error</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                This deployment is missing {missingText}. Authentication and protected routes may not work until it’s
                configured.
            </p>

            <div id="config-error-actions" className="flex flex-col gap-3">
                <Button asChild className="w-full">
                    <Link href="/">Back to home</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link href="/login">Go to login</Link>
                </Button>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
                Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in your environment and restart the
                server.
            </p>
        </main>
    );
}
