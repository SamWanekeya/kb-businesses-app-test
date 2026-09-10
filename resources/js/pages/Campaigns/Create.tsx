import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Textarea } from '@components/UserInterface/Textarea';
import { router, useForm, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CampaignCreate() {
    const { t: translate } = useTranslation();
    const { campaignTypes = [], targetLists = [], users = [] } = usePage().props;

    const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        budget: '',
        actual_cost: '',
        expected_response: '',
        campaign_type_id: '',
        target_list_id: '',
        assigned_to: '',
        status: 'active',
    });

    const set = (field: string, value: string) => {
        setData(field as any, value);
        clearErrors(field as any);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};

        if (!data.name.trim()) errs.name = translate('Campaign Name is required');
        if (!data.start_date) errs.start_date = translate('Start Date is required');
        if (!data.end_date) errs.end_date = translate('End Date is required');
        if (!data.campaign_type_id) errs.campaign_type_id = translate('Campaign Type is required');
        if (!data.target_list_id) errs.target_list_id = translate('Target List is required');
        if (!data.assigned_to) errs.assigned_to = translate('Assign To is required');

        if (Object.keys(errs).length > 0) {
            Object.entries(errs).forEach(([k, v]) => setError(k as any, v));
            return;
        }

        const toastId = toast.loading(translate('Creating campaign...'));
        post(route('campaigns.store'), {
            onSuccess: () => toast.dismiss(),
            onError: (errs) => {
                toast.dismiss(toastId);
                const first = Object.values(errs)[0] as string;
                if (first) toast.error(first);
            },
        });
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Campaigns'), href: route('campaigns.index') },
        { title: translate('Create') },
    ];

    return (
        <PageTemplate
            title={translate('Create Campaign')}
            description={translate('Fill in the details to create a new Campaigns')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('campaigns.index')),
                },
            ]}
            noPadding
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Card 1 — Campaign Information */}
                <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">{translate('Campaign Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                        <div className="space-y-1 md:col-span-2">
                            <Label className="text-sm font-medium" required>
                                {translate('Campaign Name')}
                            </Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setranslate('name', e.target.value)}
                                className={errors.name ? 'border-red-500' : ''}
                                placeholder={translate('e.g. Q1 Email Blast, Summer Promo')}
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Campaign Type')}
                            </Label>
                            <Select value={data.campaign_type_id} onValueChange={(v) => setranslate('campaign_type_id', v)}>
                                <SelectTrigger className={errors.campaign_type_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select campaign type')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {campaignTypes.map((type: any) => (
                                        <SelectItem key={type.id} value={String(type.id)}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.campaign_type_id && <p className="text-xs text-red-500">{errors.campaign_type_id}</p>}
                            {campaignTypes.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('campaign-types.index')} className="font-medium underline">
                                        {translate('Campaign Types')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Target List')}
                            </Label>
                            <Select value={data.target_list_id} onValueChange={(v) => setranslate('target_list_id', v)}>
                                <SelectTrigger className={errors.target_list_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select target list')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {targetLists.map((list: any) => (
                                        <SelectItem key={list.id} value={String(list.id)}>
                                            {list.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.target_list_id && <p className="text-xs text-red-500">{errors.target_list_id}</p>}
                            {targetLists.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('target-lists.index')} className="font-medium underline">
                                        {translate('Target Lists')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Start Date')}
                            </Label>
                            <div
                                className="cursor-pointer"
                                onClick={(e) => {
                                    const input = (e.currentTarget as HTMLElement).querySelector('input');
                                    try {
                                        (input as any)?.showPicker?.();
                                    } catch {
                                        input?.focus();
                                    }
                                }}
                            >
                                <Input
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) => setranslate('start_date', e.target.value)}
                                    className={`cursor-pointer ${errors.start_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                            {errors.start_date && <p className="text-xs text-red-500">{errors.start_date}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('End Date')}
                            </Label>
                            <div
                                className="cursor-pointer"
                                onClick={(e) => {
                                    const input = (e.currentTarget as HTMLElement).querySelector('input');
                                    try {
                                        (input as any)?.showPicker?.();
                                    } catch {
                                        input?.focus();
                                    }
                                }}
                            >
                                <Input
                                    type="date"
                                    value={data.end_date}
                                    onChange={(e) => setranslate('end_date', e.target.value)}
                                    className={`cursor-pointer ${errors.end_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                            {errors.end_date && <p className="text-xs text-red-500">{errors.end_date}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium">{translate('Status')}</Label>
                            <Select value={data.status} onValueChange={(v) => setranslate('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">{translate('Active')}</SelectItem>
                                    <SelectItem value="inactive">{translate('Inactive')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Assign To')}
                            </Label>
                            <Select value={data.assigned_to} onValueChange={(v) => setranslate('assigned_to', v)}>
                                <SelectTrigger className={errors.assigned_to ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select user')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {users.map((u: any) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name} ({u.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.assigned_to && <p className="text-xs text-red-500">{errors.assigned_to}</p>}
                            {users.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('users.index')} className="font-medium underline">
                                        {translate('Users')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <Label className="text-sm font-medium">{translate('Description')}</Label>
                            <Textarea
                                value={data.description}
                                onChange={(e) => setranslate('description', e.target.value)}
                                rows={3}
                                placeholder={translate('Enter campaign description...')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2 — Budget & Performance */}
                <Card className="border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">{translate('Budget & Performance')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">{translate('Budget')}</Label>
                            <div className="relative">
                                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.budget}
                                    onChange={(e) => setranslate('budget', e.target.value)}
                                    placeholder="0.00"
                                    className="pl-7"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium">{translate('Actual Cost')}</Label>
                            <div className="relative">
                                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-400">$</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.actual_cost}
                                    onChange={(e) => setranslate('actual_cost', e.target.value)}
                                    placeholder="0.00"
                                    className="pl-7"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium">{translate('Expected Response')}</Label>
                            <Input
                                type="number"
                                min="0"
                                value={data.expected_response}
                                onChange={(e) => setranslate('expected_response', e.target.value)}
                                placeholder="e.g. 500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-6">
                    <Button type="button" variant="outline" onClick={() => router.visit(route('campaigns.index'))}>
                        {translate('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? translate('Saving...') : translate('Save')}
                    </Button>
                </div>
            </form>
        </PageTemplate>
    );
}
