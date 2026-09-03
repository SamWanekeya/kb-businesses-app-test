import { Button } from '@/components/ui/button';
import { SidebarMenuSkeleton } from '@/components/ui/sidebar';
import { useLayout } from '@/contexts/LayoutContext';
import { Check, Sidebar as SidebarIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
        const savedSettings = localStorage.getItem('sidebarSettings');
        return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SIDEBAR_SETTINGS;
    } catch (error) {
        return DEFAULT_SIDEBAR_SETTINGS;
    }
};

export function SidebarStyleSettings() {
    const { t } = useTranslation();
    const { position } = useLayout();
    const [settings, setSettings] = useState<SidebarSettings>(DEFAULT_SIDEBAR_SETTINGS);

    // Load settings on component mount
    useEffect(() => {
        setSettings(getSidebarSettings());
    }, []);

    // Update variant
    const updateVariant = useCallback((variant: SidebarVariant) => {
        setSettings((prev) => {
            const newSettings = { ...prev, variant };
            localStorage.setItem('sidebarSettings', JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);

    // Update collapsible
    const updateCollapsible = useCallback((collapsible: SidebarCollapsible) => {
        setSettings((prev) => {
            const newSettings = { ...prev, collapsible };
            localStorage.setItem('sidebarSettings', JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);

    return (
        <div className="space-y-6 rounded-lg border p-6">
            <div>
                <h3 className="text-lg font-medium">{t('Sidebar Style')}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('Choose how your sidebar looks and behaves')}</p>

                {/* Variant Selection */}
                <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium">{t('Sidebar Variant')}</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <VariantButton variant="sidebar" isActive={settings.variant === 'sidebar'} onClick={() => updateVariant('sidebar')} />
                        <VariantButton variant="floating" isActive={settings.variant === 'floating'} onClick={() => updateVariant('floating')} />
                        <VariantButton variant="inset" isActive={settings.variant === 'inset'} onClick={() => updateVariant('inset')} />
                    </div>
                </div>

                {/* Collapsible Selection */}
                <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium">{t('Sidebar Collapse Mode')}</h4>
                    <div className="grid grid-cols-3 gap-2">
                        <CollapsibleButton
                            mode="offcanvas"
                            isActive={settings.collapsible === 'offcanvas'}
                            onClick={() => updateCollapsible('offcanvas')}
                        />
                        <CollapsibleButton mode="icon" isActive={settings.collapsible === 'icon'} onClick={() => updateCollapsible('icon')} />
                        <CollapsibleButton mode="none" isActive={settings.collapsible === 'none'} onClick={() => updateCollapsible('none')} />
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-6">
                    <h4 className="mb-2 text-sm font-medium">{t('Preview')}</h4>
                    <div className="bg-sidebar text-sidebar-foreground rounded-md border p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <SidebarIcon className="h-4 w-4" />
                            <span className="font-medium">{t('Sidebar Preview')}</span>
                        </div>
                        <div className="space-y-1">
                            <SidebarMenuSkeleton showIcon={true} />
                            <SidebarMenuSkeleton showIcon={true} />
                            <SidebarMenuSkeleton showIcon={true} />
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">{t('Changes will take effect after page reload')}</p>
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
