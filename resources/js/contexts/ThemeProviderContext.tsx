import type { Appearance, ResolvedAppearance } from '@/utils/Theme';
import { applyThemeToDocument, getStoredTheme, resolveAppearance, storeTheme } from '@/utils/Theme';

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Theme context value
 */
export type ThemeContextValue = {
    /** Stored preference */
    mode: Appearance;

    /** UI preview (ephemeral) */
    previewMode: ResolvedAppearance;

    /** Actual applied mode */
    resolved: ResolvedAppearance;

    /** Update mode */
    setMode: (mode: Appearance, persist?: boolean) => void;

    /** Reset preview → stored mode */
    resetPreview: () => void;
};

/**
 * Internal context
 */
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * ThemeProvider
 *
 * Responsibilities:
 * - Owns theme state
 * - Syncs with:
 *   - DOM
 *   - system preferences
 *   - cross-tab storage
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    /**
     * Lazy init avoids SSR mismatch
     */
    const [mode, setModeState] = useState<Appearance>(() => getStoredTheme());

    const [previewMode, setPreviewMode] = useState<ResolvedAppearance>(() => resolveAppearance(getStoredTheme()));

    const resolved = previewMode;

    /**
     * Apply to DOM
     */
    useEffect(() => {
        applyThemeToDocument(resolved);
    }, [resolved]);

    /**
     * System sync (only when mode=system)
     */
    const handleSystemThemeChange = useCallback(() => {
        if (mode !== 'system') return;

        setPreviewMode(resolveAppearance('system'));
    }, [mode]);

    useEffect(() => {
        if (mode !== 'system') return;

        const mq = window.matchMedia('(prefers-color-scheme: dark)');

        mq.addEventListener?.('change', handleSystemThemeChange);
        mq.addListener?.(handleSystemThemeChange);

        return () => {
            mq.removeEventListener?.('change', handleSystemThemeChange);
            mq.removeListener?.(handleSystemThemeChange);
        };
    }, [mode, handleSystemThemeChange]);

    /**
     * Cross-tab sync
     */
    useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key !== '__hf_thm_md') return;

            const stored = getStoredTheme();

            setModeState(stored);
            setPreviewMode(resolveAppearance(stored));
        };

        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('storage', handler);
        };
    }, []);

    /**
     * Set mode
     */
    const setMode = useCallback((m: Appearance, persist = true) => {
        setPreviewMode(resolveAppearance(m));

        if (persist) {
            setModeState(m);
            storeTheme(m);
        }
    }, []);

    /**
     * Reset preview
     */
    const resetPreview = useCallback(() => {
        setPreviewMode(resolveAppearance(mode));
    }, [mode]);

    const value = useMemo(
        () => ({
            mode,
            previewMode,
            resolved,
            setMode,
            resetPreview,
        }),
        [mode, previewMode, resolved, setMode, resetPreview],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
