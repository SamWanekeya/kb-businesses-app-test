import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

type DiscountType = 'percentage' | 'fixed' | 'none' | '';

interface ProductLine {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_type: DiscountType;
    discount_value: number;
}

interface Errors {
    [key: string]: string;
}

const emptyLine = (): ProductLine => ({
    id: crypto.randomUUID(),
    product_id: '',
    quantity: 1,
    unit_price: 0,
    discount_type: 'none',
    discount_value: 0,
});

const fmt = (n: number) => window.appSettings?.formatCurrency(n) ?? `$${n.toFixed(2)}`;

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <Label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label} {required && <span className="text-red-500">*</span>}
            </Label>
            {children}
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
}

export default function InvoiceEdit() {
    const { t } = useTranslation();
    const { invoice, accounts, contacts, salesOrders, quotes, opportunities, products, users } = usePage().props;

    const isPaidOrCancelled = invoice?.status === 'paid' || invoice?.status === 'cancelled';

    const [form, setForm] = useState({
        name: invoice?.name || '',
        description: invoice?.description || '',
        sales_order_id: invoice?.sales_order_id ? String(invoice.sales_order_id) : '',
        quote_id: invoice?.quote_id ? String(invoice.quote_id) : '',
        opportunity_id: invoice?.opportunity_id ? String(invoice.opportunity_id) : '',
        account_id: invoice?.account_id ? String(invoice.account_id) : '',
        contact_id: invoice?.contact_id ? String(invoice.contact_id) : '',
        invoice_date: invoice?.invoice_date ? invoice.invoice_date.split('T')[0] : '',
        due_date: invoice?.due_date ? invoice.due_date.split('T')[0] : '',
        status: invoice?.status || 'draft',
        assigned_to: invoice?.assigned_to ? String(invoice.assigned_to) : '',
        billing_address: invoice?.billing_address || '',
        billing_city: invoice?.billing_city || '',
        billing_state: invoice?.billing_state || '',
        billing_country: invoice?.billing_country || '',
        billing_postal_code: invoice?.billing_postal_code || '',
        notes: invoice?.notes || '',
        terms: invoice?.terms || '',
        products: invoice?.products?.length
            ? invoice.products.map((p: any) => ({
                  id: crypto.randomUUID(),
                  product_id: String(p.id),
                  quantity: parseInt(p.pivot?.quantity || 1),
                  unit_price: parseFloat(p.pivot?.unit_price || p.price || 0),
                  discount_type: (p.pivot?.discount_type || 'none') as DiscountType,
                  discount_value: parseFloat(p.pivot?.discount_value || 0),
              }))
            : [emptyLine()],
    });
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingSalesOrder, setLoadingSalesOrder] = useState(false);

    const handleSalesOrderChange = useCallback(async (salesOrderId: string) => {
        set('sales_order_id', salesOrderId);
        if (!salesOrderId) return;
        setLoadingSalesOrder(true);
        try {
            const { data } = await axios.get(route('api.invoices.sales-orders.details', salesOrderId));
            setForm((p: any) => ({
                ...p,
                sales_order_id: salesOrderId,
                account_id: data.account_id ? String(data.account_id) : p.account_id,
                contact_id: data.contact_id ? String(data.contact_id) : p.contact_id,
                quote_id: data.quote_id ? String(data.quote_id) : p.quote_id,
                opportunity_id: data.opportunity_id ? String(data.opportunity_id) : p.opportunity_id,
                billing_address: data.billing_address || p.billing_address,
                billing_city: data.billing_city || p.billing_city,
                billing_state: data.billing_state || p.billing_state,
                billing_postal_code: data.billing_postal_code || p.billing_postal_code,
                billing_country: data.billing_country || p.billing_country,
                products: data.products?.length
                    ? data.products.map((pr: any) => ({
                          id: crypto.randomUUID(),
                          product_id: String(pr.product_id),
                          quantity: parseInt(pr.quantity) || 1,
                          unit_price: parseFloat(pr.unit_price) || 0,
                          discount_type: (pr.discount_type === 'none' ? 'none' : pr.discount_type || 'none') as DiscountType,
                          discount_value: parseFloat(pr.discount_value) || 0,
                      }))
                    : p.products,
            }));
            setErrors((p) => {
                const n = { ...p };
                delete n.account_id;
                delete n.contact_id;
                delete n.quote_id;
                delete n.opportunity_id;
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
            toast.error(t('Failed to load sales order details'));
        } finally {
            setLoadingSalesOrder(false);
        }
    }, []);

    const set = (field: string, value: any) => {
        setForm((p: any) => ({ ...p, [field]: value }));
        setErrors((p) => {
            const n = { ...p };
            delete n[field];
            return n;
        });
    };

    const setLine = (id: string, field: keyof ProductLine, value: any) => {
        setForm((p: any) => ({
            ...p,
            products: p.products.map((l: ProductLine) => {
                if (l.id !== id) return l;
                const updated = { ...l, [field]: value };
                if (field === 'product_id') {
                    const prod = products?.find((p: any) => String(p.id) === String(value));
                    if (prod) updated.unit_price = parseFloat(prod.price) || 0;
                }
                return updated;
            }),
        }));
    };

    const addLine = () => setForm((p: any) => ({ ...p, products: [...p.products, emptyLine()] }));
    const removeLine = (id: string) =>
        setForm((p: any) => ({ ...p, products: p.products.length <= 1 ? p.products : p.products.filter((l: ProductLine) => l.id !== id) }));

    const calcLine = (l: ProductLine) => {
        const gross = l.quantity * l.unit_price;
        let discount = 0;
        if (l.discount_type === 'percentage') discount = (gross * l.discount_value) / 100;
        else if (l.discount_type === 'fixed') discount = Math.min(l.discount_value, gross);
        const net = gross - discount;
        const prod = products?.find((p: any) => String(p.id) === String(l.product_id));
        const tax = prod?.tax ? (net * prod.tax.rate) / 100 : 0;
        return { gross, discount, net, tax, total: net + tax };
    };

    const totals = form.products.reduce(
        (acc: any, l: ProductLine) => {
            const c = calcLine(l);
            return { discount: acc.discount + c.discount, subtotal: acc.subtotal + c.net, tax: acc.tax + c.tax };
        },
        { discount: 0, subtotal: 0, tax: 0 },
    );

    const validate = (): boolean => {
        const e: Errors = {};
        if (!form.name.trim()) e.name = t('Name is required');
        if (!form.sales_order_id) e.sales_order_id = t('Sales Order is required');
        if (!form.account_id) e.account_id = t('Account is required');
        if (!form.contact_id) e.contact_id = t('Contact is required');
        if (!form.invoice_date) e.invoice_date = t('Invoice date is required');
        if (!form.due_date) e.due_date = t('Due date is required');
        if (!form.assigned_to) e.assigned_to = t('Assigned user is required');
        if (!form.billing_address.trim()) e.billing_address = t('Billing address is required');
        if (!form.billing_city.trim()) e.billing_city = t('Billing city is required');
        if (!form.billing_state.trim()) e.billing_state = t('Billing state is required');
        if (!form.billing_country.trim()) e.billing_country = t('Billing country is required');
        if (!form.billing_postal_code.trim()) e.billing_postal_code = t('Billing postal code is required');
        if (!form.products.length || form.products.every((l: ProductLine) => !l.product_id)) e.products = t('At least one product is required');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        if ((window as any).isDemo) {
            router.put(route('invoices.update', invoice.id), {});
            return;
        }
        setSubmitting(true);
        toast.loading(t('Updating invoice...'));
        const payload = {
            ...form,
            products: form.products
                .filter((l: ProductLine) => l.product_id)
                .map(({ id, discount_type, ...rest }: any) => ({
                    ...rest,
                    discount_type: discount_type || 'none',
                })),
        };
        router.put(route('invoices.update', invoice.id), payload, {
            onSuccess: () => {
                toast.dismiss();
            },
            onError: (errs) => {
                setSubmitting(false);
                toast.dismiss();
                const firstError = Object.values(errs)[0] as string;
                if (firstError) toast.error(firstError);
                setErrors(errs as Errors);
            },
        });
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Invoice'), href: route('invoices.index') },
        { title: t('Edit') },
    ];

    const salesOrderOptions = salesOrders || [];
    const quoteOptions = quotes || [];
    const opportunityOptions = opportunities || [];
    const accountOptions = accounts || [];
    const contactOptions = contacts || [];
    const userOptions = users || [];
    const productOptions = products || [];

    return (
        <PageTemplate
            title={t('Edit Invoice')}
            description={t('Update invoice details and related information')}
            url="/invoices"
            breadcrumbs={breadcrumbs}
            fullWidth
            noPadding
            actions={[
                {
                    label: t('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('invoices.index')),
                },
            ]}
        >
            {isPaidOrCancelled && (
                <div className="mb-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    {t('You cannot modify products when the order status is Cancelled or Paid.')}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Invoice Details */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold">{t('Invoice Details')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Row 1: Invoice Name, Sales Order */}
                        <div className="md:col-span-1 lg:col-span-2">
                            <Field label={t('Invoice Name')} required error={errors.name}>
                                <Input
                                    value={form.name}
                                    onChange={(e) => set('name', e.target.value)}
                                    placeholder={t('e.g. Annual Software License Invoice')}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                            </Field>
                        </div>
                        <div className="md:col-span-1 lg:col-span-2">
                            <Field label={t('Sales Order')} required error={errors.sales_order_id}>
                                <div className="relative">
                                    <Select value={form.sales_order_id} onValueChange={handleSalesOrderChange}>
                                        <SelectTrigger className={errors.sales_order_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder={t('Select Sales Order')} />
                                        </SelectTrigger>
                                        <SelectContent searchable>
                                            {salesOrderOptions.map((s: any) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.order_number} – {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {loadingSalesOrder && (
                                        <span className="absolute top-2.5 right-8 animate-pulse text-xs text-gray-400">{t('Loading...')}</span>
                                    )}
                                </div>
                            </Field>
                        </div>

                        {/* Row 2: Quote, Opportunity, Customer, Contact */}
                        <Field label={t('Quote')} error={errors.quote_id}>
                            <Select value={form.quote_id} onValueChange={(v) => set('quote_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Select Quote')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {quoteOptions.map((q: any) => (
                                        <SelectItem key={q.id} value={String(q.id)}>
                                            {q.quote_number} – {q.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={t('Opportunity')} error={errors.opportunity_id}>
                            <Select value={form.opportunity_id} onValueChange={(v) => set('opportunity_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('Select Opportunity')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {opportunityOptions.map((o: any) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={t('Account')} required error={errors.account_id}>
                            <Select value={form.account_id} onValueChange={(v) => set('account_id', v)}>
                                <SelectTrigger className={errors.account_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={t('Select Account')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {accountOptions.map((a: any) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={t('Contact')} required error={errors.contact_id}>
                            <Select value={form.contact_id} onValueChange={(v) => set('contact_id', v)}>
                                <SelectTrigger className={errors.contact_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={t('Select Contact')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {contactOptions.map((c: any) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        {/* Row 3: Invoice Date, Due Date, Status, Assign To */}
                        <Field label={t('Invoice Date')} required error={errors.invoice_date}>
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
                                    value={form.invoice_date}
                                    onChange={(e) => set('invoice_date', e.target.value)}
                                    className={`cursor-pointer ${errors.invoice_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                        </Field>
                        <Field label={t('Due Date')} required error={errors.due_date}>
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
                                    value={form.due_date}
                                    onChange={(e) => set('due_date', e.target.value)}
                                    className={`cursor-pointer ${errors.due_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                        </Field>
                        <Field label={t('Status')} error={errors.status}>
                            <Select value={form.status} onValueChange={(v) => set('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        ['draft', t('Draft')],
                                        ['sent', t('Sent')],
                                        ['pending', t('Pending')],
                                        ['paid', t('Paid')],
                                        ['partially_paid', t('Partially Paid')],
                                        ['overdue', t('Overdue')],
                                        ['cancelled', t('Cancelled')],
                                    ].map(([v, l]) => (
                                        <SelectItem key={v} value={v}>
                                            {l}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field label={t('Assign To')} required error={errors.assigned_to}>
                            <Select value={form.assigned_to} onValueChange={(v) => set('assigned_to', v)}>
                                <SelectTrigger className={errors.assigned_to ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={t('Select User')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {userOptions.map((u: any) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name} ({u.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>

                        {/* Row 4: Notes + Description */}
                        <div className="md:col-span-1 lg:col-span-2">
                            <Field label={t('Description')} error={errors.description}>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => set('description', e.target.value)}
                                    placeholder={t('Enter invoice description...')}
                                    rows={2}
                                />
                            </Field>
                        </div>
                        <div className="md:col-span-1 lg:col-span-2">
                            <Field label={t('Notes')} error={errors.notes}>
                                <Textarea
                                    value={form.notes}
                                    onChange={(e) => set('notes', e.target.value)}
                                    placeholder={t('Additional notes...')}
                                    rows={2}
                                />
                            </Field>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing Information */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <CardTitle className="text-base font-semibold">{t('Billing Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <Field label={t('Billing Address')} required error={errors.billing_address}>
                            <Textarea
                                value={form.billing_address}
                                onChange={(e) => set('billing_address', e.target.value)}
                                placeholder={t('e.g. 123 Main St')}
                                rows={2}
                                className={errors.billing_address ? 'border-red-500' : ''}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label={t('City')} required error={errors.billing_city}>
                                <Input
                                    value={form.billing_city}
                                    onChange={(e) => set('billing_city', e.target.value)}
                                    className={errors.billing_city ? 'border-red-500' : ''}
                                />
                            </Field>
                            <Field label={t('State')} required error={errors.billing_state}>
                                <Input
                                    value={form.billing_state}
                                    onChange={(e) => set('billing_state', e.target.value)}
                                    className={errors.billing_state ? 'border-red-500' : ''}
                                />
                            </Field>
                            <Field label={t('Country')} required error={errors.billing_country}>
                                <Input
                                    value={form.billing_country}
                                    onChange={(e) => set('billing_country', e.target.value)}
                                    className={errors.billing_country ? 'border-red-500' : ''}
                                />
                            </Field>
                            <Field label={t('Postal Code')} required error={errors.billing_postal_code}>
                                <Input
                                    value={form.billing_postal_code}
                                    onChange={(e) => set('billing_postal_code', e.target.value)}
                                    className={errors.billing_postal_code ? 'border-red-500' : ''}
                                />
                            </Field>
                        </div>
                        <Field label={t('Terms')} error={errors.terms}>
                            <Textarea
                                value={form.terms}
                                onChange={(e) => set('terms', e.target.value)}
                                placeholder={t('Payment terms and conditions...')}
                                rows={2}
                            />
                        </Field>
                    </CardContent>
                </Card>

                {/* Invoice Items */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                                {t('Sales Invoice Items')}
                                {errors.products && <span className="ml-2 text-xs font-normal text-red-500">{errors.products}</span>}
                            </CardTitle>
                            {!isPaidOrCancelled && (
                                <Button type="button" size="sm" onClick={addLine}>
                                    <Plus className="mr-1 h-4 w-4" /> {t(' Add Product')}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto p-4 md:p-0">
                            <table className="block w-full text-sm xl:table">
                                <thead className="hidden xl:table-header-group">
                                    <tr className="border-b bg-gray-50 text-xs font-semibold tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                        <th className="min-w-[200px] px-4 py-3 text-left">
                                            {t('Product')} <span className="text-red-500">*</span>
                                        </th>
                                        <th className="w-24 px-4 py-3 text-left">
                                            {t('Quantity')} <span className="text-red-500">*</span>
                                        </th>
                                        <th className="w-32 px-4 py-3 text-left">
                                            {t('Unit Price')} <span className="text-red-500">*</span>
                                        </th>
                                        <th className="w-32 px-4 py-3 text-left">{t('Discount Type')}</th>
                                        <th className="w-28 px-4 py-3 text-left">{t('Discount Value')}</th>
                                        <th className="w-36 px-4 py-3 text-left">{t('Tax')}</th>
                                        <th className="w-28 px-4 py-3 text-left">{t('Total')}</th>
                                        {!isPaidOrCancelled && <th className="w-12 px-4 py-3">{t('Action')}</th>}
                                    </tr>
                                </thead>
                                <tbody className="block space-y-4 divide-y divide-gray-200 xl:table-row-group xl:space-y-0 xl:divide-y-0">
                                    {form.products.map((line: ProductLine) => {
                                        const c = calcLine(line);
                                        const usedIds = form.products
                                            .filter((l: ProductLine) => l.id !== line.id && l.product_id)
                                            .map((l: ProductLine) => l.product_id);
                                        const lineProductOptions = productOptions.filter(
                                            (o: any) => !usedIds.includes(String(o.id)) || String(o.id) === line.product_id,
                                        );
                                        const prod = products?.find((p: any) => String(p.id) === String(line.product_id));
                                        return (
                                            <tr
                                                key={line.id}
                                                className="border-border relative grid grid-cols-1 gap-3 rounded-lg border border-b bg-gray-50/50 p-4 hover:bg-gray-50 sm:grid-cols-2 xl:table-row xl:gap-0 xl:space-y-0 xl:border-b xl:bg-transparent dark:bg-gray-800/30 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="col-span-1 block w-full px-0 py-0 sm:col-span-2 xl:table-cell xl:w-[200px] xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {t('Product')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Select
                                                        value={line.product_id}
                                                        onValueChange={(v) => setLine(line.id, 'product_id', v)}
                                                        disabled={isPaidOrCancelled}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={t('Select product')} />
                                                        </SelectTrigger>
                                                        <SelectContent searchable>
                                                            {lineProductOptions.map((o: any) => (
                                                                <SelectItem key={o.id} value={String(o.id)}>
                                                                    {o.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {form.products.indexOf(line) === 0 && productOptions.length === 0 && (
                                                        <p className="mt-1 text-xs">
                                                            {t('Click here to add')}{' '}
                                                            <a href={route('products.index')} className="font-medium underline">
                                                                {t('Products')}
                                                            </a>
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-24 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {t('Quantity')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={line.quantity}
                                                        disabled={isPaidOrCancelled}
                                                        onChange={(e) => setLine(line.id, 'quantity', parseInt(e.target.value) || 1)}
                                                    />
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-32 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {t('Unit Price')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.unit_price}
                                                        disabled={isPaidOrCancelled}
                                                        onChange={(e) => setLine(line.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-32 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {t('Discount Type')}
                                                    </span>
                                                    <Select
                                                        value={line.discount_type || 'none'}
                                                        onValueChange={(v) => setLine(line.id, 'discount_type', v as DiscountType)}
                                                        disabled={isPaidOrCancelled}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">{t('None')}</SelectItem>
                                                            <SelectItem value="percentage">{t('Percentage (%)')}</SelectItem>
                                                            <SelectItem value="fixed">{t('Fixed Amount')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {t('Discount Value')}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.discount_value}
                                                        disabled={isPaidOrCancelled || !line.discount_type || line.discount_type === 'none'}
                                                        onChange={(e) => setLine(line.id, 'discount_value', parseFloat(e.target.value) || 0)}
                                                        className="disabled:opacity-40"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left xl:table-cell xl:w-36 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">{t('Tax')}</span>
                                                    <span className="text-muted-foreground text-sm font-medium">
                                                        {prod?.tax ? `${prod.tax.name} (${parseFloat(prod.tax.rate).toFixed(2)}%)` : t('No Tax')}
                                                    </span>
                                                </td>
                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left font-semibold xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">{t('Total')}</span>
                                                    <span className="font-mono">{fmt(c.total)}</span>
                                                </td>
                                                {!isPaidOrCancelled && (
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
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Invoice Summary */}
                        <div className="flex justify-end border-t p-4">
                            <div className="w-64 space-y-2">
                                <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">{t('Invoice Summary')}</h4>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>{t('Subtotal')}</span>
                                    <span className="font-mono">{fmt(totals.subtotal + totals.discount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>{t('Discount')}</span>
                                    <span className="font-mono">-{fmt(totals.discount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>{t('Tax')}</span>
                                    <span className="font-mono">{fmt(totals.tax)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-gray-100">
                                    <span>{t('Total')}</span>
                                    <span className="font-mono">{fmt(totals.subtotal + totals.tax)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="flex items-center justify-between pb-6">
                    <span className="text-sm text-gray-500">
                        {form.products.filter((l: ProductLine) => l.product_id).length} {t('Product added')}
                    </span>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('invoices.index'))}>
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? t('Saving...') : t('Save')}
                        </Button>
                    </div>
                </div>
            </form>
        </PageTemplate>
    );
}
