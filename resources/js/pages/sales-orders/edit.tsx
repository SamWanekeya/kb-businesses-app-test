import { toast } from '@components/CustomToast';
import { PageTemplate } from '@components/page-template';
import { Button } from '@components/UserInterface/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { Input } from '@components/UserInterface/input';
import { Label } from '@components/UserInterface/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/select';
import { Textarea } from '@components/UserInterface/textarea';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import axios from 'axios';
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type DiscountType = 'percentage' | 'fixed' | '';

interface ProductLine {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_type: DiscountType;
    discount_value: number;
}

interface FormData {
    name: string;
    description: string;
    quote_id: string;
    account_id: string;
    billing_contact_id: string;
    shipping_contact_id: string;
    shipping_provider_type_id: string;
    order_date: string;
    delivery_date: string;
    status: string;
    assigned_to: string;
    billing_address: string;
    billing_city: string;
    billing_state: string;
    billing_country: string;
    billing_postal_code: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_country: string;
    shipping_postal_code: string;
    products: ProductLine[];
}

interface Errors {
    [key: string]: string;
}

const fmt = (n: number) => window.appSettings?.formatCurrency(n) ?? `$${n.toFixed(2)}`;

function SearchSelect({
    value,
    onChange,
    options,
    placeholder,
    emptyNote,
    error,
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    emptyNote?: { link: string; linkText: string };
    error?: string;
}) {
    const { t: translate } = useTranslation();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));
    const selected = options.find((o) => o.value === value);

    useEffect(() => {
        if (!open) setSearch('');
    }, [open]);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className={`flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-left text-sm focus:ring-1 focus:ring-gray-400 focus:outline-none ${error ? 'border-red-500' : 'border-gray-300'}`}
            >
                <span className={selected ? 'text-gray-900' : 'text-gray-400'}>{selected?.label || placeholder || translate('Select...')}</span>
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="border-b p-2">
                        <input
                            autoFocus
                            className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:outline-none"
                            placeholder={translate('Search...')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <div className="p-3 text-center text-sm text-gray-500">
                                {emptyNote ? (
                                    <span>
                                        {translate('No records found.')}{' '}
                                        <a href={emptyNote.link} className="text-gray-600 underline">
                                            {translate('Add')} {emptyNote.linkText}
                                        </a>
                                    </span>
                                ) : (
                                    translate('No options found')
                                )}
                            </div>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${o.value === value ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-900'}`}
                                    onClick={() => {
                                        onChange(o.value);
                                        setOpen(false);
                                    }}
                                >
                                    {o.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <Label className="mb-1 block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

export default function SalesOrderEdit() {
    const { t: translate } = useTranslation();
    const { salesOrder, accounts, contacts, quotes, products, shippingProviderTypes, users } = usePage().props;

    const toDate = (d: string) => (d ? d.split('T')[0] : '');

    const [form, setForm] = useState<FormData>({
        name: salesOrder.name || '',
        description: salesOrder.description || '',
        quote_id: String(salesOrder.quote_id || ''),
        account_id: String(salesOrder.account_id || ''),
        billing_contact_id: String(salesOrder.billing_contact_id || ''),
        shipping_contact_id: String(salesOrder.shipping_contact_id || ''),
        shipping_provider_type_id: String(salesOrder.shipping_provider_type_id || ''),
        order_date: toDate(salesOrder.order_date),
        delivery_date: toDate(salesOrder.delivery_date),
        status: salesOrder.status || 'draft',
        assigned_to: String(salesOrder.assigned_to || ''),
        billing_address: salesOrder.billing_address || '',
        billing_city: salesOrder.billing_city || '',
        billing_state: salesOrder.billing_state || '',
        billing_country: salesOrder.billing_country || '',
        billing_postal_code: salesOrder.billing_postal_code || '',
        shipping_address: salesOrder.shipping_address || '',
        shipping_city: salesOrder.shipping_city || '',
        shipping_state: salesOrder.shipping_state || '',
        shipping_country: salesOrder.shipping_country || '',
        shipping_postal_code: salesOrder.shipping_postal_code || '',
        products: salesOrder.products?.length
            ? salesOrder.products.map((p: any) => ({
                  id: crypto.randomUUID(),
                  product_id: String(p.id),
                  quantity: parseInt(p.pivot?.quantity) || 1,
                  unit_price: parseFloat(p.pivot?.unit_price) || 0,
                  discount_type: (p.pivot?.discount_type === 'none' ? '' : p.pivot?.discount_type) || ('' as DiscountType),
                  discount_value: parseFloat(p.pivot?.discount_value) || 0,
              }))
            : [{ id: crypto.randomUUID(), product_id: '', quantity: 1, unit_price: 0, discount_type: '' as DiscountType, discount_value: 0 }],
    });
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [showShipping, setShowShipping] = useState(true);

    const set = (field: keyof FormData, value: any) => {
        setForm((p) => ({ ...p, [field]: value }));
        setErrors((p) => {
            const n = { ...p };
            delete n[field];
            return n;
        });
    };

    const setLine = (id: string, field: keyof ProductLine, value: any) => {
        setForm((p) => ({
            ...p,
            products: p.products.map((l) => {
                if (l.id !== id) return l;
                const updated = { ...l, [field]: value };
                if (field === 'product_id') {
                    const prod = products?.find((p: any) => String(p.id) === String(value));
                    if (prod) updated.unit_price = parseFloat(prod.price) || 0;
                }
                return updated;
            }),
        }));
        if (field === 'product_id' && value) {
            const idx = form.products.findIndex((l) => l.id === id);
            setErrors((p) => {
                const n = { ...p };
                delete n.products;
                if (idx >= 0) delete n[`products.${idx}.product_id`];
                return n;
            });
        }
    };

    const addLine = () =>
        setForm((p) => ({
            ...p,
            products: [
                ...p.products,
                { id: crypto.randomUUID(), product_id: '', quantity: 1, unit_price: 0, discount_type: '' as DiscountType, discount_value: 0 },
            ],
        }));

    const removeLine = (id: string) =>
        setForm((p) => ({
            ...p,
            products: p.products.length <= 1 ? p.products : p.products.filter((l) => l.id !== id),
        }));

    const handleQuoteChange = useCallback(async (quoteId: string) => {
        setranslate('quote_id', quoteId);
        if (!quoteId) return;
        setLoadingQuote(true);
        try {
            const { data } = await axios.get(route('api.quotes.details', quoteId));
            setForm((p) => ({
                ...p,
                quote_id: quoteId,
                account_id: String(data.account_id || ''),
                billing_contact_id: String(data.billing_contact_id || ''),
                shipping_contact_id: String(data.shipping_contact_id || ''),
                shipping_provider_type_id: String(data.shipping_provider_type_id || ''),
                billing_address: data.billing_address || '',
                billing_city: data.billing_city || '',
                billing_state: data.billing_state || '',
                billing_country: data.billing_country || '',
                billing_postal_code: data.billing_postal_code || '',
                shipping_address: data.shipping_address || '',
                shipping_city: data.shipping_city || '',
                shipping_state: data.shipping_state || '',
                shipping_country: data.shipping_country || '',
                shipping_postal_code: data.shipping_postal_code || '',
                products: data.products?.length
                    ? data.products.map((pr: any) => ({
                          id: crypto.randomUUID(),
                          product_id: String(pr.product_id),
                          quantity: pr.quantity || 1,
                          unit_price: parseFloat(pr.unit_price) || 0,
                          discount_type: pr.discount_type === 'none' ? '' : pr.discount_type || '',
                          discount_value: parseFloat(pr.discount_value) || 0,
                      }))
                    : p.products,
            }));
            setErrors((p) => {
                const n = { ...p };
                delete n.account_id;
                delete n.billing_contact_id;
                delete n.shipping_contact_id;
                delete n.shipping_provider_type_id;
                delete n.billing_address;
                delete n.billing_city;
                delete n.billing_state;
                delete n.billing_country;
                delete n.billing_postal_code;
                if (data.products?.length) {
                    delete n.products;
                    data.products.forEach((_: any, i: number) => delete n[`products.${i}.product_id`]);
                }
                return n;
            });
        } catch {
            toast.error(translate('Failed to load quote details'));
        } finally {
            setLoadingQuote(false);
        }
    }, []);

    const copyBillingToShipping = () => {
        setForm((p) => ({
            ...p,
            shipping_address: p.billing_address,
            shipping_city: p.billing_city,
            shipping_state: p.billing_state,
            shipping_country: p.billing_country,
            shipping_postal_code: p.billing_postal_code,
        }));
        toast.success(translate('Billing address copied to shipping'));
    };

    const calcLine = (l: ProductLine) => {
        const gross = l.quantity * l.unit_price;
        let discount = 0;
        if (l.discount_type === 'percentage') discount = (gross * l.discount_value) / 100;
        else if (l.discount_type === 'fixed') discount = Math.min(l.discount_value, gross);
        const net = gross - discount;
        const prod = products?.find((p: any) => String(p.id) === String(l.product_id));
        const tax = prod?.tax ? (net * prod.tax.rate) / 100 : 0;
        return { gross, discount, net, tax, total: net };
    };

    const totals = form.products.reduce(
        (acc, l) => {
            const c = calcLine(l);
            return { discount: acc.discount + c.discount, subtotal: acc.subtotal + c.net, tax: acc.tax + c.tax };
        },
        { discount: 0, subtotal: 0, tax: 0 },
    );

    const validate = (): boolean => {
        const e: Errors = {};
        if (!form.name.trim()) e.name = translate('Name is required');
        if (!form.quote_id) e.quote_id = translate('Quote is required');
        if (!form.account_id) e.account_id = translate('Account is required');
        if (!form.billing_contact_id) e.billing_contact_id = translate('Billing contact is required');
        if (!form.shipping_contact_id) e.shipping_contact_id = translate('Shipping contact is required');
        if (!form.shipping_provider_type_id) e.shipping_provider_type_id = translate('Shipping provider is required');
        if (!form.order_date) e.order_date = translate('Order date is required');
        if (!form.assigned_to) e.assigned_to = translate('Assigned user is required');
        if (!form.billing_address.trim()) e.billing_address = translate('Billing address is required');
        if (!form.billing_city.trim()) e.billing_city = translate('Billing city is required');
        if (!form.billing_state.trim()) e.billing_state = translate('Billing state is required');
        if (!form.billing_country.trim()) e.billing_country = translate('Billing country is required');
        if (!form.billing_postal_code.trim()) e.billing_postal_code = translate('Billing postal code is required');
        if (!form.products.length || form.products.every((l) => !l.product_id)) e.products = translate('At least one product is required');
        form.products.forEach((l, i) => {
            if (!l.product_id) e[`products.${i}.product_id`] = translate('Product is required');
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }
        if ((window as any).isDemo) {
            router.put(route('sales-orders.update', salesOrder.id), {});
            return;
        }
        setSubmitting(true);
        const payload = {
            ...form,
            products: form.products
                .filter((l) => l.product_id)
                .map(({ id, discount_type, ...rest }) => ({
                    ...rest,
                    discount_type: discount_type || 'none',
                })),
        };
        router.put(route('sales-orders.update', salesOrder.id), payload, {
            onSuccess: () => {
                toast.dismiss();
            },
            onError: (errs) => {
                setSubmitting(false);
                toast.dismiss();
                setErrors(errs as Errors);
            },
        });
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Sales Orders'), href: route('sales-orders.index') },
        { title: translate('Edit') },
    ];

    const quoteOptions = (quotes || []).map((q: any) => ({ value: String(q.id), label: `${q.quote_number} – ${q.name}` }));
    const accountOptions = (accounts || []).map((a: any) => ({ value: String(a.id), label: a.name }));
    const contactOptions = (contacts || []).map((c: any) => ({ value: String(c.id), label: c.name }));
    const providerOptions = (shippingProviderTypes || []).map((s: any) => ({ value: String(s.id), label: s.name }));
    const userOptions = (users || []).map((u: any) => ({ value: String(u.id), label: `${u.name} (${u.email})` }));
    const productOptions = (products || []).map((p: any) => ({
        value: String(p.id),
        label: p.name,
    }));

    return (
        <PageTemplate
            title={translate('Edit Sales Order')}
            description={translate('Update sales order details and related information')}
            url="/sales-orders"
            breadcrumbs={breadcrumbs}
            fullWidth
            noPadding
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('sales-orders.index', salesOrder.id)),
                },
            ]}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <CardTitle className="text-base font-semibold">{translate('Order Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Field label={translate('Order Name')} required error={errors.name}>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setranslate('name', e.target.value)}
                                    placeholder={translate('e.g. Annual Hardware Order 2025')}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label={translate('Description')} error={errors.description}>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setranslate('description', e.target.value)}
                                    placeholder={translate('Describe the purpose or details of this order...')}
                                    rows={2}
                                />
                            </Field>
                        </div>
                        <Field label={translate('Quote')} required error={errors.quote_id}>
                            <div className="relative">
                                <Select value={form.quote_id} onValueChange={handleQuoteChange}>
                                    <SelectTrigger className={errors.quote_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select a quote')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {quoteOptions.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {loadingQuote && (
                                    <span className="absolute top-2.5 right-8 animate-pulse text-xs text-gray-400">{translate('Loading...')}</span>
                                )}
                            </div>
                        </Field>
                        <Field label={translate('Account')} required error={errors.account_id}>
                            <Select value={form.account_id} onValueChange={(v) => setranslate('account_id', v)}>
                                <SelectTrigger className={errors.account_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select account')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {accountOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={translate('Order Date')} required error={errors.order_date}>
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
                                    value={form.order_date}
                                    onChange={(e) => setranslate('order_date', e.target.value)}
                                    className={`cursor-pointer ${errors.order_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                        </Field>
                        <Field label={translate('Delivery Date')} error={errors.delivery_date}>
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
                                    value={form.delivery_date}
                                    onChange={(e) => setranslate('delivery_date', e.target.value)}
                                    className="cursor-pointer"
                                />
                            </div>
                        </Field>
                        <Field label={translate('Status')} error={errors.status}>
                            <Select value={form.status} onValueChange={(v) => setranslate('status', v)}>
                                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        ['draft', translate('Draft')],
                                        ['confirmed', translate('Confirmed')],
                                        ['processing', translate('Processing')],
                                        ['shipped', translate('Shipped')],
                                        ['delivered', translate('Delivered')],
                                        ['cancelled', translate('Cancelled')],
                                    ].map(([v, l]) => (
                                        <SelectItem key={v} value={v}>
                                            {l}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={translate('Assign To')} required error={errors.assigned_to}>
                            <Select value={form.assigned_to} onValueChange={(v) => setranslate('assigned_to', v)}>
                                <SelectTrigger className={errors.assigned_to ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select user')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {userOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </CardContent>
                </Card>

                {/* Contacts & Shipping Provider */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <CardTitle className="text-base font-semibold">{translate('Contacts & Shipping Provider')}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">
                        <Field label={translate('Billing Contact')} required error={errors.billing_contact_id}>
                            <Select value={form.billing_contact_id} onValueChange={(v) => setranslate('billing_contact_id', v)}>
                                <SelectTrigger className={errors.billing_contact_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select billing contact')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {contactOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={translate('Shipping Contact')} required error={errors.shipping_contact_id}>
                            <Select value={form.shipping_contact_id} onValueChange={(v) => setranslate('shipping_contact_id', v)}>
                                <SelectTrigger className={errors.shipping_contact_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select shipping contact')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {contactOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={translate('Shipping Provider')} required error={errors.shipping_provider_type_id}>
                            <Select value={form.shipping_provider_type_id} onValueChange={(v) => setranslate('shipping_provider_type_id', v)}>
                                <SelectTrigger className={errors.shipping_provider_type_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select provider')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {providerOptions.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
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
                            <Button type="button" size="sm" onClick={addLine}>
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
                                    {form.products.map((line, idx) => {
                                        const c = calcLine(line);
                                        const usedIds = form.products.filter((l) => l.id !== line.id && l.product_id).map((l) => l.product_id);
                                        const lineProductOptions = productOptions.filter(
                                            (o) => !usedIds.includes(o.value) || o.value === line.product_id,
                                        );
                                        return (
                                            <tr
                                                key={line.id}
                                                className="border-border relative grid grid-cols-1 gap-3 rounded-lg border border-b bg-gray-50/50 p-4 hover:bg-gray-50 sm:grid-cols-2 xl:table-row xl:gap-0 xl:space-y-0 xl:border-b xl:bg-transparent dark:bg-gray-800/30 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="col-span-1 block w-full px-0 py-0 sm:col-span-2 xl:table-cell xl:w-48 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Product')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Select value={line.product_id} onValueChange={(v) => setLine(line.id, 'product_id', v)}>
                                                        <SelectTrigger
                                                            className={errors[`products.${idx}.product_id`] ? 'w-full border-red-500' : 'w-full'}
                                                        >
                                                            <SelectValue placeholder={translate('Select product')} />
                                                        </SelectTrigger>
                                                        <SelectContent searchable>
                                                            {lineProductOptions.map((o) => (
                                                                <SelectItem key={o.value} value={o.value}>
                                                                    {o.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {errors[`products.${idx}.product_id`] && (
                                                        <p className="mt-1 text-xs text-red-500">{errors[`products.${idx}.product_id`]}</p>
                                                    )}
                                                    {idx === 0 && productOptions.length === 0 && (
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
                                                        value={line.quantity}
                                                        onChange={(e) => setLine(line.id, 'quantity', parseInt(e.target.value) || 1)}
                                                    />
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-32 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Unit Price')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.unit_price}
                                                        onChange={(e) => setLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-32 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Discount Type')}
                                                    </span>
                                                    <Select
                                                        value={line.discount_type || 'none'}
                                                        onValueChange={(val) =>
                                                            setLine(line.id, 'discount_type', (val === 'none' ? '' : val) as DiscountType)
                                                        }
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder={translate('None')} />
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
                                                        min="0"
                                                        step="0.01"
                                                        value={line.discount_value}
                                                        disabled={!line.discount_type}
                                                        onChange={(e) => setLine(line.id, 'discount_value', parseFloat(e.target.value) || 0)}
                                                        className="disabled:opacity-40"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">
                                                        {translate('Tax')}
                                                    </span>
                                                    {(() => {
                                                        const prod = products?.find((p: any) => String(p.id) === String(line.product_id));
                                                        return (
                                                            <span className="text-muted-foreground text-sm font-medium">
                                                                {prod?.tax
                                                                    ? `${prod.tax.name} (${parseFloat(prod.tax.rate).toFixed(2)}%)`
                                                                    : translate('No Tax')}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left font-mono font-medium xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">
                                                        {translate('Total')}
                                                    </span>
                                                    <span>{fmt(c.net + c.tax)}</span>
                                                </td>
                                                <td className="col-span-1 block w-full border-t px-0 py-0 pt-2 text-right sm:col-span-2 xl:table-cell xl:w-12 xl:border-t-0 xl:px-4 xl:py-3 xl:pt-0 xl:text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeLine(line.id)}
                                                        disabled={form.products.length <= 1}
                                                        className="cursor-pointer rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
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

                        <div className="flex justify-end border-t p-4">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>{translate('Subtotal')}</span>
                                    <span className="font-mono font-medium">{fmt(totals.subtotal + totals.discount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>{translate('Discount')}</span>
                                    <span className="font-mono font-medium">-{fmt(totals.discount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>{translate('Tax')}</span>
                                    <span className="font-mono font-medium">{fmt(totals.tax)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-gray-100">
                                    <span>{translate('Grand Total')}</span>
                                    <span className="font-mono text-lg text-green-600">{fmt(totals.subtotal + totals.tax)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing & Shipping */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">{translate('Billing & Shipping Address')}</CardTitle>
                            <button
                                type="button"
                                onClick={() => setShowShipping((p) => !p)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                                {showShipping ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {showShipping ? translate('Collapse') : translate('Expand')}
                            </button>
                        </div>
                    </CardHeader>
                    {showShipping && (
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                {/* Billing */}
                                <div>
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{translate('Billing Address')}</h3>
                                        <Button type="button" variant="outline" size="sm" onClick={copyBillingToShipping} className="text-xs">
                                            <Copy className="mr-1 h-3 w-3" /> {translate('Copy to Shipping')}
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        <Field label={translate('Billing Address')} required error={errors.billing_address}>
                                            <Textarea
                                                value={form.billing_address}
                                                onChange={(e) => setranslate('billing_address', e.target.value)}
                                                placeholder={translate('e.g. 123 Main St, Suite 100')}
                                                rows={2}
                                                className={errors.billing_address ? 'border-red-500' : ''}
                                            />
                                        </Field>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label={translate('City')} required error={errors.billing_city}>
                                                <Input
                                                    value={form.billing_city}
                                                    onChange={(e) => setranslate('billing_city', e.target.value)}
                                                    placeholder="New York"
                                                    className={errors.billing_city ? 'border-red-500' : ''}
                                                />
                                            </Field>
                                            <Field label={translate('State')} required error={errors.billing_state}>
                                                <Input
                                                    value={form.billing_state}
                                                    onChange={(e) => setranslate('billing_state', e.target.value)}
                                                    placeholder="NY"
                                                    className={errors.billing_state ? 'border-red-500' : ''}
                                                />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label={translate('Country')} required error={errors.billing_country}>
                                                <Input
                                                    value={form.billing_country}
                                                    onChange={(e) => setranslate('billing_country', e.target.value)}
                                                    placeholder="United States"
                                                    className={errors.billing_country ? 'border-red-500' : ''}
                                                />
                                            </Field>
                                            <Field label={translate('Postal Code')} required error={errors.billing_postal_code}>
                                                <Input
                                                    value={form.billing_postal_code}
                                                    onChange={(e) => setranslate('billing_postal_code', e.target.value)}
                                                    placeholder="10001"
                                                    className={errors.billing_postal_code ? 'border-red-500' : ''}
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping */}
                                <div>
                                    <h3 className="mb-4 font-semibold text-gray-800 dark:text-gray-100">{translate('Shipping Address')}</h3>
                                    <div className="space-y-3">
                                        <Field label={translate('Shipping Address')} error={errors.shipping_address}>
                                            <Textarea
                                                value={form.shipping_address}
                                                onChange={(e) => setranslate('shipping_address', e.target.value)}
                                                placeholder={translate('e.g. 456 Elm St, Warehouse B')}
                                                rows={2}
                                            />
                                        </Field>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label={translate('City')} error={errors.shipping_city}>
                                                <Input
                                                    value={form.shipping_city}
                                                    onChange={(e) => setranslate('shipping_city', e.target.value)}
                                                    placeholder="Los Angeles"
                                                />
                                            </Field>
                                            <Field label={translate('State')} error={errors.shipping_state}>
                                                <Input
                                                    value={form.shipping_state}
                                                    onChange={(e) => setranslate('shipping_state', e.target.value)}
                                                    placeholder="CA"
                                                />
                                            </Field>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Field label={translate('Country')} error={errors.shipping_country}>
                                                <Input
                                                    value={form.shipping_country}
                                                    onChange={(e) => setranslate('shipping_country', e.target.value)}
                                                    placeholder="United States"
                                                />
                                            </Field>
                                            <Field label={translate('Postal Code')} error={errors.shipping_postal_code}>
                                                <Input
                                                    value={form.shipping_postal_code}
                                                    onChange={(e) => setranslate('shipping_postal_code', e.target.value)}
                                                    placeholder="90001"
                                                />
                                            </Field>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pb-6">
                    <Button type="button" variant="outline" onClick={() => router.visit(route('sales-orders.show', salesOrder.id))}>
                        {translate('Cancel')}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? translate('Saving...') : translate('Save')}
                    </Button>
                </div>
            </form>
        </PageTemplate>
    );
}
