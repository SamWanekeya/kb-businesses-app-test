import { toast } from '@components/CustomToast';
import { PageTemplate } from '@components/page-template';
import { Button } from '@components/UserInterface/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { Input } from '@components/UserInterface/input';
import { Label } from '@components/UserInterface/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/select';
import { Textarea } from '@components/UserInterface/textarea';
import { useForm, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft, Copy, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type ProductRow = {
    product_id: string;
    quantity: string;
    unit_price: string;
    discount_type: string;
    discount_value: string;
};

export default function QuoteCreate() {
    const { t: translate } = useTranslation();
    const {
        accounts = [],
        contacts = [],
        opportunities = [],
        products: productOptions = [],
        shippingProviderTypes = [],
        users = [],
    } = usePage().props;

    const [sameAsBilling, setSameAsBilling] = useState(false);

    const { data, setData, setError, clearErrors, post, processing, errors } = useForm({
        name: '',
        description: '',
        opportunity_id: '',
        account_id: '',
        billing_contact_id: '',
        shipping_contact_id: '',
        shipping_provider_type_id: '',
        status: 'draft',
        valid_until: '',
        assigned_to: '',
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
        products: [{ product_id: '', quantity: '1', unit_price: '0', discount_type: 'none', discount_value: '0' }] as ProductRow[],
    });

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Quotes'), href: route('quotes.index') },
        { title: translate('Create') },
    ];

    const set = (name: string, value: string) => {
        setData(name as any, value);
        clearErrors(name as any);
    };

    const handleOpportunityChange = async (opportunityId: string) => {
        setranslate('opportunity_id', opportunityId);
        if (!opportunityId) return;
        try {
            const res = await fetch(route('api.opportunities.details', opportunityId));
            const details = await res.json();
            if (details && !details.error) {
                setData((prev: any) => ({
                    ...prev,
                    opportunity_id: opportunityId,
                    account_id: details.account_id ? String(details.account_id) : prev.account_id,
                    billing_contact_id: details.billing_contact_id ? String(details.billing_contact_id) : prev.billing_contact_id,
                    shipping_contact_id: details.shipping_contact_id ? String(details.shipping_contact_id) : prev.shipping_contact_id,
                    products: details.products?.length
                        ? details.products.map((p: any) => ({
                              product_id: String(p.product_id),
                              quantity: String(p.quantity),
                              unit_price: String(p.unit_price),
                              discount_type: p.discount_type || 'none',
                              discount_value: String(p.discount_value || '0'),
                          }))
                        : prev.products,
                }));
                clearErrors('account_id' as any);
                clearErrors('billing_contact_id' as any);
                clearErrors('shipping_contact_id' as any);
                clearErrors('billing_address' as any);
                clearErrors('billing_city' as any);
                clearErrors('billing_state' as any);
                clearErrors('billing_postal_code' as any);
                clearErrors('billing_country' as any);
                clearErrors('shipping_provider_type_id' as any);
                if (details.products?.length) {
                    clearErrors('products' as any);
                    details.products.forEach((_: any, i: number) => clearErrors(`products.${i}.product_id` as any));
                }
            }
        } catch {}
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
        setSameAsBilling(true);
        toast.success(translate('Billing address copied to shipping'));
    };

    const addProductRow = () =>
        setData('products', [...data.products, { product_id: '', quantity: '1', unit_price: '0', discount_type: 'none', discount_value: '0' }]);

    const removeProductRow = (i: number) => {
        if (data.products.length <= 1) return;
        setData(
            'products',
            data.products.filter((_, idx) => idx !== i),
        );
    };

    const updateProductRow = (i: number, field: string, value: string) => {
        const updated = data.products.map((row, idx) => {
            if (idx !== i) return row;
            const newRow = { ...row, [field]: value };
            if (field === 'product_id') {
                const p = productOptions.find((p: any) => String(p.id) === value);
                if (p) newRow.unit_price = String(p.price);
            }
            return newRow;
        });
        setData('products', updated);
        clearErrors(`products.${i}.${field}` as any);
        if (field === 'product_id' && value) clearErrors('products' as any);
    };

    const calcLineTotal = (row: ProductRow) => (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0);

    const calcDiscount = (row: ProductRow) => {
        const lineTotal = calcLineTotal(row);
        const val = parseFloat(row.discount_value) || 0;
        if (!val || row.discount_type === 'none') return 0;
        if (row.discount_type === 'percentage') return (lineTotal * val) / 100;
        return Math.min(val, lineTotal);
    };

    const calcTax = (row: ProductRow) => {
        const product = productOptions.find((p: any) => String(p.id) === row.product_id);
        const after = calcLineTotal(row) - calcDiscount(row);
        return product?.tax ? (after * product.tax.rate) / 100 : 0;
    };

    const subtotal = data.products.reduce((s, r) => s + calcLineTotal(r), 0);
    const totalDiscount = data.products.reduce((s, r) => s + calcDiscount(r), 0);
    const totalTax = data.products.reduce((s, r) => s + calcTax(r), 0);
    const grandTotal = subtotal - totalDiscount + totalTax;

    const fmt = (v: number) => <span className="font-mono">{window.appSettings?.formatCurrency(v) || `$${v.toFixed(2)}`}</span>;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errs: Record<string, string> = {};

        if (!data.name) errs.name = translate('Quote Name is required');
        if (!data.opportunity_id) errs.opportunity_id = translate('Opportunity is required');
        if (!data.account_id) errs.account_id = translate('Account is required');
        if (!data.billing_contact_id) errs.billing_contact_id = translate('Billing Contact is required');
        if (!data.shipping_contact_id) errs.shipping_contact_id = translate('Shipping Contact is required');
        if (!data.shipping_provider_type_id) errs.shipping_provider_type_id = translate('Shipping Provider is required');
        if (!data.assigned_to) errs.assigned_to = translate('Assign To is required');
        if (!data.billing_address) errs.billing_address = translate('Billing Address is required');
        if (!data.billing_city) errs.billing_city = translate('Billing City is required');
        if (!data.billing_state) errs.billing_state = translate('Billing State is required');
        if (!data.billing_postal_code) errs.billing_postal_code = translate('Billing Postal Code is required');
        if (!data.billing_country) errs.billing_country = translate('Billing Country is required');

        if (!data.products.length || data.products.every((r: any) => !r.product_id)) errs.products = translate('At least one product is required');

        data.products.forEach((row, i) => {
            if (!row.product_id) errs[`products.${i}.product_id`] = translate('Product is required');
            if (row.product_id && (!row.quantity || parseFloat(row.quantity) < 1)) errs[`products.${i}.quantity`] = translate('Min 1');
            if (row.product_id && (row.unit_price === '' || parseFloat(row.unit_price) < 0)) errs[`products.${i}.unit_price`] = translate('Required');
        });

        if (Object.keys(errs).length > 0) {
            Object.entries(errs).forEach(([k, v]) => setError(k as any, v));
            return;
        }

        toast.loading(translate('Creating quote...'));
        post(route('quotes.store'), {
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    };

    return (
        <PageTemplate
            title={translate('Create Quote')}
            description={translate('Create a new quote for your customers.')}
            breadcrumbs={breadcrumbs}
            fullWidth
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
                {/* Quote Details */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <CardTitle className="text-base font-semibold">{translate('Quote Details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1 md:col-span-2 lg:col-span-3">
                            <Label className="text-sm font-medium" required>
                                {translate('Quote Name')}
                            </Label>
                            <Input
                                value={data.name}
                                onChange={(e) => setranslate('name', e.target.value)}
                                className={errors.name ? 'border-red-500' : ''}
                                placeholder={translate('e.g. Annual Software License Quote')}
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Opportunity')}
                            </Label>
                            <Select value={data.opportunity_id} onValueChange={handleOpportunityChange}>
                                <SelectTrigger className={errors.opportunity_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select opportunity')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {opportunities.map((o: any) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.opportunity_id && <p className="text-xs text-red-500">{errors.opportunity_id}</p>}
                            {opportunities.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('opportunities.index')} className="font-medium underline">
                                        {translate('Opportunities')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Account')}
                            </Label>
                            <Select value={data.account_id} onValueChange={(v) => setranslate('account_id', v)}>
                                <SelectTrigger className={errors.account_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select account')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {accounts.map((a: any) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.account_id && <p className="text-xs text-red-500">{errors.account_id}</p>}
                            {accounts.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('accounts.index')} className="font-medium underline">
                                        {translate('Accounts')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Billing Contact')}
                            </Label>
                            <Select value={data.billing_contact_id} onValueChange={(v) => setranslate('billing_contact_id', v)}>
                                <SelectTrigger className={errors.billing_contact_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select billing contact')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {contacts.map((c: any) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.billing_contact_id && <p className="text-xs text-red-500">{errors.billing_contact_id}</p>}
                            {contacts.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('contacts.index')} className="font-medium underline">
                                        {translate('Contacts')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Shipping Contact')}
                            </Label>
                            <Select value={data.shipping_contact_id} onValueChange={(v) => setranslate('shipping_contact_id', v)}>
                                <SelectTrigger className={errors.shipping_contact_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select shipping contact')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {contacts.map((c: any) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.shipping_contact_id && <p className="text-xs text-red-500">{errors.shipping_contact_id}</p>}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium" required>
                                {translate('Shipping Provider')}
                            </Label>
                            <Select value={data.shipping_provider_type_id} onValueChange={(v) => setranslate('shipping_provider_type_id', v)}>
                                <SelectTrigger className={errors.shipping_provider_type_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select shipping provider')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {shippingProviderTypes.map((s: any) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.shipping_provider_type_id && <p className="text-xs text-red-500">{errors.shipping_provider_type_id}</p>}
                            {shippingProviderTypes.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('shipping-provider-types.index')} className="font-medium underline">
                                        {translate('Shipping Providers')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium">{translate('Status')}</Label>
                            <Select value={data.status} onValueChange={(v) => setranslate('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">{translate('Draft')}</SelectItem>
                                    <SelectItem value="sent">{translate('Sent')}</SelectItem>
                                    <SelectItem value="accepted">{translate('Accepted')}</SelectItem>
                                    <SelectItem value="rejected">{translate('Rejected')}</SelectItem>
                                    <SelectItem value="expired">{translate('Expired')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-sm font-medium">{translate('Valid Until')}</Label>
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
                                    value={data.valid_until}
                                    onChange={(e) => setranslate('valid_until', e.target.value)}
                                    className={`cursor-pointer ${errors.valid_until ? 'border-red-500' : ''}`}
                                />
                            </div>
                            {errors.valid_until && <p className="text-xs text-red-500">{errors.valid_until}</p>}
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

                        <div className="space-y-1 md:col-span-2 lg:col-span-3">
                            <Label className="text-sm font-medium">{translate('Description')}</Label>
                            <Textarea
                                value={data.description}
                                onChange={(e) => setranslate('description', e.target.value)}
                                rows={2}
                                placeholder={translate('Brief description of this quote...')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Products */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                                {translate('Products')}
                                {errors.products && <span className="ml-2 text-xs font-normal text-red-500">{errors.products}</span>}
                            </CardTitle>
                            <Button type="button" size="sm" onClick={addProductRow}>
                                <Plus className="mr-1 h-4 w-4" /> {translate('Add Product')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto p-4 md:p-0">
                            <table className="block w-full text-sm xl:table">
                                <thead className="hidden xl:table-header-group">
                                    <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                        <th className="min-w-[200px] px-4 py-3 text-left">
                                            {translate('Product')} <span className="text-red-500">*</span>
                                        </th>
                                        <th className="w-24 px-4 py-3 text-left">
                                            {translate('Quantity')} <span className="text-red-500">*</span>
                                        </th>
                                        <th className="w-32 px-4 py-3 text-left">
                                            {translate('Unit Price')} <span className="text-red-500">*</span>
                                        </th>
                                        <th className="w-32 px-4 py-3 text-left">{translate('Discount Type')}</th>
                                        <th className="w-28 px-4 py-3 text-left">{translate('Discount Val')}</th>
                                        <th className="w-28 px-4 py-3 text-left">{translate('Tax')}</th>
                                        <th className="w-28 px-4 py-3 text-left">{translate('Total')}</th>
                                        <th className="w-12 px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="block space-y-4 divide-y divide-gray-200 xl:table-row-group xl:space-y-0 xl:divide-y-0">
                                    {data.products.map((row, i) => {
                                        const disc = calcDiscount(row);
                                        const tax = calcTax(row);
                                        const total = calcLineTotal(row) - disc + tax;
                                        return (
                                            <tr
                                                key={i}
                                                className="border-border relative grid grid-cols-1 gap-3 rounded-lg border border-b bg-gray-50/50 p-4 hover:bg-gray-50 sm:grid-cols-2 xl:table-row xl:gap-0 xl:space-y-0 xl:border-b xl:bg-transparent dark:bg-gray-800/30 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="col-span-1 block w-full px-0 py-0 sm:col-span-2 xl:table-cell xl:w-48 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Product')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Select value={row.product_id} onValueChange={(v) => updateProductRow(i, 'product_id', v)}>
                                                        <SelectTrigger className={errors[`products.${i}.product_id`] ? 'border-red-500' : ''}>
                                                            <SelectValue placeholder={translate('Select product')} />
                                                        </SelectTrigger>
                                                        <SelectContent searchable>
                                                            {productOptions
                                                                .filter(
                                                                    (p: any) =>
                                                                        !data.products.some(
                                                                            (r, ri) => ri !== i && String(r.product_id) === String(p.id),
                                                                        ),
                                                                )
                                                                .map((p: any) => (
                                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                                        {p.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors[`products.${i}.product_id`] && (
                                                        <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.product_id`]}</p>
                                                    )}
                                                    {i === 0 && productOptions.length === 0 && (
                                                        <p className="mt-1 text-xs">
                                                            {translate('Click here to add')}{' '}
                                                            <a href={route('products.index')} className="font-medium underline">
                                                                {translate('Products')}
                                                            </a>
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-24 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Quantity')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={row.quantity}
                                                        onChange={(e) => updateProductRow(i, 'quantity', e.target.value)}
                                                        className={errors[`products.${i}.quantity`] ? 'border-red-500' : ''}
                                                    />
                                                    {errors[`products.${i}.quantity`] && (
                                                        <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.quantity`]}</p>
                                                    )}
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-32 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Unit Price')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={row.unit_price}
                                                        onChange={(e) => updateProductRow(i, 'unit_price', e.target.value)}
                                                        placeholder="0.00"
                                                        className={errors[`products.${i}.unit_price`] ? 'border-red-500' : ''}
                                                    />
                                                    {errors[`products.${i}.unit_price`] && (
                                                        <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.unit_price`]}</p>
                                                    )}
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-32 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Discount Type')}
                                                    </span>
                                                    <Select value={row.discount_type} onValueChange={(v) => updateProductRow(i, 'discount_type', v)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">{translate('None')}</SelectItem>
                                                            <SelectItem value="percentage">{translate('Percentage (%)')}</SelectItem>
                                                            <SelectItem value="fixed">{translate('Fixed Amount')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Discount Val')}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={row.discount_value}
                                                        onChange={(e) => updateProductRow(i, 'discount_value', e.target.value)}
                                                        disabled={row.discount_type === 'none'}
                                                        className="disabled:opacity-40"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">
                                                        {translate('Tax')}
                                                    </span>
                                                    {(() => {
                                                        const p = productOptions.find((p: any) => String(p.id) === row.product_id);
                                                        return (
                                                            <span className="text-muted-foreground text-sm font-medium">
                                                                {p?.tax
                                                                    ? `${p.tax.name} (${parseFloat(p.tax.rate).toFixed(2)}%)`
                                                                    : translate('No Tax')}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left font-mono font-medium xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">
                                                        {translate('Total')}
                                                    </span>
                                                    <span>{fmt(total)}</span>
                                                </td>
                                                <td className="col-span-1 block w-full border-t px-0 py-0 pt-2 text-right sm:col-span-2 xl:table-cell xl:w-12 xl:border-t-0 xl:px-4 xl:py-3 xl:pt-0 xl:text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProductRow(i)}
                                                        disabled={data.products.length <= 1}
                                                        className="cursor-pointer rounded p-1.5 text-gray-500 disabled:cursor-not-allowed disabled:opacity-30"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-gray-500" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end border-t p-4">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>{translate('Subtotal')}</span>
                                    <span className="font-mono font-medium">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>{translate('Discount')}</span>
                                    <span className="font-mono font-medium">-{fmt(totalDiscount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>{translate('Tax')}</span>
                                    <span className="font-mono font-medium">{fmt(totalTax)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-gray-100">
                                    <span>{translate('Grand Total')}</span>
                                    <span className="font-mono text-lg text-green-600">{fmt(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing & Shipping Address */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">{translate('Billing & Shipping Address')}</CardTitle>
                            <Button type="button" variant="outline" size="sm" onClick={copyBillingToShipping} className="text-xs">
                                <Copy className="mr-1 h-3 w-3" /> {translate('Copy Billing to Shipping')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            {/* Billing */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{translate('Billing Address')}</h3>
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium" required>
                                        {translate('Address')}
                                    </Label>
                                    <Textarea
                                        value={data.billing_address}
                                        onChange={(e) => {
                                            setranslate('billing_address', e.target.value);
                                            if (sameAsBilling) setData('shipping_address' as any, e.target.value);
                                        }}
                                        className={errors.billing_address ? 'border-red-500' : ''}
                                        rows={2}
                                        placeholder={translate('e.g. 123 Main Street, Suite 100')}
                                    />
                                    {errors.billing_address && <p className="text-xs text-red-500">{errors.billing_address}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium" required>
                                            {translate('City')}
                                        </Label>
                                        <Input
                                            value={data.billing_city}
                                            onChange={(e) => {
                                                setranslate('billing_city', e.target.value);
                                                if (sameAsBilling) setData('shipping_city' as any, e.target.value);
                                            }}
                                            className={errors.billing_city ? 'border-red-500' : ''}
                                            placeholder="New York"
                                        />
                                        {errors.billing_city && <p className="text-xs text-red-500">{errors.billing_city}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium" required>
                                            {translate('State')}
                                        </Label>
                                        <Input
                                            value={data.billing_state}
                                            onChange={(e) => {
                                                setranslate('billing_state', e.target.value);
                                                if (sameAsBilling) setData('shipping_state' as any, e.target.value);
                                            }}
                                            className={errors.billing_state ? 'border-red-500' : ''}
                                            placeholder="NY"
                                        />
                                        {errors.billing_state && <p className="text-xs text-red-500">{errors.billing_state}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium" required>
                                            {translate('Country')}
                                        </Label>
                                        <Input
                                            value={data.billing_country}
                                            onChange={(e) => {
                                                setranslate('billing_country', e.target.value);
                                                if (sameAsBilling) setData('shipping_country' as any, e.target.value);
                                            }}
                                            className={errors.billing_country ? 'border-red-500' : ''}
                                            placeholder="United States"
                                        />
                                        {errors.billing_country && <p className="text-xs text-red-500">{errors.billing_country}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium" required>
                                            {translate('Postal Code')}
                                        </Label>
                                        <Input
                                            value={data.billing_postal_code}
                                            onChange={(e) => {
                                                setranslate('billing_postal_code', e.target.value);
                                                if (sameAsBilling) setData('shipping_postal_code' as any, e.target.value);
                                            }}
                                            className={errors.billing_postal_code ? 'border-red-500' : ''}
                                            placeholder="10001"
                                        />
                                        {errors.billing_postal_code && <p className="text-xs text-red-500">{errors.billing_postal_code}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Shipping */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{translate('Shipping Address')}</h3>
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">{translate('Address')}</Label>
                                    <Textarea
                                        value={data.shipping_address}
                                        onChange={(e) => setranslate('shipping_address', e.target.value)}
                                        rows={2}
                                        placeholder={translate('e.g. 456 Elm Street')}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">{translate('City')}</Label>
                                        <Input
                                            value={data.shipping_city}
                                            onChange={(e) => setranslate('shipping_city', e.target.value)}
                                            placeholder="Los Angeles"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">{translate('State')}</Label>
                                        <Input
                                            value={data.shipping_state}
                                            onChange={(e) => setranslate('shipping_state', e.target.value)}
                                            placeholder="CA"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">{translate('Country')}</Label>
                                        <Input
                                            value={data.shipping_country}
                                            onChange={(e) => setranslate('shipping_country', e.target.value)}
                                            placeholder="United States"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-sm font-medium">{translate('Postal Code')}</Label>
                                        <Input
                                            value={data.shipping_postal_code}
                                            onChange={(e) => setranslate('shipping_postal_code', e.target.value)}
                                            placeholder="90001"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-6">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
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
