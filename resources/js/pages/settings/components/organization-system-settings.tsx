import { toast } from '@components/CustomToast';
import { SettingsSection } from '@components/settings-section';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { useTranslation } from 'react-i18next';
import languageData from '/resources/lang/language.json';

interface OrganizationSystemSettingsProps {
    settings?: Record<string, string>;
    timezones?: Record<string, string>;
    dateFormats?: Record<string, string>;
    timeFormats?: Record<string, string>;
}

export default function OrganizationSystemSettings({
    settings = {},
    timezones = {},
    dateFormats = {},
    timeFormats = {},
}: OrganizationSystemSettingsProps) {
    const { t: translate } = useTranslation();
    const pageProps = usePage().props;
    const [processing, setProcessing] = useState(false);

    // Default settings
    const defaultSettings = {
        defaultLanguage: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        defaultTimezone: 'UTC',
    };

    // Combine settings from props and page props
    const settingsData = Object.keys(settings).length > 0 ? settings : pageProps.settings || {};

    // Initialize state with merged settings
    const [systemSettings, setSystemSettings] = useState(() => ({
        defaultLanguage: settingsData.defaultLanguage || defaultSettings.defaultLanguage,
        dateFormat: settingsData.dateFormat || defaultSettings.dateFormat,
        timeFormat: settingsData.timeFormat || defaultSettings.timeFormat,
        defaultTimezone: settingsData.defaultTimezone || defaultSettings.defaultTimezone,
    }));

    // Update state when settings change
    useEffect(() => {
        if (Object.keys(settingsData).length > 0) {
            // Create merged settings object
            const mergedSettings = Object.keys(defaultSettings).reduce(
                (acc, key) => {
                    acc[key] = settingsData[key] || defaultSettings[key];
                    return acc;
                },
                {} as Record<string, string>,
            );

            setSystemSettings((prevSettings) => ({
                ...prevSettings,
                ...mergedSettings,
            }));
        }
    }, [settingsData]);

    // Handle system settings form changes
    const handleSystemSettingsChange = (field: string, value: string) => {
        setSystemSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle system settings form submission
    const submitSystemSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Create clean settings object
        const cleanSettings = {
            defaultLanguage: systemSettings.defaultLanguage,
            dateFormat: systemSettings.dateFormat,
            timeFormat: systemSettings.timeFormat,
            defaultTimezone: systemSettings.defaultTimezone,
        };

        // Submit to backend using Inertia
        router.post(route('settings.organization.system.update'), cleanSettings, {
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
                const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to update system settings');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <SettingsSection
            title={translate('System Settings')}
            description={translate('Configure system-wide settings for your organization')}
            action={
                <Button type="submit" disabled={processing} form="organization-system-settings-form" size="sm" className="max-[1300px]:px-2.5">
                    <Save className="mr-2 h-4 w-4 max-[1300px]:mr-0" />
                    <span className="max-[1300px]:hidden">{processing ? translate('Saving...') : translate('Save Changes')}</span>
                </Button>
            }
        >
            <Card>
                <CardContent className="mt-6">
                    <form id="organization-system-settings-form" onSubmit={submitSystemSettings} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="defaultLanguage">{translate('Default Language')}</Label>
                                <Select
                                    value={systemSettings.defaultLanguage}
                                    onValueChange={(value) => handleSystemSettingsChange('defaultLanguage', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select language')}>
                                            {systemSettings.defaultLanguage &&
                                                (() => {
                                                    const selectedLang = languageData.find((lang) => lang.code === systemSettings.defaultLanguage);
                                                    return selectedLang ? (
                                                        <div className="flex items-center space-x-2">
                                                            <ReactCountryFlag
                                                                countryCode={selectedLang.countryCode}
                                                                svg
                                                                style={{
                                                                    width: '1.2em',
                                                                    height: '1.2em',
                                                                }}
                                                            />{' '}
                                                            <span>{selectedLang.name}</span>{' '}
                                                        </div>
                                                    ) : (
                                                        translate('Select language')
                                                    );
                                                })()}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languageData.map((language) => (
                                            <SelectItem key={language.code} value={language.code}>
                                                <div className="flex items-center space-x-2">
                                                    <ReactCountryFlag
                                                        countryCode={language.countryCode}
                                                        svg
                                                        style={{
                                                            width: '1.2em',
                                                            height: '1.2em',
                                                        }}
                                                    />{' '}
                                                    <span>{language.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="dateFormat">{translate('Date Format')}</Label>
                                <Select value={systemSettings.dateFormat} onValueChange={(value) => handleSystemSettingsChange('dateFormat', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select date format')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(dateFormats).length > 0 ? (
                                            Object.entries(dateFormats).map(([format, example]) => (
                                                <SelectItem key={format} value={format}>
                                                    <div className="flex w-full items-center justify-between">
                                                        <span>{format}</span>
                                                        <span className="text-muted-foreground ml-4 text-sm">({example})</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="M j, Y">Jan 1, 2025</SelectItem>
                                                <SelectItem value="d-m-Y">01-01-2025</SelectItem>
                                                <SelectItem value="Y-m-d">2025-01-01</SelectItem>
                                                <SelectItem value="F j, Y">January 1, 2025</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="timeFormat">{translate('Time Format')}</Label>
                                <Select value={systemSettings.timeFormat} onValueChange={(value) => handleSystemSettingsChange('timeFormat', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select time format')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(timeFormats).length > 0 ? (
                                            Object.entries(timeFormats).map(([format, example]) => (
                                                <SelectItem key={format} value={format}>
                                                    <div className="flex w-full items-center justify-between">
                                                        <span>{format}</span>
                                                        <span className="text-muted-foreground ml-4 text-sm">({example})</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="g:i A">1:30 PM</SelectItem>
                                                <SelectItem value="H:i">13:30</SelectItem>
                                                <SelectItem value="g:i a">1:30 pm</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="defaultTimezone">{translate('Default Timezone')}</Label>
                                <Select
                                    value={systemSettings.defaultTimezone}
                                    onValueChange={(value) => handleSystemSettingsChange('defaultTimezone', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select timezone')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(timezones).length > 0 ? (
                                            Object.entries(timezones).map(([timezone, description]) => (
                                                <SelectItem key={timezone} value={timezone}>
                                                    {description}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="UTC">UTC</SelectItem>
                                                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </SettingsSection>
    );
}
