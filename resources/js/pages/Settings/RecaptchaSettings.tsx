import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Switch } from '@components/UserInterface/Switch';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type RecaptchaVersion = 'v2' | 'v3';

interface RecaptchaSettingsProps {
    settings?: Record<string, string | boolean | number>;
}

interface RecaptchaFormSettings {
    recaptchaEnabled: boolean;
    recaptchaVersion: RecaptchaVersion;
    recaptchaSiteKey: string;
    recaptchaSecretKey: string;
}

const DEFAULT_SETTINGS: RecaptchaFormSettings = {
    recaptchaEnabled: false,
    recaptchaVersion: 'v2',
    recaptchaSiteKey: '',
    recaptchaSecretKey: '',
};

/**
 * Normalizes boolean values received from Laravel settings.
 *
 * Supports common database and serialized representations without
 * treating arbitrary non-empty strings as enabled.
 */
function isEnabled(value: string | boolean | number | undefined): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
}

/**
 * Converts server-provided settings into the form's strongly typed model.
 *
 * Unknown reCAPTCHA versions fall back to v2, preserving the original
 * component's behavior.
 */
function createInitialSettings(settings: Record<string, string | boolean | number>): RecaptchaFormSettings {
    return {
        recaptchaEnabled: isEnabled(settings.recaptchaEnabled),
        recaptchaVersion: settings.recaptchaVersion === 'v3' ? 'v3' : 'v2',
        recaptchaSiteKey: String(settings.recaptchaSiteKey ?? DEFAULT_SETTINGS.recaptchaSiteKey),
        recaptchaSecretKey: String(settings.recaptchaSecretKey ?? DEFAULT_SETTINGS.recaptchaSecretKey),
    };
}

/**
 * RecaptchaSettings
 *
 * Configures Google reCAPTCHA protection for application authentication
 * pages.
 *
 * Responsibilities:
 * - Control whether reCAPTCHA protection is enabled.
 * - Manage the reCAPTCHA version and provider credentials.
 * - Synchronize server-provided settings when the form is not saving.
 * - Submit updates through the existing Inertia endpoint.
 * - Present accessible loading, success and validation feedback.
 *
 * Architecture:
 * - Uses a single typed form model.
 * - Keeps credentials intact when protection is disabled.
 * - Prevents duplicate submissions while an Inertia request is active.
 *
 * Accessibility:
 * - Associates form labels and descriptions with their controls.
 * - Uses semantic sections, visible focus states and descriptive buttons.
 * - Communicates save status through the existing toast system.
 *
 * Performance:
 * - Memoizes derived settings and stable event handlers where useful.
 *
 * Security:
 * - Secret keys use password inputs.
 * - Client-side visibility is not a substitute for server-side credential
 *   protection, validation or authorization.
 */
export default function RecaptchaSettings({ settings = {} }: RecaptchaSettingsProps) {
    const { t: translate } = useTranslation();
    const { systemSettings } = usePage().props;

    const settingsData = useMemo(
        () => (Object.keys(settings).length > 0 ? settings : ((systemSettings as Record<string, string | boolean | number> | undefined) ?? {})),
        [settings, systemSettings],
    );

    const initialSettings = useMemo(() => createInitialSettings(settingsData), [settingsData]);

    const [form, setForm] = useState<RecaptchaFormSettings>(initialSettings);

    const [isSaving, setIsSaving] = useState(false);

    /**
     * Synchronizes incoming server settings without replacing user edits
     * while a save request is in progress.
     */
    useEffect(() => {
        if (!isSaving) {
            setForm(initialSettings);
        }
    }, [initialSettings, isSaving]);

    const handleChange = useCallback(<K extends keyof RecaptchaFormSettings>(field: K, value: RecaptchaFormSettings[K]) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }, []);

    /**
     * Submits the current configuration through Inertia.
     *
     * The form event is handled directly by the form element, avoiding
     * an explicit dependency on React form event type aliases.
     */
    const submitSettings = useCallback(() => {
        if (isSaving) {
            return;
        }

        setIsSaving(true);

        const toastId = toast.loading(translate('Updating Google reCAPTCHA settings...'));

        router.post(route('settings.recaptcha.update'), form, {
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
                setIsSaving(false);
                toast.dismiss(toastId);
            },
        });
    }, [form, isSaving, translate]);

    return (
        <SettingsSection
            title={translate('Google reCAPTCHA')}
            description={translate('Protect authentication forms against automated abuse.')}
            action={
                <Button type="submit" form="recaptcha-settings-form" size="lg" disabled={isSaving}>
                    {isSaving ? translate('Saving...') : <>{translate('Save')}</>}
                </Button>
            }
        >
            <form
                id="recaptcha-settings-form"
                autoComplete="off"
                onSubmit={(event) => {
                    event.preventDefault();
                    submitSettings();
                }}
                className="space-y-8"
            >
                <div className="border-border border-t" />

                <section aria-labelledby="recaptcha-status-heading" className="space-y-4">
                    <div className="border-border flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div className="min-w-0 space-y-1">
                            <Label htmlFor="recaptchaEnabled" className="cursor-pointer text-sm">
                                {translate('Enable Google reCAPTCHA')}
                            </Label>

                            <p id="recaptcha-enabled-description" className="text-foreground/75 text-sm leading-relaxed">
                                {translate('Show Google reCAPTCHA on authentication pages.')}
                            </p>
                        </div>

                        <Switch
                            id="recaptchaEnabled"
                            checked={form.recaptchaEnabled}
                            onCheckedChange={(checked) => handleChange('recaptchaEnabled', checked)}
                            aria-describedby="recaptcha-enabled-description"
                        />
                    </div>
                </section>

                <section aria-labelledby="recaptcha-config-heading" className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="min-w-0 space-y-2">
                            <Select
                                value={form.recaptchaVersion}
                                onValueChange={(value) => {
                                    if (value === 'v2' || value === 'v3') {
                                        handleChange('recaptchaVersion', value);
                                    }
                                }}
                            >
                                <SelectTrigger id="recaptchaVersion" label={translate('Google reCAPTCHA version')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="v2">{translate('reCAPTCHA v2')}</SelectItem>
                                    <SelectItem value="v3">{translate('reCAPTCHA v3')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="min-w-0 space-y-2">
                            <Input
                                inputIdentifier="recaptchaSiteKey"
                                label={translate('Site key')}
                                name="recaptchaSiteKey"
                                value={form.recaptchaSiteKey}
                                autoComplete="off"
                                spellCheck={false}
                                onChange={(event) => handleChange('recaptchaSiteKey', event.target.value)}
                                aria-describedby="recaptcha-site-key-help"
                            />
                        </div>

                        <div className="min-w-0 space-y-2 md:col-span-2">
                            <Input
                                inputIdentifier="recaptchaSecretKey"
                                label={translate('Secret key')}
                                name="recaptchaSecretKey"
                                inputType="password"
                                autoComplete="new-password"
                                value={form.recaptchaSecretKey}
                                onChange={(event) => handleChange('recaptchaSecretKey', event.target.value)}
                                aria-describedby="recaptcha-secret-key-help"
                            />
                        </div>
                    </div>
                </section>
            </form>
        </SettingsSection>
    );
}
