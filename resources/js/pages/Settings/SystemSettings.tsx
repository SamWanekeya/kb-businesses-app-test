import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { router, usePage } from '@inertiajs/react';
import languageData from '@lang/language.json';
import { route } from '@utils/Routes';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SystemSettingsProps {
    settings?: Record<string, string>;
    timezones?: Record<string, string>;
    dateFormats?: Record<string, string>;
    timeFormats?: Record<string, string>;
}

export default function SystemSettings({ settings = {}, timezones = {}, dateFormats = {}, timeFormats = {} }: SystemSettingsProps) {
    const { t: translate } = useTranslation();
    const pageProps = usePage().props;

    // Default settings
    const defaultSettings = {
        defaultLanguage: 'en',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        calendarStartDay: 'sunday',
        defaultTimezone: 'UTC',
        termsConditionsPage: '',
    };

    // Combine settings from props and page props
    const settingsData = Object.keys(settings).length > 0 ? settings : pageProps.settings || {};

    // Initialize state with merged settings
    const [systemSettings, setSystemSettings] = useState(() => ({
        defaultLanguage: settingsData.defaultLanguage || defaultSettings.defaultLanguage,
        dateFormat: settingsData.dateFormat || defaultSettings.dateFormat,
        timeFormat: settingsData.timeFormat || defaultSettings.timeFormat,
        calendarStartDay: settingsData.calendarStartDay || defaultSettings.calendarStartDay,
        defaultTimezone: settingsData.defaultTimezone || defaultSettings.defaultTimezone,
        termsConditionsPage: settingsData.termsConditionsPage || '',
    }));

    // Update state when settings change
    useEffect(() => {
        if (Object.keys(settingsData).length > 0) {
            // Create merged settings object
            const mergedSettings = Object.keys(defaultSettings).reduce<Record<string, any>>((acc, key) => {
                acc[key] = settingsData[key] || defaultSettings[key];
                return acc;
            }, {});

            setSystemSettings((prevSettings) => ({
                ...prevSettings,
                ...mergedSettings,
                termsConditionsPage: systemSettings.termsConditionsPage,
            }));
        }
    }, [settingsData]);

    // Handle system settings form changes
    const handleSystemSettingsChange = (field: string, value: string | boolean) => {
        setSystemSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const [processing, setProcessing] = useState(false);

    // Handle system settings form submission
    const submitSystemSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Create clean settings object
        const cleanSettings = {
            defaultLanguage: systemSettings.defaultLanguage,
            dateFormat: systemSettings.dateFormat,
            timeFormat: systemSettings.timeFormat,
            calendarStartDay: systemSettings.calendarStartDay,
            defaultTimezone: systemSettings.defaultTimezone,
        };

        const toastId = toast.loading(translate('Saving system settings...'));
        router.post(route('settings.system.update'), cleanSettings, {
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(toastId);
                setProcessing(false);
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    return (
        <SettingsSection
            title={translate('System Settings')}
            description={translate('Configure system-wide settings for your application')}
            action={
                <Button type="submit" disabled={processing} form="system-settings-form" size="sm" className="max-[1300px]:px-2.5">
                    <Save className="mr-2 h-4 w-4 max-[1300px]:mr-0" />
                    <span className="max-[1300px]:hidden">{processing ? translate('Saving...') : translate('Save Changes')}</span>
                </Button>
            }
        >
            <Card>
                <CardContent className="mt-6">
                    <form id="system-settings-form" onSubmit={submitSystemSettings} className="space-y-6">
                        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="defaultLanguage">{translate('Default Language')}</Label>
                                <Select
                                    value={systemSettings.defaultLanguage}
                                    onValueChange={(value) => {
                                        handleSystemSettingsChange('defaultLanguage', value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select...')}>
                                            {systemSettings.default_language &&
                                                (() => {
                                                    const selectedLang = languageData.find((lang) => lang.code === systemSettings.default_language);
                                                    return selectedLang ? (
                                                        <div className="flex items-center space-x-2">
                                                            <span>{selectedLang.name}</span>
                                                        </div>
                                                    ) : (
                                                        translate('Select...')
                                                    );
                                                })()}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {languageData.map((language) => (
                                            <SelectItem key={language.code} value={language.code}>
                                                <div className="flex items-center space-x-2">
                                                    <span>{language.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="dateFormat">{translate('Date Format')}</Label>
                                <Select
                                    value={systemSettings.dateFormat}
                                    onValueChange={(value) => {
                                        handleSystemSettingsChange('dateFormat', value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select date format')} />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {Object.keys(dateFormats || {}).length > 0 ? (
                                            Object.entries(dateFormats || {}).map(([format, example]) => (
                                                <SelectItem key={format} value={format}>
                                                    <div className="flex w-full min-w-0 items-center justify-between">
                                                        <span className="shrink-0 whitespace-nowrap">{format}</span>
                                                        <span className="text-muted-foreground ml-4 truncate text-sm">({example})</span>
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

                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="timeFormat">{translate('Time Format')}</Label>
                                <Select
                                    value={systemSettings.timeFormat}
                                    onValueChange={(value) => {
                                        handleSystemSettingsChange('timeFormat', value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select time format')} />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {Object.keys(timeFormats || {}).length > 0 ? (
                                            Object.entries(timeFormats || {}).map(([format, example]) => (
                                                <SelectItem key={format} value={format}>
                                                    <div className="flex w-full min-w-0 items-center justify-between">
                                                        <span className="shrink-0 whitespace-nowrap">{format}</span>
                                                        <span className="text-muted-foreground ml-4 truncate text-sm">({example})</span>
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

                            <div className="grid min-w-0 gap-2">
                                <Label htmlFor="calendarStartDay">{translate('Calendar Start Day')}</Label>
                                <Select
                                    value={systemSettings.calendarStartDay}
                                    onValueChange={(value) => {
                                        handleSystemSettingsChange('calendarStartDay', value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select start day')} />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        <SelectItem value="sunday">{translate('Sunday')}</SelectItem>
                                        <SelectItem value="monday">{translate('Monday')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="defaultTimezone">{translate('Default Timezone')}</Label>
                                <Select
                                    value={systemSettings.defaultTimezone}
                                    onValueChange={(value) => {
                                        handleSystemSettingsChange('defaultTimezone', value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select timezone')} />
                                    </SelectTrigger>
                                    <SelectContent position="popper">
                                        {Object.keys(timezones || {}).length > 0 ? (
                                            Object.entries(timezones || {}).map(([timezone, description]) => (
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
