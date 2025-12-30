import { redirect } from "next/navigation";

import { createClient } from "./server";

type MissingEnvVar = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";

export async function createClientOrNull() {
    try {
        return await createClient();
    } catch {
        return null;
    }
}

export async function createClientOrRedirect() {
    try {
        return await createClient();
    } catch {
        const missing: MissingEnvVar[] = [];
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
        if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

        redirect(`/auth/config-error?missing=${encodeURIComponent(missing.join(","))}`);
    }
}
