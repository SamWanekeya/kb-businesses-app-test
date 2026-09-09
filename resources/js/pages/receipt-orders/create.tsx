import { toast } from '@components/CustomToast';
import { PageTemplate } from '@components/page-template';
import { Button } from '@components/UserInterface/button';
import { Input } from '@components/UserInterface/input';
import { Label } from '@components/UserInterface/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/select';
import { Textarea } from '@components/UserInterface/textarea';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ProductRow {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_type: string;
    discount_value: number;
}

interface Errors {
    [key: string]: string;
}

const fmt = (n: number) => window.appSettings?.formatCurrency(n) ?? `$${n.toFixed(2)}`;

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

export default function ReceiptOrderCreate() {
    const { t: translate } = useTranslation();
    const { accounts = [], contacts = [], purchaseOrders = [], returnOrders = [], products = [], users = [] } = usePage().props;

    const [form, setFormData] = useState({
        name: '',
        description: '',
        purchase_order_id: '',
        return_order_id: '',
        account_id: '',
        contact_id: '',
        receipt_date: new Date().toISOString().split('T')[0],
        expected_date: '',
        status: 'pending',
        notes: '',
        assigned_to: '',
    });

    const [productRows, setProductRows] = useState<ProductRow[]>([
        { id: crypto.randomUUID(), product_id: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 },
    ]);
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Receipt Orders'), href: route('receipt-orders.index') },
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

    const handlePurchaseOrderChange = async (id: string) => {
        setranslate('purchase_order_id', id);
        setFormData((prev) => ({ ...prev, return_order_id: '' }));
        if (!id) return;
        try {
            const res = await fetch(route('api.receipt-orders.purchase-orders.details', id));
            const data = await res.json();
            if (!data.error) {
                setFormData((prev) => ({
                    ...prev,
                    purchase_order_id: id,
                    account_id: data.account_id ? String(data.account_id) : prev.account_id,
                    contact_id: data.contact_id ? String(data.contact_id) : prev.contact_id,
                }));
                if (data.products?.length) {
                    setProductRows(
                        data.products.map((p: any) => ({
                            id: crypto.randomUUID(),
                            product_id: String(p.product_id),
                            quantity: p.quantity || 1,
                            unit_price: p.unit_price || 0,
                            discount_type: p.discount_type || 'none',
                            discount_value: p.discount_value || 0,
                        })),
                    );
                }
                setErrors((prev) => {
                    const e = { ...prev };
                    delete e.purchase_order_id;
                    delete e.return_order_id;
                    if (data.account_id) delete e.account_id;
                    if (data.contact_id) delete e.contact_id;
                    if (data.products?.length) delete e.products;
                    return e;
                });
            }
        } catch {}
    };

    const handleReturnOrderChange = async (id: string) => {
        setranslate('return_order_id', id);
        setFormData((prev) => ({ ...prev, purchase_order_id: '' }));
        if (!id) return;
        try {
            const res = await fetch(route('api.receipt-orders.return-orders.details', id));
            const data = await res.json();
            if (!data.error) {
                setFormData((prev) => ({
                    ...prev,
                    return_order_id: id,
                    account_id: data.account_id ? String(data.account_id) : prev.account_id,
                    contact_id: data.contact_id ? String(data.contact_id) : prev.contact_id,
                }));
                if (data.products?.length) {
                    setProductRows(
                        data.products.map((p: any) => ({
                            id: crypto.randomUUID(),
                            product_id: String(p.product_id),
                            quantity: p.quantity || 1,
                            unit_price: p.unit_price || 0,
                            discount_type: 'none',
                            discount_value: 0,
                        })),
                    );
                }
                setErrors((prev) => {
                    const e = { ...prev };
                    delete e.purchase_order_id;
                    delete e.return_order_id;
                    if (data.account_id) delete e.account_id;
                    if (data.contact_id) delete e.contact_id;
                    if (data.products?.length) delete e.products;
                    return e;
                });
            }
        } catch {}
    };

    const addProductRow = useCallback(() => {
        setProductRows((p) => [
            ...p,
            { id: crypto.randomUUID(), product_id: '', quantity: 1, unit_price: 0, discount_type: 'none', discount_value: 0 },
        ]);
    }, []);

    const setRow = (id: string, field: keyof ProductRow, value: string | number) => {
        setProductRows((prev) =>
            prev.map((r) => {
                if (r.id !== id) return r;
                const updated = { ...r, [field]: value };
                if (field === 'product_id') {
                    const prod = products.find((p: any) => String(p.id) === String(value));
                    if (prod) updated.unit_price = parseFloat(prod.price || 0);
                }
                return updated;
            }),
        );
    };

    const calcLine = (row: ProductRow) => {
        const gross = (Number(row.quantity) || 0) * (Number(row.unit_price) || 0);
        const discVal = Number(row.discount_value) || 0;
        const discount = row.discount_type === 'percentage' ? (gross * discVal) / 100 : row.discount_type === 'fixed' ? Math.min(discVal, gross) : 0;
        const net = gross - discount;
        const prod = products.find((p: any) => String(p.id) === String(row.product_id));
        const tax = prod?.tax ? (net * prod.tax.rate) / 100 : 0;
        return { gross, discount, net, tax };
    };

    const totals = productRows.reduce(
        (acc, r) => {
            const c = calcLine(r);
            return { discount: acc.discount + c.discount, subtotal: acc.subtotal + c.net, tax: acc.tax + c.tax };
        },
        { discount: 0, subtotal: 0, tax: 0 },
    );

    const handleSubmit = () => {
        const errs: Errors = {};
        if (!form.name.trim()) errs.name = translate('Name is required');
        if (!form.purchase_order_id && !form.return_order_id) errs.purchase_order_id = translate('Either Purchase Order or Return Order is required');
        if (!form.account_id) errs.account_id = translate('Account is required');
        if (!form.contact_id) errs.contact_id = translate('Contact is required');
        if (!form.receipt_date) errs.receipt_date = translate('Receipt Date is required');
        if (!form.assigned_to) errs.assigned_to = translate('Assigned To is required');
        if (!productRows.length || productRows.every((r) => !r.product_id)) errs.products = translate('At least one product is required');

        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setProcessing(true);
        toast.loading(translate('Saving...'));

        router.post(
            route('receipt-orders.store'),
            {
                ...form,
                products: productRows
                    .filter((r) => r.product_id)
                    .map(({ id, discount_type, ...rest }) => ({
                        ...rest,
                        discount_type: discount_type !== 'none' ? discount_type : null,
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
            title={translate('Create Receipt Order')}
            description={translate('Fill in the details to create a new receipt order')}
            breadcrumbs={breadcrumbs}
            url="/receipt-orders"
            noPadding
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('receipt-orders.index')),
                },
            ]}
        >
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                {/* Basic Information */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="px-6 pt-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Basic Information')}</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 p-6 md:grid-cols-2">
                        {/* Name + Description */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Receipt Order Name')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setranslate('name', e.target.value)}
                                placeholder={translate('e.g. Q1 Supplier Receipt')}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.name} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Description')}</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setranslate('description', e.target.value)}
                                rows={2}
                                placeholder={translate('Optional description about this receipt order...')}
                            />
                        </div>

                        {/* Purchase Order + Return Order */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Purchase Order')}</Label>
                            <Select value={form.purchase_order_id} onValueChange={handlePurchaseOrderChange}>
                                <SelectTrigger className={errors.purchase_order_id ? 'border-red-500' : ''}>
                                    <SelectValue placeholder={translate('Select purchase order')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {purchaseOrders.map((po: any) => (
                                        <SelectItem key={po.id} value={String(po.id)}>
                                            {po.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.purchase_order_id} />
                            {purchaseOrders.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('purchase-orders.index')} className="font-medium underline">
                                        {translate('Purchase Orders')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Return Order')}</Label>
                            <Select value={form.return_order_id} onValueChange={handleReturnOrderChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={translate('Select return order')} />
                                </SelectTrigger>
                                <SelectContent searchable>
                                    {returnOrders.map((ro: any) => (
                                        <SelectItem key={ro.id} value={String(ro.id)}>
                                            {ro.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {returnOrders.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('return-orders.index')} className="font-medium underline">
                                        {translate('Return Orders')}
                                    </a>
                                </p>
                            )}
                        </div>

                        {/* Account + Contact */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Account')} <span className="text-red-500">*</span>
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
                            <FieldError message={errors.account_id} />
                            {accounts.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('accounts.index')} className="font-medium underline">
                                        {translate('Accounts')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Contact')} <span className="text-red-500">*</span>
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
                            <FieldError message={errors.contact_id} />
                            {contacts.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('contacts.index')} className="font-medium underline">
                                        {translate('Contacts')}
                                    </a>
                                </p>
                            )}
                        </div>

                        {/* Receipt Date + Expected Date */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Receipt Date')} <span className="text-red-500">*</span>
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
                                    value={form.receipt_date}
                                    onChange={(e) => setranslate('receipt_date', e.target.value)}
                                    className={`cursor-pointer ${errors.receipt_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                            <FieldError message={errors.receipt_date} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Expected Date')}</Label>
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
                                    value={form.expected_date}
                                    onChange={(e) => setranslate('expected_date', e.target.value)}
                                    className={`cursor-pointer ${errors.expected_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                            <FieldError message={errors.expected_date} />
                        </div>

                        {/* Status + Assigned To */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Status')}</Label>
                            <Select value={form.status} onValueChange={(v) => setranslate('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">{translate('Pending')}</SelectItem>
                                    <SelectItem value="received">{translate('Received')}</SelectItem>
                                    <SelectItem value="partial">{translate('Partial')}</SelectItem>
                                    <SelectItem value="completed">{translate('Completed')}</SelectItem>
                                    <SelectItem value="cancelled">{translate('Cancelled')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Assigned To')} <span className="text-red-500">*</span>
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
                    </div>
                </div>

                {/* Products */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-3 dark:bg-gray-800">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            {translate('Products')}
                            {errors.products && <span className="ml-2 text-xs font-normal text-red-500">{errors.products}</span>}
                        </h2>
                        <Button type="button" size="sm" onClick={addProductRow}>
                            <Plus className="mr-1 h-4 w-4" /> {translate('Add Product')}
                        </Button>
                    </div>

                    {productRows.length > 0 && (
                        <div className="max-h-72 overflow-x-auto overflow-y-auto p-4 md:p-0">
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
                                        <th className="w-28 px-4 py-3 text-left">{translate('Discount Value')}</th>
                                        <th className="w-28 px-4 py-3 text-left">{translate('Tax')}</th>
                                        <th className="w-28 px-4 py-3 text-left">{translate('Line Total')}</th>
                                        <th className="w-12 px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="block space-y-4 divide-y divide-gray-200 xl:table-row-group xl:space-y-0 xl:divide-y-0">
                                    {productRows.map((row, i) => {
                                        const c = calcLine(row);
                                        return (
                                            <tr
                                                key={row.id}
                                                className="border-border relative grid grid-cols-1 gap-3 rounded-lg border border-b bg-gray-50/50 p-4 hover:bg-gray-50 sm:grid-cols-2 xl:table-row xl:gap-0 xl:space-y-0 xl:border-b xl:bg-transparent dark:bg-gray-800/30 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="col-span-1 block w-full px-0 py-0 sm:col-span-2 xl:table-cell xl:w-[200px] xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Product')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Select value={row.product_id} onValueChange={(v) => setRow(row.id, 'product_id', v)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={translate('Select product')} />
                                                        </SelectTrigger>
                                                        <SelectContent searchable>
                                                            {products
                                                                .filter((p: any) => {
                                                                    const selectedIds = productRows
                                                                        .filter((r) => r.id !== row.id)
                                                                        .map((r) => r.product_id);
                                                                    return !selectedIds.includes(String(p.id));
                                                                })
                                                                .map((p: any) => (
                                                                    <SelectItem key={p.id} value={String(p.id)}>
                                                                        {p.name}
                                                                    </SelectItem>
                                                                ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {i === 0 && products.length === 0 && (
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
                                                        onChange={(e) => setRow(row.id, 'quantity', parseInt(e.target.value) || 1)}
                                                    />
                                                </td>

                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Unit Price')} <span className="text-red-500">*</span>
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={row.unit_price}
                                                        onChange={(e) => setRow(row.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>

                                                <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-36 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                        {translate('Discount Type')}
                                                    </span>
                                                    <Select value={row.discount_type} onValueChange={(v) => setRow(row.id, 'discount_type', v)}>
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
                                                        {translate('Discount Value')}
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={row.discount_value}
                                                        disabled={row.discount_type === 'none'}
                                                        onChange={(e) => setRow(row.id, 'discount_value', parseFloat(e.target.value) || 0)}
                                                        className="disabled:opacity-40"
                                                        placeholder="0"
                                                    />
                                                </td>

                                                <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left xl:table-cell xl:w-36 xl:px-4 xl:py-3">
                                                    <span className="text-muted-foreground block text-xs font-semibold xl:hidden">
                                                        {translate('Tax')}
                                                    </span>
                                                    {(() => {
                                                        const prod = products.find((p: any) => String(p.id) === String(row.product_id));
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

                                                <td className="col-span-1 block w-full border-t px-0 py-0 pt-2 text-right sm:col-span-2 xl:table-cell xl:w-10 xl:border-t-0 xl:px-4 xl:py-3 xl:pt-0 xl:text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProductRows((p) => (p.length <= 1 ? p : p.filter((r) => r.id !== row.id)))}
                                                        disabled={productRows.length <= 1}
                                                        className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
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
                    )}

                    {productRows.length > 0 && (
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
                    )}
                </div>

                {/* Additional Notes */}
                <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">{translate('Additional Notes')}</h2>
                    <Textarea
                        value={form.notes}
                        onChange={(e) => setranslate('notes', e.target.value)}
                        rows={3}
                        placeholder={translate('Enter any additional notes...')}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 px-6 py-4">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                        {translate('Cancel')}
                    </Button>
                    <Button type="button" disabled={processing} onClick={handleSubmit}>
                        {processing ? translate('Saving...') : translate('Save')}
                    </Button>
                </div>
            </div>
        </PageTemplate>
    );
}
