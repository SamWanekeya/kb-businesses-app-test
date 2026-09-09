import { toast } from '@components/CustomToast';
import { SettingsSection } from '@components/settings-section';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Switch } from '@components/UserInterface/Switch';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface RecaptchaSettingsProps {
    settings?: Record<string, string>;
}

export default function RecaptchaSettings({ settings = {} }: RecaptchaSettingsProps) {
    const { t: translate } = useTranslation();
    const pageProps = usePage().props;
    const [processing, setProcessing] = useState(false);

    // Default settings
    const defaultSettings = {
        recaptchaEnabled: false,
        recaptchaVersion: 'v2',
        recaptchaSiteKey: '',
        recaptchaSecretKey: '',
    };

    // Combine settings from props and page props
    const settingsData = Object.keys(settings).length > 0 ? settings : pageProps.systemSettings || {};

    // Initialize state with merged settings
    const [recaptchaSettings, setRecaptchaSettings] = useState(() => ({
        recaptchaEnabled:
            settingsData.recaptchaEnabled === 'true' ||
            settingsData.recaptchaEnabled === true ||
            settingsData.recaptchaEnabled === 1 ||
            settingsData.recaptchaEnabled === '1',
        recaptchaVersion: settingsData.recaptchaVersion || defaultSettings.recaptchaVersion,
        recaptchaSiteKey: settingsData.recaptchaSiteKey || defaultSettings.recaptchaSiteKey,
        recaptchaSecretKey: settingsData.recaptchaSecretKey || defaultSettings.recaptchaSecretKey,
    }));

    // Handle form changes
    const handleSettingsChange = (field: string, value: string | boolean) => {
        setRecaptchaSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle form submission
    const submitRecaptchaSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Submit to backend using Inertia
        router.post(route('settings.recaptcha.update'), recaptchaSettings, {
            preserveScroll: true,
            onSuccess: (page) => {
                setProcessing(false);
                const successMessage = page.props.flash?.success;
                const errorMessage = page.props.flash?.error;

                if (successMessage) {
                    toast.success(successMessage);
                } else if (errorMessage) {
                    toast.error(errorMessage);
                }
            },
            onError: (errors) => {
                setProcessing(false);
                const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to update ReCaptcha settings');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <SettingsSection
            title={translate('ReCaptcha Settings')}
            description={translate('Configure Google ReCaptcha settings for form protection')}
            action={
                <Button type="submit" disabled={processing} form="recaptcha-settings-form" size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? translate('Saving...') : translate('Save Changes')}
                </Button>
            }
        >
            <Card>
                <CardContent className="mt-6">
                    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                        <strong>{translate('Note')}:</strong>{' '}
                        <a
                            href="https://phppot.com/php/how-to-get-google-recaptcha-site-and-secret-key/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:no-underline"
                        >
                            {translate('How to Get Google reCaptcha Site and Secret key')}
                        </a>
                    </div>

                    <form id="recaptcha-settings-form" onSubmit={submitRecaptchaSettings} className="space-y-6">
                        <div className="grid gap-2 md:col-span-2">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="recaptchaEnabled">{translate('Enable ReCaptcha')}</Label>
                                    <p className="text-muted-foreground text-sm">{translate('Show ReCaptcha on authentication pages')}</p>
                                </div>
                                <Switch
                                    id="recaptchaEnabled"
                                    checked={recaptchaSettings.recaptchaEnabled}
                                    onCheckedChange={(checked) => handleSettingsChange('recaptchaEnabled', checked)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="recaptchaVersion">{translate('Google Recaptcha Version')}</Label>
                                <Select
                                    value={recaptchaSettings.recaptchaVersion}
                                    onValueChange={(value) => handleSettingsChange('recaptchaVersion', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select version')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="v2">v2</SelectItem>
                                        <SelectItem value="v3">v3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="recaptchaSiteKey" required>
                                    {translate('Site Key')}
                                </Label>
                                <Input
                                    id="recaptchaSiteKey"
                                    name="recaptchaSiteKey"
                                    type="text"
                                    value={recaptchaSettings.recaptchaSiteKey}
                                    onChange={(e) => handleSettingsChange('recaptchaSiteKey', e.target.value)}
                                    placeholder={translate('Enter your Google ReCaptcha site key')}
                                />
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="recaptchaSecretKey" required>
                                    {translate('Secret Key')}
                                </Label>
                                <Input
                                    id="recaptchaSecretKey"
                                    name="recaptchaSecretKey"
                                    type="password"
                                    value={recaptchaSettings.recaptchaSecretKey}
                                    onChange={(e) => handleSettingsChange('recaptchaSecretKey', e.target.value)}
                                    placeholder={translate('Enter your Google ReCaptcha secret key')}
                                />
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </SettingsSection>
    );
}
