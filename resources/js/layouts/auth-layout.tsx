import CookieConsentBanner from '@/components/CookieConsentBanner';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useBrand } from '@/contexts/BrandContext';
import { useLayout } from '@/contexts/LayoutContext';
import { THEME_COLORS, useAppearance } from '@/hooks/use-appearance';
import { useFavicon } from '@/hooks/use-favicon';
import i18n from '@/i18n';
import { getCookie } from '@/utils/Helpers/Cookies';
import { Head, usePage } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import React, { ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    icon?: ReactNode;
    status?: string;
    statusType?: 'success' | 'error';
}

function hexToAdjustedRgba(hex, opacity = 1, adjust = 0) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    const getF = (ch) => (typeof adjust === 'number' ? clamp(adjust) : clamp(adjust[ch] ?? 0));
    const adj = (c, f) => (f < 0 ? Math.floor(c * (1 + f)) : Math.floor(c + (255 - c) * f));
    const rr = adj(r, getF('r'));
    const gg = adj(g, getF('g'));
    const bb = adj(b, getF('b'));
    return opacity === 1
        ? `#${rr.toString(16).padStart(2, '0')}${gg.toString(16).padStart(2, '0')}${bb.toString(16).padStart(2, '0')}`.toUpperCase()
        : `rgba(${rr}, ${gg}, ${bb}, ${opacity})`;
}

export default function AuthLayout({ children, title, description, icon, status, statusType = 'success' }: AuthLayoutProps) {
    useFavicon();
    const { t: translate } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const { logoLight, logoDark, themeColor, customColor } = useBrand();
    const { appearance } = useAppearance();
    const globalSettings = (usePage().props as any).globalSettings;
    const userLanguage = (usePage().props as any).userLanguage;
    const { position } = useLayout();

    const currentLogo = appearance === 'dark' ? logoLight : logoDark;
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];

    useEffect(() => {
        setMounted(true);
        let dir = 'ltr';
        let data = getCookie('layoutDirection');
        const isDemo = globalSettings?.is_demo || false;
        // Check RTL setting from cookies/globalSettings
        const layoutDirection = isDemo ? data : globalSettings?.layoutDirection;
        const isRTLSetting = layoutDirection === 'right';
        const currentLang = i18n.language || globalSettings?.defaultLanguage || 'en';
        const isRTLLanguage = ['ar', 'he'].includes(currentLang);

        // Apply RTL if: 1) Language is ar/he OR 2) RTL setting is enabled
        if (isRTLLanguage || isRTLSetting) {
            dir = 'rtl';
        }

        // Apply direction immediately
        document.documentElement.dir = dir;
        document.documentElement.setAttribute('dir', dir);
        document.body.dir = dir;
    }, []);

    // RTL Support for auth pages - Apply immediately and persist
    const applyRTLDirection = React.useCallback(() => {
        const currentLang = i18n.language || globalSettings?.defaultLanguage || 'en';
        const isRTLLanguage = ['ar', 'he'].includes(currentLang);
        let dir = 'ltr';

        // Apply RTL if: 1) Language is ar/he OR 2) RTL setting is enabled
        if (isRTLLanguage) {
            dir = 'rtl';
        }

        // Apply direction immediately
        document.documentElement.dir = dir;
        document.documentElement.setAttribute('dir', dir);
        document.body.dir = dir;

        return dir;
    }, [i18n.language, globalSettings?.defaultLanguage, globalSettings?.is_demo, globalSettings?.layoutDirection]);

    // Apply RTL on mount and when dependencies change
    React.useLayoutEffect(() => {
        const direction = applyRTLDirection();

        // Ensure direction persists after any DOM changes
        const observer = new MutationObserver(() => {
            if (document.documentElement.dir !== direction) {
                document.documentElement.dir = direction;
                document.documentElement.setAttribute('dir', direction);
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir'],
        });

        return () => {
            observer.disconnect();
            // Reset to LTR when leaving auth layout
            document.documentElement.dir = 'ltr';
            document.documentElement.setAttribute('dir', 'ltr');
            document.body.dir = 'ltr';
        };
    }, [applyRTLDirection]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gray-50">
            <Head title={title} />

            {/* Enhanced Background Design */}
            <div className="absolute inset-0">
                {/* Elegant Pattern Overlay */}
                <div
                    className="absolute inset-0 opacity-70"
                    style={{
                        backgroundImage: `radial-gradient(circle at 30% 70%, ${primaryColor} 1px, transparent 1px)`,
                        backgroundSize: '80px 80px',
                    }}
                ></div>
            </div>

            {/* Language Dropdown - Top Right */}
            <div className="absolute top-6 right-6 z-10 hidden md:block">
                <LanguageSwitcher />
            </div>

            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="mb-8 text-center">
                        <div className="relative pb-2 lg:inline-block lg:px-6">
                            {currentLogo ? (
                                <img src={currentLogo} alt="Logo" className="mx-auto w-auto" />
                            ) : (
                                <CreditCard className="mx-auto h-8 w-8" style={{ color: primaryColor }} />
                            )}
                        </div>
                    </div>

                    {/* Main Card */}
                    <div className="relative">
                        {/* Corner accents */}
                        <div
                            className="absolute -top-3 -left-3 h-6 w-6 rounded-tl-md border-t-2 border-l-2"
                            style={{ borderColor: primaryColor }}
                        ></div>
                        <div
                            className="absolute -right-3 -bottom-3 h-6 w-6 rounded-br-md border-r-2 border-b-2"
                            style={{ borderColor: primaryColor }}
                        ></div>

                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:p-8 lg:pt-5">
                            {/* Header */}
                            <div className="mb-4 text-center">
                                {icon && (
                                    <div
                                        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                                        style={{ backgroundColor: `${primaryColor}20` }}
                                    >
                                        {icon}
                                    </div>
                                )}
                                <h1 className="mb-1.5 text-xl font-semibold tracking-wide text-gray-900 sm:text-2xl">{title}</h1>
                                <div className="mx-auto mb-2.5 h-px w-12" style={{ backgroundColor: primaryColor }}></div>
                                {description && <p className="text-sm text-gray-700">{description}</p>}
                            </div>

                            {status && (
                                <div
                                    className={`mb-6 text-center text-sm font-medium ${
                                        statusType === 'success'
                                            ? 'border-green-200 bg-green-50 text-green-700'
                                            : 'border-red-200 bg-red-50 text-red-700'
                                    } rounded-lg border p-3`}
                                >
                                    {status}
                                </div>
                            )}

                            {children}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <div className="lg:relative lg:inline-flex lg:px-9">
                            <div className="inline-flex items-center space-x-2 rounded-md border border-gray-200 bg-white px-4 py-2 backdrop-blur-sm">
                                {/* <div className="w-1 h-1 rounded-full" style={{ backgroundColor: primaryColor }}></div> */}
                                <p className="text-sm text-gray-500">
                                    {globalSettings?.footerText || `© ${new Date().getFullYear()} ${globalSettings?.organization_name || 'Kakbima'}`}
                                </p>
                                {/* <div className="w-1 h-1 rounded-full" style={{ backgroundColor: primaryColor }}></div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <CookieConsentBanner />
        </div>
    );
}
