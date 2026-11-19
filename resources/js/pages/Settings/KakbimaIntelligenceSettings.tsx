import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface KakbimaIntelligenceSettingsProps {
    settings?: Record<string, string>;
}

interface IntelligenceSettings {
    kakbima_intelligence_key: string;
    kakbima_intelligence_model: string;
}

const DEFAULT_SETTINGS: IntelligenceSettings = {
    kakbima_intelligence_key: '',
    kakbima_intelligence_model: 'gpt-3.5-turbo',
};

const AVAILABLE_MODELS = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
] as const;

type IntelligenceModel = (typeof AVAILABLE_MODELS)[number]['value'];

function isSupportedModel(value: string): value is IntelligenceModel {
    return AVAILABLE_MODELS.some((model) => model.value === value);
}

function createInitialSettings(settings: Record<string, string>): IntelligenceSettings {
    const model = settings.kakbima_intelligence_model;

    return {
        kakbima_intelligence_key: settings.kakbima_intelligence_key ?? DEFAULT_SETTINGS.kakbima_intelligence_key,
        kakbima_intelligence_model: model && isSupportedModel(model) ? model : DEFAULT_SETTINGS.kakbima_intelligence_model,
    };
}

/**
 * Configures the API key and model used by Kakbima Intelligence.
 *
 * Keeps the existing Inertia endpoint and payload contract, synchronizes
 * server settings when appropriate, and provides save/error feedback.
 */
export default function KakbimaIntelligenceSettings({ settings = {} }: KakbimaIntelligenceSettingsProps) {
    const { t: translate } = useTranslation();
    const { settings: pageSettings } = usePage().props;

    const settingsData = useMemo(
        () => (Object.keys(settings).length > 0 ? settings : ((pageSettings as Record<string, string> | undefined) ?? {})),
        [settings, pageSettings],
    );

    const initialSettings = useMemo(() => createInitialSettings(settingsData), [settingsData]);

    const [form, setForm] = useState<IntelligenceSettings>(initialSettings);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isSaving) {
            setForm(initialSettings);
        }
    }, [initialSettings, isSaving]);

    const handleChange = <K extends keyof IntelligenceSettings>(field: K, value: IntelligenceSettings[K]) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const submitSettings = () => {
        if (isSaving) {
            return;
        }

        setIsSaving(true);

        const toastId = toast.loading(translate('Updating Kakbima Intelligence information...'));

        router.post(route('settings.kakbima-intelligence.update'), form, {
            preserveScroll: true,
            onSuccess: () => {
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                Object.values(errors).forEach((message) => {
                    toast.error(translate(message));
                });
            },
            onFinish: () => {
                setIsSaving(false);
                toast.dismiss(toastId);
            },
        });
    };

    return (
        <SettingsSection
            title={translate('Kakbima Intelligence')}
            description={translate('Configure the AI integration used by Kakbima Intelligence features.')}
            action={
                <Button type="submit" form="kakbima-intelligence-settings-form" size="lg" disabled={isSaving}>
                    {isSaving ? translate('Saving...') : translate('Save')}
                </Button>
            }
        >
            <form
                id="kakbima-intelligence-settings-form"
                autoComplete="off"
                onSubmit={(event) => {
                    event.preventDefault();
                    submitSettings();
                }}
                className="border-border space-y-5 border-t pt-5"
            >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                        <Input
                            inputIdentifier="kakbima_intelligence_key"
                            label={translate('Kakbima Intelligence key')}
                            name="kakbima_intelligence_key"
                            inputType="password"
                            autoComplete="kakbima_intelligence_key"
                            value={form.kakbima_intelligence_key}
                            onChange={(event) => handleChange('kakbima_intelligence_key', event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Select
                            value={form.kakbima_intelligence_model}
                            onValueChange={(value) => {
                                if (isSupportedModel(value)) {
                                    handleChange('kakbima_intelligence_model', value);
                                }
                            }}
                        >
                            <SelectTrigger label={translate('Kakbima Intelligence model name')} id="kakbima_intelligence_model">
                                <SelectValue placeholder={translate('Select...')} />
                            </SelectTrigger>

                            <SelectContent>
                                {AVAILABLE_MODELS.map((model) => (
                                    <SelectItem key={model.value} value={model.value}>
                                        {model.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </form>
        </SettingsSection>
    );
}
