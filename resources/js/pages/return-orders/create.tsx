import { toast } from '@components/CustomToast';
import { PageTemplate } from '@components/page-template';
import { Button } from '@components/UserInterface/button';
import { Card, CardContent } from '@components/UserInterface/card';
import { Input } from '@components/UserInterface/input';
import { Label } from '@components/UserInterface/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/select';
import { Textarea } from '@components/UserInterface/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/tooltip';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProductRow {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
}

interface SalesOrderItem {
    product_id: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_price: number;
    tax?: { name: string; rate: number } | null;
}

interface ReturnItem {
    product_id: string;
    product_name: string;
    product_sku?: string;
    return_quantity: number;
    maximum_quantity: number;
    unit_price: number;
    tax?: { name: string; rate: number } | null;
    reason: string;
}

interface Errors {
    [key: string]: string;
}

const fmt = (n: number) => window.appSettings?.formatCurrency(n) ?? `$${n.toFixed(2)}`;

export default function ReturnOrderCreate() {
    const { t: translate } = useTranslation();
    const { accounts = [], contacts = [], salesOrders = [], products = [], shippingProviderTypes = [], users = [] } = usePage().props;

    const [form, setFormData] = useState({
        name: '',
        description: '',
        sales_order_id: '',
        account_id: '',
        contact_id: '',
        shipping_provider_type_id: '',
        return_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        reason: 'other',
        reason_description: '',
        notes: '',
        assigned_to: '',
    });

    const [productRows, setProductRows] = useState<ProductRow[]>([]);
    const [salesOrderItems, setSalesOrderItems] = useState<SalesOrderItem[]>([]);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Return Orders'), href: route('return-orders.index') },
        { title: translate('Create') },
    ];

    const set = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => {
            const e = { ...prev };
            delete e[name];
            return e;
        });
    };

    const handleSalesOrderChange = async (id: string) => {
        setranslate('sales_order_id', id);
        setSalesOrderItems([]);
        setReturnItems([]);
        if (!id) return;
        try {
            const res = await fetch(route('api.return-orders.sales-orders.details', id));
            const data = await res.json();
            if (!data.error) {
                setFormData((prev) => ({
                    ...prev,
                    sales_order_id: id,
                    account_id: data.account_id ? String(data.account_id) : prev.account_id,
                    contact_id: data.contact_id ? String(data.contact_id) : prev.contact_id,
                    shipping_provider_type_id: data.shipping_provider_type_id
                        ? String(data.shipping_provider_type_id)
                        : prev.shipping_provider_type_id,
                }));
                if (data.products?.length) {
                    setSalesOrderItems(
                        data.products.map((p: any) => {
                            const prod = products.find((pr: any) => String(pr.id) === String(p.product_id));
                            return {
                                product_id: String(p.product_id),
                                product_name: prod?.name ?? p.product_name ?? `Product #${p.product_id}`,
                                product_sku: prod?.sku ?? p.sku ?? '',
                                quantity: p.quantity || 1,
                                unit_price: p.unit_price || 0,
                                tax: prod?.tax ?? null,
                            };
                        }),
                    );
                    setProductRows(
                        data.products.map((p: any) => ({
                            id: crypto.randomUUID(),
                            product_id: String(p.product_id),
                            quantity: p.quantity || 1,
                            unit_price: p.unit_price || 0,
                        })),
                    );
                }
                setErrors((prev) => {
                    const e = { ...prev };
                    delete e.sales_order_id;
                    if (data.account_id) delete e.account_id;
                    if (data.contact_id) delete e.contact_id;
                    if (data.shipping_provider_type_id) delete e.shipping_provider_type_id;
                    if (data.products?.length) delete e.products;
                    return e;
                });
            }
        } catch {}
    };

    const addToReturn = (item: SalesOrderItem) => {
        if (returnItems.find((r) => r.product_id === item.product_id)) return;
        setReturnItems((prev) => [
            ...prev,
            {
                product_id: item.product_id,
                product_name: item.product_name,
                product_sku: item.product_sku,
                return_quantity: 1,
                maximum_quantity: item.quantity,
                unit_price: item.unit_price,
                tax: item.tax,
                reason: '',
            },
        ]);
    };

    const removeReturnItem = (product_id: string) => {
        setReturnItems((prev) => prev.filter((r) => r.product_id !== product_id));
    };

    const setReturnQuantity = (product_id: string, quantity: number) => {
        setReturnItems((prev) =>
            prev.map((r) => {
                if (r.product_id !== product_id) return r;
                return { ...r, return_quantity: Math.max(1, Math.min(quantity, r.maximum_quantity)) };
            }),
        );
    };

    const setReturnReason = (product_id: string, reason: string) => {
        setReturnItems((prev) => prev.map((r) => (r.product_id === product_id ? { ...r, reason } : r)));
    };

    const calcReturnLine = (item: ReturnItem) => {
        const net = item.return_quantity * item.unit_price;
        const tax = item.tax ? (net * item.tax.rate) / 100 : 0;
        return { net, tax };
    };

    const calcAvailLine = (item: SalesOrderItem) => {
        const net = item.quantity * item.unit_price;
        const tax = item.tax ? (net * item.tax.rate) / 100 : 0;
        return { net, tax };
    };

    const totals = returnItems.reduce(
        (acc, r) => {
            const c = calcReturnLine(r);
            return { subtotal: acc.subtotal + c.net, tax: acc.tax + c.tax };
        },
        { subtotal: 0, tax: 0 },
    );

    const handleSubmit = () => {
        const errs: Errors = {};
        if (!form.name.trim()) errs.name = translate('Name is required');
        if (!form.sales_order_id) errs.sales_order_id = translate('Sales Order is required');
        if (!form.account_id) errs.account_id = translate('Account is required');
        if (!form.contact_id) errs.contact_id = translate('Contact is required');
        if (!form.shipping_provider_type_id) errs.shipping_provider_type_id = translate('Shipping Provider is required');
        if (!form.return_date) errs.return_date = translate('Return Date is required');
        if (!form.assigned_to) errs.assigned_to = translate('Assigned To is required');
        if (!returnItems.length) errs.products = translate('At least one product is required');

        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setProcessing(true);
        toast.loading(translate('Saving...'));

        router.post(
            route('return-orders.store'),
            {
                ...form,
                products: returnItems.map((r) => ({
                    product_id: r.product_id,
                    quantity: r.return_quantity,
                    unit_price: r.unit_price,
                    reason: r.reason,
                })),
            },
            {
                onSuccess: () => {
                    toast.dismiss();
                },
                onError: (errs: any) => {
                    toast.dismiss();
                    setErrors(errs);
                    setProcessing(false);
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <PageTemplate
            title={translate('Create Return Order')}
            description={translate('Fill in the details to create a new return order')}
            breadcrumbs={breadcrumbs}
            url="/return-orders"
            fullWidth
            noPadding
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('return-orders.index')),
                },
            ]}
        >
            <div className="space-y-6">
                {/* Basic Information */}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardContent className="p-6">
                        <div className="mb-5 flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-700 dark:text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span className="text-base font-bold text-gray-900 dark:text-white">{translate('Basic Information')}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                <Label className="text-sm font-medium" required>
                                    {translate('Return Order Name')}
                                </Label>
                                <Input
                                    value={form.name}
                                    onChange={(e) => setranslate('name', e.target.value)}
                                    placeholder={translate('e.g. Defective Items Return')}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm font-medium" required>
                                    {translate('Sales Order')}
                                </Label>
                                <Select value={form.sales_order_id} onValueChange={handleSalesOrderChange}>
                                    <SelectTrigger className={errors.sales_order_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select sales order')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {salesOrders.map((so: any) => (
                                            <SelectItem key={so.id} value={String(so.id)}>
                                                {so.order_number} – {so.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.sales_order_id && <p className="text-xs text-red-500">{errors.sales_order_id}</p>}
                                {salesOrders.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('sales-orders.index')} className="font-medium underline">
                                            {translate('Sales Orders')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm font-medium" required>
                                    {translate('Account')}
                                </Label>
                                <Select value={form.account_id} onValueChange={(v) => setranslate('account_id', v)}>
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
                                    {translate('Contact')}
                                </Label>
                                <Select value={form.contact_id} onValueChange={(v) => setranslate('contact_id', v)}>
                                    <SelectTrigger className={errors.contact_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select contact')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {contacts.map((c: any) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.contact_id && <p className="text-xs text-red-500">{errors.contact_id}</p>}
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
                                    {translate('Shipping Provider')}
                                </Label>
                                <Select value={form.shipping_provider_type_id} onValueChange={(v) => setranslate('shipping_provider_type_id', v)}>
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
                                <Label className="text-sm font-medium" required>
                                    {translate('Return Date')}
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
                                        value={form.return_date}
                                        onChange={(e) => setranslate('return_date', e.target.value)}
                                        className={`cursor-pointer ${errors.return_date ? 'border-red-500' : ''}`}
                                    />
                                </div>
                                {errors.return_date && <p className="text-xs text-red-500">{errors.return_date}</p>}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm font-medium">{translate('Status')}</Label>
                                <Select value={form.status} onValueChange={(v) => setranslate('status', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">{translate('Pending')}</SelectItem>
                                        <SelectItem value="approved">{translate('Approved')}</SelectItem>
                                        <SelectItem value="shipped">{translate('Shipped')}</SelectItem>
                                        <SelectItem value="received">{translate('Received')}</SelectItem>
                                        <SelectItem value="processed">{translate('Processed')}</SelectItem>
                                        <SelectItem value="cancelled">{translate('Cancelled')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm font-medium">{translate('Return Reason')}</Label>
                                <Select value={form.reason} onValueChange={(v) => setranslate('reason', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="defective">{translate('Defective')}</SelectItem>
                                        <SelectItem value="wrong_item">{translate('Wrong Item')}</SelectItem>
                                        <SelectItem value="damaged">{translate('Damaged')}</SelectItem>
                                        <SelectItem value="not_needed">{translate('Not Needed')}</SelectItem>
                                        <SelectItem value="other">{translate('Other')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-sm font-medium" required>
                                    {translate('Assigned To')}
                                </Label>
                                <Select value={form.assigned_to} onValueChange={(v) => setranslate('assigned_to', v)}>
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
                                    value={form.description}
                                    onChange={(e) => setranslate('description', e.target.value)}
                                    rows={2}
                                    placeholder={translate('Optional description about this return order...')}
                                />
                            </div>

                            <div className="space-y-1 md:col-span-2 lg:col-span-3">
                                <Label className="text-sm font-medium">{translate('Reason Description')}</Label>
                                <Textarea
                                    value={form.reason_description}
                                    onChange={(e) => setranslate('reason_description', e.target.value)}
                                    rows={2}
                                    placeholder={translate('Describe the reason for return in detail...')}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Available Items from Invoice */}
                {salesOrderItems.length > 0 && (
                    <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <CardContent className="p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-700 dark:text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"
                                    />
                                </svg>
                                <span className="text-base font-bold text-gray-900 dark:text-white">
                                    {translate('Available Product from Sales Order')}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            {['Product', 'Available Quantity', 'Unit Price', 'Tax', 'Total', 'Action'].map((h) => (
                                                <th
                                                    key={h}
                                                    className="pe-6 pb-3 text-start text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
                                                >
                                                    {translate(h)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {salesOrderItems.map((item) => {
                                            const returnItem = returnItems.find((r) => r.product_id === item.product_id);
                                            const usedQuantity = returnItem ? returnItem.return_quantity : 0;
                                            const availableQuantity = item.quantity - usedQuantity;
                                            const displayItem = { ...item, quantity: availableQuantity };
                                            const c = calcAvailLine(displayItem);
                                            const isAdded = !!returnItem;
                                            return (
                                                <tr key={item.product_id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="py-4 pe-6">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.product_name}</div>
                                                        {item.product_sku && <div className="mt-0.5 text-xs text-gray-400">{item.product_sku}</div>}
                                                    </td>
                                                    <td className="py-4 pe-6 text-gray-700 dark:text-gray-300">
                                                        <span className={availableQuantity === 0 ? 'font-medium text-red-500' : ''}>
                                                            {availableQuantity}
                                                        </span>
                                                        <span className="ml-1 text-xs text-gray-400">/ {item.quantity}</span>
                                                    </td>
                                                    <td className="py-4 pe-6 font-mono text-gray-700 dark:text-gray-300">{fmt(item.unit_price)}</td>
                                                    <td className="py-4 pe-6">
                                                        {item.tax ? (
                                                            <span className="text-xs text-gray-900 dark:text-gray-100">
                                                                {item.tax.name} ({parseFloat(String(item.tax.rate)).toFixed(2)}%)
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">{translate('No Tax')}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 pe-6 font-mono font-medium text-gray-900 dark:text-gray-100">
                                                        {fmt(c.net + c.tax)}
                                                    </td>
                                                    <td className="py-4">
                                                        {isAdded ? (
                                                            <Button type="button" disabled size="sm">
                                                                {translate('Added')}
                                                            </Button>
                                                        ) : availableQuantity === 0 ? (
                                                            <Button type="button" disabled size="sm" variant="outline">
                                                                {translate('Fully Returned')}
                                                            </Button>
                                                        ) : (
                                                            <TooltipProvider delayDuration={200}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            onClick={() => addToReturn(item)}
                                                                            className="flex h-8 w-8 items-center justify-center bg-emerald-500 p-2 text-white hover:bg-emerald-600 min-[1200px]:h-auto min-[1200px]:w-auto min-[1200px]:px-3 min-[1200px]:py-1.5"
                                                                        >
                                                                            <Plus className="h-4 w-4 min-[1200px]:mr-1" />
                                                                            <span className="hidden min-[1200px]:inline">
                                                                                {translate('Add to Return')}
                                                                            </span>
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="min-[1200px]:hidden">
                                                                        <p>{translate('Add to Return')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Return Items */}
                {returnItems.length > 0 && (
                    <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <CardContent className="p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5 text-gray-700 dark:text-gray-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                <span className="text-base font-bold text-gray-900 dark:text-white">{translate('Return Product')}</span>
                                {errors.products && <span className="ml-1 text-xs font-normal text-red-500">{errors.products}</span>}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            {['Product', 'Return Quantity', 'Unit Price', 'Tax', 'Total', 'Action'].map((h) => (
                                                <th
                                                    key={h}
                                                    className="pe-6 pb-3 text-start text-sm font-medium whitespace-nowrap text-gray-500 dark:text-gray-400"
                                                >
                                                    {translate(h)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {returnItems.map((item) => {
                                            const c = calcReturnLine(item);
                                            const quantityError = item.return_quantity > item.maximum_quantity;
                                            return (
                                                <tr key={item.product_id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="py-4 pe-6">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">{item.product_name}</div>
                                                        {item.product_sku && <div className="mt-0.5 text-xs text-gray-400">{item.product_sku}</div>}
                                                    </td>
                                                    <td className="w-24 py-4 pe-6">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max={item.maximum_quantity}
                                                            value={item.return_quantity}
                                                            onChange={(e) => setReturnQuantity(item.product_id, parseInt(e.target.value) || 1)}
                                                            className={`w-20 ${quantityError ? 'border-red-500' : ''}`}
                                                        />
                                                        {quantityError && (
                                                            <p className="mt-1 text-xs text-red-500">
                                                                {translate('Max')} {item.maximum_quantity}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-4 pe-6 font-mono text-gray-700 dark:text-gray-300">{fmt(item.unit_price)}</td>
                                                    <td className="py-4 pe-6">
                                                        {item.tax ? (
                                                            <span className="text-xs text-gray-900 dark:text-gray-100">
                                                                {item.tax.name} ({parseFloat(String(item.tax.rate)).toFixed(2)}%)
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">{translate('No Tax')}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 pe-6 font-mono font-medium text-gray-900 dark:text-gray-100">
                                                        {fmt(c.net + c.tax)}
                                                    </td>
                                                    <td className="py-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeReturnItem(item.product_id)}
                                                            className="cursor-pointer text-red-500 transition-colors hover:text-red-700"
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

                            <div className="mt-8 flex justify-end">
                                <div className="w-80">
                                    <p className="mb-3 text-base font-bold text-gray-900 dark:text-white">{translate('Return Summary')}</p>
                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">{translate('Subtotal')}</span>
                                            <span className="font-mono text-gray-900 dark:text-gray-100">{fmt(totals.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">{translate('Tax')}</span>
                                            <span className="font-mono text-gray-900 dark:text-gray-100">{fmt(totals.tax)}</span>
                                        </div>
                                        <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 text-base font-bold dark:border-gray-700">
                                            <span className="text-gray-900 dark:text-white">{translate('Total Return Amount')}</span>
                                            <span className="font-mono text-green-600 dark:text-green-400">{fmt(totals.subtotal + totals.tax)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                <Card className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <CardContent className="p-6">
                        <div className="mb-4 flex items-center gap-2">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-gray-700 dark:text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                            </svg>
                            <span className="text-base font-bold text-gray-900 dark:text-white">{translate('Additional Notes')}</span>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-sm font-medium">{translate('Notes')}</Label>
                            <Textarea
                                value={form.notes}
                                onChange={(e) => setranslate('notes', e.target.value)}
                                rows={3}
                                placeholder={translate('Enter any additional notes...')}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-6">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                        {translate('Cancel')}
                    </Button>
                    <Button type="button" disabled={processing || returnItems.length === 0} onClick={handleSubmit}>
                        {processing ? translate('Saving...') : translate('Save')}
                    </Button>
                </div>
            </div>
        </PageTemplate>
    );
}
