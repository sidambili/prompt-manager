import { createClient } from "@/lib/supabase/client";

interface OAuthProviderAvailability {
    google: boolean;
    github: boolean;
}

interface OAuthConfig {
    providers: OAuthProviderAvailability;
    isLoading: boolean;
}

// Cache for provider availability to avoid repeated checks
let cachedProviders: OAuthProviderAvailability | null = null;
let detectionPromise: Promise<OAuthProviderAvailability> | null = null;

/**
 * Reads environment variables for explicit OAuth provider control.
 * Returns null if not set (should fall back to runtime detection).
 */
const getEnvVarProviders = (): OAuthProviderAvailability | null => {
    const googleEnv = process.env.NEXT_PUBLIC_ENABLE_OAUTH_GOOGLE;
    const githubEnv = process.env.NEXT_PUBLIC_ENABLE_OAUTH_GITHUB;

    // If at least one env var is explicitly set, use them
    if (googleEnv !== undefined || githubEnv !== undefined) {
        return {
            google: googleEnv === "true" || googleEnv === "1",
            github: githubEnv === "true" || githubEnv === "1",
        };
    }

    return null;
};

/**
 * Detects if we're likely in a self-hosted environment.
 * This is a heuristic based on the Supabase URL.
 */
const isSelfHostedEnvironment = (): boolean => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    
    // Check for localhost or local IP patterns
    if (
        supabaseUrl.includes("localhost") ||
        supabaseUrl.includes("127.0.0.1") ||
        supabaseUrl.includes("192.168.") ||
        supabaseUrl.includes("10.") ||
        supabaseUrl.includes("172.16.") ||
        supabaseUrl.includes("172.17.") ||
        supabaseUrl.includes("172.18.") ||
        supabaseUrl.includes("172.19.") ||
        supabaseUrl.includes("172.20.") ||
        supabaseUrl.includes("172.21.") ||
        supabaseUrl.includes("172.22.") ||
        supabaseUrl.includes("172.23.") ||
        supabaseUrl.includes("172.24.") ||
        supabaseUrl.includes("172.25.") ||
        supabaseUrl.includes("172.26.") ||
        supabaseUrl.includes("172.27.") ||
        supabaseUrl.includes("172.28.") ||
        supabaseUrl.includes("172.29.") ||
        supabaseUrl.includes("172.30.") ||
        supabaseUrl.includes("172.31.")
    ) {
        return true;
    }

    // Check if it's NOT a Supabase cloud URL
    if (!supabaseUrl.includes("supabase.co")) {
        return true;
    }

    return false;
};

/**
 * Attempts to detect OAuth provider availability at runtime.
 * This is a best-effort detection that may not be 100% accurate.
 */
const detectOAuthProviders = async (): Promise<OAuthProviderAvailability> => {
    // If we already have a cached result, return it
    if (cachedProviders !== null) {
        return cachedProviders;
    }

    // If there's already a detection in progress, wait for it
    if (detectionPromise !== null) {
        return detectionPromise;
    }

    // Start detection
    detectionPromise = (async () => {
        try {
            const supabase = createClient();
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

            // Heuristic: If self-hosted, OAuth is likely not configured
            // (self-hosters need to manually configure OAuth)
            if (isSelfHostedEnvironment()) {
                // In self-hosted environments, OAuth is typically not configured
                // unless explicitly set up. Default to false.
                const result: OAuthProviderAvailability = {
                    google: false,
                    github: false,
                };
                cachedProviders = result;
                return result;
            }

            // For cloud Supabase, we assume OAuth might be configured
            // Since we can't easily check without service role key,
            // we default to true and let errors be handled gracefully
            const result: OAuthProviderAvailability = {
                google: true,
                github: true,
            };
            cachedProviders = result;
            return result;
        } catch (error) {
            console.warn("Failed to detect OAuth providers:", error);
            // On error, default to false (safer for self-hosted)
            const result: OAuthProviderAvailability = {
                google: false,
                github: false,
            };
            cachedProviders = result;
            return result;
        } finally {
            detectionPromise = null;
        }
    })();

    return detectionPromise;
};

/**
 * Gets OAuth provider availability.
 * Priority: Environment variables > Runtime detection > Defaults
 */
export const getOAuthProviders = async (): Promise<OAuthProviderAvailability> => {
    // First, check environment variables (explicit control)
    const envProviders = getEnvVarProviders();
    if (envProviders !== null) {
        cachedProviders = envProviders;
        return envProviders;
    }

    // Fall back to runtime detection
    return detectOAuthProviders();
};

/**
 * Synchronously gets OAuth provider availability from cache or env vars.
 * Returns null if not cached yet (use async version for first call).
 */
export const getOAuthProvidersSync = (): OAuthProviderAvailability | null => {
    const envProviders = getEnvVarProviders();
    if (envProviders !== null) {
        return envProviders;
    }

    return cachedProviders;
};

/**
 * Clears the cached provider availability.
 * Useful for testing or when configuration changes.
 */
export const clearOAuthProviderCache = (): void => {
    cachedProviders = null;
    detectionPromise = null;
};

