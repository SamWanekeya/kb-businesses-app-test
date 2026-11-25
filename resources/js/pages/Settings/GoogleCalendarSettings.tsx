import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Switch } from '@components/UserInterface/Switch';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { CalendarDays, CheckCircle2, FileJson, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface GoogleCalendarSettingsProps {
    settings?: Record<string, string>;
}

export default function GoogleCalendarSettings({ settings = {} }: GoogleCalendarSettingsProps) {
    const { t: translate } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [formData, setFormData] = useState({
        googleCalendarEnabled: settings.googleCalendarEnabled === '1' || settings.googleCalendarEnabled === 'true',
        googleCalendarId: settings.googleCalendarId || '',
    });
    const [jsonFile, setJsonFile] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const data = new FormData();
        data.append('googleCalendarEnabled', formData.googleCalendarEnabled ? '1' : '0');
        data.append('googleCalendarId', formData.googleCalendarId);
        if (jsonFile) {
            data.append('googleCalendarJson', jsonFile);
        }

        const toastId = toast.loading(translate('Updating Google Calendar settings...'));
        router.post(route('settings.google-calendar.update'), data, {
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(toastId);
                setIsLoading(false);
                setJsonFile(null);
            },
            onError: (errors) => {
                setIsLoading(false);
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    const handleSync = () => {
        setIsSyncing(true);
        const toastId = toast.loading(translate('Saving Google Calendar settings...'));

        router.post(
            route('settings.google-calendar.sync'),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.dismiss(toastId);
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    Object.values(errors).forEach((message) => toast.error(translate(message)));
                },
            },
        );
    };

    return (
        <SettingsSection
            title={translate('Google Calendar')}
            description={translate('Configure Google Calendar integration for appointment synchronization')}
            action={
                <Button type="submit" form="google-calendar-form" disabled={isLoading} size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <form id="google-calendar-form" onSubmit={handleSubmit} className="space-y-6">
                <div aria-hidden="true" className="border-border border-t" />
                {/* Integration status */}
                <div className="border-border bg-card flex items-center justify-between gap-4 rounded-xl border p-4 sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                        <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                            <CalendarDays className="text-muted-foreground size-5" />
                        </div>

                        <div className="min-w-0 space-y-1">
                            <Label htmlFor="googleCalendarEnabled" className="font-medium">
                                {translate('Enable Google Calendar')}
                            </Label>

                            <p className="text-muted-foreground text-sm">{translate('Enable Google Calendar integration for appointments')}</p>
                        </div>
                    </div>

                    <Switch
                        id="googleCalendarEnabled"
                        checked={formData.googleCalendarEnabled}
                        onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                                ...prev,
                                googleCalendarEnabled: checked,
                            }));
                        }}
                    />
                </div>

                {/* Integration credentials */}
                <fieldset disabled={!formData.googleCalendarEnabled} className="space-y-5 disabled:opacity-60">
                    <div className="space-y-1">
                        <h3 className="text-foreground text-sm font-semibold">{translate('Connection credentials')}</h3>

                        <p className="text-muted-foreground text-sm">
                            {translate('Provide the credentials required to connect your Google Calendar')}
                        </p>
                    </div>

                    <div className="border-border bg-card space-y-5 rounded-xl border p-4 sm:p-5">
                        {/* Calendar ID */}
                        <div className="space-y-2">
                            <Input
                                inputIdentifier="googleCalendarId"
                                label={translate('Google Calendar ID')}
                                required
                                inputType="text"
                                inputMode="text"
                                value={formData.googleCalendarId}
                                onChange={(e) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        googleCalendarId: e.target.value,
                                    }));
                                }}
                            />
                        </div>

                        {/* Service account credentials */}
                        <div className="space-y-3">
                            <Input
                                inputIdentifier="googleCalendarJson"
                                label={translate('Service account JSON file')}
                                inputType="file"
                                accept=".json"
                                onChange={(e) => {
                                    setJsonFile(e.target.files?.[0] || null);
                                }}
                            />

                            {jsonFile && (
                                <div className="border-border bg-muted/40 flex items-center gap-3 rounded-lg border p-3">
                                    <div className="bg-background flex size-9 shrink-0 items-center justify-center rounded-lg">
                                        <FileJson className="size-[18px]" aria-hidden="true" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-muted-foreground text-xs">{translate('Selected file')}</p>

                                        <p className="text-foreground truncate text-sm font-medium">{jsonFile.name}</p>
                                    </div>

                                    <CheckCircle2 className="text-primary size-4 shrink-0" />
                                </div>
                            )}

                            <p className="text-muted-foreground text-xs">{translate('Upload your Google service account JSON credentials')}</p>
                        </div>
                    </div>

                    {/* Synchronization */}
                    <div className="border-border bg-muted/20 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <p className="text-foreground text-sm font-medium">{translate('Connection test')}</p>

                            <p className="text-muted-foreground text-xs">
                                {translate('Verify that your Google Calendar integration is working correctly')}
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSync}
                            disabled={!formData.googleCalendarEnabled || isSyncing}
                            className="w-full shrink-0 sm:w-auto"
                        >
                            <RefreshCw className={`mr-2 size-4 ${isSyncing ? 'animate-spin' : ''}`} />

                            {isSyncing ? translate('Syncing...') : translate('Test sync')}
                        </Button>
                    </div>
                </fieldset>
            </form>
        </SettingsSection>
    );
}
