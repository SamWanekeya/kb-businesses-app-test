import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Switch } from '@components/UserInterface/Switch';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Bell, MessagesCircle, Send } from 'lucide-react';
import React, { useEffect, useState } from 'react';
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
        fetch(route('settings.slack-notifications.available'), {
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
        fetch(route('settings.slack-notifications.get'), {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setNotifications(data);
            })
            .catch(() => {});

        // Load Slack configuration
        fetch(route('settings.slack-config.get'), {
            headers: {
                Accept: 'application/json',
            },
        })
            .then((response) => response.json())
            .then((data) => {
                setSlackWebhookUrl(data.slack_webhook_url || '');
                setIsAvailableSlackWebhookUrl(data.slack_webhook_url);
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
        setProcessing(true);
        e.preventDefault();
        const data = {
            ...notifications,
            slack_webhook_url: slackWebhookUrl,
        };

        const toastId = toast.loading(translate('Saving Slack settings...'));

        router.post(route('settings.slack-notifications.update'), data, {
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

    const handleTestMessage = (e: React.FormEvent) => {
        e.preventDefault();

        setIsSendingMessage(true);
        setTestMessageResult(null);
        const toastId = toast.loading(translate('Sending test message...'));

        router.post(
            route('settings.slack.test'),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSendingMessage(false);
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
            title={translate('Slack')}
            description={translate('Configure Slack settings for notifications and communications')}
            action={
                <Button onClick={handleSave} disabled={processing} size="lg">
                    {translate('Save')}
                </Button>
            }
        >
            <div aria-hidden="true" className="border-border border-t" />
            <div className="grid grid-cols-1 gap-6 space-y-6 py-7 2xl:grid-cols-3">
                {/* Main configuration */}
                <div className="space-y-6 2xl:col-span-2">
                    {/* Webhook configuration */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-foreground text-sm font-semibold">{translate('Connection credentials')}</h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                                {translate('Connect your Slack workspace using an incoming webhook URL')}
                            </p>
                        </div>

                        <Input
                            inputIdentifier="slackWebhookUrl"
                            value={slackWebhookUrl}
                            label={translate('Webhook URL')}
                            required
                            onChange={(e) => {
                                setSlackWebhookUrl(e.target.value);
                            }}
                        />
                    </div>

                    {/* Notification preferences */}
                    <div className="border-border space-y-4 border-t pt-6">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                                <Bell className="size-[18px]" aria-hidden="true" />
                            </div>

                            <div>
                                <h3 className="text-foreground text-sm font-semibold">{translate('Slack notification settings')}</h3>
                                <p className="text-muted-foreground mt-1 text-sm">{translate('Choose which notifications are sent to Slack')}</p>
                            </div>
                        </div>

                        {availableNotifications.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                {availableNotifications.map((item) => (
                                    <div
                                        key={item.name}
                                        className="border-border bg-card hover:bg-muted/30 flex min-h-16 items-center justify-between gap-4 rounded-xl border p-4 transition-colors"
                                    >
                                        <Label htmlFor={item.name} className="text-foreground cursor-pointer text-sm leading-relaxed font-medium">
                                            {translate(item.label)}
                                        </Label>

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
                        ) : (
                            <div className="border-border rounded-xl border border-dashed px-6 py-10 text-center">
                                <Bell className="text-muted-foreground mx-auto mb-3 size-5" />

                                <p className="text-muted-foreground text-sm">{translate('No notification template available')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Testing and setup sidebar */}
                <div className="space-y-5">
                    {/* Test configuration */}
                    <div className="border-border bg-card space-y-4 rounded-xl border p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                                <Send className="size-[18px]" aria-hidden="true" />
                            </div>

                            <div>
                                <h3 className="text-foreground text-sm font-semibold">{translate('Test Slack configuration')}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">{translate('Send a test message to verify your Slack webhook.')}</p>
                            </div>
                        </div>

                        <form autoComplete="off" onSubmit={handleTestMessage}>
                            <Button type="submit" className="w-full" disabled={isSendingMessage || !isAvailableSlackWebhookUrl}>
                                {isSendingMessage ? (
                                    <>
                                        <span className="mr-2 animate-spin">◌</span>
                                        {translate('Sending...')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 size-4" />
                                        {translate('Send test message')}
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Setup instructions */}
                    <div className="border-border bg-muted/20 space-y-4 rounded-xl border p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
                                <MessagesCircle className="size-[18px]" aria-hidden="true" />
                            </div>

                            <div>
                                <h3 className="text-foreground text-sm font-semibold">{translate('Slack setup instructions')}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {translate('Follow these steps to connect your Slack workspace')}
                                </p>
                            </div>
                        </div>

                        <ol className="text-muted-foreground space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="bg-background text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                    1
                                </span>
                                <span>{translate('Go to your Slack workspace')}</span>
                            </li>

                            <li className="flex items-start gap-3">
                                <span className="bg-background text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                    2
                                </span>
                                <span>{translate('Create a new Slack app')}</span>
                            </li>

                            <li className="flex items-start gap-3">
                                <span className="bg-background text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                    3
                                </span>
                                <span>{translate('Enable incoming webhooks')}</span>
                            </li>

                            <li className="flex items-start gap-3">
                                <span className="bg-background text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                    4
                                </span>
                                <span>{translate('Add webhook to workspace')}</span>
                            </li>

                            <li className="flex items-start gap-3">
                                <span className="bg-background text-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                                    5
                                </span>
                                <span>{translate('Copy the webhook URL here')}</span>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </SettingsSection>
    );
}
