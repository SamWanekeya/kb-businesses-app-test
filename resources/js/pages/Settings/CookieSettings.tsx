import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '@/components/CustomToast';
import SettingsSection from '@/components/SettingsSection';
import { Button } from '@/components/UserInterface/Button';
import { Input } from '@/components/UserInterface/Input';
import { Label } from '@/components/UserInterface/Label';
import { Switch } from '@/components/UserInterface/Switch';
import { Textarea } from '@/components/UserInterface/Textarea';
import { route } from '@/utils/Routes';

type CookieSettingsValues = {
    enable_logging: boolean;
    strictly_necessary_cookies: boolean;
    cookie_title: string;
    strictly_cookie_title: string;
    cookie_description: string;
    strictly_cookie_description: string;
    contact_us_description: string;
    contact_us_url: string;
};

type TextSettingKey = Exclude<keyof CookieSettingsValues, 'enable_logging' | 'strictly_necessary_cookies'>;

type RawCookieSettings = Record<string, string | boolean | undefined>;

interface CookieSettingsProps {
    settings?: RawCookieSettings;
}

interface CookiePageProps {
    settings?: RawCookieSettings;
}

const DEFAULT_SETTINGS: CookieSettingsValues = {
    enable_logging: false,
    strictly_necessary_cookies: true,
    cookie_title: 'Cookie Consent',
    strictly_cookie_title: 'Strictly Necessary Cookies',
    cookie_description: 'We use cookies to enhance your browsing experience and provide personalized content.',
    strictly_cookie_description: 'These cookies are essential for the website to function properly.',
    contact_us_description: 'If you have any questions about our cookie policy, please contact us.',
    contact_us_url: 'https://www.kakbima.com/contact',
};

/**
 * Normalizes persisted cookie settings into the form's expected state.
 *
 * Boolean logging values support both database strings and actual booleans.
 * Strictly necessary cookies remain enabled regardless of the stored value.
 */
function normalizeCookieSettings(settings: RawCookieSettings = {}): CookieSettingsValues {
    const getText = (key: TextSettingKey): string => {
        const value = settings[key];

        return typeof value === 'string' && value.length > 0 ? value : DEFAULT_SETTINGS[key];
    };

    return {
        enable_logging: settings.enable_logging === '1' || settings.enable_logging === true,
        strictly_necessary_cookies: true,
        cookie_title: getText('cookie_title'),
        strictly_cookie_title: getText('strictly_cookie_title'),
        cookie_description: getText('cookie_description'),
        strictly_cookie_description: getText('strictly_cookie_description'),
        contact_us_description: getText('contact_us_description'),
        contact_us_url: getText('contact_us_url'),
    };
}

/**
 * CookieSettings
 *
 * Configures cookie consent presentation, activity logging, and consent
 * data exports for the application.
 *
 * Responsibilities:
 * - Manage editable cookie consent settings.
 * - Synchronize form values with server-provided settings.
 * - Submit updates through Inertia.
 * - Download accepted cookie preference data as CSV.
 *
 * Architecture:
 * - Uses a normalized settings model to centralize default handling.
 * - Separates boolean and text field updates for type safety.
 * - Preserves the existing backend route and field names.
 *
 * Accessibility:
 * - Associates every field with a visible label.
 * - Explains why strictly necessary cookies cannot be disabled.
 * - Provides descriptive text for settings and the download action.
 *
 * Performance:
 * - Uses stable callbacks for event handlers.
 * - Synchronizes state only when normalized server values change.
 */
export default function CookieSettings({ settings = {} }: CookieSettingsProps) {
    const { t: translate } = useTranslation();
    const { props } = usePage<CookiePageProps>();

    const pageSettings = props.settings ?? {};
    const settingsData = Object.keys(settings).length > 0 ? settings : pageSettings;

    const normalizedSettings = normalizeCookieSettings(settingsData);

    const [cookieSettings, setCookieSettings] = useState<CookieSettingsValues>(() => normalizedSettings);

    /**
     * Apply server updates without resetting unsaved edits on unrelated
     * renders where the normalized settings have not changed.
     */
    useEffect(() => {
        setCookieSettings(normalizedSettings);
    }, [
        normalizedSettings.enable_logging,
        normalizedSettings.cookie_title,
        normalizedSettings.strictly_cookie_title,
        normalizedSettings.cookie_description,
        normalizedSettings.strictly_cookie_description,
        normalizedSettings.contact_us_description,
        normalizedSettings.contact_us_url,
    ]);

    const handleTextChange = useCallback((field: TextSettingKey, value: string) => {
        setCookieSettings((previous) => ({
            ...previous,
            [field]: value,
        }));
    }, []);

    const handleLoggingChange = useCallback((checked: boolean) => {
        setCookieSettings((previous) => ({
            ...previous,
            enable_logging: checked,
        }));
    }, []);

    const submitCookieSettings: NonNullable<React.ComponentProps<'form'>['onSubmit']> = useCallback(
        (event) => {
            event.preventDefault();

            const toastId = toast.loading(translate('Saving cookie settings...'));

            router.post(route('settings.cookie.update'), cookieSettings, {
                preserveScroll: true,

                onSuccess: () => {
                    toast.dismiss(toastId);
                },

                onError: (errors) => {
                    Object.values(errors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },

                onFinish: () => {
                    toast.dismiss(toastId);
                },
            });
        },
        [cookieSettings, translate],
    );

    const downloadCookieData = useCallback(() => {
        window.location.href = route('cookie.consent.download');
    }, []);

    return (
        <SettingsSection
            title={translate('Cookie')}
            description={translate('Configure cookie consent and privacy settings for your application')}
            action={
                <Button type="submit" form="cookie-settings-form" size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <form id="cookie-settings-form" autoComplete="off" onSubmit={submitCookieSettings} className="space-y-8">
                <div className="border-border border-t" />
                {/* Cookie behavior */}
                <section aria-label={translate('Cookie behavior')} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div className="min-w-0 space-y-1">
                                <Label htmlFor="enable_logging">{translate('Enable logging')}</Label>

                                <p id="enable-logging-description" className="text-foreground/75 text-sm">
                                    {translate('Enable cookie activity logging')}
                                </p>
                            </div>

                            <Switch
                                id="enable_logging"
                                aria-describedby="enable-logging-description"
                                checked={cookieSettings.enable_logging}
                                onCheckedChange={handleLoggingChange}
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div className="min-w-0 space-y-1">
                                <Label htmlFor="strictly_necessary_cookies">{translate('Strictly necessary cookies')}</Label>

                                <p id="strictly-necessary-description" className="text-foreground/75 text-sm">
                                    {translate('These cookies are always enabled and cannot be disabled')}
                                </p>
                            </div>

                            <Switch id="strictly_necessary_cookies" aria-describedby="strictly-necessary-description" checked disabled />
                        </div>
                    </div>
                </section>

                {/* Consent dialog content */}
                <section className="space-y-4">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="cookie_title"
                                label={translate('Cookie title')}
                                name="cookie_title"
                                value={cookieSettings.cookie_title}
                                maxLength={255}
                                onChange={(event) => handleTextChange('cookie_title', event.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="strictly_cookie_title"
                                label={translate('Strictly cookie title')}
                                name="strictly_cookie_title"
                                value={cookieSettings.strictly_cookie_title}
                                maxLength={255}
                                onChange={(event) => handleTextChange('strictly_cookie_title', event.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Textarea
                                id="cookie_description"
                                label={translate('Cookie description')}
                                name="cookie_description"
                                value={cookieSettings.cookie_description}
                                rows={4}
                                maxLength={5000}
                                onChange={(event) => handleTextChange('cookie_description', event.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Textarea
                                id="strictly_cookie_description"
                                label={translate('Strictly cookie description')}
                                name="strictly_cookie_description"
                                value={cookieSettings.strictly_cookie_description}
                                rows={4}
                                maxLength={5000}
                                onChange={(event) => handleTextChange('strictly_cookie_description', event.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Contact information */}
                <section className="space-y-4">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div className="grid content-start gap-2">
                            <Textarea
                                id="contact_us_description"
                                label={translate('Contact us description')}
                                name="contact_us_description"
                                value={cookieSettings.contact_us_description}
                                rows={3}
                                maxLength={5000}
                                onChange={(event) => handleTextChange('contact_us_description', event.target.value)}
                            />
                        </div>

                        <div className="grid content-start gap-2">
                            <Input
                                inputIdentifier="contact_us_url"
                                label={translate('Contact us URL')}
                                name="contact_us_url"
                                type="url"
                                inputMode="url"
                                maxLength={2048}
                                value={cookieSettings.contact_us_url}
                                onChange={(event) => handleTextChange('contact_us_url', event.target.value)}
                            />
                        </div>
                    </div>
                </section>

                {/* Consent data export */}
                <section className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-semibold">{translate('Download accepted cookies')}</h3>

                        <p className="text-foreground/75 text-sm">{translate('Download a CSV file of accepted cookie preferences')}</p>
                    </div>

                    <Button type="button" variant="outline" size="lg" onClick={downloadCookieData} className="w-full shrink-0 sm:w-auto">
                        {translate('Download CSV')}
                    </Button>
                </section>
            </form>
        </SettingsSection>
    );
}
