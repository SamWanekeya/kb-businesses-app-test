import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Textarea } from '@components/UserInterface/Textarea';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
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

interface FormData {
    name: string;
    description: string;
    sales_order_id: string;
    quote_id: string;
    opportunity_id: string;
    account_id: string;
    contact_id: string;
    invoice_date: string;
    due_date: string;
    status: string;
    assigned_to: string;
    billing_address: string;
    billing_city: string;
    billing_state: string;
    billing_country: string;
    billing_postal_code: string;
    notes: string;
    terms: string;
    products: ProductLine[];
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

export default function InvoiceCreate() {
    const { t: translate } = useTranslation();
    const { accounts, contacts, salesOrders, quotes, opportunities, products, users, globalSettings } = usePage().props;

    const [form, setForm] = useState<FormData>({
        name: '',
        description: '',
        sales_order_id: '',
        quote_id: '',
        opportunity_id: '',
        account_id: '',
        contact_id: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        status: 'draft',
        assigned_to: '',
        billing_address: '',
        billing_city: '',
        billing_state: '',
        billing_country: '',
        billing_postal_code: '',
        notes: '',
        terms: '',
        products: [emptyLine()],
    });
    const [errors, setErrors] = useState<Errors>({});
    const [submitting, setSubmitting] = useState(false);
    const [loadingSalesOrder, setLoadingSalesOrder] = useState(false);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [loadingOpportunity, setLoadingOpportunity] = useState(false);

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
    };

    const addLine = () => setForm((p) => ({ ...p, products: [...p.products, emptyLine()] }));
    const removeLine = (id: string) =>
        setForm((p) => ({ ...p, products: p.products.length <= 1 ? p.products : p.products.filter((l) => l.id !== id) }));

    const handleSalesOrderChange = useCallback(async (soId: string) => {
        setranslate('sales_order_id', soId);
        if (!soId) return;
        setLoadingSalesOrder(true);
        try {
            const { data } = await axios.get(route('api.invoices.sales-orders.details', soId));
            setForm((p) => ({
                ...p,
                sales_order_id: soId,
                account_id: String(data.account_id || ''),
                contact_id: String(data.contact_id || ''),
                quote_id: String(data.quote_id || ''),
                opportunity_id: String(data.opportunity_id || ''),
                billing_address: data.billing_address || '',
                billing_city: data.billing_city || '',
                billing_state: data.billing_state || '',
                billing_country: data.billing_country || '',
                billing_postal_code: data.billing_postal_code || '',
                products: data.products?.length
                    ? data.products.map((pr: any) => ({
                          id: crypto.randomUUID(),
                          product_id: String(pr.product_id),
                          quantity: pr.quantity || 1,
                          unit_price: parseFloat(pr.unit_price) || 0,
                          discount_type: pr.discount_type === 'none' ? 'none' : pr.discount_type || 'none',
                          discount_value: parseFloat(pr.discount_value) || 0,
                      }))
                    : p.products,
            }));
            setErrors({});
        } catch {
            toast.error(translate('Failed to load sales order details'));
        } finally {
            setLoadingSalesOrder(false);
        }
    }, []);

    const handleQuoteChange = useCallback(async (quoteId: string) => {
        setranslate('quote_id', quoteId);
        if (!quoteId) return;
        setLoadingQuote(true);
        try {
            const { data } = await axios.get(route('api.invoices.quotes.details', quoteId));
            setForm((p) => ({
                ...p,
                quote_id: quoteId,
                account_id: String(data.account_id || p.account_id),
                contact_id: String(data.contact_id || p.contact_id),
                billing_address: data.billing_address || p.billing_address,
                billing_city: data.billing_city || p.billing_city,
                billing_state: data.billing_state || p.billing_state,
                billing_country: data.billing_country || p.billing_country,
                billing_postal_code: data.billing_postal_code || p.billing_postal_code,
                products: data.products?.length
                    ? data.products.map((pr: any) => ({
                          id: crypto.randomUUID(),
                          product_id: String(pr.product_id),
                          quantity: pr.quantity || 1,
                          unit_price: parseFloat(pr.unit_price) || 0,
                          discount_type: pr.discount_type || 'none',
                          discount_value: parseFloat(pr.discount_value) || 0,
                      }))
                    : p.products,
            }));
        } catch {
            toast.error(translate('Failed to load quote details'));
        } finally {
            setLoadingQuote(false);
        }
    }, []);

    const handleOpportunityChange = useCallback(async (opportunityId: string) => {
        setranslate('opportunity_id', opportunityId);
        if (!opportunityId) return;
        setLoadingOpportunity(true);
        try {
            const { data } = await axios.get(route('api.invoices.opportunities.details', opportunityId));
            setForm((p) => ({
                ...p,
                opportunity_id: opportunityId,
                account_id: String(data.account_id || p.account_id),
                contact_id: String(data.contact_id || p.contact_id),
                products: data.products?.length
                    ? data.products.map((pr: any) => ({
                          id: crypto.randomUUID(),
                          product_id: String(pr.product_id),
                          quantity: pr.quantity || 1,
                          unit_price: parseFloat(pr.unit_price) || 0,
                          discount_type: pr.discount_type || 'none',
                          discount_value: parseFloat(pr.discount_value) || 0,
                      }))
                    : p.products,
            }));
        } catch {
            toast.error(translate('Failed to load opportunity details'));
        } finally {
            setLoadingOpportunity(false);
        }
    }, []);

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
        (acc, l) => {
            const c = calcLine(l);
            return { discount: acc.discount + c.discount, subtotal: acc.subtotal + c.net, tax: acc.tax + c.tax };
        },
        { discount: 0, subtotal: 0, tax: 0 },
    );

    const validate = (): boolean => {
        const e: Errors = {};
        if (!form.name.trim()) e.name = translate('Name is required');
        if (!form.sales_order_id) e.sales_order_id = translate('Sales Order is required');
        if (!form.account_id) e.account_id = translate('Account is required');
        if (!form.contact_id) e.contact_id = translate('Contact is required');
        if (!form.invoice_date) e.invoice_date = translate('Invoice date is required');
        if (!form.due_date) e.due_date = translate('Due date is required');
        if (!form.assigned_to) e.assigned_to = translate('Assigned user is required');
        if (!form.billing_address.trim()) e.billing_address = translate('Billing address is required');
        if (!form.billing_city.trim()) e.billing_city = translate('Billing city is required');
        if (!form.billing_state.trim()) e.billing_state = translate('Billing state is required');
        if (!form.billing_country.trim()) e.billing_country = translate('Billing country is required');
        if (!form.billing_postal_code.trim()) e.billing_postal_code = translate('Billing postal code is required');
        if (!form.products.length || form.products.every((l) => !l.product_id)) e.products = translate('At least one product is required');
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        const toastId = toast.loading(translate('Creating invoice...'));
        const payload = {
            ...form,
            products: form.products
                .filter((l) => l.product_id)
                .map(({ id, discount_type, ...rest }) => ({
                    ...rest,
                    discount_type: discount_type || 'none',
                })),
        };
        router.post(route('invoices.store'), payload, {
            onSuccess: () => {
                toast.dismiss(toastId);
            },
            onError: (errs) => {
                setSubmitting(false);
                toast.dismiss(toastId);
                const firstError = Object.values(errs)[0] as string;
                if (firstError) toast.error(firstError);
                setErrors(errs as Errors);
            },
        });
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Invoices'), href: route('invoices.index') },
        { title: translate('Create') },
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
            title={translate('Create Invoice')}
            description={translate('Fill in the details to create a new invoice')}
            url="/invoices"
            breadcrumbs={breadcrumbs}
            fullWidth
            noPadding
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('invoices.index')),
                },
            ]}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Invoice Details */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-base font-semibold">{translate('Invoice Details')}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Row 1: Invoice Name, Sales Order */}
                        <div className="md:col-span-1 lg:col-span-2">
                            <Field label={translate('Invoice Name')} required error={errors.name}>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setranslate('name', e.target.value)}
                                    placeholder={translate('e.g. Annual Software License Invoice')}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                            </Field>
                        </div>
                        <div className="relative md:col-span-1 lg:col-span-2">
                            <Field label={translate('Sales Order')} required error={errors.sales_order_id}>
                                <Select value={form.sales_order_id} onValueChange={handleSalesOrderChange}>
                                    <SelectTrigger className={errors.sales_order_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select Sales Order')} />
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
                                    <span className="absolute top-7 right-2 animate-pulse text-xs text-gray-400">{translate('Loading...')}</span>
                                )}
                                {salesOrders.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('sales-orders.index')} className="font-medium underline">
                                            {translate('Sales Orders')}
                                        </a>
                                    </p>
                                )}
                            </Field>
                        </div>

                        {/* Row 2: Quote, Opportunity, Customer, Contact */}
                        <div className="relative">
                            <Field label={translate('Quote')} error={errors.quote_id}>
                                <Select value={form.quote_id} onValueChange={handleQuoteChange}>
                                    <SelectTrigger className={errors.quote_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select Quote')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {quoteOptions.map((q: any) => (
                                            <SelectItem key={q.id} value={String(q.id)}>
                                                {q.quote_number} – {q.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {loadingQuote && (
                                    <span className="absolute top-7 right-2 animate-pulse text-xs text-gray-400">{translate('Loading...')}</span>
                                )}
                                {quotes.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('quotes.index')} className="font-medium underline">
                                            {translate('Quotes')}
                                        </a>
                                    </p>
                                )}
                            </Field>
                        </div>
                        <div className="relative">
                            <Field label={translate('Opportunity')} error={errors.opportunity_id}>
                                <Select value={form.opportunity_id} onValueChange={handleOpportunityChange}>
                                    <SelectTrigger className={errors.opportunity_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select Opportunity')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {opportunityOptions.map((o: any) => (
                                            <SelectItem key={o.id} value={String(o.id)}>
                                                {o.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {loadingOpportunity && (
                                    <span className="absolute top-7 right-2 animate-pulse text-xs text-gray-400">{translate('Loading...')}</span>
                                )}
                                {opportunities.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('opportunities.index')} className="font-medium underline">
                                            {translate('Opportunities')}
                                        </a>
                                    </p>
                                )}
                            </Field>
                        </div>
                        <Field label={translate('Account')} required error={errors.account_id}>
                            <Select value={form.account_id} onValueChange={(v) => setranslate('account_id', v)}>
                                <SelectTrigger className={errors.account_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select Account')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {accountOptions.map((a: any) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {accounts.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('accounts.index')} className="font-medium underline">
                                        {translate('Accounts')}
                                    </a>
                                </p>
                            )}
                        </Field>
                        <Field label={translate('Contact')} required error={errors.contact_id}>
                            <Select value={form.contact_id} onValueChange={(v) => setranslate('contact_id', v)}>
                                <SelectTrigger className={errors.contact_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select Contact')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {contactOptions.map((c: any) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {contacts.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('contacts.index')} className="font-medium underline">
                                        {translate('Contacts')}
                                    </a>
                                </p>
                            )}
                        </Field>

                        {/* Row 3: Invoice Date, Due Date, Status, Assign To */}
                        <Field label={translate('Invoice Date')} required error={errors.invoice_date}>
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
                                    onChange={(e) => setranslate('invoice_date', e.target.value)}
                                    className={`cursor-pointer ${errors.invoice_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                        </Field>
                        <Field label={translate('Due Date')} required error={errors.due_date}>
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
                                    onChange={(e) => setranslate('due_date', e.target.value)}
                                    className={`cursor-pointer ${errors.due_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                        </Field>
                        <Field label={translate('Status')} error={errors.status}>
                            <Select value={form.status} onValueChange={(v) => setranslate('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        ['draft', translate('Draft')],
                                        ['sent', translate('Sent')],
                                        ['pending', translate('Pending')],
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
                                    <SelectValue placeholder={translate('Select User')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {userOptions.map((u: any) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name} ({u.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {users.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('users.index')} className="font-medium underline">
                                        {translate('Users')}
                                    </a>
                                </p>
                            )}
                        </Field>

                        {/* Row 4 & 5: Notes + Description in one row */}
                        <div className="md:col-span-1 lg:col-span-2">
                            <Field label={translate('Description')} error={errors.description}>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setranslate('description', e.target.value)}
                                    placeholder={translate('Enter invoice description...')}
                                    rows={2}
                                />
                            </Field>
                        </div>
                        <div className="md:col-span-1 lg:col-span-2">
                            <Field label={translate('Notes')} error={errors.notes}>
                                <Textarea
                                    value={form.notes}
                                    onChange={(e) => setranslate('notes', e.target.value)}
                                    placeholder={translate('Additional notes...')}
                                    rows={2}
                                />
                            </Field>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing Information */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardHeader className="border-b bg-gray-50 pb-3 dark:bg-gray-800">
                        <CardTitle className="text-base font-semibold">{translate('Billing Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <Field label={translate('Billing Address')} required error={errors.billing_address}>
                            <Textarea
                                value={form.billing_address}
                                onChange={(e) => setranslate('billing_address', e.target.value)}
                                placeholder={translate('e.g. 123 Main St, Suite 100')}
                                rows={2}
                                className={errors.billing_address ? 'border-red-500' : ''}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
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
                        <Field label={translate('Terms')} error={errors.terms}>
                            <Textarea
                                value={form.terms}
                                onChange={(e) => setranslate('terms', e.target.value)}
                                placeholder={translate('Payment terms and conditions...')}
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
                                {translate('Invoice Product')}
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
                                    <tr className="border-b bg-gray-50 text-xs font-semibold tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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
                                        <th className="w-28 px-4 py-3 text-left">{translate('Discount Value')}</th>
                                        <th className="w-36 px-4 py-3 text-left">{translate('Tax')}</th>
                                        <th className="w-28 px-4 py-3 text-left">{translate('Total')}</th>
                                        <th className="w-12 px-4 py-3">{translate('Action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="block space-y-4 divide-y divide-gray-200 xl:table-row-group xl:space-y-0 xl:divide-y-0">
                                    {form.products.map((line) => {
                                        const c = calcLine(line);
                                        const usedIds = form.products.filter((l) => l.id !== line.id && l.product_id).map((l) => l.product_id);
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
                                                        {translate('Product')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Select value={line.product_id} onValueChange={(v) => setLine(line.id, 'product_id', v)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={translate('Select product')} />
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
                                                        onValueChange={(v) => setLine(line.id, 'discount_type', v as DiscountType)}
                                                    >
                                                        <SelectTrigger className="w-full">
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
                                                        {translate('Discount Value')}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.discount_value}
                                                        onChange={(e) => setLine(line.id, 'discount_value', parseFloat(e.target.value) || 0)}
                                                        className="disabled:opacity-40"
                                                        placeholder="0"
                                                        disabled={!line.discount_type || line.discount_type === 'none'}
                                                    />
                                                </td>
                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left xl:table-cell xl:w-36 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">
                                                        {translate('Tax')}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm font-medium">
                                                        {prod?.tax
                                                            ? `${prod.tax.name} (${parseFloat(prod.tax.rate).toFixed(2)}%)`
                                                            : translate('No Tax')}
                                                    </span>
                                                </td>
                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left font-semibold xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">
                                                        {translate('Total')}
                                                    </span>
                                                    <span className="font-mono">{fmt(c.total)}</span>
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

                        {/* Invoice Summary */}
                        <div className="flex justify-end border-t p-4">
                            <div className="w-64 space-y-2">
                                <h4 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">{translate('Invoice Summary')}</h4>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>{translate('Subtotal')}</span>
                                    <span className="font-mono">{fmt(totals.subtotal + totals.discount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>{translate('Discount')}</span>
                                    <span className="font-mono">-{fmt(totals.discount)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>{translate('Tax')}</span>
                                    <span className="font-mono">{fmt(totals.tax)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-gray-100">
                                    <span>{translate('Total')}</span>
                                    <span className="font-mono">{fmt(totals.subtotal + totals.tax)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="flex items-center justify-between pb-6">
                    <span className="text-sm text-gray-500">
                        {form.products.filter((l) => l.product_id).length} {translate('Product added')}
                    </span>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" onClick={() => router.visit(route('invoices.index'))}>
                            {translate('Cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? translate('Creating...') : translate('Save')}
                        </Button>
                    </div>
                </div>
            </form>
        </PageTemplate>
    );
}
