"use client";

import { useEffect, useState } from "react";
import { getOAuthProviders, getOAuthProvidersSync } from "./config";

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
 * Checks environment variables first, then falls back to runtime detection.
 * Results are cached to avoid repeated checks.
 */
export const useOAuthProviders = (): UseOAuthProvidersResult => {
    const [providers, setProviders] = useState<OAuthProviderAvailability>(() => {
        // Try to get sync value first (from env vars or cache)
        const syncProviders = getOAuthProvidersSync();
        if (syncProviders !== null) {
            return syncProviders;
        }
        // Default to false while loading
        return { google: false, github: false };
    });

    const [isLoading, setIsLoading] = useState(() => {
        // If we have a sync value, we're not loading
        return getOAuthProvidersSync() === null;
    });

    useEffect(() => {
        // If we already have providers from sync, skip async detection
        if (getOAuthProvidersSync() !== null) {
            return;
        }

        // Otherwise, perform async detection
        setIsLoading(true);
        getOAuthProviders()
            .then((detectedProviders) => {
                setProviders(detectedProviders);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error("Failed to detect OAuth providers:", error);
                // On error, default to false (safer for self-hosted)
                setProviders({ google: false, github: false });
                setIsLoading(false);
            });
    }, []);

    return { providers, isLoading };
};

