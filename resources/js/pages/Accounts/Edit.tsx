import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Textarea } from '@components/UserInterface/Textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { router, useForm, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft, Copy } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function SectionTitle({ title, extra }: { title: string; extra?: React.ReactNode }) {
    return (
        <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            {extra}
        </div>
    );
}

export default function AccountEdit() {
    const { t: translate } = useTranslation();
    const { account, accountTypes = [], accountIndustries = [], users = [] } = usePage().props;

    const { data, setData, setError, clearErrors, put, processing, errors } = useForm({
        name: account.name ?? '',
        email: account.email ?? '',
        phone: account.phone ?? '',
        website: account.website ?? '',
        account_type_id: String(account.account_type_id ?? ''),
        account_industry_id: String(account.account_industry_id ?? ''),
        billing_address: account.billing_address ?? '',
        billing_city: account.billing_city ?? '',
        billing_state: account.billing_state ?? '',
        billing_postal_code: account.billing_postal_code ?? '',
        billing_country: account.billing_country ?? '',
        shipping_address: account.shipping_address ?? '',
        shipping_city: account.shipping_city ?? '',
        shipping_state: account.shipping_state ?? '',
        shipping_postal_code: account.shipping_postal_code ?? '',
        shipping_country: account.shipping_country ?? '',
        assigned_to: String(account.assigned_to ?? ''),
        status: account.status ?? 'active',
    });

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Account Management') },
        { title: translate('Accounts'), href: route('accounts.index') },
        { title: translate('Edit') },
    ];

    const set = (name: string, value: string) => {
        setData(name as any, value);
        clearErrors(name as any);
    };

    const copyBillingToShipping = () => {
        setData((prev: any) => ({
            ...prev,
            shipping_address: prev.billing_address,
            shipping_city: prev.billing_city,
            shipping_state: prev.billing_state,
            shipping_postal_code: prev.billing_postal_code,
            shipping_country: prev.billing_country,
        }));
        toast.success(translate('Billing address copied to shipping'));
    };

    const requiredFields: { name: keyof typeof data; label: string }[] = [
        { name: 'name', label: translate('Account Name') },
        { name: 'email', label: translate('Email') },
        { name: 'phone', label: translate('Phone') },
        { name: 'account_type_id', label: translate('Account Type') },
        { name: 'account_industry_id', label: translate('Industry') },
        { name: 'assigned_to', label: translate('Assign To') },
        { name: 'billing_address', label: translate('Street Address') },
        { name: 'billing_city', label: translate('City') },
        { name: 'billing_state', label: translate('State / Province') },
        { name: 'billing_postal_code', label: translate('Postal Code') },
        { name: 'billing_country', label: translate('Country') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const clientErrors: Record<string, string> = {};
        requiredFields.forEach(({ name, label }) => {
            if (!data[name]) clientErrors[name] = `${label} ${translate('is required')}`;
        });
        if (data.phone && !/^[+\d\s\-().]+$/.test(data.phone)) {
            clientErrors['phone'] = translate('Phone number can only contain digits, spaces, +, -, (, )');
        }
        if (data.website && !/^https?:\/\/.+/.test(data.website)) {
            clientErrors['website'] = translate('Website must start with http:// or https://');
        }
        if (Object.keys(clientErrors).length > 0) {
            Object.entries(clientErrors).forEach(([k, v]) => setError(k as any, v));
            return;
        }
        const toastId = toast.loading(translate('Updating account...'));

        put(route('accounts.update', account.id), {
            onSuccess: () => {
                toast.dismiss(toastId);
                router.visit(route('accounts.index'));
            },

            onError: () => {
                toast.dismiss(toastId);

                toast.error(translate('Please fix the errors before submitting.'));
            },
        });
    };

    return (
        <PageTemplate
            title={translate('Edit Account')}
            description={translate('Edit Account details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('accounts.index')),
                },
            ]}
            noPadding
        >
            <form
                onSubmit={handleSubmit}
                className="space-y-8 rounded-lg border border-gray-200 bg-white p-6 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
                {/* ── Basic Information ── */}
                <div>
                    <SectionTitle title={translate('Basic Information')} />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" required>
                                {translate('Account Name')}
                            </Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setranslate('name', e.target.value)}
                                className={errors.name ? 'border-red-500' : ''}
                                placeholder={translate('e.g. Acme Corporation')}
                            />
                            <FieldError message={errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" required>
                                {translate('Email')}
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setranslate('email', e.target.value)}
                                className={errors.email ? 'border-red-500' : ''}
                                placeholder={translate('e.g. contact@acmecorp.com')}
                            />
                            <FieldError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone" required>
                                {translate('Phone')}
                            </Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setranslate('phone', e.target.value)}
                                className={errors.phone ? 'border-red-500' : ''}
                                placeholder={translate('e.g. +1 234 567 8900')}
                            />
                            <FieldError message={errors.phone} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="website">{translate('Website')}</Label>
                            <Input
                                id="website"
                                value={data.website}
                                onChange={(e) => setranslate('website', e.target.value)}
                                className={errors.website ? 'border-red-500' : ''}
                                placeholder="e.g. https://acmecorp.com"
                            />
                            <FieldError message={errors.website} />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* ── Classification & Assignment ── */}
                <div>
                    <SectionTitle title={translate('Classification & Assignment')} />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label required>{translate('Account Type')}</Label>
                            <Select value={data.account_type_id} onValueChange={(v) => setranslate('account_type_id', v)}>
                                <SelectTrigger className={errors.account_type_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select account type')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {accountTypes.map((item: any) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.account_type_id} />
                            {accountTypes.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('account-types.index')} className="font-medium underline">
                                        {translate('Account Types')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label required>{translate('Assign To')}</Label>
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
                            <FieldError message={errors.assigned_to} />
                            {users.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('users.index')} className="font-medium underline">
                                        {translate('Users')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label required>{translate('Industry')}</Label>
                            <Select value={data.account_industry_id} onValueChange={(v) => setranslate('account_industry_id', v)}>
                                <SelectTrigger className={errors.account_industry_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select industry')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {accountIndustries.map((item: any) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                            {item.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.account_industry_id} />
                            {accountIndustries.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('account-industries.index')} className="font-medium underline">
                                        {translate('Industries')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>{translate('Status')}</Label>
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
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* ── Billing & Shipping Address side by side ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Billing */}
                    <div>
                        <SectionTitle title={translate('Billing Address')} />
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="billing_address" required>
                                    {translate('Billing Address')}
                                </Label>
                                <Textarea
                                    id="billing_address"
                                    value={data.billing_address}
                                    onChange={(e) => setranslate('billing_address', e.target.value)}
                                    className={errors.billing_address ? 'border-red-500' : ''}
                                    rows={2}
                                    placeholder={translate('e.g. 123 Main Street, Suite 100')}
                                />
                                <FieldError message={errors.billing_address} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="billing_city" required>
                                        {translate('Billing City')}
                                    </Label>
                                    <Input
                                        id="billing_city"
                                        value={data.billing_city}
                                        onChange={(e) => setranslate('billing_city', e.target.value)}
                                        className={errors.billing_city ? 'border-red-500' : ''}
                                        placeholder={translate('e.g. New York')}
                                    />
                                    <FieldError message={errors.billing_city} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="billing_state" required>
                                        {translate('Billing State')}
                                    </Label>
                                    <Input
                                        id="billing_state"
                                        value={data.billing_state}
                                        onChange={(e) => setranslate('billing_state', e.target.value)}
                                        className={errors.billing_state ? 'border-red-500' : ''}
                                        placeholder={translate('e.g. NY')}
                                    />
                                    <FieldError message={errors.billing_state} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="billing_country" required>
                                        {translate('Billing Country')}
                                    </Label>
                                    <Input
                                        id="billing_country"
                                        value={data.billing_country}
                                        onChange={(e) => setranslate('billing_country', e.target.value)}
                                        className={errors.billing_country ? 'border-red-500' : ''}
                                        placeholder={translate('e.g. United States')}
                                    />
                                    <FieldError message={errors.billing_country} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="billing_postal_code" required>
                                        {translate('Billing Postal Code')}
                                    </Label>
                                    <Input
                                        id="billing_postal_code"
                                        value={data.billing_postal_code}
                                        onChange={(e) => setranslate('billing_postal_code', e.target.value)}
                                        className={errors.billing_postal_code ? 'border-red-500' : ''}
                                        placeholder={translate('e.g. 10001')}
                                    />
                                    <FieldError message={errors.billing_postal_code} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shipping */}
                    <div>
                        <SectionTitle
                            title={
                                (
                                    <span className="flex items-center gap-2">
                                        {translate('Shipping Address')}
                                        <span className="text-sm font-normal text-gray-400">({translate('Optional')})</span>
                                    </span>
                                ) as any
                            }
                            extra={
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={copyBillingToShipping}
                                                className="flex items-center justify-center p-2 text-xs sm:gap-1 sm:px-3 sm:py-1.5"
                                            >
                                                <Copy className="h-3 w-3" />
                                                <span className="hidden sm:inline">{translate('Copy to Shipping')}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{translate('Copy Billing to Shipping Address')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            }
                        />
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="shipping_address">{translate('Shipping Address')}</Label>
                                <Textarea
                                    id="shipping_address"
                                    value={data.shipping_address}
                                    onChange={(e) => setranslate('shipping_address', e.target.value)}
                                    rows={2}
                                    placeholder={translate('e.g. 456 Elm Street')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="shipping_city">{translate('Shipping City')}</Label>
                                    <Input
                                        id="shipping_city"
                                        value={data.shipping_city}
                                        onChange={(e) => setranslate('shipping_city', e.target.value)}
                                        placeholder={translate('e.g. Los Angeles')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="shipping_state">{translate('Shipping State')}</Label>
                                    <Input
                                        id="shipping_state"
                                        value={data.shipping_state}
                                        onChange={(e) => setranslate('shipping_state', e.target.value)}
                                        placeholder={translate('e.g. CA')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="shipping_country">{translate('Shipping Country')}</Label>
                                    <Input
                                        id="shipping_country"
                                        value={data.shipping_country}
                                        onChange={(e) => setranslate('shipping_country', e.target.value)}
                                        placeholder={translate('e.g. United States')}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="shipping_postal_code">{translate('Shipping Postal Code')}</Label>
                                    <Input
                                        id="shipping_postal_code"
                                        value={data.shipping_postal_code}
                                        onChange={(e) => setranslate('shipping_postal_code', e.target.value)}
                                        placeholder={translate('e.g. 90001')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex justify-end gap-3 pt-1">
                    <Button type="button" variant="outline" onClick={() => router.visit(route('accounts.index'))}>
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
