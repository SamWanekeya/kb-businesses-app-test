import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { BrandSettings } from '@pages/Settings/BrandSettings';

/**
 * Props for BrandProvider.
 */
interface BrandProviderProps {
    children: React.ReactNode;
    globalSettings?: Partial<BrandSettings>;
    user?: any;
}

/**
 * Context shape
 */
interface BrandContextType extends BrandSettings {
    updateBrandSettings: (updates: Partial<BrandSettings>) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

/**
 * Normalize incoming settings into full BrandSettings shape
 */
function normalizeSettings(settings?: Partial<BrandSettings>): BrandSettings {
    return {
        organization_email: settings?.organization_email || '',
        organization_name: settings?.organization_name || '',
        organization_phone_number: settings?.organization_phone_number || '',
        organization_physical_address: settings?.organization_physical_address || '',
        organization_tax_id_pin_number: settings?.organization_tax_id_pin_number || '',
        logo_light: settings?.logo_light || '',
        logo_dark: settings?.logo_dark || '',
        favicon: settings?.favicon || '',
        theme_mode: settings?.theme_mode || 'system',
    };
}

export function BrandProvider({ children, globalSettings }: BrandProviderProps) {
    /**
     * Initialize once
     */
    const [state, setState] = useState<BrandSettings>(() => normalizeSettings(globalSettings));

    /**
     * Sync when globalSettings changes (navigation)
     */
    useEffect(() => {
        if (!globalSettings) return;

        setState((prev) => {
            const next = normalizeSettings(globalSettings);

            // Avoid unnecessary state updates
            if (
                prev.logo_light === next.logo_light &&
                prev.logo_dark === next.logo_dark &&
                prev.favicon === next.favicon &&
                prev.theme_mode === next.theme_mode
            ) {
                return prev;
            }

            return next;
        });
    }, [globalSettings]);

    /**
     * Stable updater
     */
    const updateBrandSettings = useCallback((updates: Partial<BrandSettings>) => {
        setState((prev) => ({ ...prev, ...updates }));
    }, []);

    /**
     * Stable context value
     */
    const contextValue = useMemo(
        () => ({
            ...state,
            updateBrandSettings,
        }),
        [state, updateBrandSettings],
    );

    return <BrandContext.Provider value={contextValue}>{children}</BrandContext.Provider>;
}

export function useBrand() {
    const ctx = useContext(BrandContext);
    if (!ctx) {
        throw new Error('useBrand must be used within BrandProvider');
    }
    return ctx;
}
