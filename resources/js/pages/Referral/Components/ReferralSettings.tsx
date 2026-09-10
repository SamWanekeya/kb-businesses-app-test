import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Switch } from '@components/UserInterface/Switch';
import { Textarea } from '@components/UserInterface/Textarea';
import { useForm } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReferralSettingsProps {
    settings: any;
    currencySymbol?: string;
    globalSettings?: any;
}

export default function ReferralSettings({ settings, currencySymbol, globalSettings }: ReferralSettingsProps) {
    const { t: translate } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({
        is_enabled: settings.is_enabled,
        commission_percentage: settings.commission_percentage,
        threshold_amount: settings.threshold_amount,
        guidelines: settings.guidelines || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!globalSettings?.is_demo) {
            toast.loading(translate('Updating referral settings...'));
        }

        post(route('referral.settings.update'), {
            preserveScroll: true,
            onSuccess: (page) => {
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                if (page.props.flash.success) {
                    toast.success(translate(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(translate(page.props.flash.error));
                }
            },
            onError: (errors) => {
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                if (typeof errors === 'string') {
                    toast.error(t(errors));
                } else {
                    toast.error(translate('Failed to update referral settings: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base font-semibold">{translate('Referral Program Settings')}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center space-x-2">
                        <Switch id="is_enabled" checked={data.is_enabled} onCheckedChange={(checked) => setData('is_enabled', checked)} />
                        <Label htmlFor="is_enabled">{translate('Enable Referral Program')}</Label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="commission_percentage" required>
                                {translate('Commission Percentage (%)')}
                            </Label>
                            <Input
                                id="commission_percentage"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={data.commission_percentage}
                                onChange={(e) => setData('commission_percentage', e.target.value)}
                            />
                            {errors.commission_percentage && <p className="text-sm text-red-500">{errors.commission_percentage}</p>}
                        </div>

                        <div>
                            <Label htmlFor="threshold_amount" required>
                                {translate('Minimum Threshold Amount')} {currencySymbol}
                            </Label>
                            <Input
                                id="threshold_amount"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.threshold_amount}
                                onChange={(e) => setData('threshold_amount', e.target.value)}
                            />
                            {errors.threshold_amount && <p className="text-sm text-red-500">{errors.threshold_amount}</p>}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="guidelines" required>
                            {translate('Referral Guidelines')}
                        </Label>
                        <Textarea
                            id="guidelines"
                            value={data.guidelines}
                            onChange={(e) => setData('guidelines', e.target.value)}
                            placeholder={translate('Enter referral program guidelines and terms...')}
                            rows={6}
                        />
                        {errors.guidelines && <p className="text-sm text-red-500">{errors.guidelines}</p>}
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing} size="sm">
                            <Save className="me-2 h-4 w-4" />
                            {processing ? translate('Saving...') : translate('Save Settings')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
