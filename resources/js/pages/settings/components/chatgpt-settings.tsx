import { toast } from '@/components/custom-toast';
import { SettingsSection } from '@/components/settings-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router, usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ChatGptSettingsProps {
    settings?: Record<string, string>;
}

export default function ChatGptSettings({ settings = {} }: ChatGptSettingsProps) {
    const { t: translate } = useTranslation();
    const pageProps = usePage().props;
    const [processing, setProcessing] = useState(false);

    // Default settings
    const defaultSettings = {
        chatgptKey: '',
        chatgptModel: 'gpt-3.5-turbo',
    };

    // Combine settings from props and page props
    const settingsData = Object.keys(settings).length > 0 ? settings : pageProps.settings || {};

    // Initialize state with merged settings
    const [chatgptSettings, setChatgptSettings] = useState(() => ({
        chatgptKey: settingsData.chatgptKey || defaultSettings.chatgptKey,
        chatgptModel: settingsData.chatgptModel || defaultSettings.chatgptModel,
    }));

    // Update state when settings change
    useEffect(() => {
        if (Object.keys(settingsData).length > 0) {
            const mergedSettings = Object.keys(defaultSettings).reduce(
                (acc, key) => {
                    acc[key] = settingsData[key] || defaultSettings[key];
                    return acc;
                },
                {} as Record<string, string>,
            );

            setChatgptSettings((prevSettings) => ({
                ...prevSettings,
                ...mergedSettings,
            }));
        }
    }, [settingsData]);

    // Handle form changes
    const handleSettingsChange = (field: string, value: string) => {
        setChatgptSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle form submission
    const submitChatgptSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(route('settings.chatgpt.update'), chatgptSettings, {
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
                const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to update Chat GPT settings');
                toast.error(errorMessage);
            },
        });
    };

    return (
        <SettingsSection
            title={translate('Chat GPT Settings')}
            description={translate('Configure Chat GPT integration settings for AI-powered features')}
            action={
                <Button type="submit" disabled={processing} form="chatgpt-settings-form" size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? translate('Saving...') : translate('Save Changes')}
                </Button>
            }
        >
            <Card>
                <CardContent className="mt-6">
                    <form id="chatgpt-settings-form" onSubmit={submitChatgptSettings} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="chatgptKey" required>
                                    {translate('Chat GPT Key')}
                                </Label>
                                <Input
                                    id="chatgptKey"
                                    type="password"
                                    value={chatgptSettings.chatgptKey}
                                    onChange={(e) => handleSettingsChange('chatgptKey', e.target.value)}
                                    placeholder={translate('Enter your OpenAI API key')}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="chatgptModel">{translate('Chat GPT Model Name')}</Label>
                                <Select value={chatgptSettings.chatgptModel} onValueChange={(value) => handleSettingsChange('chatgptModel', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select Chat GPT model')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                        <SelectItem value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</SelectItem>
                                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
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
