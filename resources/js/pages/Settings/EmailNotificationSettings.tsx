import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Label } from '@components/UserInterface/Label';
import { Switch } from '@components/UserInterface/Switch';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
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
            title={translate('Email Notification Settings')}
            description={translate('Configure which email notifications are sent')}
            action={
                <Button onClick={handleSave} disabled={processing} size="sm" className="max-[1300px]:px-2.5">
                    <Save className="mr-2 h-4 w-4 max-[1300px]:mr-0" />
                    <span className="max-[1300px]:hidden">{processing ? translate('Saving...') : translate('Save Changes')}</span>
                </Button>
            }
        >
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4 min-[1300px]:grid-cols-2 min-[1600px]:grid-cols-3">
                        {availableNotifications.map((item) => (
                            <div key={item.name} className="flex items-center justify-between rounded-md border p-4">
                                <div>
                                    <Label htmlFor={item.name} className="text-sm font-medium">
                                        {translate(item.label)}
                                    </Label>
                                </div>
                                <Switch
                                    id={item.name}
                                    checked={notifications[item.name] || false}
                                    onCheckedChange={(checked) => {
                                        handleToggle(item.name, checked);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </SettingsSection>
    );
}
