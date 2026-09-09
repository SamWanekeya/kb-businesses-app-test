/**
 * @file i18n.ts
 * @description
 * Shared i18next configuration for both client and server environments.
 * Optimized for Laravel + Inertia + React applications with SSR support.
 */

import { supportedLanguages } from '@utils/Constants';
import { getEnvironmentVariable } from '@utils/Helpers/EnvironmentVariables';
import i18n, { Resource } from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const isBrowser = typeof window !== 'undefined';

/**
 * Custom backend for fetching translations from Laravel endpoints.
 * Falls back gracefully in SSR context (returns empty data).
 */
const customBackend = {
    type: 'backend' as const,
    read(language: string, namespace: string, callback: (err: unknown, data: object | false) => void) {
        if (!isBrowser) {
            callback(null, {}); // SSR: no fetch, handled separately
            return;
        }
        const base_url = getEnvironmentVariable.appUrl || 'http://localhost';
        const loadPath = `${base_url}/translations/${language}`;

        fetch(loadPath, {
            headers: { Accept: 'application/json' },
            credentials: 'include',
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load ${language}`);
                return res.json();
            })
            .then((data) => {
                const translations = data?.translations || {};

                callback(null, translations);
            })
            .catch((err) => {
                console.warn('Translation fetch failed:', err);
                callback(err, null);
            });
    },
};

/**
 * Initializes the i18n instance for both client and server contexts.
 * Ensures initialization happens only once.
 *
 * @param {object} [options]
 * @param {string} [options.lng] - Language to initialize with (used for SSR).
 * @param {Resource} [options.resources] - Preloaded translation resources (used for SSR).
 * @returns {Promise<typeof i18n>} The initialized i18n instance.
 */
export async function initI18nForSSR(options?: { lng?: string; resources?: Resource }) {
    if (i18n.isInitialized) return i18n;

    await i18n.use(initReactI18next).init({
        fallbackLng: false,
        lowerCaseLng: true,
        supportedLngs: supportedLanguages,
        debug: getEnvironmentVariable.isDevelopment,
        interpolation: { escapeValue: false },
        resources: options?.resources,
        lng: options?.lng,
        ns: ['translation'],
        defaultNS: 'translation',
    });

    return i18n;
}

/**
 * Standard i18n initialization for the browser.
 * Uses backend + language detector plugins.
 */
if (isBrowser && !i18n.isInitialized) {
    i18n.use(LanguageDetector)
        .use(initReactI18next)
        .use(customBackend)
        .init({
            fallbackLng: false,
            lowerCaseLng: true,
            supportedLngs: supportedLanguages,
            load: 'currentOnly',
            debug: getEnvironmentVariable.isDevelopment,
            interpolation: { escapeValue: false },
            detection: {
                order: ['cookie', 'navigator'],
                caches: ['cookie'],
                lookupCookie: '__kb_lcl',
                cookieMinutes: 400 * 24 * 60, // Set the expiration time of the cookie to 400 days
                cookieDomain: getEnvironmentVariable.sessionDomain,
            },
            ns: ['translation'],
            defaultNS: 'translation',
        });

    // @ts-expect-error: Expose for debugging
    window.i18next = i18n;
}

export default i18n;
