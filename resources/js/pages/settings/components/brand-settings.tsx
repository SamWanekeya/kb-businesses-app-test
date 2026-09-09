import MediaPicker from '@components/MediaPicker';
import { SettingsSection } from '@components/settings-section';
import { ThemePreview } from '@components/theme-preview';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Separator } from '@components/UserInterface/Separator';
import { getBrandSettings, useBrand } from '@contexts/BrandContext';
import { LayoutPosition, useLayout } from '@contexts/LayoutContext';
import { useSidebarSettings } from '@contexts/SidebarContext';
import { Appearance, ThemeColor, useAppearance } from '@hooks/use-appearance';
import { router, usePage } from '@inertiajs/react';
import { resolveImageUrl } from '@utils/Helpers/Url';
import { route } from '@utils/Routes';
import { Check, FileText, Layout, Moon, Palette, Save, Sidebar as SidebarIcon, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

// Define the brand settings interface
export interface BrandSettings {
    logoDark: string;
    logoLight: string;
    favicon: string;
    titleText: string;
    footerText: string;
    themeColor: ThemeColor;
    customColor: string;
    sidebarVariant: string;
    sidebarStyle: string;
    layoutDirection: LayoutPosition;
    themeMode: Appearance;
}

// Default brand settings
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
    logoDark: 'logo/logo-dark.png',
    logoLight: 'logo/logo-light.png',
    favicon: 'logo/favicon.png',
    titleText: 'Kakbima',
    footerText: '© 2026 Kakbima. All rights reserved.',
    themeColor: 'green',
    customColor: '#A12582',
    sidebarVariant: 'inset',
    sidebarStyle: 'plain',
    layoutDirection: 'left',
    themeMode: 'light',
};

interface BrandSettingsProps {
    userSettings?: Record<string, string>;
}

export default function BrandSettings({ userSettings }: BrandSettingsProps) {
    const { t: translate } = useTranslation();
    const { props } = usePage();
    const currentGlobalSettings = (props as any).globalSettings;
    const [settings, setSettings] = useState<BrandSettings>(() => getBrandSettings(currentGlobalSettings || userSettings));
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState<'logos' | 'text' | 'theme'>('logos');

    // Get theme hooks
    const { updateAppearance, updateThemeColor, updateCustomColor, saveThemeSettings } = useAppearance();

    const { updatePosition, saveLayoutPosition } = useLayout();
    const { updateVariant, updateStyle, saveSidebarSettings } = useSidebarSettings();

    // Load settings when globalSettings change (but not while saving)
    useEffect(() => {
        if (isSaving) return; // Don't reset form while saving

        const brandSettings = getBrandSettings(currentGlobalSettings || userSettings);
        setSettings(brandSettings);

        // Also sync sidebar settings from cookies (demo mode) or localStorage (fallback)
        try {
            let sidebarSettings;

            if (sidebarSettings) {
                setSettings((prev) => ({
                    ...prev,
                    sidebarVariant: sidebarSettings.variant || prev.sidebarVariant,
                    sidebarStyle: sidebarSettings.style || prev.sidebarStyle,
                }));
            }
        } catch (error) {}
    }, [currentGlobalSettings, userSettings, isSaving]);

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings((prev) => ({ ...prev, [name]: value }));

        // Update brand context if the input is for a logo
        if (['logoLight', 'logoDark', 'favicon'].includes(name)) {
            updateBrandSettings({ [name]: value });
        }
    };

    // Convert full URL to relative path for storage
    const convertToRelativePath = (url: string): string => {
        if (!url) return url;

        // If it's already a relative path, return as is
        if (!url.startsWith('http')) return url;

        // Extract the path after /storage/media
        const mediaStoragePath = '/storage/media/';
        const storageIndex = url.indexOf(mediaStoragePath);
        if (storageIndex !== -1) {
            return url.substring(storageIndex + mediaStoragePath.length);
        }
        const defaultPath = url.indexOf('/images/');
        if (defaultPath !== -1) {
            return url.substring(defaultPath);
        }

        return url;
    };

    // Handle media picker selection
    const handleMediaSelect = (name: string, url: string) => {
        // If URL is empty, use default logo
        if (!url) {
            const defaultValue = DEFAULT_BRAND_SETTINGS[name as keyof BrandSettings] as string;
            setSettings((prev) => ({ ...prev, [name]: defaultValue }));
            updateBrandSettings({ [name]: resolveImageUrl(defaultValue) });
            return;
        }

        // Convert to relative path for storage

        const relativePath = convertToRelativePath(url);

        // Reset error state for this logo
        setLogoErrors((prev) => ({ ...prev, [name]: false }));

        // Update settings state with relative path
        setSettings((prev) => ({ ...prev, [name]: relativePath }));

        // Update brand context with corrected URL for immediate preview
        updateBrandSettings({ [name]: resolveImageUrl(relativePath) });
    };

    // Import useBrand hook
    const { updateBrandSettings } = useBrand();

    // State to track logo errors
    const [logoErrors, setLogoErrors] = useState({
        logoDark: false,
        logoLight: false,
        favicon: false,
    });

    // Handle theme color change
    const handleThemeColorChange = (color: ThemeColor) => {
        setSettings((prev) => ({ ...prev, themeColor: color }));
        updateThemeColor(color);
    };

    // Handle custom color change
    const handleCustomColorChange = (color: string) => {
        setSettings((prev) => ({ ...prev, customColor: color }));
        // Set as active custom color when user is editing it
        updateCustomColor(color, true);
    };

    // Handle sidebar variant change
    const handleSidebarVariantChange = (variant: string) => {
        setSettings((prev) => ({ ...prev, sidebarVariant: variant }));
        updateVariant(variant as any);
    };

    // Handle sidebar style change
    const handleSidebarStyleChange = (style: string) => {
        setSettings((prev) => ({ ...prev, sidebarStyle: style }));
        updateStyle(style);
    };

    // Handle layout direction change
    const handleLayoutDirectionChange = (direction: LayoutPosition) => {
        setSettings((prev) => ({ ...prev, layoutDirection: direction }));
        updatePosition(direction);
    };

    // Handle theme mode change
    const handleThemeModeChange = (mode: Appearance) => {
        setSettings((prev) => ({ ...prev, themeMode: mode }));
        // Only update appearance, don't let it reset the theme color
        updateAppearance(mode);
        // Immediately reapply the current theme color to prevent it from changing
        setTimeout(() => {
            updateThemeColor(settings.themeColor);
            if (settings.themeColor === 'custom') {
                updateCustomColor(settings.customColor);
            }
        }, 0);
    };

    // Save settings
    const saveSettings = () => {
        setIsLoading(true);
        setIsSaving(true);

        // Update theme settings
        updateThemeColor(settings.themeColor);
        if (settings.themeColor === 'custom') {
            updateCustomColor(settings.customColor);
        }
        updateAppearance(settings.themeMode);
        updatePosition(settings.layoutDirection);

        // Update sidebar settings
        updateVariant(settings.sidebarVariant as any);
        updateStyle(settings.sidebarStyle);

        // Save all settings to cookies in demo mode
        saveThemeSettings();
        saveSidebarSettings();
        saveLayoutPosition();

        // Update brand context with correct URLs
        updateBrandSettings({
            logoLight: resolveImageUrl(settings.logoLight),
            logoDark: resolveImageUrl(settings.logoDark),
            favicon: resolveImageUrl(settings.favicon),
        });

        // Individual update functions already handled storage (cookies in demo mode, localStorage in normal mode)
        // Only save to database in normal mode

        // Save to database using Inertia

        router.post(
            route('settings.brand.update'),
            {
                settings: settings,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsLoading(false);
                    const successMessage = page.props.flash?.success;
                    const errorMessage = page.props.flash?.error;

                    if (successMessage) {
                        toast.success(successMessage);
                        // Reset saving state after success
                        setTimeout(() => setIsSaving(false), 500);
                    } else if (errorMessage) {
                        toast.error(errorMessage);
                    }
                },
                onError: (errors) => {
                    setIsLoading(false);
                    setIsSaving(false);
                    const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to save brand settings');
                    toast.error(errorMessage);
                },
            },
        );
    };

    return (
        <SettingsSection
            title={translate('Brand Settings')}
            description={translate("Customize your application's branding and appearance")}
            action={
                <Button onClick={saveSettings} disabled={isLoading} size="sm" className="max-[1300px]:px-2.5">
                    <Save className="mr-2 h-4 w-4 max-[1300px]:mr-0" />
                    <span className="max-[1300px]:hidden">{isLoading ? translate('Saving...') : translate('Save Changes')}</span>
                </Button>
            }
        >
            <Card>
                <CardContent className="mt-6">
                    <div className="grid grid-cols-1 gap-6 min-[1230px]:grid-cols-3">
                        <div className="min-[1230px]:col-span-2">
                            <div className="mb-6 grid w-full grid-cols-3 gap-2 max-[1230px]:grid-cols-1">
                                <Button
                                    variant={activeSection === 'logos' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveSection('logos')}
                                    className="flex-1"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {translate('Logos')}
                                </Button>
                                <Button
                                    variant={activeSection === 'text' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveSection('text')}
                                    className="flex-1"
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {translate('Text')}
                                </Button>
                                <Button
                                    variant={activeSection === 'theme' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setActiveSection('theme')}
                                    className="flex-1"
                                >
                                    <Palette className="mr-2 h-4 w-4" />
                                    {translate('Theme')}
                                </Button>
                            </div>

                            {/* Logos Section */}
                            {activeSection === 'logos' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6 min-[1400px]:grid-cols-2">
                                        <div className="space-y-3">
                                            <Label>{translate('Logo Dark')}</Label>
                                            <div className="flex flex-col gap-3">
                                                <div className="bg-muted/30 flex h-32 items-center justify-center rounded-md border p-4 dark:bg-white">
                                                    {settings.logoDark && !logoErrors.logoDark ? (
                                                        <img
                                                            key={`preview-dark-${Date.now()}`}
                                                            src={resolveImageUrl(settings.logoDark)}
                                                            alt="Dark Logo"
                                                            className="max-h-full max-w-full object-contain"
                                                            onError={() => setLogoErrors((prev) => ({ ...prev, logoDark: true }))}
                                                        />
                                                    ) : (
                                                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                                                            <div className="bg-muted flex h-12 w-24 items-center justify-center rounded border border-dashed">
                                                                <span className="text-muted-foreground font-semibold">{translate('Logo')}</span>
                                                            </div>
                                                            <span className="text-xs">
                                                                {logoErrors.logoDark ? 'Failed to load image' : 'No logo selected'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <MediaPicker
                                                    label=""
                                                    value={convertToRelativePath(settings.logoDark)}
                                                    onChange={(url) => handleMediaSelectranslate('logoDark', url)}
                                                    placeholder="Select dark mode logo..."
                                                    showPreview={false}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label>{translate('Logo Light')}</Label>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex h-32 items-center justify-center rounded-md border bg-black p-4">
                                                    {settings.logoLight && !logoErrors.logoLight ? (
                                                        <img
                                                            key={`preview-light-${Date.now()}`}
                                                            src={resolveImageUrl(settings.logoLight)}
                                                            alt="Light Logo"
                                                            className="max-h-full max-w-full object-contain"
                                                            onError={() => setLogoErrors((prev) => ({ ...prev, logoLight: true }))}
                                                        />
                                                    ) : (
                                                        <div className="text-muted-foreground flex flex-col items-center gap-2">
                                                            <div className="bg-muted flex h-12 w-24 items-center justify-center rounded border border-dashed">
                                                                <span className="text-muted-foreground font-semibold">{translate('Logo')}</span>
                                                            </div>
                                                            <span className="text-xs">
                                                                {logoErrors.logoLight ? 'Failed to load image' : 'No logo selected'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <MediaPicker
                                                    label=""
                                                    value={convertToRelativePath(settings.logoLight)}
                                                    onChange={(url) => handleMediaSelectranslate('logoLight', url)}
                                                    placeholder="Select light mode logo..."
                                                    showPreview={false}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label>{translate('Favicon')}</Label>
                                            <div className="flex flex-col gap-3">
                                                <div className="bg-muted/30 flex h-20 items-center justify-center rounded-md border p-4">
                                                    {settings.favicon && !logoErrors.favicon ? (
                                                        <img
                                                            key={`preview-favicon-${Date.now()}`}
                                                            src={resolveImageUrl(settings.favicon)}
                                                            alt="Favicon"
                                                            className="h-16 w-16 object-contain"
                                                            onError={() => setLogoErrors((prev) => ({ ...prev, favicon: true }))}
                                                        />
                                                    ) : (
                                                        <div className="text-muted-foreground flex flex-col items-center gap-1">
                                                            <div className="bg-muted flex h-10 w-10 items-center justify-center rounded border border-dashed">
                                                                <span className="text-muted-foreground text-xs font-semibold">
                                                                    {translate('Icon')}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs">
                                                                {logoErrors.favicon ? 'Failed to load image' : 'No favicon selected'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <MediaPicker
                                                    label=""
                                                    value={convertToRelativePath(settings.favicon)}
                                                    onChange={(url) => handleMediaSelectranslate('favicon', url)}
                                                    placeholder="Select favicon..."
                                                    showPreview={false}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Text Section */}
                            {activeSection === 'text' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-3">
                                            <Label htmlFor="titleText" required>
                                                {translate('Title Text')}
                                            </Label>
                                            <Input
                                                id="titleText"
                                                name="titleText"
                                                value={settings.titleText}
                                                onChange={handleInputChange}
                                                placeholder="Kakbima"
                                            />
                                            <p className="text-muted-foreground text-xs">
                                                {translate('Application title displayed in the browser tab')}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <Label htmlFor="footerText" required>
                                                {translate('Footer Text')}
                                            </Label>
                                            <Input
                                                id="footerText"
                                                name="footerText"
                                                value={settings.footerText}
                                                onChange={handleInputChange}
                                                placeholder="© 2026 Kakbima. All rights reserved."
                                            />
                                            <p className="text-muted-foreground text-xs">{translate('Text displayed in the footer')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Theme Section */}
                            {activeSection === 'theme' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col space-y-8">
                                        {/* Theme Color Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <Palette className="text-muted-foreground mr-2 h-5 w-5" />
                                                <h3 className="text-base font-medium">{translate('Theme Color')}</h3>
                                            </div>
                                            <Separator className="my-2" />

                                            <div className="grid grid-cols-6 gap-2">
                                                {Object.entries({
                                                    blue: '#A12582',
                                                    green: '#10b77f',
                                                    purple: '#8b5cf6',
                                                    orange: '#f97316',
                                                    red: '#ef4444',
                                                }).map(([color, hex]) => (
                                                    <Button
                                                        key={color}
                                                        type="button"
                                                        variant={settings.themeColor === color ? 'default' : 'outline'}
                                                        className="relative h-8 w-full p-0"
                                                        style={{ backgroundColor: settings.themeColor === color ? hex : 'transparent' }}
                                                        onClick={() => handleThemeColorChange(color as ThemeColor)}
                                                    >
                                                        <span className="absolute inset-1 rounded-sm" style={{ backgroundColor: hex }} />
                                                    </Button>
                                                ))}
                                                <Button
                                                    type="button"
                                                    variant={settings.themeColor === 'custom' ? 'default' : 'outline'}
                                                    className="relative h-8 w-full p-0"
                                                    style={{
                                                        backgroundColor: settings.themeColor === 'custom' ? settings.customColor : 'transparent',
                                                    }}
                                                    onClick={() => handleThemeColorChange('custom')}
                                                >
                                                    <span className="absolute inset-1 rounded-sm" style={{ backgroundColor: settings.customColor }} />
                                                </Button>
                                            </div>

                                            {settings.themeColor === 'custom' && (
                                                <div className="mt-4 space-y-2">
                                                    <Label htmlFor="customColor">{translate('Custom Color')}</Label>
                                                    <div className="flex gap-2">
                                                        <div className="relative">
                                                            <Input
                                                                id="colorPicker"
                                                                type="color"
                                                                value={settings.customColor}
                                                                onChange={(e) => handleCustomColorChange(e.target.value)}
                                                                className="absolute inset-0 cursor-pointer opacity-0"
                                                            />
                                                            <div
                                                                className="h-10 w-10 cursor-pointer rounded border"
                                                                style={{ backgroundColor: settings.customColor }}
                                                            />
                                                        </div>
                                                        <Input
                                                            id="customColor"
                                                            name="customColor"
                                                            type="text"
                                                            value={settings.customColor}
                                                            onChange={(e) => handleCustomColorChange(e.target.value)}
                                                            placeholder="#A12582"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sidebar Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <SidebarIcon className="text-muted-foreground mr-2 h-5 w-5" />
                                                <h3 className="text-base font-medium">{translate('Sidebar')}</h3>
                                            </div>
                                            <Separator className="my-2" />

                                            <div className="space-y-6">
                                                <div>
                                                    <Label className="mb-2 block">{translate('Sidebar Variant')}</Label>
                                                    <div className="grid grid-cols-3 gap-3 max-[450px]:grid-cols-1">
                                                        {['inset', 'floating', 'minimal'].map((variant) => (
                                                            <Button
                                                                key={variant}
                                                                type="button"
                                                                variant={settings.sidebarVariant === variant ? 'default' : 'outline'}
                                                                className="h-10 justify-start"
                                                                style={{
                                                                    backgroundColor:
                                                                        settings.sidebarVariant === variant
                                                                            ? settings.themeColor === 'custom'
                                                                                ? settings.customColor
                                                                                : null
                                                                            : 'transparent',
                                                                }}
                                                                onClick={() => handleSidebarVariantChange(variant)}
                                                            >
                                                                {variant.charAt(0).toUpperCase() + variant.slice(1)}
                                                                {settings.sidebarVariant === variant && <Check className="ml-2 h-4 w-4" />}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="mb-2 block">{translate('Sidebar Style')}</Label>
                                                    <div className="grid grid-cols-3 gap-3 max-[450px]:grid-cols-1">
                                                        {[
                                                            { id: 'plain', name: 'Plain' },
                                                            { id: 'colored', name: 'Colored' },
                                                            { id: 'gradient', name: 'Gradient' },
                                                        ].map((style) => (
                                                            <Button
                                                                key={style.id}
                                                                type="button"
                                                                variant={settings.sidebarStyle === style.id ? 'default' : 'outline'}
                                                                className="h-10 justify-start"
                                                                style={{
                                                                    backgroundColor:
                                                                        settings.sidebarStyle === style.id
                                                                            ? settings.themeColor === 'custom'
                                                                                ? settings.customColor
                                                                                : null
                                                                            : 'transparent',
                                                                }}
                                                                onClick={() => handleSidebarStyleChange(style.id)}
                                                            >
                                                                {style.name}
                                                                {settings.sidebarStyle === style.id && <Check className="ml-2 h-4 w-4" />}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Layout Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <Layout className="text-muted-foreground mr-2 h-5 w-5" />
                                                <h3 className="text-base font-medium">{translate('Layout')}</h3>
                                            </div>
                                            <Separator className="my-2" />

                                            <div className="space-y-2">
                                                <Label className="mb-2 block">{translate('Layout Direction')}</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        type="button"
                                                        variant={settings.layoutDirection === 'left' ? 'default' : 'outline'}
                                                        className="h-10 justify-start"
                                                        style={{
                                                            backgroundColor:
                                                                settings.layoutDirection === 'left'
                                                                    ? settings.themeColor === 'custom'
                                                                        ? settings.customColor
                                                                        : null
                                                                    : 'transparent',
                                                        }}
                                                        onClick={() => handleLayoutDirectionChange('left')}
                                                    >
                                                        {translate('Left-to-Right')}
                                                        {settings.layoutDirection === 'left' && <Check className="ml-2 h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={settings.layoutDirection === 'right' ? 'default' : 'outline'}
                                                        className="h-10 justify-start"
                                                        style={{
                                                            backgroundColor:
                                                                settings.layoutDirection === 'right'
                                                                    ? settings.themeColor === 'custom'
                                                                        ? settings.customColor
                                                                        : null
                                                                    : 'transparent',
                                                        }}
                                                        onClick={() => handleLayoutDirectionChange('right')}
                                                    >
                                                        {translate('Right-to-Left')}
                                                        {settings.layoutDirection === 'right' && <Check className="ml-2 h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mode Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <Moon className="text-muted-foreground mr-2 h-5 w-5" />
                                                <h3 className="text-base font-medium">{translate('Theme Mode')}</h3>
                                            </div>
                                            <Separator className="my-2" />

                                            <div className="space-y-2">
                                                <div className="grid grid-cols-3 gap-2 max-[450px]:grid-cols-1">
                                                    <Button
                                                        type="button"
                                                        variant={settings.themeMode === 'light' ? 'default' : 'outline'}
                                                        className="h-10 justify-start"
                                                        style={{
                                                            backgroundColor:
                                                                settings.themeMode === 'light'
                                                                    ? settings.themeColor === 'custom'
                                                                        ? settings.customColor
                                                                        : null
                                                                    : 'transparent',
                                                        }}
                                                        onClick={() => handleThemeModeChange('light')}
                                                    >
                                                        {translate('Light')}
                                                        {settings.themeMode === 'light' && <Check className="ml-2 h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={settings.themeMode === 'dark' ? 'default' : 'outline'}
                                                        className="h-10 justify-start"
                                                        style={{
                                                            backgroundColor:
                                                                settings.themeMode === 'dark'
                                                                    ? settings.themeColor === 'custom'
                                                                        ? settings.customColor
                                                                        : null
                                                                    : 'transparent',
                                                        }}
                                                        onClick={() => handleThemeModeChange('dark')}
                                                    >
                                                        {translate('Dark')}
                                                        {settings.themeMode === 'dark' && <Check className="ml-2 h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant={settings.themeMode === 'system' ? 'default' : 'outline'}
                                                        className="h-10 justify-start"
                                                        style={{
                                                            backgroundColor:
                                                                settings.themeMode === 'system'
                                                                    ? settings.themeColor === 'custom'
                                                                        ? settings.customColor
                                                                        : null
                                                                    : 'transparent',
                                                        }}
                                                        onClick={() => handleThemeModeChange('system')}
                                                    >
                                                        {translate('System')}
                                                        {settings.themeMode === 'system' && <Check className="ml-2 h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preview Column */}
                        <div className="min-[1230px]:col-span-1">
                            <div className="sticky top-20 space-y-6">
                                <div className="rounded-md border p-4">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        <h3 className="font-medium">{translate('Live Preview')}</h3>
                                    </div>

                                    {/* Comprehensive Theme Preview */}
                                    <ThemePreview />

                                    {/* Text Preview */}
                                    <div className="mt-4 border-t pt-4">
                                        <div className="text-muted-foreground mb-2 text-xs">
                                            {translate('Title:')} <span className="text-foreground font-medium">{settings.titleText}</span>
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            {translate('Footer:')} <span className="text-foreground font-medium">{settings.footerText}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </SettingsSection>
    );
}
