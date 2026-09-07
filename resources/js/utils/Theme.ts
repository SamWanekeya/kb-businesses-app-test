/**
 * resources/js/utils/theme.ts
 *
 * Dependency-free utilities for theme persistence and resolution.
 *
 * Responsibilities:
 * - Read/write appearance preference (cookie)
 * - Normalize legacy values
 * - Resolve "system" → concrete mode
 *
 * Non-responsibilities:
 * - React state
 * - Context
 * - Side effects on app state
 */

import { getCookie, storeCookie } from '@/utils/Helpers/Cookies';

export type Appearance = 'light' | 'dark' | 'system';
export type ResolvedAppearance = 'light' | 'dark';

/**
 * Storage key for theme mode
 */
export const THEME_KEY = '__kb_thm_md';

/**
 * Parse stored value:
 * - raw string: 'light' | 'dark' | 'system'
 * - legacy JSON: '{"appearance":"light"}'
 */
function parseStored(value: string | null): Appearance {
    if (!value) return 'system';

    // Legacy JSON support
    try {
        const parsed = JSON.parse(value);
        if (parsed?.appearance) {
            const a = String(parsed.appearance).toLowerCase();
            if (a === 'light' || a === 'dark' || a === 'system') return a;
        }
    } catch {
        // not JSON
    }

    const raw = value.trim().toLowerCase();
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;

    return 'system';
}

/**
 * Read stored theme preference
 */
export function getStoredTheme(): Appearance {
    try {
        return parseStored(getCookie(THEME_KEY));
    } catch {
        return 'system';
    }
}

/**
 * Persist theme as plain string
 */
export function storeTheme(appearance: Appearance): void {
    try {
        storeCookie(THEME_KEY, appearance);
    } catch {
        // ignore
    }
}

/**
 * Resolve appearance → concrete mode
 */
export function resolveAppearance(appearance: Appearance): ResolvedAppearance {
    if (appearance === 'light') return 'light';
    if (appearance === 'dark') return 'dark';

    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
        return 'light';
    }
}

/**
 * Apply resolved theme to DOM
 *
 * Effects:
 * - <html>.dark toggle (Tailwind)
 * - data-theme attribute
 * - <body>.dark (legacy)
 */
export function applyThemeToDocument(resolved: ResolvedAppearance): void {
    try {
        const doc = document.documentElement;

        requestAnimationFrame(() => {
            doc.classList.toggle('dark', resolved === 'dark');
            doc.dataset.theme = resolved;

            if (document.body) {
                document.body.classList.toggle('dark', resolved === 'dark');
            }
        });
    } catch {
        // noop
    }
}
