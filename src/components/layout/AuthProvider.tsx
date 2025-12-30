
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const missing = useMemo(() => {
        const keys: string[] = [];
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) keys.push("NEXT_PUBLIC_SUPABASE_URL");
        if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) keys.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
        return keys;
    }, []);
    const missingKey = missing.join(",");
    const isSupabaseConfigured = missing.length === 0;

    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
    const router = useRouter();
    const pathname = usePathname();

    const handleAuthStateChange = useCallback((_: string, nextSession: Session | null) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            if (pathname !== "/auth/config-error") {
                router.push(`/auth/config-error?missing=${encodeURIComponent(missingKey)}`);
            }

            return;
        }

        let supabase: ReturnType<typeof createClient>;
        try {
            supabase = createClient();
        } catch {
            if (pathname !== "/auth/config-error") {
                router.push(`/auth/config-error?missing=${encodeURIComponent(missingKey)}`);
            }
            return;
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(handleAuthStateChange);

        return () => {
            subscription.unsubscribe();
        };
    }, [handleAuthStateChange, isSupabaseConfigured, missingKey, pathname, router]);

    return (
        <AuthContext.Provider value={{ user, session, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
