import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { router, usePage } from '@inertiajs/react';
import languageData from '@lang/language.json';
import { route } from '@utils/Routes';
import { Clock, Globe2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type SettingValue = string | number | boolean | undefined;
type SettingsRecord = Record<string, SettingValue>;

interface SystemSettingsState {
    default_language: string;
    date_format: string;
    time_format: string;
    calendar_start_day: string;
    default_timezone: string;
}

interface SystemSettingsProps {
    /** Initial settings returned by the server. */
    settings?: Record<string, string>;

    /** Available timezone identifiers mapped to display descriptions. */
    timeZones?: Record<string, string>;

    /** Supported date formats mapped to human-readable examples. */
    dateFormats?: Record<string, string>;

    /** Supported time formats mapped to human-readable examples. */
    timeFormats?: Record<string, string>;

    /** Controls organization-specific fields and options. */
    isOrganizationUser?: boolean;
}

const EMPTY_RECORD: Record<string, string> = {};

const DEFAULT_SETTINGS: SystemSettingsState = {
    default_language: 'en',
    date_format: 'd/m/Y',
    time_format: '12h',
    calendar_start_day: 'sunday',
    default_timezone: 'UTC',
};

/**
 * Converts a server-side setting into a boolean without relying on
 * JavaScript truthiness, which would incorrectly treat "0" as true.
 */
function toBoolean(value: SettingValue): boolean {
    return value === true || value === 1 || value === '1';
}

/**
 * Resolves an incoming setting to a string, preserving the configured
 * default when the server value is absent or empty.
 */
function getStringSetting(settings: SettingsRecord, key: keyof SystemSettingsState): string {
    const value = settings[key];

    return typeof value === 'string' && value.length > 0 ? value : typeof value === 'number' ? String(value) : DEFAULT_SETTINGS[key];
}

/**
 * Normalizes server settings into the strongly typed form state.
 * This keeps backend serialization details out of the rendering logic.
 */
function normalizeSettings(settings: SettingsRecord): SystemSettingsState {
    return {
        default_language: getStringSetting(settings, 'default_language'),
        date_format: getStringSetting(settings, 'date_format'),
        time_format: getStringSetting(settings, 'time_format'),
        calendar_start_day: getStringSetting(settings, 'calendar_start_day'),
        default_timezone: getStringSetting(settings, 'default_timezone'),
    };
}

/**
 * SystemSettings
 *
 * Configures system-wide language, date and time formats, calendar
 * preferences, timezone, and organization IP restriction settings.
 *
 * Responsibilities:
 * - Normalize server-provided values into controlled form state.
 * - Synchronize the form when its initial server data changes.
 * - Submit validated form values through the existing Inertia endpoint.
 * - Provide searchable timezone and localized option lists.
 *
 * Accessibility:
 * - Associates visible labels with their respective controls.
 * - Provides an accessible name for the timezone search input.
 * - Keeps the save action connected to the form.
 *
 * Performance:
 * - Uses stable defaults to prevent unnecessary effect execution.
 * - Memoizes normalized settings and filtered timezone options.
 * - Uses stable callbacks for form updates and submission.
 *
 * Extension points:
 * - Add new settings to SystemSettingsState and normalizeSettings.
 * - Keep server-side validation and authorization in Laravel.
 */
export default function SystemSettings({
    settings = EMPTY_RECORD,
    timeZones = EMPTY_RECORD,
    dateFormats = EMPTY_RECORD,
    timeFormats = EMPTY_RECORD,
    isOrganizationUser = false,
}: SystemSettingsProps) {
    const { t: translate } = useTranslation();
    const pageProps = usePage().props;

    const fallbackSettings = pageProps.settings as SettingsRecord | undefined;

    /**
     * Explicit settings props take precedence. Page props remain a fallback
     * for existing usages that do not pass a populated settings object.
     */
    const settingsData = useMemo<SettingsRecord>(() => {
        return Object.keys(settings).length > 0 ? settings : (fallbackSettings ?? EMPTY_RECORD);
    }, [fallbackSettings, settings]);

    const normalizedSettings = useMemo(() => normalizeSettings(settingsData), [settingsData]);

    const [systemSettings, setSystemSettings] = useState<SystemSettingsState>(() => normalizedSettings);

    const [timezoneSearch, setTimezoneSearch] = useState('');

    /**
     * Keep controlled inputs synchronized with fresh server data, including
     * after Inertia navigation or a server-driven settings refresh.
     */
    useEffect(() => {
        setSystemSettings(normalizedSettings);
    }, [normalizedSettings]);

    /**
     * Updates one known setting while preserving the remaining form state.
     */
    const handleSystemSettingsChange = useCallback(<K extends keyof SystemSettingsState>(field: K, value: SystemSettingsState[K]) => {
        setSystemSettings((current) => ({
            ...current,
            [field]: value,
        }));
    }, []);

    /**
     * Submits the current form values to the existing update endpoint.
     * Server-side validation errors are surfaced through translated toasts.
     */
    const submitSystemSettings = useCallback(
        (event: Parameters<NonNullable<React.ComponentProps<'form'>['onSubmit']>>[0]) => {
            event.preventDefault();

            const payload = {
                default_language: systemSettings.default_language,
                date_format: systemSettings.date_format,
                time_format: systemSettings.time_format,
                calendar_start_day: systemSettings.calendar_start_day,
                default_timezone: systemSettings.default_timezone,
            };

            const toastId = toast.loading(translate('Saving system settings...'));

            router.post(route('settings.system.update'), payload, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.dismiss(toastId);
                },
                onError: (errors) => {
                    toast.dismiss(toastId);

                    Object.values(errors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },
            });
        },
        [systemSettings, translate],
    );

    /**
     * Filter timezone identifiers and descriptions case-insensitively.
     * The normalized query avoids repeated lowercasing during filtering.
     */
    const filteredTimezones = useMemo(() => {
        const query = timezoneSearch.trim().toLowerCase();

        return Object.entries(timeZones).filter(
            ([timezone, description]) => timezone.toLowerCase().includes(query) || description.toLowerCase().includes(query),
        );
    }, [timeZones, timezoneSearch]);

    const handleTimezoneSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setTimezoneSearch(event.target.value);
    }, []);

    const handleTimezoneChange = useCallback(
        (value: string) => {
            handleSystemSettingsChange('default_timezone', value);
        },
        [handleSystemSettingsChange],
    );

    const handleLanguageChange = useCallback(
        (value: string) => {
            handleSystemSettingsChange('default_language', value);
        },
        [handleSystemSettingsChange],
    );

    const handleDateFormatChange = useCallback(
        (value: string) => {
            handleSystemSettingsChange('date_format', value);
        },
        [handleSystemSettingsChange],
    );

    const handleTimeFormatChange = useCallback(
        (value: string) => {
            handleSystemSettingsChange('time_format', value);
        },
        [handleSystemSettingsChange],
    );

    const handleCalendarStartDayChange = useCallback(
        (value: string) => {
            handleSystemSettingsChange('calendar_start_day', value);
        },
        [handleSystemSettingsChange],
    );

    const selectedLanguage = useMemo(
        () => languageData.find((language) => language.code === systemSettings.default_language),
        [systemSettings.default_language],
    );

    return (
        <SettingsSection
            title={translate('System')}
            description={translate('Configure the language, date and time formats, timezone, and other platform-wide preferences.')}
            action={
                <Button type="submit" form="system-settings-form" size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <form id="system-settings-form" autoComplete="off" onSubmit={submitSystemSettings}>
                <div aria-hidden="true" className="border-border border-t" />
                {/* Regional preferences */}
                <section className="space-y-5 py-7 first:pt-0">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                            <Globe2 className="size-[18px]" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <h3 className="text-foreground text-sm font-semibold tracking-tight">{translate('Regional preferences')}</h3>

                            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                                {translate('Set the default language and regional date and time formats used throughout the platform.')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        {/* Default language */}
                        <div className="grid content-start gap-2">
                            <Select value={systemSettings.default_language} onValueChange={handleLanguageChange}>
                                <SelectTrigger id="default_language" label={translate('Default language')}>
                                    <SelectValue placeholder={translate('Select...')}>{selectedLanguage?.name ?? translate('Select...')}</SelectValue>
                                </SelectTrigger>

                                <SelectContent>
                                    {languageData.map((language) => (
                                        <SelectItem key={language.code} value={language.code}>
                                            {language.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date format */}
                        <div className="grid content-start gap-2">
                            <Select value={systemSettings.date_format} onValueChange={handleDateFormatChange}>
                                <SelectTrigger id="date_format" label={translate('Date format')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent>
                                    {Object.entries(dateFormats).map(([format, example]) => (
                                        <SelectItem key={format} value={format}>
                                            <span className="flex items-center justify-between gap-4">
                                                <span>{format}</span>

                                                <span className="text-muted-foreground text-xs">{example}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Time format */}
                        <div className="grid content-start gap-2">
                            <Select value={systemSettings.time_format} onValueChange={handleTimeFormatChange}>
                                <SelectTrigger id="time_format" label={translate('Time format')}>
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>

                                <SelectContent>
                                    {Object.entries(timeFormats).map(([format, example]) => (
                                        <SelectItem key={format} value={format}>
                                            <span className="flex items-center justify-between gap-4">
                                                <span>{format}</span>

                                                <span className="text-muted-foreground text-xs">{example}</span>
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Calendar start day */}
                        {!isOrganizationUser && (
                            <div className="grid content-start gap-2">
                                <Select value={systemSettings.calendar_start_day} onValueChange={handleCalendarStartDayChange}>
                                    <SelectTrigger id="calendar_start_day" label={translate('Calendar start day')}>
                                        <SelectValue placeholder={translate('Select...')} />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="sunday">{translate('Sunday')}</SelectItem>

                                        <SelectItem value="monday">{translate('Monday')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                </section>
                <div aria-hidden="true" className="border-border border-t" />
                {/* Timezone preferences */}
                <section className="space-y-5 py-7">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                            <Clock className="size-[18px]" aria-hidden="true" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <h3 className="text-foreground text-sm font-semibold tracking-tight">{translate('Timezone')}</h3>

                            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                                {translate('Choose the timezone used to display dates and times throughout your workspace.')}
                            </p>
                        </div>
                    </div>

                    <div className="grid min-w-0 gap-2">
                        <Select value={systemSettings.default_timezone} onValueChange={handleTimezoneChange}>
                            <SelectTrigger id="default_timezone" label={translate('Default timezone')}>
                                <SelectValue placeholder={translate('Select...')} />
                            </SelectTrigger>

                            <SelectContent>
                                <div className="border-border bg-popover sticky top-0 z-10 border-b p-2">
                                    <Input
                                        value={timezoneSearch}
                                        onChange={handleTimezoneSearchChange}
                                        aria-label={translate('Search timezones')}
                                        placeholder={translate('Search timezones...')}
                                        autoComplete="off"
                                        className="h-9"
                                    />
                                </div>

                                <div className="max-h-60 overflow-y-auto">
                                    {filteredTimezones.length > 0 ? (
                                        filteredTimezones.map(([timezone, description]) => (
                                            <SelectItem key={timezone} value={timezone}>
                                                {description}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <p role="status" className="text-muted-foreground px-3 py-6 text-center text-sm">
                                            {translate('No timezones found.')}
                                        </p>
                                    )}
                                </div>
                            </SelectContent>
                        </Select>

                        <p className="text-muted-foreground text-xs leading-relaxed">
                            {translate('This setting determines how dates and times are presented across the platform.')}
                        </p>
                    </div>
                </section>
            </form>
        </SettingsSection>
    );
}
