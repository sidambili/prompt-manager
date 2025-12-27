/**
 * Authentication configuration for PromptManager.
 *
 * OAuth provider visibility is controlled by:
 * 1. Explicit override environment variables (e.g., NEXT_PUBLIC_ENABLE_OAUTH_GOOGLE)
 * 2. Deployment mode defaults (NEXT_PUBLIC_DEPLOYMENT_MODE)
 * 3. Final fallback: disabled
 */

interface OAuthProviderAvailability {
    google: boolean;
    github: boolean;
}

type DeploymentMode = "cloud" | "self-hosted" | "local";

/**
 * Gets the current deployment mode.
 * Defaults to "cloud" if not specified, as it is the most common managed target.
 */
const getDeploymentMode = (): DeploymentMode => {
    const mode = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE as DeploymentMode;
    if (["cloud", "self-hosted", "local"].includes(mode)) {
        return mode;
    }
    return "cloud";
};

/**
 * Determines if a specific OAuth provider is enabled.
 *
 * Priority:
 * 1. Explicit environment variable (NEXT_PUBLIC_ENABLE_OAUTH_*)
 * 2. Mode-based default:
 *    - "cloud": enabled (standard for managed Supabase)
 *    - "self-hosted"/"local": disabled (requires manual setup)
 * 3. Default: false
 */
const isProviderEnabled = (provider: "google" | "github"): boolean => {
    const envVarName =
        provider === "google"
            ? "NEXT_PUBLIC_ENABLE_OAUTH_GOOGLE"
            : "NEXT_PUBLIC_ENABLE_OAUTH_GITHUB";

    const envOverride = process.env[envVarName];

    // Priority 1: Explicit Override
    if (envOverride !== undefined) {
        return envOverride === "true" || envOverride === "1";
    }

    // Priority 2: Mode-based Default
    const mode = getDeploymentMode();
    if (mode === "cloud") {
        return true; // We assume cloud users want/have OAuth configured by default
    }

    // "local" or "self-hosted" require explicit enabling because they require
    // external secrets that don't exist in the repo.
    return false;
};

/**
 * Gets OAuth provider availability.
 * Returns synchronously based on environment variables.
 */
export const getOAuthProviders = (): OAuthProviderAvailability => {
    return {
        google: isProviderEnabled("google"),
        github: isProviderEnabled("github"),
    };
};

/**
 * Synchronous version of getOAuthProviders.
 */
export const getOAuthProvidersSync = (): OAuthProviderAvailability => {
    return getOAuthProviders();
};

/**
 * Clears any cached provider state.
 */
export const clearOAuthProviderCache = (): void => {
    // No-op: current implementation reads directly from process.env
};
