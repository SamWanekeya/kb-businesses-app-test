import { toast } from '@components/CustomToast';
import { SettingsSection } from '@components/settings-section';
import { Button } from '@components/UserInterface/button';
import { Input } from '@components/UserInterface/input';
import { Label } from '@components/UserInterface/label';
import { Switch } from '@components/UserInterface/switch';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import axios from 'axios';
import { Bell, Link, Save, Send, Slack } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface NotificationItem {
    name: string;
    label: string;
    description?: string;
}

export default function SlackNotificationSettings() {
    const { t: translate } = useTranslation();
    const [notifications, setNotifications] = useState<Record<string, boolean>>({});
    const [availableNotifications, setAvailableNotifications] = useState<NotificationItem[]>([]);
    const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [testMessageResult, setTestMessageResult] = useState<{ success: boolean; message: string } | null>(null);
    const [isAvailableSlackWebhookUrl, setIsAvailableSlackWebhookUrl] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Load available notifications
        axios
            .get(route('settings.slack-notifications.available'))
            .then((response) => {
                setAvailableNotifications(response.data);
            })
            .catch((error) => {});

        // Load current settings
        axios
            .get(route('settings.slack-notifications.get'))
            .then((response) => {
                setNotifications(response.data);
            })
            .catch((error) => {});

        // Load Slack configuration
        axios
            .get(route('settings.slack-config.get'))
            .then((response) => {
                setSlackWebhookUrl(response.data.slack_webhook_url || '');
                setIsAvailableSlackWebhookUrl(response.data.slack_webhook_url);
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
        setProcessing(true);
        e.preventDefault();
        const data = {
            ...notifications,
            slack_webhook_url: slackWebhookUrl,
        };

        toast.loading(translate('Saving slack settings...'));

        router.post(route('settings.slack-notifications.update'), data, {
            preserveScroll: true,
            onSuccess: (page) => {
                setProcessing(false);
                toast.dismiss();
                const successMessage = page.props.flash?.success;
                const errorMessage = page.props.flash?.error;

                if (successMessage) {
                    toast.success(successMessage);
                    setIsAvailableSlackWebhookUrl(slackWebhookUrl);
                } else if (errorMessage) {
                    setSlackWebhookUrl(isAvailableSlackWebhookUrl);
                    toast.error(errorMessage);
                } else {
                    toast.success('Slack settings updated successfully.');
                }
            },
            onError: () => {
                setProcessing(false);
                toast.error('Failed to update Slack settings.');
            },
        });
    };

    const handleTestMessage = (e: React.FormEvent) => {
        e.preventDefault();

        setIsSendingMessage(true);
        setTestMessageResult(null);
        toast.loading(translate('Sending test message...'));

        router.post(
            route('settings.slack.test'),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsSendingMessage(false);
                    toast.dismiss();
                    const successMessage = page.props.flash?.success;
                    const errorMessage = page.props.flash?.error;

                    if (successMessage) {
                        toast.success(successMessage);
                        setTestMessageResult({ success: true, message: successMessage });
                    } else if (errorMessage) {
                        toast.error(errorMessage);
                        setTestMessageResult({ success: false, message: errorMessage });
                    } else {
                        const message = translate('Test message sent successfully');
                        toast.success(message);
                        setTestMessageResult({ success: true, message });
                    }

                    setTimeout(() => {
                        setTestMessageResult(null);
                    }, 5000);
                },
                onError: (errors) => {
                    setIsSendingMessage(false);
                    toast.dismiss();
                    const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to send test message');
                    toast.error(errorMessage);
                    setTestMessageResult({ success: false, message: errorMessage });

                    setTimeout(() => {
                        setTestMessageResult(null);
                    }, 5000);
                },
            },
        );
    };

    return (
        <SettingsSection
            title={translate('Slack Settings')}
            description={translate('Configure Slack settings for notifications and communications')}
            action={
                <Button onClick={handleSave} disabled={processing} size="sm" className="max-[1300px]:px-2.5">
                    <Save className="mr-2 h-4 w-4 max-[1300px]:mr-0" />
                    <span className="max-[1300px]:hidden">{processing ? translate('Saving...') : translate('Save Changes')}</span>
                </Button>
            }
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-6 min-[1600px]:grid-cols-3">
                    {/* Left Column - Configuration */}
                    <div className="space-y-6 min-[1600px]:col-span-2">
                        {/* Credentials */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <Label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Link className="h-4 w-4" />
                                        {translate('Webhook URL')}
                                    </Label>
                                    <Input
                                        value={slackWebhookUrl}
                                        required={true}
                                        onChange={(e) => setSlackWebhookUrl(e.target.value)}
                                        placeholder="https://hooks.slack.com/services/..."
                                        className="font-mono"
                                    />
                                </div>
                            </div>

                            {/* Slack Notification Settings */}
                            <div className="my-6 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-emerald-500" />
                                <h3 className="font-medium text-gray-900">{translate('Slack Notification Settings')}</h3>
                            </div>
                            {availableNotifications.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 min-[1300px]:grid-cols-2">
                                    {availableNotifications.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                                            <Label htmlFor={item.name} className="text-sm font-medium">
                                                {translate(item.label)}
                                            </Label>
                                            <Switch
                                                id={item.name}
                                                checked={notifications[item.name] || false}
                                                onCheckedChange={(checked) => handleToggle(item.name, checked)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-500">{translate('No notification template available')}</div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Test Configuration */}
                    <div className="h-fit rounded-lg border border-gray-200 bg-white p-6 min-[1600px]:col-span-1">
                        <div className="mb-4 flex items-center gap-2">
                            <Send className="h-4 w-4 text-emerald-500" />
                            <h3 className="font-medium text-gray-900">{translate('Test Slack Configuration')}</h3>
                        </div>
                        <form onSubmit={handleTestMessage} className="space-y-4">
                            <p className="text-xs text-gray-600">{translate('Send a test message to verify your slack webhook.')}</p>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                                disabled={isSendingMessage || !isAvailableSlackWebhookUrl}
                            >
                                {isSendingMessage ? (
                                    <>
                                        <span className="mr-2 animate-spin">◌</span>
                                        {translate('Sending...')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        {translate('Send Test Message')}
                                    </>
                                )}
                            </Button>
                        </form>
                        {/* Setup Instructions */}
                        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-6">
                            <div className="mb-2 flex items-center gap-2">
                                <Slack className="h-4 w-4 text-blue-600" />
                                <h3 className="text-sm font-medium text-blue-900">{translate('Slack Setup Instructions')}</h3>
                            </div>
                            <ol className="space-y-2 text-xs text-blue-800">
                                <li>{translate('1. Go to your Slack workspace')}</li>
                                <li>{translate('2. Create a new Slack app')}</li>
                                <li>{translate('3. Enable Incoming Webhooks')}</li>
                                <li>{translate('4. Add webhook to workspace')}</li>
                                <li>{translate('5. Copy the webhook URL here')}</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsSection>
    );
}
