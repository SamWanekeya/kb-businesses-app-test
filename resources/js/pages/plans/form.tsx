import InputError from '@components/InputError';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Switch } from '@components/UserInterface/Switch';
import { Textarea } from '@components/UserInterface/Textarea';
import { router, useForm } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Plan {
    id: number;
    name: string;
    price: number;
    yearly_price: number | null;
    duration: string;
    description: string | null;
    maximum_users: number;
    maximum_projects: number;
    maximum_contacts: number;
    maximum_accounts: number;
    storage_limit: number;
    enable_branding: string;
    enable_kakbima_intelligence: string;
    module: string[] | null;
    is_trial: string | null;
    trial_days: number;
    is_plan_enabled: string;
    is_default: boolean;
}

interface Props {
    plan?: Plan;
    hasDefaultPlan?: boolean;
    otherDefaultPlanExists?: boolean;
}

export default function PlanForm({ plan, hasDefaultPlan = false, otherDefaultPlanExists = false }: Props) {
    const { t: translate } = useTranslation();

    const isEdit = !!plan;

    const { data, setData, post, put, processing, errors } = useForm({
        name: plan?.name || '',
        price: plan?.price || 0,
        yearly_price: plan?.yearly_price || '',
        duration: plan?.duration || 'monthly',
        description: plan?.description || '',
        maximum_users: plan?.maximum_users || 0,
        maximum_projects: plan?.maximum_projects || 0,
        maximum_contacts: plan?.maximum_contacts || 0,
        maximum_accounts: plan?.maximum_accounts || 0,
        storage_limit: plan?.storage_limit || 0,
        enable_branding: plan?.enable_branding || 'on',
        enable_kakbima_intelligence: plan?.enable_kakbima_intelligence || 'off',
        is_trial: plan?.is_trial || 'off',
        trial_days: plan?.trial_days || 0,
        is_plan_enabled: plan?.is_plan_enabled || 'on',
        is_default: plan?.is_default || false,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (name: string, checked: boolean) => {
        setData((prev) => ({ ...prev, [name]: checked ? 'on' : 'off' }));
    };

    const handleDefaultChange = (checked: boolean) => {
        setData((prev) => ({ ...prev, is_default: checked }));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit) {
            put(route('plans.update', plan.id));
        } else {
            post(route('plans.store'));
        }
    };

    return (
        <PageTemplate
            title={translate(isEdit ? 'Edit Plan' : 'Create Plan')}
            description={translate(isEdit ? 'Update subscription plan details' : 'Add a new subscription plan')}
            url={isEdit ? route('plans.update', plan.id) : '/plans/create'}
            breadcrumbs={[
                { title: translate('Dashboard'), href: route('dashboard') },
                { title: translate('Plans'), href: route('plans.index') },
                { title: t(isEdit ? 'Edit Plan' : 'Create Plan') },
            ]}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('plans.index')),
                },
            ]}
        >
            <div className="rounded-lg bg-white p-6 shadow">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="name" required>
                                    {translate('Plan Name')}
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    onChange={handleChange}
                                    placeholder="eg. Pro"
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div>
                                <Label htmlFor="price" required>
                                    {translate('Monthly Price')}
                                </Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    value={data.price}
                                    onChange={handleChange}
                                    placeholder="eg. 29.99"
                                    className={errors.price ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.price} />
                            </div>

                            <div>
                                <Label htmlFor="yearly_price">
                                    {translate('Yearly Price')} <span className="text-muted-foreground text-sm">({translate('Optional')})</span>
                                </Label>
                                <Input
                                    id="yearly_price"
                                    name="yearly_price"
                                    type="number"
                                    step="0.01"
                                    value={data.yearly_price}
                                    onChange={handleChange}
                                    placeholder={translate('Leave empty for 20% discount')}
                                    className={errors.yearly_price ? 'border-red-500' : ''}
                                />
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {translate('If left empty, yearly price will be calculated as 80% of monthly price × 12')}
                                </p>
                                <InputError message={errors.yearly_price} />
                            </div>

                            <div>
                                <Label htmlFor="description">{translate('Description')}</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={data.description}
                                    onChange={handleChange}
                                    placeholder={translate('Enter plan description...')}
                                    rows={3}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.description} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="maximum_users" required>
                                    {translate('Maximum Users')}
                                </Label>
                                <Input
                                    id="maximum_users"
                                    name="maximum_users"
                                    type="number"
                                    value={data.maximum_users}
                                    onChange={handleChange}
                                    placeholder="eg. 10"
                                    className={errors.maximum_users ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.maximum_users} />
                            </div>

                            <div>
                                <Label htmlFor="maximum_projects" required>
                                    {translate('Maximum Projects')}
                                </Label>
                                <Input
                                    id="maximum_projects"
                                    name="maximum_projects"
                                    type="number"
                                    value={data.maximum_projects}
                                    onChange={handleChange}
                                    placeholder="eg. 20"
                                    className={errors.maximum_projects ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.maximum_projects} />
                            </div>

                            <div>
                                <Label htmlFor="maximum_contacts" required>
                                    {translate('Maximum Contacts')}
                                </Label>
                                <Input
                                    id="maximum_contacts"
                                    name="maximum_contacts"
                                    type="number"
                                    value={data.maximum_contacts}
                                    onChange={handleChange}
                                    placeholder="eg. 500"
                                    className={errors.maximum_contacts ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.maximum_contacts} />
                            </div>

                            <div>
                                <Label htmlFor="maximum_accounts" required>
                                    {translate('Maximum Accounts')}
                                </Label>
                                <Input
                                    id="maximum_accounts"
                                    name="maximum_accounts"
                                    type="number"
                                    value={data.maximum_accounts}
                                    onChange={handleChange}
                                    placeholder="eg. 100"
                                    className={errors.maximum_accounts ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.maximum_accounts} />
                            </div>

                            <div>
                                <Label htmlFor="storage_limit" required>
                                    {translate('Storage Limit (GB)')}
                                </Label>
                                <Input
                                    id="storage_limit"
                                    name="storage_limit"
                                    type="number"
                                    step="0.01"
                                    value={data.storage_limit}
                                    onChange={handleChange}
                                    placeholder="eg. 5"
                                    className={errors.storage_limit ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.storage_limit} />
                            </div>

                            <div>
                                <Label htmlFor="trial_days">{translate('Trial Days')}</Label>
                                <Input
                                    id="trial_days"
                                    name="trial_days"
                                    type="number"
                                    value={data.trial_days}
                                    onChange={handleChange}
                                    placeholder="eg. 14"
                                    className={errors.trial_days ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.trial_days} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-medium">{translate('Features')}</h3>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="enable_kakbima_intelligence">{translate('Kakbima Intelligence')}</Label>
                                <Switch
                                    id="enable_kakbima_intelligence"
                                    checked={data.enable_kakbima_intelligence === 'on'}
                                    onCheckedChange={(checked) => handleSwitchChange('enable_kakbima_intelligence', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_trial">{translate('Enable Trial')}</Label>
                                <Switch
                                    id="is_trial"
                                    checked={data.is_trial === 'on'}
                                    onCheckedChange={(checked) => handleSwitchChange('is_trial', checked)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-medium">{translate('Settings')}</h3>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="is_plan_enabled">{translate('Active')}</Label>
                                <Switch
                                    id="is_plan_enabled"
                                    checked={data.is_plan_enabled === 'on'}
                                    onCheckedChange={(checked) => handleSwitchChange('is_plan_enabled', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="is_default">{translate('Default Plan')}</Label>
                                    {(isEdit ? !plan?.is_default : hasDefaultPlan) && (
                                        <p className="mt-1 text-xs text-amber-600">
                                            {translate('Setting this as default will remove default status from the current default plan.')}
                                        </p>
                                    )}
                                </div>
                                <Switch id="is_default" checked={data.is_default} onCheckedChange={handleDefaultChange} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.get(route('plans.index'))}>
                            {translate('Cancel')}
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? translate('Saving...') : translate('Save')}
                        </Button>
                    </div>
                </form>
            </div>
        </PageTemplate>
    );
}
