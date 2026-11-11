import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Textarea } from '@components/UserInterface/Textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { useForm, usePage } from '@inertiajs/react';
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
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
            {extra}
        </div>
    );
}

export default function AccountCreate() {
    const { t: translate } = useTranslation();
    const { accountTypes = [], accountIndustries = [], users = [] } = usePage().props;

    const { data, setData, setError, clearErrors, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        website: '',
        account_type_id: '',
        account_industry_id: '',
        billing_address: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        billing_country: '',
        shipping_address: '',
        shipping_city: '',
        shipping_state: '',
        shipping_postal_code: '',
        shipping_country: '',
        assigned_to: '',
        status: 'active',
    });

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard.index') },
        { title: translate('Account management') },
        { title: translate('Accounts'), href: route('accounts.index') },
        { title: translate('Create') },
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
        { name: 'name', label: translate('Account name') },
        { name: 'email', label: translate('Email') },
        { name: 'phone', label: translate('Phone') },
        { name: 'account_type_id', label: translate('Account type') },
        { name: 'account_industry_id', label: translate('Industry') },
        { name: 'assigned_to', label: translate('Assign to') },
        { name: 'billing_address', label: translate('Street address') },
        { name: 'billing_city', label: translate('City') },
        { name: 'billing_state', label: translate('State / province') },
        { name: 'billing_postal_code', label: translate('Postal code') },
        { name: 'billing_country', label: translate('Country') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const clientErrors: Record<string, string> = {};
        requiredFields.forEach(({ name, label }) => {
            if (!data[name]) clientErrors[name] = `${label} ${translate('Is required')}`;
        });
        if (data.phone && !/^[+\d\s\-().]+$/.test(data.phone)) {
            clientErrors['phone'] = translate('Phone number can only contain digits, spaces, +, -, (, )');
        }
        if (data.website && !/^https?:\/\/.+/.test(data.website)) {
            clientErrors['website'] = translate('Website must start with http:// or https://');
        }
        if (Object.keys(clientErrors).length > 0) {
            Object.entries(clientErrors).forEach(([k, v]) => {
                setError(k as any, v);
            });
            return;
        }
        const toastId = toast.loading(translate('Creating account...'));
        post(route('accounts.store'), {
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    };

    return (
        <PageTemplate
            title={translate('Create account')}
            description={translate('Fill in the details to create a new account')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => {
                        window.history.back();
                    },
                },
            ]}
        >
            <form
                onSubmit={handleSubmit}
                className="space-y-8 rounded-lg border border-gray-200 bg-white p-6 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
                {/* ── 1. Basic Information ── */}
                <div>
                    <SectionTitle title={translate('Basic information')} />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Input
                                inputType="text"
                                inputMode="text"
                                inputIdentifier="name"
                                label={translate('Name')}
                                value={data.name}
                                onChange={(e) => set('name', e.target.value)}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Input
                                inputIdentifier="email"
                                inputType="email"
                                inputMode="email"
                                required
                                label={translate('Email')}
                                value={data.email}
                                onChange={(e) => set('email', e.target.value)}
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.email} />
                        </div>

                        <div className="space-y-1.5">
                            <Input
                                id="phone"
                                label={translate('Phone')}
                                value={data.phone}
                                onChange={(e) => set('phone', e.target.value)}
                                className={errors.phone ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.phone} />
                        </div>

                        <div className="space-y-1.5">
                            <Input
                                id="website"
                                label={translate('Website')}
                                value={data.website}
                                onChange={(e) => set('website', e.target.value)}
                                className={errors.website ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.website} />
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* ── 2. Classification & Assignment ── */}
                <div>
                    <SectionTitle title={translate('Classification & assignment')} />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label required>{translate('Account type')}</Label>
                            <Select value={data.account_type_id} onValueChange={(v) => set('account_type_id', v)}>
                                <SelectTrigger className={errors.account_type_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select...')} />
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
                                        {translate('Account types')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label required>{translate('Assign to')}</Label>
                            <Select value={data.assigned_to} onValueChange={(v) => set('assigned_to', v)}>
                                <SelectTrigger className={errors.assigned_to ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select...')} />
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
                                    <a href={route('users-permissions.users.index')} className="font-medium underline">
                                        {translate('Users')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label required>{translate('Industry')}</Label>
                            <Select value={data.account_industry_id} onValueChange={(v) => set('account_industry_id', v)}>
                                <SelectTrigger className={errors.account_industry_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select...')} />
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
                            <Select value={data.status} onValueChange={(v) => set('status', v)}>
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

                {/* ── 3 & 4. Billing & Shipping Address side by side ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Billing */}
                    <div>
                        <SectionTitle title={translate('Billing address')} />
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="billing_address" required>
                                    {translate('Billing address')}
                                </Label>
                                <Textarea
                                    id="billing_address"
                                    value={data.billing_address}
                                    onChange={(e) => set('billing_address', e.target.value)}
                                    className={errors.billing_address ? 'border-red-500' : ''}
                                    rows={2}
                                />
                                <FieldError message={errors.billing_address} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Input
                                        inputIdentifier="billing_city"
                                        label={translate('Billing city')}
                                        required
                                        value={data.billing_city}
                                        onChange={(e) => set('billing_city', e.target.value)}
                                        className={errors.billing_city ? 'border-red-500' : ''}
                                    />
                                    <FieldError message={errors.billing_city} />
                                </div>
                                <div className="space-y-1.5">
                                    <Input
                                        inputIdentifier="billing_state"
                                        label={translate('State')}
                                        required
                                        value={data.billing_state}
                                        onChange={(e) => set('billing_state', e.target.value)}
                                        className={errors.billing_state ? 'border-red-500' : ''}
                                    />
                                    <FieldError message={errors.billing_state} />
                                </div>
                                <div className="space-y-1.5">
                                    <Input
                                        inputIdentifier="billing_country"
                                        label={translate('Billing country')}
                                        required
                                        value={data.billing_country}
                                        onChange={(e) => set('billing_country', e.target.value)}
                                        className={errors.billing_country ? 'border-red-500' : ''}
                                    />
                                    <FieldError message={errors.billing_country} />
                                </div>
                                <div className="space-y-1.5">
                                    <Input
                                        inputIdentifier="billing_postal_code"
                                        label={translate('Billing postal code')}
                                        value={data.billing_postal_code}
                                        onChange={(e) => set('billing_postal_code', e.target.value)}
                                        className={errors.billing_postal_code ? 'border-red-500' : ''}
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
                                        {translate('Shipping address')}
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
                                                <span className="hidden sm:inline">{translate('Copy to shipping')}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{translate('Copy billing to shipping address')}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            }
                        />
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="shipping_address">{translate('Shipping address')}</Label>
                                <Textarea
                                    id="shipping_address"
                                    value={data.shipping_address}
                                    onChange={(e) => set('shipping_address', e.target.value)}
                                    rows={2}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Input
                                        id="shipping_city"
                                        value={data.shipping_city}
                                        label={translate('Shipping city')}
                                        onChange={(e) => set('shipping_city', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Input
                                        id="shipping_state"
                                        value={data.shipping_state}
                                        label={translate('Shipping state')}
                                        onChange={(e) => set('shipping_state', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Input
                                        inputIdentifier="shipping_country"
                                        value={data.shipping_country}
                                        label={translate('Shipping country')}
                                        onChange={(e) => set('shipping_country', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Input
                                        inputIdentifier="shipping_postal_code"
                                        value={data.shipping_postal_code}
                                        label={translate('Shipping postal code')}
                                        onChange={(e) => set('shipping_postal_code', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex justify-end gap-3 pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            window.history.back();
                        }}
                    >
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
