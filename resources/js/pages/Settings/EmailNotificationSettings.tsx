import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Label } from '@components/UserInterface/Label';
import { Switch } from '@components/UserInterface/Switch';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface NotificationItem {
    name: string;
    label: string;
    description?: string;
}

export default function EmailNotificationSettings() {
    const { t: translate } = useTranslation();
    const [notifications, setNotifications] = useState<Record<string, boolean>>({});
    const [availableNotifications, setAvailableNotifications] = useState<NotificationItem[]>([]);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Load available notifications
        fetch(route('settings.email-notifications.available'), {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setAvailableNotifications(data);
            })
            .catch(() => {});

        // Load current settings
        fetch(route('settings.email-notifications.get'), {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setNotifications(data);
            })
            .catch(() => {});
    }, []);

    const handleToggle = (key: string, enabled: boolean) => {
        setNotifications((prev) => ({
            ...prev,
            [key]: enabled,
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const toastId = toast.loading(translate('Saving email notification settings...'));
        router.post(route('settings.email-notifications.update'), notifications, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                setProcessing(false);
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    return (
        <SettingsSection
            title={translate('Email notification')}
            description={translate('Configure which email notifications are sent')}
            action={
                <Button onClick={handleSave} disabled={processing} size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <div aria-hidden="true" className="border-border border-t" />
            <div className="grid grid-cols-1 gap-3 space-y-6 py-7 sm:grid-cols-2 xl:grid-cols-3">
                {availableNotifications.map((item) => (
                    <div
                        key={item.name}
                        className="border-border bg-card hover:bg-muted/30 flex min-h-20 items-center justify-between gap-4 rounded-xl border p-4 transition-colors"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <div className={`size-2 shrink-0 rounded-full ${notifications[item.name] ? 'bg-primary' : 'bg-muted-foreground/40'}`} />

                            <Label htmlFor={item.name} className="text-foreground cursor-pointer text-sm leading-relaxed font-medium">
                                {translate(item.label)}
                            </Label>
                        </div>

                        <Switch
                            id={item.name}
                            checked={notifications[item.name] || false}
                            onCheckedChange={(checked) => handleToggle(item.name, checked)}
                        />
                    </div>
                ))}
            </div>
        </SettingsSection>
    );
}
