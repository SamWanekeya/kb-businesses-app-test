import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LeadEdit() {
    const { t } = useTranslation();
    const { lead, leadStatuses = [], leadSources = [], accountIndustries = [], campaigns = [], users = [] } = usePage().props as any;

    const { data, setData, setError, clearErrors, put, processing, errors } = useForm({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        organization: lead.organization || '',
        account_name: lead.account_name || '',
        account_industry_id: String(lead.account_industry_id || ''),
        website: lead.website || '',
        position: lead.position || '',
        value: lead.value || '',
        lead_status_id: String(lead.lead_status_id || ''),
        lead_source_id: String(lead.lead_source_id || ''),
        address: lead.address || '',
        campaign_id: String(lead.campaign_id || ''),
        notes: lead.notes || '',
        assigned_to: String(lead.assigned_to || ''),
        status: lead.status || 'active',
    });

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Lead Management') },
        { title: t('Leads'), href: route('leads.index') },
        { title: t('Edit') },
    ];

    const handleInputChange = (name: string, value: string) => {
        setData(name as any, value);
        clearErrors(name as any);
    };

    const requiredFields: { name: keyof typeof data; label: string }[] = [
        { name: 'name', label: t('Lead Name') },
        { name: 'email', label: t('Email') },
        { name: 'phone', label: t('Phone') },
        { name: 'organization', label: t('Organization') },
        { name: 'value', label: t('Lead Value') },
        { name: 'account_industry_id', label: t('Account Industry') },
        { name: 'lead_status_id', label: t('Lead Status') },
        { name: 'lead_source_id', label: t('Lead Source') },
        { name: 'address', label: t('Address') },
        { name: 'campaign_id', label: t('Campaign') },
        { name: 'assigned_to', label: t('Assign To') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const clientErrors: Record<string, string> = {};

        requiredFields.forEach(({ name, label }) => {
            if (!data[name]) clientErrors[name] = `${label} is required`;
        });

        if (data.website && !/^https?:\/\/.+/.test(data.website)) {
            clientErrors['website'] = t('Website must start with http:// or https://');
        }

        if (Object.keys(clientErrors).length > 0) {
            Object.entries(clientErrors).forEach(([key, msg]) => setError(key as any, msg));
            return;
        }

        toast.loading(t('Updating lead...'));
        put(route('leads.update', lead.id), {
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    };

    return (
        <PageTemplate
            title={t('Edit Lead')}
            description={t('Edit lead details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('leads.index')),
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
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Basic Information')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium" required>
                                        {t('Lead Name')}
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={errors.name ? 'border-red-500' : ''}
                                        placeholder={t('eg. John Smith')}
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium" required>
                                        {t('Email')}
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className={errors.email ? 'border-red-500' : ''}
                                        placeholder={t('eg. john@kakbima.dev')}
                                    />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium" required>
                                        {t('Phone')}
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={errors.phone ? 'border-red-500' : ''}
                                        placeholder={t('eg. +1 234 567 8900')}
                                    />
                                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="position" className="text-sm font-medium">
                                        {t('Position')}
                                    </Label>
                                    <Input
                                        id="position"
                                        value={data.position}
                                        onChange={(e) => handleInputChange('position', e.target.value)}
                                        className={errors.position ? 'border-red-500' : ''}
                                        placeholder={t('eg. CEO, Manager, Developer')}
                                    />
                                    {errors.position && <p className="text-xs text-red-500">{errors.position}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="organization" className="text-sm font-medium" required>
                                        {t('Organization')}
                                    </Label>
                                    <Input
                                        id="organization"
                                        value={data.organization}
                                        onChange={(e) => handleInputChange('organization', e.target.value)}
                                        className={errors.organization ? 'border-red-500' : ''}
                                        placeholder={t('eg. Acme Corp')}
                                    />
                                    {errors.organization && <p className="text-xs text-red-500">{errors.organization}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="account_name" className="text-sm font-medium">
                                        {t('Account Name')}
                                    </Label>
                                    <Input
                                        id="account_name"
                                        value={data.account_name}
                                        onChange={(e) => handleInputChange('account_name', e.target.value)}
                                        className={errors.account_name ? 'border-red-500' : ''}
                                        placeholder={t('eg. Acme Corp')}
                                    />
                                    {errors.account_name && <p className="text-xs text-red-500">{errors.account_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="website" className="text-sm font-medium">
                                        {t('Website')}
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
                                        {t('Lead Value')}
                                    </Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.value}
                                        onChange={(e) => handleInputChange('value', e.target.value)}
                                        className={errors.value ? 'border-red-500' : ''}
                                        placeholder={t('eg. 5000')}
                                    />
                                    {errors.value && <p className="text-xs text-red-500">{errors.value}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lead Classification */}
                    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Lead Classification')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {t('Account Industry')}
                                </Label>
                                <Select value={data.account_industry_id} onValueChange={(value) => handleInputChange('account_industry_id', value)}>
                                    <SelectTrigger className={errors.account_industry_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select industry')} />
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
                                        {t('Click here to add')}{' '}
                                        <a href={route('account-industries.index')} className="font-medium underline">
                                            {t('Account Industries')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {t('Lead Status')}
                                </Label>
                                <Select value={data.lead_status_id} onValueChange={(value) => handleInputChange('lead_status_id', value)}>
                                    <SelectTrigger className={errors.lead_status_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select status')} />
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
                                        {t('Click here to add')}{' '}
                                        <a href={route('lead-statuses.index')} className="font-medium underline">
                                            {t('Lead Statuses')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {t('Lead Source')}
                                </Label>
                                <Select value={data.lead_source_id} onValueChange={(value) => handleInputChange('lead_source_id', value)}>
                                    <SelectTrigger className={errors.lead_source_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select source')} />
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
                                        {t('Click here to add')}{' '}
                                        <a href={route('lead-sources.index')} className="font-medium underline">
                                            {t('Lead Sources')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {t('Campaign')}
                                </Label>
                                <Select value={data.campaign_id} onValueChange={(value) => handleInputChange('campaign_id', value)}>
                                    <SelectTrigger className={errors.campaign_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select campaign')} />
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
                                        {t('Click here to add')}{' '}
                                        <a href={route('campaigns.index')} className="font-medium underline">
                                            {t('Campaigns')}
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
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Address & Notes')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-sm font-medium" required>
                                    {t('Address')}
                                </Label>
                                <Textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className={errors.address ? 'border-red-500' : ''}
                                    rows={2}
                                    placeholder={t('eg. 123 Main St, City, Country')}
                                />
                                {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-medium">
                                    {t('Notes')}
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className={errors.notes ? 'border-red-500' : ''}
                                    rows={2}
                                    placeholder={t('Enter any additional notes...')}
                                />
                                {errors.notes && <p className="text-xs text-red-500">{errors.notes}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Assignment')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {t('Assign To')}
                                </Label>
                                <Select value={data.assigned_to} onValueChange={(value) => handleInputChange('assigned_to', value)}>
                                    <SelectTrigger className={errors.assigned_to ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select user')} />
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
                                        {t('Click here to add')}{' '}
                                        <a href={route('users.index')} className="font-medium underline">
                                            {t('Users')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">{t('Status')}</Label>
                                <Select value={data.status} onValueChange={(value) => handleInputChange('status', value)}>
                                    <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('Active')}</SelectItem>
                                        <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-4">
                    <Button type="button" variant="outline" onClick={() => router.visit(route('leads.index'))} className="w-full sm:w-auto">
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                        {processing ? t('Saving...') : t('Save')}
                    </Button>
                </div>
            </form>
        </PageTemplate>
    );
}
