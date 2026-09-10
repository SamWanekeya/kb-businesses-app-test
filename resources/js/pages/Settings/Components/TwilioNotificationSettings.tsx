import { toast } from '@components/CustomToast';
import { SettingsSection } from '@components/settings-section';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Switch } from '@components/UserInterface/Switch';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import axios from 'axios';
import { Bell, Key, MessageSquare, Phone, Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface NotificationItem {
    name: string;
    label: string;
    description?: string;
}

export default function TwilioNotificationSettings() {
    const { t: translate } = useTranslation();
    const [notifications, setNotifications] = useState<Record<string, boolean>>({});
    const [availableNotifications, setAvailableNotifications] = useState<NotificationItem[]>([]);
    const [twilioSettings, setTwilioSettings] = useState({
        twilio_sid: '',
        twilio_token: '',
        twilio_from: '',
    });
    const [testPhone, setTestPhone] = useState('');
    const [isSendingSMS, setIsSendingSMS] = useState(false);
    const [testSMSResult, setTestSMSResult] = useState<{ success: boolean; message: string } | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        // Load available notifications
        axios
            .get(route('settings.twilio-notifications.available'))
            .then((response) => {
                setAvailableNotifications(response.data);
            })
            .catch((error) => {});

        // Load current settings
        axios
            .get(route('settings.twilio-notifications.get'))
            .then((response) => {
                setNotifications(response.data);
            })
            .catch((error) => {});

        // Load Twilio configuration
        axios
            .get(route('settings.twilio-config.get'))
            .then((response) => {
                setTwilioSettings(response.data);
            })
            .catch((error) => {});
    }, []);

    const handleToggle = (key: string, enabled: boolean) => {
        setNotifications((prev) => ({
            ...prev,
            [key]: enabled,
        }));
    };

    const handleConfigChange = (key: string, value: string) => {
        setTwilioSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const data = {
            ...notifications,
            ...twilioSettings,
        };

        toast.loading(translate('Saving twilio settings...'));

        router.post(route('settings.twilio-notifications.update'), data, {
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
                    toast.success('Twilio settings updated successfully.');
                }
            },
            onError: () => {
                setProcessing(false);
                toast.error('Failed to update Twilio settings.');
            },
        });
    };

    const handleTestSMS = (e: React.FormEvent) => {
        e.preventDefault();
        if (!testPhone) {
            toast.error(translate('Please enter a phone number'));
            return;
        }

        setIsSendingSMS(true);
        setTestSMSResult(null);
        toast.loading(translate('Sending test SMS...'));

        router.post(
            route('settings.sms.test'),
            { phone: testPhone },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsSendingSMS(false);
                    toast.dismiss();
                    const successMessage = page.props.flash?.success;
                    const errorMessage = page.props.flash?.error;

                    if (successMessage) {
                        toast.success(successMessage);
                        setTestSMSResult({ success: true, message: successMessage });
                    } else if (errorMessage) {
                        toast.error(errorMessage);
                        setTestSMSResult({ success: false, message: errorMessage });
                    } else {
                        const message = translate('Test SMS sent successfully to {{phone}}', { phone: testPhone });
                        toast.success(message);
                        setTestSMSResult({ success: true, message });
                    }

                    // Reset result after 5 seconds
                    setTimeout(() => {
                        setTestSMSResult(null);
                    }, 5000);
                },
                onError: (errors) => {
                    setIsSendingSMS(false);
                    toast.dismiss();
                    const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to send test SMS');
                    toast.error(errorMessage);
                    setTestSMSResult({ success: false, message: errorMessage });

                    // Reset result after 5 seconds
                    setTimeout(() => {
                        setTestSMSResult(null);
                    }, 5000);
                },
            },
        );
    };

    return (
        <SettingsSection
            title={translate('Twilio Settings')}
            description={translate('Configure Twilio settings for SMS notifications and communications')}
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
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <Label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Key className="h-4 w-4" />
                                        {translate('Account SID')}
                                    </Label>
                                    <Input
                                        value={twilioSettings.twilio_sid}
                                        onChange={(e) => handleConfigChange('twilio_sid', e.target.value)}
                                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="font-mono"
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Key className="h-4 w-4" />
                                        {translate('Auth Token')}
                                    </Label>
                                    <Input
                                        type="password"
                                        value={twilioSettings.twilio_token}
                                        onChange={(e) => handleConfigChange('twilio_token', e.target.value)}
                                        placeholder="••••••••••••••••••••"
                                        className="font-mono"
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Phone className="h-4 w-4" />
                                        {translate('From Phone Number')}
                                    </Label>
                                    <Input
                                        value={twilioSettings.twilio_from}
                                        onChange={(e) => handleConfigChange('twilio_from', e.target.value)}
                                        placeholder="+1234567890"
                                        className="font-mono"
                                    />
                                </div>
                            </div>

                            {/* SMS Notification Settings */}
                            <div className="my-6 flex items-center gap-2">
                                <Bell className="h-5 w-5 text-emerald-500" />
                                <h3 className="font-medium text-gray-900">{translate('Twilio Notification Settings')}</h3>
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
                            <h3 className="font-medium text-gray-900">{translate('Test Twilio Configuration')}</h3>
                        </div>
                        <form onSubmit={handleTestSMS} className="space-y-4">
                            <div>
                                <Label className="block text-sm font-medium text-gray-700">{translate('Send Test To')}</Label>
                                <Input
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    placeholder="+1234567890"
                                    className="font-mono"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {translate('Enter a phone number with country code')} {translate('e.g., +1234567890')}
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
                                disabled={isSendingSMS || !testPhone}
                            >
                                {isSendingSMS ? (
                                    <>
                                        <span className="mr-2 animate-spin">◌</span>
                                        {translate('Sending...')}
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        {translate('Send Test SMS')}
                                    </>
                                )}
                            </Button>
                        </form>
                        {/* Setup Instructions */}
                        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-6">
                            <div className="mb-2 flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                                <h3 className="font-medium text-blue-900">{translate('Twilio Setup Instructions')}</h3>
                            </div>
                            <ol className="space-y-2 text-xs text-blue-800">
                                <li>
                                    {translate('1. Sign up for a Twilio account at')}{' '}
                                    <span className="text-blue-600 underline">
                                        <a href="https://www.twilio.com">twilio.com</a>{' '}
                                    </span>
                                </li>
                                <li>{translate('2. Get your Account SID and Auth Token from the Twilio Console')}</li>
                                <li>{translate('3. Purchase a phone number or use a trial number')}</li>
                                <li>{translate('4. Enter your credentials and admin phone number')}</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </SettingsSection>
    );
}
