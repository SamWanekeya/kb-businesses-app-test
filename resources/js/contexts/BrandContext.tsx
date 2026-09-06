import { LayoutPosition } from '@/contexts/LayoutContext';
import { Appearance, ThemeColor } from '@/hooks/use-appearance';
import { resolveImageUrl } from '@/utils/Helpers/Url';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
// Default brand settings
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
    logoDark: 'logo/logo-dark.png',
    logoLight: 'logo/logo-light.png',
    favicon: 'logo/favicon.png',
    titleText: 'Kakbima',
    footerText: '© 2024 Kakbima. All rights reserved.',
    organizationMobile: '',
    themeColor: 'green',
    customColor: '#A12582',
    sidebarVariant: 'inset',
    sidebarStyle: 'plain',
    layoutDirection: 'left',
    themeMode: 'light',
};

// Define the brand settings interface
export interface BrandSettings {
    logoDark: string;
    logoLight: string;
    favicon: string;
    titleText: string;
    footerText: string;
    organizationMobile?: string;
    themeColor: ThemeColor;
    customColor: string;
    sidebarVariant: string;
    sidebarStyle: string;
    layoutDirection: LayoutPosition;
    themeMode: Appearance;
}

// Get brand settings from props or cookies/localStorage as fallback
export const getBrandSettings = (userSettings?: Record<string, string>): BrandSettings => {
    // If we have settings from the backend, use those (non-demo mode)
    if (userSettings) {
        return {
            logoDark: userSettings.logoDark || DEFAULT_BRAND_SETTINGS.logoDark,
            logoLight: userSettings.logoLight || DEFAULT_BRAND_SETTINGS.logoLight,
            favicon: userSettings.favicon || DEFAULT_BRAND_SETTINGS.favicon,
            titleText: userSettings.titleText || DEFAULT_BRAND_SETTINGS.titleText,
            footerText: userSettings.footerText || DEFAULT_BRAND_SETTINGS.footerText,
            themeColor: (userSettings.themeColor as ThemeColor) || DEFAULT_BRAND_SETTINGS.themeColor,
            customColor: userSettings.customColor || DEFAULT_BRAND_SETTINGS.customColor,
            sidebarVariant: userSettings.sidebarVariant || DEFAULT_BRAND_SETTINGS.sidebarVariant,
            sidebarStyle: userSettings.sidebarStyle || DEFAULT_BRAND_SETTINGS.sidebarStyle,
            layoutDirection: (userSettings.layoutDirection as LayoutPosition) || DEFAULT_BRAND_SETTINGS.layoutDirection,
            themeMode: (userSettings.themeMode as Appearance) || DEFAULT_BRAND_SETTINGS.themeMode,
        };
    }

    // Fallback to defaults
    return DEFAULT_BRAND_SETTINGS;
};

interface BrandContextType extends BrandSettings {
    updateBrandSettings: (settings: Partial<BrandSettings>) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children, globalSettings, user }: { children: ReactNode; globalSettings?: any; user?: any }) {
    // Determine which settings to use based on user role and route
    const getEffectiveSettings = () => {
        const isDemo = globalSettings?.is_demo || false;
        if (isDemo) {
            return null; // This will force getBrandSettings to use cookies
        }
        const isPublicRoute =
            window.location.pathname.includes('/public/') || window.location.pathname === '/' || window.location.pathname.includes('/auth/');

        // For public routes (auth pages), always use super_admin settings
        if (isPublicRoute) {
            return {
                ...globalSettings,
                favicon: resolveImageUrl(globalSettings.favicon),
                logoDark: resolveImageUrl(globalSettings.logoDark),
                logoLight: resolveImageUrl(globalSettings.logoLight),
            };
        }

        // For authenticated routes, use user's own settings if organization role
        if (user?.role === 'organization' && user?.globalSettings) {
            return {
                ...user.globalSettings,
                favicon: resolveImageUrl(user.globalSettings?.favicon),
                logoDark: resolveImageUrl(user.globalSettings?.logoDark),
                logoLight: resolveImageUrl(user.globalSettings?.logoLight),
            };
        }

        // Default to global settings (super_admin)
        return {
            ...globalSettings,
            favicon: resolveImageUrl(globalSettings.favicon),
            logoDark: resolveImageUrl(globalSettings.logoDark),
            logoLight: resolveImageUrl(globalSettings.logoLight),
        };
    };

    const [brandSettings, setBrandSettings] = useState<BrandSettings>(() => getBrandSettings(getEffectiveSettings()));

    // Listen for changes in settings
    useEffect(() => {
        let effectiveSettings = getEffectiveSettings();

        const updatedSettings = getBrandSettings(effectiveSettings);
        setBrandSettings(updatedSettings);

        // Apply layout direction (RTL/LTR) to DOM
        // if (updatedSettings?.layoutDirection) {
        //   const dir = updatedSettings.layoutDirection === 'right' ? 'ltr' : 'rtl';
        //   document.documentElement.dir = dir;
        //   document.documentElement.setAttribute('dir', dir);
        // }
        // Apply theme settings immediately for home page (both demo and non-demo modes)
        if (updatedSettings) {
            // Apply theme color globally
            const color =
                updatedSettings.themeColor === 'custom'
                    ? updatedSettings.customColor
                    : {
                          blue: '#A12582',
                          green: '#10b77f',
                          purple: '#8b5cf6',
                          orange: '#f97316',
                          red: '#ef4444',
                      }[updatedSettings.themeColor] || '#A12582';

            document.documentElement.style.setProperty('--theme-color', color);
            document.documentElement.style.setProperty('--primary', color);

            // Apply theme mode
            const isDark =
                updatedSettings.themeMode === 'dark' ||
                (updatedSettings.themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', isDark);
            document.body.classList.toggle('dark', isDark);

            // Apply layout direction (RTL/LTR)
            const dir = updatedSettings.layoutDirection === 'right' ? 'rtl' : 'ltr';
            document.documentElement.dir = dir;
            document.documentElement.setAttribute('dir', dir);
        }
    }, [globalSettings, user]);

    const updateBrandSettings = (newSettings: Partial<BrandSettings>) => {
        setBrandSettings((prev) => ({ ...prev, ...newSettings }));
    };

    return <BrandContext.Provider value={{ ...brandSettings, updateBrandSettings }}>{children}</BrandContext.Provider>;
}

export function useBrand() {
    const context = useContext(BrandContext);
    if (context === undefined) {
        throw new Error('useBrand must be used within a BrandProvider');
    }
    return context;
}
