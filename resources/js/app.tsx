/**
 * @file app.tsx — Inertia/React entry point
 *
 * Import order is load-order. The very first import below runs before React
 * or any other module is evaluated. See SecurityInit.ts for details.
 */

// Security bootstrap — must be the absolute first import
import '@/utils/Helpers/SecurityInit';
import { scrubFingerprints } from '@utils/Helpers/SecurityInit';

// Styles
import kakbimaLogoLight from '@images/logos/kakbima_logo.png';
import kakbimaLogoDark from '@images/logos/kakbima_logo_dark.png';
import '../css/app.css';
import './lib/i18n';

// Core framework
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import React, { ComponentType, StrictMode, Suspense, useEffect, useMemo } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

// App internals
import { SharedData } from '@/types';
import { CustomToast } from '@components/CustomToast';
import { BrandProvider } from '@contexts/BrandContext';
import { LayoutProvider } from '@contexts/LayoutContext';
import { ModalStackProvider } from '@contexts/ModalStackContext';
import { SidebarProvider } from '@contexts/SidebarContext';
import { ThemeEffect } from '@contexts/ThemeEffect';
import { ThemeProvider } from '@contexts/ThemeProviderContext';
import { Page } from '@inertiajs/core';
import { rtlLanguages } from '@utils/Constants';
import { bootstrapKbSettings } from '@utils/GlobalSettings';
import { getCookie } from '@utils/Helpers/Cookies';
import { getEnvironmentVariable } from '@utils/Helpers/EnvironmentVariables';
import { suppressConsoleMethods } from '@utils/Helpers/Security';
import { initPerformanceMonitoring, lazyLoadImages } from '@utils/Performance';
import { initZiggyConfig } from '@utils/Routes';
import { applyThemeToDocument } from '@utils/Theme';
import i18n from 'i18next';
import { Config } from 'ziggy-js';

// Runtime security + perf (safe to run after React is imported)
if (getEnvironmentVariable.isProduction) {
    suppressConsoleMethods();
}

const perfMonitor = initPerformanceMonitoring();

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        () => {
            lazyLoadImages();
        },
        { once: true },
    );
} else {
    lazyLoadImages();
}

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        perfMonitor.disconnect();
    });
}

// Initial appearance (synchronous, before hydration)

/**
 * Resolves the initial appearance before React hydration to prevent
 * first-paint logo/theme flicker.
 *
 * Precedence:
 * 1. `__kb_thm_md` cookie.
 * 2. If set to `system`, resolves via `matchMedia`.
 * 3. OS preference via `prefers-color-scheme`.
 * 4. Final fallback: `light`.
 */
const initialAppearance: 'light' | 'dark' = (() => {
    const stored = getCookie('__kb_thm_md') || 'light';
    if (stored === 'light' || stored === 'dark') return stored;
    if (stored === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
})();

const currentLogo = initialAppearance === 'dark' ? kakbimaLogoDark : kakbimaLogoLight;

// Dev-only diagnostics

/**
 * Dev-only Inertia navigation diagnostics.
 *
 * Logs the target page component, prop keys, and `globalSettings` presence.
 * Also warns on consecutive renders of the same component, which typically
 * indicates a hydration mismatch or unintended reload.
 *
 * This hook must never contain behaviorally meaningful logic.
 */
function useInertiaDiagnostics(): void {
    useEffect(() => {
        if (!getEnvironmentVariable.isDevelopment) return;

        let lastPageName: string | null = null;

        const unsubscribe = router.on('navigate', (event: any) => {
            const newPage = event.detail?.page?.component || 'unknown';
            const props = event.detail?.page?.props || {};

            console.groupCollapsed(`Inertia Navigation to ${newPage}`);
            console.log('Props keys:', Object.keys(props));
            console.log('Global settings:', props.globalSettings || '(none)');
            console.groupEnd();

            if (lastPageName === newPage) {
                console.warn(`Inertia re-rendered the same page (${newPage}) — possible hydration issue.`);
            }

            lastPageName = newPage;
        });

        console.info('%c[Diagnostics] Inertia navigation monitoring active', 'color: #60a5fa');

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, []);
}

// Component tree

/**
 * Mirrors the current Inertia page object onto `window.page` after hydration.
 *
 * Required for legacy integrations and non-React scripts that depend on the
 * Inertia page payload. Must remain side-effect minimal and idempotent.
 */
const PageInitializer: React.FC<{ page: Page<SharedData> }> = ({ page }) => {
    useEffect(() => {
        if (page) (window as any).page = page;
    }, [page]);
    return null;
};

const Providers = React.memo(function Providers({ children, globalSettings, user }: { children: React.ReactNode; globalSettings: any; user: any }) {
    return (
        <ThemeProvider>
            <ThemeEffect />
            <ModalStackProvider>
                <LayoutProvider globalSettings={globalSettings}>
                    <SidebarProvider globalSettings={globalSettings}>
                        <BrandProvider globalSettings={globalSettings} user={user}>
                            {children}
                        </BrandProvider>
                    </SidebarProvider>
                </LayoutProvider>
            </ModalStackProvider>
        </ThemeProvider>
    );
});

/**
 * Root wrapper for the Inertia application tree.
 *
 * Stabilizes and distributes server-provided state (`globalSettings`,
 * `auth.user`) into context providers without causing unnecessary re-renders
 * during navigation.
 *
 * Key behaviours:
 * - Keeps `globalSettings` and `user` referentially stable.
 * - Subscribes to Inertia navigation events once for cross-cutting side
 *   effects: i18n language sync, `<html lang>` + `dir` (RTL), `window.page`.
 *
 * This is the only place where navigation-driven side effects may escape React.
 */
export const KakbimaRoot: React.FC<any> = ({ App, props }) => {
    const page = props.initialPage as Page<SharedData>;
    const globalSettings = page.props.globalSettings;
    const user = page.props.auth?.user;

    const stableGlobalSettings = useMemo(() => globalSettings || {}, [globalSettings]);
    const stableUser = useMemo(() => user || null, [user]);

    useEffect(() => {
        if (!page) return;

        (window as any).page = page;

        const unsubscribe = router.on('navigate', (event) => {
            const newPage = event.detail.page;
            if (!newPage) return;

            (window as any).page = newPage;

            const userLang = (newPage.props as unknown as SharedData).auth?.user?.lang || getCookie('__kb_lcl');

            if (i18n.language !== userLang) {
                i18n.changeLanguage(userLang);
            }

            if (typeof userLang === 'string') {
                document.documentElement.lang = userLang;
            }
            document.documentElement.dir = rtlLanguages.includes(userLang) ? 'rtl' : 'ltr';
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [page]);

    useInertiaDiagnostics();

    return (
        <Providers globalSettings={stableGlobalSettings} user={stableUser}>
            <PageInitializer page={page} />
            <StrictMode>
                <Suspense
                    fallback={
                        <div className="flex h-screen w-full items-center justify-center">
                            <img src={currentLogo} alt="Kakbima" className="h-12" />
                        </div>
                    }
                >
                    <App {...props} />
                </Suspense>
            </StrictMode>
            <CustomToast />
        </Providers>
    );
};

// App bootstrap

/**
 * Bootstraps the client-side Inertia application.
 *
 * Responsibilities:
 * - Binds the server-rendered DOM to React (hydrate vs createRoot).
 * - Resolves page components dynamically via Vite.
 * - Initialises the Ziggy route config closure before scrubbing the global.
 * - Runs post-hydration fingerprint scrubbing on first mount only.
 *
 * Constraints:
 * - Must remain idempotent across repeated calls (HMR, partial reloads).
 * - Hydration path must not diverge from SSR output.
 * - Provider composition is delegated to `KakbimaRoot`.
 */
function initializeKakbimaApp(): void {
    // Pre-hydration language & theme sync
    const el = document.getElementById('kakbima-saas');
    if (el) {
        const userLang = getCookie('__kb_lcl');
        i18n.changeLanguage(userLang);
        if (typeof userLang === 'string') {
            document.documentElement.lang = userLang;
        }
        document.documentElement.dir = rtlLanguages.includes(userLang) ? 'rtl' : 'ltr';

        const themeCookie = getCookie('__kb_thm_md') || 'light';
        const initialTheme = themeCookie === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : themeCookie;
        applyThemeToDocument(initialTheme);
    }

    void createInertiaApp({
        id: 'kakbima-saas',

        resolve: (name: string) => {
            const pages = import.meta.glob('./pages/**/*.tsx');
            return resolvePageComponent(`./pages/${name}.tsx`, pages) as Promise<ComponentType<any>>;
        },

        title: (title) => (title ? `${title} \u2014 Kakbima` : 'Kakbima'),

        setup({ el, App, props }) {
            // Ziggy
            //
            // 1. Cache the config into the Routes module closure FIRST.
            //    After this call, `route()` never reads `window.Ziggy` again.
            //
            // 2. Still assign to `window.Ziggy` so that any non-module legacy
            //    scripts that reference it directly continue to work
            //    until scrubFingerprints() removes it below.
            const ziggyConfig = props.initialPage.props.namedRoutes as Config;
            initZiggyConfig(ziggyConfig);
            (window as any).Ziggy = ziggyConfig;

            // Global settings
            try {
                const globalSettings = props.initialPage.props.globalSettings || {};
                if (Object.keys(globalSettings).length > 0) {
                    bootstrapKbSettings(globalSettings);
                }
            } catch (err) {
                console.warn('Global settings init failed:', err);
            }

            // Mount
            const element = el as HTMLElement & {
                _reactRoot?: ReturnType<typeof createRoot>;
                _hydrated?: boolean;
            };

            if (!element._reactRoot) {
                if (element.hasChildNodes() && !element._hydrated) {
                    hydrateRoot(element, <KakbimaRoot App={App} props={props} />);
                    element._hydrated = true;
                } else {
                    element._reactRoot = createRoot(element);
                    element._reactRoot.render(<KakbimaRoot App={App} props={props} />);
                }

                // Fingerprint scrub (first mount only)
                //
                // Runs after React has mounted so:
                //  - `data-page` has already been read by Inertia's hydration.
                //  - `window.Ziggy` has been captured into the Routes closure.
                //
                // NOT called on subsequent renders (element._reactRoot exists)
                // because the properties are already gone — deleting them again
                // is a safe no-op, but the branch is skipped for clarity.
                if (getEnvironmentVariable.isProduction) {
                    scrubFingerprints({ inertiaRootEl: element });
                }
            } else {
                // Re-render path: HMR or programmatic re-mount.
                // Scrubbing already happened on first mount.
                element._reactRoot.render(<KakbimaRoot App={App} props={props} />);
            }
        },

        progress: { color: '#008037' },
    });
}

initializeKakbimaApp();

if (getEnvironmentVariable.isDevelopment) {
    console.info('%cKakbima React app initialized successfully', 'color: #4ade80');
}
