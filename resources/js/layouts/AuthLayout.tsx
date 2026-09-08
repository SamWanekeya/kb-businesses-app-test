/**
 * @file AuthLayout.tsx
 * @description
 * Authentication layout wrapper for all auth-related pages.
 *
 * Responsibilities:
 * - Provides a split-screen authentication layout
 * - Handles theme-based assets (logo & background)
 * - Displays flash messages and validation errors as toast notifications
 * - Manages entry animations and global UI elements
 * - Wraps auth pages with consistent structure and branding
 */

import { Head, usePage } from '@inertiajs/react';
import { JSX, ReactNode, useCallback, useEffect, useState } from 'react';

import CookieConsentBanner from '@/components/CookieConsentBanner';
import { toast } from '@/components/CustomToast';
import { LanguageSelector } from '@/components/LanguageSelector';
import useTheme from '@/hooks/useTheme';
import { getCookie } from '@/utils/Helpers/Cookies';
import { createKakbimaExternalUrl } from '@/utils/Helpers/Url';
import backgroundImageLight from '@images/background_image.jpg';
import backgroundImageDark from '@images/background_image_dark.jpg';
import kakbimaLogoLight from '@images/logos/kakbima_logo.png';
import kakbimaLogoDark from '@images/logos/kakbima_logo_dark.png';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

/**
 * Props accepted by {@link AuthLayout}.
 */
interface AuthLayoutProps {
    /**
     * Rendered inside the form container on the right panel.
     */
    children?: ReactNode;

    /**
     * Used for both the document title and the visible heading.
     * Keep this aligned with the page-level intent (not marketing copy).
     */
    title: string;

    /**
     * Secondary text under the title.
     * Optional, but expected for most flows where additional guidance reduces friction.
     */
    description?: string;

    /**
     * Reserved. Do not rely on this until usage is defined.
     */
    icon?: ReactNode;
}

/**
 * Shape of flash messages shared via Inertia.
 *
 * This mirrors the backend contract. Any change here must stay in sync
 * with Laravel's flash message structure.
 */
interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

/**
 * Layout wrapper for all authentication routes.
 *
 * Centralizes:
 * - Theme-dependent branding (logo, background)
 * - Global UI elements required during auth (language switcher, cookie consent)
 * - Flash + validation error surfacing via toasts
 *
 * Notes:
 * - Flash and validation errors are intentionally handled here to avoid
 *   duplicating notification logic across individual auth pages.
 * - Toasts are triggered on every Inertia page change. Backend responses
 *   should avoid re-sending the same flash messages unless intentional.
 * - External website URL includes locale from cookie, not i18n state.
 *   This is deliberate to match server-side expectations.
 */
export default function AuthLayout({ children, title, description }: AuthLayoutProps): JSX.Element {
    const { t: translate } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const languageFromCookie = getCookie('__kb_lcl');
    const { resolved } = useTheme();
    const currentLogo = resolved === 'dark' ? kakbimaLogoDark : kakbimaLogoLight;
    const leftSideBackgroundImage = resolved === 'dark' ? backgroundImageDark : backgroundImageLight;

    /**
     * Emits toast notifications based on backend flash messages and validation errors.
     *
     * - Maps flash message types (`success`, `error`, `warning`, `info`)
     *   to their corresponding toast notification variants
     * - Ignores empty or falsy flash messages
     * - Always displays validation errors as error toasts
     * - Translates all messages before displaying them
     *
     * The effect runs whenever flash messages, validation errors,
     * or the translation function change.
     *
     * @effect
     */

    const page = usePage();

    useEffect(() => {
        const { flash, errors } = page.props as {
            flash?: FlashMessages;
            errors?: Record<string, string>;
        };

        if (!flash && !errors) return;

        // Flash messages
        if (flash) {
            for (const [type, message] of Object.entries(flash)) {
                if (!message) continue;

                switch (type) {
                    case 'success':
                        toast.success(translate(message));
                        break;
                    case 'error':
                        toast.error(translate(message));
                        break;
                    case 'warning':
                        toast.warning(translate(message));
                        break;
                    case 'info':
                        toast.info(translate(message));
                        break;
                }
            }
        }

        // Validation errors
        if (errors && Object.keys(errors).length > 0) {
            Object.values(errors).forEach((message) => {
                if (!message) return;
                toast.error(translate(message));
            });
        }
    }, [page, translate]);

    /**
     * Triggers mount animation after first render.
     */
    useEffect(() => {
        setMounted(true);
    }, []);

    /**
     * Builds a localized external website URL with tracking parameters.
     *
     * Memoized to avoid unnecessary recalculations.
     *
     * @returns {string} External Kakbima website URL
     */
    const externalWebsiteUrl = useCallback(() => {
        return `${createKakbimaExternalUrl('www')}${languageFromCookie}/?utm_source=accounts.kakbima.com`;
    }, [languageFromCookie]);

    return (
        <div className="flex h-screen w-full">
            <Head title={title} />

            {/* Left side: branding & marketing */}
            <div className="relative hidden p-6 lg:block lg:w-1/2">
                <div className="relative h-full w-full overflow-hidden rounded-xl">
                    <img src={leftSideBackgroundImage} alt="Kakbima" className="h-full w-full rounded-xl object-cover" />

                    <div className="absolute inset-0 flex flex-col justify-between rounded-xl bg-black/40 p-6">
                        <div className="text-sm font-semibold text-white">
                            <a
                                href={externalWebsiteUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md bg-white/20 px-3 py-1 backdrop-blur"
                            >
                                {translate('Back to website')}
                            </a>
                        </div>

                        <div>
                            <h2 className="text-xl font-medium text-white">
                                {translate('Welcome to the world of HR')}
                                <br />
                                {translate('and recruitment')}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side: auth content */}
            <div className="relative flex w-full items-center justify-center p-6 md:p-12 lg:w-1/2">
                <div className="absolute top-4 right-4">
                    <LanguageSelector />
                </div>

                <div className={`w-full max-w-md transition-all duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="bg-card text-card-foreground rounded-xl border p-8 shadow-sm shadow-xl">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-4 flex h-10 w-50 items-center justify-center">
                                <img src={currentLogo} alt="Kakbima" />
                            </div>

                            <h1 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-400">{title}</h1>

                            {description && <p className="text-neutral-600 dark:text-neutral-400">{description}</p>}
                        </div>

                        {children}
                    </div>
                </div>
            </div>

            {/* Global cookie consent */}
            <CookieConsentBanner />
        </div>
    );
}
