import MediaPicker from '@components/MediaPicker';
import SettingsSection from '@components/SettingsSection';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useBrand } from '@contexts/BrandContext';
import useTheme from '@hooks/useTheme';

import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

import { toast } from '@components/CustomToast';
import { Check, SunMoon, TabletSmartphone } from 'lucide-react';

import kakbimaIcon from '@images/logos/kakbima_icon.png';
import kakbimaLogoLight from '@images/logos/kakbima_logo.png';
import kakbimaLogoDark from '@images/logos/kakbima_logo_dark.png';

import { Button } from '@components/UserInterface/Button';
import Input from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { resolveImageUrl } from '@utils/Helpers/Url';
import { Appearance } from '@utils/Theme';

/**
 * Defines the shape of the organization branding and profile settings.
 */
export interface BrandSettings {
    logo_light: string;
    logo_dark: string;
    favicon: string;
    theme_mode: Appearance;
    organization_name: string;
    organization_tax_id_pin_number: string;
    organization_phone_number: string;
    organization_email: string;
    organization_physical_address: string;
}

/**
 * BrandSettings component allows organization users to manage:
 *
 * - Organization legal and contact information
 * - Organization physical address
 * - Light and dark mode logos
 * - Favicon
 * - Application appearance/theme preference
 *
 * The component maintains local form state for all settings, provides
 * immediate previews for branding assets and persists the complete
 * configuration to the server through the Inertia router.
 *
 * @returns JSX element containing the brand settings interface.
 */
export default function BrandSettings() {
    const { auth, userSettings, globalSettings } = usePage().props;
    const userType = auth?.user?.type;

    const { t: translate } = useTranslation();
    const { updateBrandSettings: updateBrandCtx } = useBrand();
    const theme = useTheme();

    /**
     * Resolves the settings source used to populate the form.
     *
     * User-specific settings take precedence over global settings.
     */
    const src = useMemo(() => userSettings || globalSettings || {}, [userSettings, globalSettings]);

    /**
     * Builds the initial form state from the currently available settings.
     */
    const initial = useMemo<BrandSettings>(
        () => ({
            logo_light: src.logo_light || '',
            logo_dark: src.logo_dark || '',
            favicon: src.favicon || '',
            theme_mode: src.theme_mode || 'system',
            organization_name: src.organization_name || '',
            organization_tax_id_pin_number: src.organization_tax_id_pin_number || '',
            organization_phone_number: src.organization_phone_number || '',
            organization_email: src.organization_email || '',
            organization_physical_address: src.organization_physical_address || '',
        }),
        [
            src.logo_light,
            src.logo_dark,
            src.favicon,
            src.theme_mode,
            src.organization_name,
            src.organization_tax_id_pin_number,
            src.organization_phone_number,
            src.organization_email,
            src.organization_physical_address,
        ],
    );

    const [form, setForm] = useState<BrandSettings>(initial);

    const [previewLight, setPreviewLight] = useState(initial.logo_light);
    const [previewDark, setPreviewDark] = useState(initial.logo_dark);
    const [previewFavicon, setPreviewFavicon] = useState(initial.favicon);
    const [saving, setSaving] = useState(false);

    /**
     * Synchronizes local form state with the latest server-provided settings.
     *
     * The synchronization is skipped while a save request is in progress
     * to prevent the in-flight form state from being overwritten.
     */
    useEffect(() => {
        if (saving) {
            return;
        }

        setForm(initial);
        setPreviewLight(initial.logo_light);
        setPreviewDark(initial.logo_dark);
        setPreviewFavicon(initial.favicon);
    }, [initial, saving]);

    /**
     * Updates a text-based organization setting in the local form state.
     *
     * @param field - Organization field to update.
     * @param value - New field value.
     */
    const handleOrganizationChange = useCallback(
        (
            field: keyof Pick<
                BrandSettings,
                | 'organization_name'
                | 'organization_tax_id_pin_number'
                | 'organization_phone_number'
                | 'organization_email'
                | 'organization_physical_address'
            >,
            value: string,
        ) => {
            setForm((prev) => ({
                ...prev,
                [field]: value,
            }));
        },
        [],
    );

    /**
     * Updates form state and previews for a branding media field.
     *
     * The updated media URL is also immediately propagated to the brand
     * context so other parts of the application can reflect the change.
     *
     * @param url - URL of the uploaded media.
     * @param field - Branding media field to update.
     */
    const handleFile = useCallback(
        (url: string, field: keyof BrandSettings) => {
            setForm((prev) => ({
                ...prev,
                [field]: url,
            }));

            if (field === 'logo_light') {
                setPreviewLight(url);
            } else if (field === 'logo_dark') {
                setPreviewDark(url);
            } else if (field === 'favicon') {
                setPreviewFavicon(url);
            }

            updateBrandCtx({ [field]: url });
        },
        [updateBrandCtx],
    );

    /**
     * Updates the selected theme in the form and immediately applies it
     * as a temporary preview without persisting the preference.
     *
     * @param mode - Selected appearance mode.
     */
    const handleThemePreview = useCallback(
        (mode: Appearance) => {
            setForm((prev) => ({
                ...prev,
                theme_mode: mode,
            }));

            theme.setMode(mode, false);
        },
        [theme],
    );

    /**
     * Persists the current brand and organization settings to the server.
     *
     * Displays a loading toast while the request is in progress and
     * reports validation or server errors through error toasts.
     */
    const save = useCallback(() => {
        setSaving(true);

        const toastId = toast.loading(translate('Saving brand settings...'));

        router.post(
            route('settings.brand.update'),
            {
                settings: form,
            },
            {
                preserveScroll: true,

                onSuccess: () => {
                    toast.dismiss(toastId);
                    setSaving(false);

                    // Persist the selected theme after the server confirms the save.
                    theme.setMode(form.theme_mode, true);
                },

                onError: (errors) => {
                    setSaving(false);
                    toast.dismiss(toastId);

                    Object.values(errors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },
            },
        );
    }, [form, theme, translate]);

    /**
     * Creates a click handler for selecting and previewing a theme mode.
     *
     * @param mode - Appearance mode to preview.
     * @returns Click handler for the corresponding theme option.
     */
    const buildThemeClick = useCallback(
        (mode: Appearance) => () => {
            handleThemePreview(mode);
        },
        [handleThemePreview],
    );

    return (
        <SettingsSection
            title={translate('Branding')}
            description={translate(
                'Manage your organization details and branding elements that will appear on payslips, certificates, letters, and other organization-related documents',
            )}
            action={
                <Button size="lg" onClick={save} disabled={saving}>
                    {saving ? translate('Saving...') : translate('Save')}
                </Button>
            }
        >
            <div className="grid grid-cols-1 gap-4">
                {/* Organization details */}
                {userType === 'organization' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Legal name */}
                            <div className="grid gap-2">
                                <Label required htmlFor="organization_name">
                                    {translate('Legal name')}
                                </Label>

                                <Input
                                    required
                                    id="organization_name"
                                    name="organization_name"
                                    value={form.organization_name}
                                    onChange={(event) => {
                                        handleOrganizationChange('organization_name', event.target.value);
                                    }}
                                />
                            </div>

                            {/* Tax ID / PIN number */}
                            <div className="grid gap-2">
                                <Label htmlFor="organization_tax_id_pin_number">{translate('Tax ID/PIN number')}</Label>

                                <Input
                                    id="organization_tax_id_pin_number"
                                    name="organization_tax_id_pin_number"
                                    value={form.organization_tax_id_pin_number}
                                    onChange={(event) => {
                                        handleOrganizationChange('organization_tax_id_pin_number', event.target.value);
                                    }}
                                />
                            </div>

                            {/* Phone number */}
                            <div className="grid gap-2">
                                <Label htmlFor="organization_phone_number">{translate('Phone number')}</Label>

                                <Input
                                    id="organization_phone_number"
                                    name="organization_phone_number"
                                    type="tel"
                                    value={form.organization_phone_number}
                                    onChange={(event) => {
                                        handleOrganizationChange('organization_phone_number', event.target.value);
                                    }}
                                />
                            </div>

                            {/* Email */}
                            <div className="grid gap-2">
                                <Label htmlFor="organization_email">{translate('Email')}</Label>

                                <Input
                                    id="organization_email"
                                    name="organization_email"
                                    type="email"
                                    value={form.organization_email}
                                    onChange={(event) => {
                                        handleOrganizationChange('organization_email', event.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Physical address */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-3">
                                <Label htmlFor="organization_physical_address">{translate('Physical address')}</Label>

                                <textarea
                                    id="organization_physical_address"
                                    name="organization_physical_address"
                                    value={form.organization_physical_address}
                                    onChange={(event) => {
                                        handleOrganizationChange('organization_physical_address', event.target.value);
                                    }}
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Appearance */}
                <div className="space-y-6">
                    <div className="flex items-center">
                        <SunMoon className="text-muted-foreground mr-2 h-5 w-5" />

                        <h3 className="text-base font-medium">{translate('Appearance')}</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {(['light', 'dark', 'system'] as Appearance[]).map((mode) => (
                            <Button
                                key={mode}
                                type="button"
                                variant={form.theme_mode === mode ? 'default' : 'outline'}
                                className="h-10 justify-start"
                                onClick={buildThemeClick(mode)}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}

                                {form.theme_mode === mode && <Check className="ml-2 h-4 w-4" />}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Logos */}
                {userType === 'organization' && (
                    <div className="space-y-6">
                        <div className="flex items-center pt-4">
                            <TabletSmartphone className="text-muted-foreground mr-2 h-5 w-5" />

                            <h3 className="text-base font-medium">{translate('Logo')}</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Dark mode logo */}
                            <div className="space-y-3">
                                <Label>{translate('Dark mode')}</Label>

                                <div className="flex h-32 items-center justify-center rounded-md border bg-neutral-900 p-4">
                                    <img
                                        src={resolveImageUrl(previewDark) || kakbimaLogoDark}
                                        alt={translate('Dark mode')}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>

                                <MediaPicker
                                    value={form.logo_dark}
                                    onChange={(url) => {
                                        handleFile(url, 'logo_dark');
                                    }}
                                    showPreview={false}
                                />
                            </div>

                            {/* Light mode logo */}
                            <div className="space-y-3">
                                <Label>{translate('Light mode')}</Label>

                                <div className="bg-muted/30 flex h-32 items-center justify-center rounded-md border p-4">
                                    <img
                                        src={resolveImageUrl(previewLight) || kakbimaLogoLight}
                                        alt={translate('Light mode')}
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>

                                <MediaPicker
                                    value={form.logo_light}
                                    onChange={(url) => {
                                        handleFile(url, 'logo_light');
                                    }}
                                    showPreview={false}
                                />
                            </div>

                            {/* Favicon */}
                            <div className="space-y-3">
                                <Label>{translate('Favicon')}</Label>

                                <div className="bg-muted/30 flex h-20 items-center justify-center rounded-md border p-4">
                                    <img
                                        src={resolveImageUrl(previewFavicon) || kakbimaIcon}
                                        alt={translate('Favicon')}
                                        className="h-16 w-16 object-contain"
                                    />
                                </div>

                                <MediaPicker
                                    value={form.favicon}
                                    onChange={(url) => {
                                        handleFile(url, 'favicon');
                                    }}
                                    showPreview={false}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </SettingsSection>
    );
}
