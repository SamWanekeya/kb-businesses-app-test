import { PageTemplate } from '@/components/page-template';
import { useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

export default function LeadCreate() {
    const { t: translate } = useTranslation();
    const {
        leadStatuses = [],
        leadSources = [],
        accountIndustries = [],
        campaigns = [],
        users = [],
        prefilledLeadStatusId = '',
    } = usePage().props;

    const { data, setData, setError, clearErrors, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        organization: '',
        account_name: '',
        account_industry_id: '',
        website: '',
        position: '',
        value: '',
        lead_status_id: String(prefilledLeadStatusId || ''),
        lead_source_id: '',
        address: '',
        campaign_id: '',
        notes: '',
        assigned_to: '',
        status: 'active',
    });

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Lead Management') },
        { title: translate('Leads'), href: route('leads.index') },
        { title: translate('Create') },
    ];

    const handleInputChange = (name: string, value: string) => {
        setData(name as any, value);
        clearErrors(name as any);
    };

    const requiredFields: { name: keyof typeof data; label: string }[] = [
        { name: 'name', label: translate('Lead Name') },
        { name: 'email', label: translate('Email') },
        { name: 'phone', label: translate('Phone') },
        { name: 'organization', label: translate('Organization') },
        { name: 'value', label: translate('Lead Value') },
        { name: 'account_industry_id', label: translate('Account Industry') },
        { name: 'lead_status_id', label: translate('Lead Status') },
        { name: 'lead_source_id', label: translate('Lead Source') },
        { name: 'address', label: translate('Address') },
        { name: 'campaign_id', label: translate('Campaign') },
        { name: 'assigned_to', label: translate('Assign To') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const clientErrors: Record<string, string> = {};

        requiredFields.forEach(({ name, label }) => {
            if (!data[name]) clientErrors[name] = `${label} is required`;
        });

        if (data.website && !/^https?:\/\/.+/.test(data.website)) {
            clientErrors['website'] = translate('Website must start with http:// or https://');
        }

        if (Object.keys(clientErrors).length > 0) {
            Object.entries(clientErrors).forEach(([key, msg]) => setError(key as any, msg));
            return;
        }

        toast.loading(translate('Creating lead...'));

        post(route('leads.store'), {
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    };

    return (
        <PageTemplate
            title={translate('Create Lead')}
            description={translate('Fill in the details to create a new lead')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => window.history.back(),
                },
            ]}
            noPadding
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ROW 1 */}
                <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
                    {/* Basic Information */}
                    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Basic Information')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium" required>
                                        {translate('Lead Name')}
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder={translate('eg. John Smith')}
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium" required>
                                        {translate('Email')}
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={errors.email ? 'border-red-500' : ''}
                                        placeholder={translate('eg. john@kakbima.dev')}
                                    />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium" required>
                                        {translate('Phone')}
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={errors.phone ? 'border-red-500' : ''}
                                        placeholder={translate('eg. +1 234 567 8900')}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position" className="text-sm font-medium">
                                        {translate('Position')}
                                    </Label>
                                    <Input
                                        id="position"
                                        value={data.position}
                                        onChange={(e) => handleInputChange('position', e.target.value)}
                                        className={errors.position ? 'border-red-500' : ''}
                                        placeholder={translate('eg. CEO, Manager, Developer')}
                                    />
                                    {errors.position && <p className="text-xs text-red-500">{errors.position}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="organization" className="text-sm font-medium" required>
                                        {translate('Organization')}
                                    </Label>
                                    <Input
                                        id="organization"
                                        value={data.organization}
                                        onChange={(e) => handleInputChange('organization', e.target.value)}
                                        className={errors.organization ? 'border-red-500' : ''}
                                        placeholder={translate('eg. Acme Corp')}
                                    />
                                    {errors.organization && <p className="text-xs text-red-500">{errors.organization}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="account_name" className="text-sm font-medium">
                                        {translate('Account Name')}
                                    </Label>
                                    <Input
                                        id="account_name"
                                        value={data.account_name}
                                        onChange={(e) => handleInputChange('account_name', e.target.value)}
                                        className={errors.account_name ? 'border-red-500' : ''}
                                        placeholder={translate('eg. Acme Corp')}
                                    />
                                    {errors.account_name && <p className="text-xs text-red-500">{errors.account_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website" className="text-sm font-medium">
                                        {translate('Website')}
                                    </Label>
                                    <Input
                                        id="website"
                                        value={data.website}
                                        onChange={(e) => handleInputChange('website', e.target.value)}
                                        className={errors.website ? 'border-red-500' : ''}
                                        placeholder="eg. https://kakbima.dev"
                                    />
                                    {errors.website && <p className="text-xs text-red-500">{errors.website}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="value" className="text-sm font-medium" required>
                                        {translate('Lead Value')}
                                    </Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.value}
                                        onChange={(e) => handleInputChange('value', e.target.value)}
                                        className={errors.value ? 'border-red-500' : ''}
                                        placeholder={translate('eg. 5000')}
                                    />
                                    {errors.value && <p className="text-xs text-red-500">{errors.value}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lead Classification */}
                    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Lead Classification')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Account Industry')}
                                </Label>
                                <Select value={data.account_industry_id} onValueChange={(value) => handleInputChange('account_industry_id', value)}>
                                    <SelectTrigger className={errors.account_industry_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select industry')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {accountIndustries.map((i: any) => (
                                            <SelectItem key={i.id} value={String(i.id)}>
                                                {i.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.account_industry_id && <p className="text-xs text-red-500">{errors.account_industry_id}</p>}
                                {accountIndustries.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('account-industries.index')} className="font-medium underline">
                                            {translate('Account Industries')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Lead Status')}
                                </Label>
                                <Select value={data.lead_status_id} onValueChange={(value) => handleInputChange('lead_status_id', value)}>
                                    <SelectTrigger className={errors.lead_status_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select status')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {leadStatuses.map((s: any) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.lead_status_id && <p className="text-xs text-red-500">{errors.lead_status_id}</p>}
                                {leadStatuses.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('lead-statuses.index')} className="font-medium underline">
                                            {translate('Lead Statuses')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Lead Source')}
                                </Label>
                                <Select value={data.lead_source_id} onValueChange={(value) => handleInputChange('lead_source_id', value)}>
                                    <SelectTrigger className={errors.lead_source_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select source')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {leadSources.map((s: any) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.lead_source_id && <p className="text-xs text-red-500">{errors.lead_source_id}</p>}
                                {leadSources.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('lead-sources.index')} className="font-medium underline">
                                            {translate('Lead Sources')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Campaign')}
                                </Label>
                                <Select value={data.campaign_id} onValueChange={(value) => handleInputChange('campaign_id', value)}>
                                    <SelectTrigger className={errors.campaign_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select campaign')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {campaigns.map((c: any) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.campaign_id && <p className="text-xs text-red-500">{errors.campaign_id}</p>}
                                {campaigns.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('campaigns.index')} className="font-medium underline">
                                            {translate('Campaigns')}
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2 */}
                <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
                    {/* Address & Notes */}
                    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Address & Notes')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-sm font-medium" required>
                                    {translate('Address')}
                                </Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className={errors.address ? 'border-red-500' : ''}
                                    rows={2}
                                    placeholder={translate('eg. 123 Main St, City, Country')}
                                />
                                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-medium">
                                    {translate('Notes')}
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className={errors.notes ? 'border-red-500' : ''}
                                    rows={2}
                                    placeholder={translate('Enter any additional notes...')}
                                />
                                {errors.notes && <p className="text-xs text-red-500">{errors.notes}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Assignment')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Assign To')}
                                </Label>
                                <Select value={data.assigned_to} onValueChange={(value) => handleInputChange('assigned_to', value)}>
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

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{translate('Status')}</Label>
                                <Select value={data.status} onValueChange={(value) => handleInputChange('status', value)}>
                                    <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{translate('Active')}</SelectItem>
                                        <SelectItem value="inactive">{translate('Inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-4">
                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
                        {translate('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                        {processing ? translate('Saving...') : translate('Save')}
                    </Button>
                </div>
            </form>
        </PageTemplate>
    );
}
