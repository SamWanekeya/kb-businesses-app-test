import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface KakbimaIntelligenceSettingsProps {
    settings?: Record<string, string>;
}

export default function KakbimaIntelligenceSettings({ settings = {} }: KakbimaIntelligenceSettingsProps) {
    const { t: translate } = useTranslation();
    const pageProps = usePage().props;
    const [processing, setProcessing] = useState(false);

    // Default settings
    const defaultSettings = {
        kakbima_intelligence_key: '',
        kakbima_intelligence_model: 'gpt-3.5-turbo',
    };

    // Combine settings from props and page props
    const settingsData = Object.keys(settings).length > 0 ? settings : pageProps.settings || {};

    // Initialize state with merged settings
    const [kakbimaIntelligenceSettings, setKakbimaIntelligenceSettings] = useState(() => ({
        kakbima_intelligence_key: settingsData.kakbima_intelligence_key || defaultSettings.kakbima_intelligence_key,
        kakbima_intelligence_model: settingsData.kakbima_intelligence_model || defaultSettings.kakbima_intelligence_model,
    }));

    // Update state when settings change
    useEffect(() => {
        if (Object.keys(settingsData).length > 0) {
            const mergedSettings = Object.keys(defaultSettings).reduce<Record<string, string>>((acc, key) => {
                acc[key] = settingsData[key] || defaultSettings[key];
                return acc;
            }, {});

            setKakbimaIntelligenceSettings((prevSettings) => ({
                ...prevSettings,
                ...mergedSettings,
            }));
        }
    }, [settingsData]);

    // Handle form changes
    const handleSettingsChange = (field: string, value: string) => {
        setKakbimaIntelligenceSettings((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle form submission
    const submitKakbimaIntelligenceSettings = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const toastId = toast.loading(translate('Updating Kakbima Intelligence...'));
        router.post(route('settings.kakbima-intelligence.update'), kakbimaIntelligenceSettings, {
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
            title={translate('Kakbima Intelligence Settings')}
            description={translate('Configure Kakbima Intelligence integration settings for AI-powered features')}
            action={
                <Button type="submit" disabled={processing} form="kakbima-intelligence-settings-form" size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? translate('Saving...') : translate('Save Changes')}
                </Button>
            }
        >
            <Card>
                <CardContent className="mt-6">
                    <form id="kakbima-intelligence-settings-form" onSubmit={submitKakbimaIntelligenceSettings} className="space-y-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="kakbima_intelligence_key" required>
                                    {translate('Kakbima Intelligence Key')}
                                </Label>
                                <Input
                                    id="kakbima_intelligence_key"
                                    type="password"
                                    value={kakbimaIntelligenceSettings.kakbima_intelligence_key}
                                    onChange={(e) => {
                                        handleSettingsChange('kakbima_intelligence_key', e.target.value);
                                    }}
                                    placeholder={translate('Enter your OpenAI API key')}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="kakbima_intelligence_model">{translate('Kakbima Intelligence Model Name')}</Label>
                                <Select
                                    value={kakbimaIntelligenceSettings.kakbima_intelligence_model}
                                    onValueChange={(value) => {
                                        handleSettingsChange('kakbima_intelligence_model', value);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('Select Kakbima Intelligence model')} />
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
