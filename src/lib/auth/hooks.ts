"use client";

import { getOAuthProviders } from "./config";

interface OAuthProviderAvailability {
    google: boolean;
    github: boolean;
}

interface UseOAuthProvidersResult {
    providers: OAuthProviderAvailability;
    isLoading: boolean;
}

/**
 * React hook to get OAuth provider availability.
 * Reads from environment variables synchronously.
 * isLoading is always false since no async detection is needed.
 */
export const useOAuthProviders = (): UseOAuthProvidersResult => {
    // Configuration is now purely from environment variables, no async needed.
    const providers = getOAuthProviders();

    return {
        providers,
        isLoading: false,
    };
};
