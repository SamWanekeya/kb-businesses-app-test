import { useCallback, useEffect, useState } from 'react';

import { Button } from '@components/UserInterface/Button';
import { SidebarMenuSkeleton } from '@components/UserInterface/Sidebar';
import { getFromLocalStorage, storeToLocalStorage } from '@utils/Helpers/Storage';
import { Check, Sidebar as SidebarIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Sidebar style types
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';
export type SidebarCollapsible = 'offcanvas' | 'icon' | 'none';

// Sidebar settings interface
export interface SidebarSettings {
    variant: SidebarVariant;
    collapsible: SidebarCollapsible;
}

// Default sidebar settings
const DEFAULT_SIDEBAR_SETTINGS: SidebarSettings = {
    variant: 'inset',
    collapsible: 'icon',
};

// Get sidebar settings from localStorage
export const getSidebarSettings = (): SidebarSettings => {
    if (typeof localStorage === 'undefined') {
        return DEFAULT_SIDEBAR_SETTINGS;
    }

    try {
        const savedSettings = getFromLocalStorage('__kb_sidebar_stns');
        return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SIDEBAR_SETTINGS;
    } catch (_error) {
        return DEFAULT_SIDEBAR_SETTINGS;
    }
};

export default function SidebarStyleSettings() {
    const { t: translate } = useTranslation();
    const [settings, setSettings] = useState(DEFAULT_SIDEBAR_SETTINGS);

    // Load settings on component mount
    useEffect(() => {
        setSettings(getSidebarSettings());
    }, []);

    // Update variant
    const updateVariant = useCallback((variant: SidebarVariant) => {
        setSettings((prev) => {
            const newSettings = { ...prev, variant };
            storeToLocalStorage('__kb_sidebar_stns', newSettings);
            return newSettings;
        });
    }, []);

    // Update collapsible
    const updateCollapsible = useCallback((collapsible: SidebarCollapsible) => {
        setSettings((prev) => {
            const newSettings = { ...prev, collapsible };
            storeToLocalStorage('__kb_sidebar_stns', newSettings);
            return newSettings;
        });
    }, []);

    return (
        <div className="space-y-6 rounded-lg border p-6">
            <div>
                <h3 className="text-lg font-medium">{translate('Sidebar style')}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{translate('Choose how your sidebar looks and behaves')}</p>

                {/* Variant Selection */}
                <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium">{translate('Sidebar variant')}</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <VariantButton
                            variant="sidebar"
                            isActive={settings.variant === 'sidebar'}
                            onClick={() => {
                                updateVariant('Sidebar');
                            }}
                        />
                        <VariantButton
                            variant="floating"
                            isActive={settings.variant === 'floating'}
                            onClick={() => {
                                updateVariant('Floating');
                            }}
                        />
                        <VariantButton
                            variant="inset"
                            isActive={settings.variant === 'inset'}
                            onClick={() => {
                                updateVariant('Inset');
                            }}
                        />
                    </div>
                </div>

                {/* Collapsible Selection */}
                <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium">{translate('Sidebar collapse mode')}</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <CollapsibleButton
                            mode="offcanvas"
                            isActive={settings.collapsible === 'offcanvas'}
                            onClick={() => {
                                updateCollapsible('offcanvas');
                            }}
                        />
                        <CollapsibleButton
                            mode="icon"
                            isActive={settings.collapsible === 'icon'}
                            onClick={() => {
                                updateCollapsible('icon');
                            }}
                        />
                        <CollapsibleButton
                            mode="none"
                            isActive={settings.collapsible === 'none'}
                            onClick={() => {
                                updateCollapsible('none');
                            }}
                        />
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-6">
                    <h4 className="mb-2 text-sm font-medium">{translate('Preview')}</h4>
                    <div className="bg-sidebar text-sidebar-foreground rounded-md border p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <SidebarIcon className="h-4 w-4" />
                            <span className="font-medium">{translate('Sidebar preview')}</span>
                        </div>
                        <div className="space-y-1">
                            <SidebarMenuSkeleton showIcon={true} />
                            <SidebarMenuSkeleton showIcon={true} />
                            <SidebarMenuSkeleton showIcon={true} />
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">{translate('Changes will take effect after page reload')}</p>
                </div>
            </div>
        </div>
    );
}

// Variant button component
function VariantButton({ variant, isActive, onClick }: { variant: SidebarVariant; isActive: boolean; onClick: () => void }) {
    return (
        <Button
            type="button"
            variant={isActive ? 'default' : 'outline'}
            className="relative flex h-20 w-full flex-col items-center justify-center gap-1"
            onClick={onClick}
        >
            {isActive && (
                <span className="absolute top-1 right-1">
                    <Check className="h-3 w-3" />
                </span>
            )}
            <SidebarIcon className="h-4 w-4" />
            <span className="text-xs capitalize">{variant}</span>
        </Button>
    );
}

// Collapsible button component
function CollapsibleButton({ mode, isActive, onClick }: { mode: SidebarCollapsible; isActive: boolean; onClick: () => void }) {
    return (
        <Button
            type="button"
            variant={isActive ? 'default' : 'outline'}
            className="relative flex h-20 w-full flex-col items-center justify-center gap-1"
            onClick={onClick}
        >
            {isActive && (
                <span className="absolute top-1 right-1">
                    <Check className="h-3 w-3" />
                </span>
            )}
            <SidebarIcon className={`h-4 w-4 ${mode === 'icon' ? 'scale-75' : ''}`} />
            <span className="text-xs capitalize">{mode}</span>
        </Button>
    );
}
