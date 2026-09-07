/**
 * @file ssr.tsx
 * @description
 * Server entry for Inertia SSR rendering with preloaded and cached translations.
 * Uses Laravel endpoint caching for instant SSR localization.
 */

import { createInertiaApp } from '@inertiajs/react';
import createServer from '@inertiajs/react/server';

import { initI18nForSSR } from '@lib/i18n';

import { getEnvironmentVariable } from '@/utils/Helpers/EnvironmentVariables';
import { renderToString } from 'react-dom/server';
import { KakbimaRoot } from './app';

/**
 * Fetch translations from Laravel backend (cached server-side).
 *
 */
async function fetchServerTranslations(locale: string) {
    const base_url = getEnvironmentVariable.appUrl || 'http://localhost';
    const url = `${base_url}/translations/${locale}`;

    const res = await fetch(url, { headers: { Accept: 'application/json' } });

    // Handle failed responses directly
    if (!res.ok) {
        console.warn(`[SSR] Failed to preload translations for ${locale}: ${res.status} ${res.statusText}`);
        return {};
    }

    const data = await res.json();
    return {
        [locale]: { translation: data.translations ?? {} },
    };
}

/**
 * Inertia SSR entry point with preloaded i18n.
 */
createServer(async (page) => {
    const locale = (page.props.locale as string) ?? getEnvironmentVariable.viteDefaultLocale ?? 'en';

    const resources = await fetchServerTranslations(locale);

    await initI18nForSSR({ lng: locale, resources });

    return createInertiaApp({
        page,
        render: renderToString,
        resolve: ((name: string) => {
            const pages = import.meta.glob('./pages/**/*.tsx');

            return pages[`./pages/${name}.tsx`];
        }) as any,
        setup({ App, props }) {
            return <KakbimaRoot App={App} props={props} />;
        },
    });
});
