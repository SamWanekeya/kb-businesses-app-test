import { toast } from '@components/CustomToast';
import { SettingsSection } from '@components/settings-section';
import { Button } from '@components/UserInterface/button';
import { Card, CardContent } from '@components/UserInterface/card';
import { Label } from '@components/UserInterface/label';
import { Switch } from '@components/UserInterface/switch';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import axios from 'axios';
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
        axios
            .get(route('settings.email-notifications.available'))
            .then((response) => {
                setAvailableNotifications(response.data);
            })
            .catch((error) => {});

        // Load current settings
        axios
            .get(route('settings.email-notifications.get'))
            .then((response) => {
                setNotifications(response.data);
            })
            .catch((error) => {});
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
        toast.loading(translate('Saving email notification settings...'));
        router.post(route('settings.email-notifications.update'), notifications, {
            preserveScroll: true,
            onSuccess: (page) => {
                setProcessing(false);
                toast.dismiss();
                const successMessage = page.props.flash?.success;
                const errorMessage = page.props.flash?.error;

                if (successMessage) {
                    toast.success(successMessage);
                } else if (errorMessage) {
                    toast.error(errorMessage);
                } else {
                    toast.success('Email notification settings updated successfully.');
                }
            },
            onError: () => {
                setProcessing(false);
                toast.error('Failed to update email notification settings.');
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
                                    onCheckedChange={(checked) => handleToggle(item.name, checked)}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </SettingsSection>
    );
}
