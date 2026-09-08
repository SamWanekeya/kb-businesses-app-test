import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface ProductRow {
    id: string;
    product_id: string;
    quantity: string;
    unit_weight: string;
}

interface Errors {
    [key: string]: string;
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="mt-1 text-xs text-red-500">{message}</p>;
}

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="mb-5 flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
    );
}

export default function DeliveryOrderCreate() {
    const { t: translate } = useTranslation();
    const { accounts = [], contacts = [], salesOrders = [], products = [], shippingProviderTypes = [], users = [] } = usePage().props;

    const [form, setFormData] = useState({
        name: '',
        description: '',
        sales_order_id: '',
        account_id: '',
        contact_id: '',
        shipping_provider_type_id: '',
        delivery_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        status: 'pending',
        shipping_cost: '',
        delivery_address: '',
        delivery_city: '',
        delivery_state: '',
        delivery_postal_code: '',
        delivery_country: '',
        delivery_notes: '',
        assigned_to: '',
    });

    const [productRows, setProductRows] = useState<ProductRow[]>([{ id: crypto.randomUUID(), product_id: '', quantity: '1', unit_weight: '0' }]);
    const [errors, setErrors] = useState<Errors>({});
    const [processing, setProcessing] = useState(false);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Delivery Orders'), href: route('delivery-orders.index') },
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
        if (!id) return;
        try {
            const res = await fetch(route('api.delivery-orders.sales-orders.details', id));
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
                    setProductRows(
                        data.products.map((p: any) => ({
                            id: crypto.randomUUID(),
                            product_id: String(p.product_id),
                            quantity: String(p.quantity || 1),
                            unit_weight: String(p.unit_weight || 0),
                        })),
                    );
                }
                setErrors((prev) => {
                    const e = { ...prev };
                    delete e.sales_order_id;
                    delete e.account_id;
                    delete e.contact_id;
                    delete e.products;
                    delete e.shipping_provider_type_id;
                    return e;
                });
            }
        } catch {}
    };

    const setRow = (id: string, field: keyof ProductRow, value: string) => {
        setProductRows((prev) => prev.map((r) => (r.id !== id ? r : { ...r, [field]: value })));
        if (field === 'product_id' && value)
            setErrors((prev) => {
                const e = { ...prev };
                delete e.products;
                return e;
            });
    };

    const totalWeight = productRows.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0) * (parseFloat(r.unit_weight) || 0), 0);

    const handleSubmit = () => {
        const errs: Errors = {};
        if (!form.name.trim()) errs.name = translate('Name is required');
        if (!form.sales_order_id) errs.sales_order_id = translate('Sales Order is required');
        if (!form.account_id) errs.account_id = translate('Account is required');
        if (!form.contact_id) errs.contact_id = translate('Contact is required');
        if (!form.shipping_provider_type_id) errs.shipping_provider_type_id = translate('Shipping Provider is required');
        if (!form.delivery_date) errs.delivery_date = translate('Delivery Date is required');
        if (!form.delivery_address.trim()) errs.delivery_address = translate('Delivery Address is required');
        if (!form.delivery_city.trim()) errs.delivery_city = translate('City is required');
        if (!form.delivery_state.trim()) errs.delivery_state = translate('State is required');
        if (!form.delivery_postal_code.trim()) errs.delivery_postal_code = translate('Postal Code is required');
        if (!form.delivery_country.trim()) errs.delivery_country = translate('Country is required');
        if (!form.assigned_to) errs.assigned_to = translate('Assigned To is required');
        if (!productRows.length || productRows.every((r) => !r.product_id)) errs.products = translate('At least one product is required');
        productRows.forEach((r, i) => {
            if (!r.product_id) errs[`products.${i}.product_id`] = translate('Product is required');
            if (r.product_id && (!r.quantity || parseFloat(r.quantity) < 1)) errs[`products.${i}.quantity`] = translate('Min 1');
            if (r.product_id && (!r.unit_weight || parseFloat(r.unit_weight) < 0)) errs[`products.${i}.unit_weight`] = translate('Required');
        });

        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setProcessing(true);
        toast.loading(translate('Saving...'));

        router.post(
            route('delivery-orders.store'),
            {
                ...form,
                shipping_cost: form.shipping_cost ? parseFloat(form.shipping_cost) : 0,
                products: productRows.filter((r) => r.product_id).map(({ id, ...rest }) => rest),
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
            title={translate('Create Delivery Order')}
            description={translate('Fill in the details to create a new delivery order')}
            breadcrumbs={breadcrumbs}
            url="/delivery-orders"
            noPadding
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('delivery-orders.index')),
                },
            ]}
        >
            <div className="space-y-8 rounded-lg border border-gray-200 bg-white p-6 text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                {/* ── Order Details ── */}
                <div>
                    <SectionHeader title={translate('Order Details')} />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Delivery Order Name')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setranslate('name', e.target.value)}
                                placeholder={translate('e.g. Q1 Hardware Delivery')}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.name} />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Description')}</Label>
                            <Textarea
                                value={form.description}
                                onChange={(e) => setranslate('description', e.target.value)}
                                rows={2}
                                placeholder={translate('Optional notes about this delivery...')}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Sales Order')} <span className="text-red-500">*</span>
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
                            <FieldError message={errors.sales_order_id} />
                            {salesOrders.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('sales-orders.index')} className="font-medium underline">
                                        {translate('Sales Orders')}
                                    </a>
                                </p>
                            )}
                        </div>

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

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Shipping Provider')} <span className="text-red-500">*</span>
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
                            <FieldError message={errors.shipping_provider_type_id} />
                            {shippingProviderTypes.length === 0 && (
                                <p className="mt-1 text-xs">
                                    {translate('Click here to add')}{' '}
                                    <a href={route('shipping-provider-types.index')} className="font-medium underline">
                                        {translate('Shipping Providers')}
                                    </a>
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Delivery Date')} <span className="text-red-500">*</span>
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
                                    value={form.delivery_date}
                                    onChange={(e) => setranslate('delivery_date', e.target.value)}
                                    className={`cursor-pointer ${errors.delivery_date ? 'border-red-500' : ''}`}
                                />
                            </div>
                            <FieldError message={errors.delivery_date} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Expected Delivery Date')}</Label>
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
                                    value={form.expected_delivery_date}
                                    onChange={(e) => setranslate('expected_delivery_date', e.target.value)}
                                    className="cursor-pointer"
                                />
                            </div>
                            <FieldError message={errors.expected_delivery_date} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Status')}</Label>
                            <Select value={form.status} onValueChange={(v) => setranslate('status', v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">{translate('Pending')}</SelectItem>
                                    <SelectItem value="in_transit">{translate('In Transit')}</SelectItem>
                                    <SelectItem value="delivered">{translate('Delivered')}</SelectItem>
                                    <SelectItem value="cancelled">{translate('Cancelled')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Shipping Cost')}</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.shipping_cost}
                                    onChange={(e) => setranslate('shipping_cost', e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
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

                {/* ── Products ── */}
                <div className="-mx-6">
                    <div className="flex items-center justify-between border-t border-b bg-gray-50 px-6 py-3 dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{translate('Products')}</h2>
                            {errors.products && <span className="text-xs font-normal text-red-500">{errors.products}</span>}
                        </div>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() =>
                                setProductRows((p) => [...p, { id: crypto.randomUUID(), product_id: '', quantity: '1', unit_weight: '0' }])
                            }
                        >
                            <Plus className="mr-1 h-4 w-4" /> {translate('Add Product')}
                        </Button>
                    </div>

                    {productRows.length === 0 ? (
                        <div className="mx-6 my-4 rounded-lg border-2 border-dashed border-gray-200 py-10 text-center dark:border-gray-700">
                            <p className="text-sm text-gray-400">{translate('No products added yet. Click "Add Product" to begin.')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="max-h-72 overflow-x-auto overflow-y-auto p-4 md:p-0">
                                <table className="block w-full text-sm xl:table">
                                    <thead className="hidden xl:table-header-group">
                                        <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                            <th className="min-w-[220px] px-4 py-3 text-left">
                                                {translate('Product')} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="w-28 px-4 py-3 text-left">
                                                {translate('Quantity')} <span className="text-red-500">*</span>
                                            </th>
                                            <th className="w-36 px-4 py-3 text-left">{translate('Unit Weight (kg)')}</th>
                                            <th className="w-36 px-4 py-3 text-left">{translate('Total Weight (kg)')}</th>
                                            <th className="w-12 px-4 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="block space-y-4 divide-y divide-gray-200 xl:table-row-group xl:space-y-0 xl:divide-y-0">
                                        {productRows.map((row, i) => {
                                            const lineWeight = (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_weight) || 0);
                                            return (
                                                <tr
                                                    key={row.id}
                                                    className="border-border relative grid grid-cols-1 gap-3 rounded-lg border border-b bg-gray-50/50 p-4 hover:bg-gray-50 sm:grid-cols-2 xl:table-row xl:gap-0 xl:space-y-0 xl:border-b xl:bg-transparent dark:bg-gray-800/30 dark:text-gray-100 dark:hover:bg-gray-800/50"
                                                >
                                                    <td className="col-span-1 block w-full px-0 py-0 sm:col-span-2 xl:table-cell xl:w-[220px] xl:px-4 xl:py-3">
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
                                                                        const taken = productRows
                                                                            .filter((r) => r.id !== row.id)
                                                                            .map((r) => r.product_id);
                                                                        return !taken.includes(String(p.id));
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
                                                    <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-28 xl:px-4 xl:py-3">
                                                        <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                            {translate('Quantity')} <span className="text-red-500">*</span>
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={row.quantity}
                                                            onChange={(e) => setRow(row.id, 'quantity', e.target.value)}
                                                            className={errors[`products.${i}.quantity`] ? 'border-red-500 text-left' : 'text-left'}
                                                        />
                                                        {errors[`products.${i}.quantity`] && (
                                                            <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.quantity`]}</p>
                                                        )}
                                                    </td>
                                                    <td className="col-span-1 block w-full px-0 py-0 xl:table-cell xl:w-36 xl:px-4 xl:py-3">
                                                        <span className="text-muted-foreground mb-1 block text-xs font-semibold xl:hidden">
                                                            {translate('Unit Weight (kg)')}
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={row.unit_weight}
                                                            onChange={(e) => setRow(row.id, 'unit_weight', e.target.value)}
                                                            className={errors[`products.${i}.unit_weight`] ? 'border-red-500 text-left' : 'text-left'}
                                                        />
                                                        {errors[`products.${i}.unit_weight`] && (
                                                            <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.unit_weight`]}</p>
                                                        )}
                                                    </td>
                                                    <td className="col-span-1 block flex w-full items-center justify-between px-0 py-0 text-left xl:table-cell xl:w-36 xl:px-4 xl:py-3">
                                                        <span className="text-muted-foreground block text-xs font-semibold xl:hidden">
                                                            {translate('Total Weight (kg)')}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                            {lineWeight.toFixed(2)} kg
                                                        </span>
                                                    </td>
                                                    <td className="col-span-1 block w-full border-t px-0 py-0 pt-2 text-right sm:col-span-2 xl:table-cell xl:w-10 xl:border-t-0 xl:px-4 xl:py-3 xl:pt-0 xl:text-left">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setProductRows((p) => (p.length <= 1 ? p : p.filter((r) => r.id !== row.id)))
                                                            }
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
                            {totalWeight >= 0 && productRows.some((r) => r.product_id) && (
                                <div className="flex justify-end border-t border-gray-100 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
                                    <div className="w-64">
                                        <div className="flex justify-between border-t pt-2 text-base font-bold text-gray-900 dark:text-gray-100">
                                            <span>{translate('Total Weight')}</span>
                                            <span className="text-lg text-green-600">{totalWeight.toFixed(2)} kg</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Delivery Address ── */}
                <div className="-mx-6">
                    <div className="border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="mt-6">
                    <SectionHeader title={translate('Delivery Address')} />
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Delivery Address')} <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                value={form.delivery_address}
                                onChange={(e) => setranslate('delivery_address', e.target.value)}
                                rows={2}
                                placeholder={translate('e.g. 123 Main St, Suite 100')}
                                className={errors.delivery_address ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.delivery_address} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Delivery City')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={form.delivery_city}
                                onChange={(e) => setranslate('delivery_city', e.target.value)}
                                placeholder={translate('e.g. New York')}
                                className={errors.delivery_city ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.delivery_city} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Delivery State')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={form.delivery_state}
                                onChange={(e) => setranslate('delivery_state', e.target.value)}
                                placeholder={translate('e.g. NY')}
                                className={errors.delivery_state ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.delivery_state} />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Delivery Country')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={form.delivery_country}
                                onChange={(e) => setranslate('delivery_country', e.target.value)}
                                placeholder={translate('e.g. United States')}
                                className={errors.delivery_country ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.delivery_country} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">
                                {translate('Delivery Postal Code')} <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={form.delivery_postal_code}
                                onChange={(e) => setranslate('delivery_postal_code', e.target.value)}
                                placeholder={translate('e.g. 10001')}
                                className={errors.delivery_postal_code ? 'border-red-500' : ''}
                            />
                            <FieldError message={errors.delivery_postal_code} />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label className="text-sm font-semibold text-gray-900 dark:text-white">{translate('Delivery Notes')}</Label>
                            <Textarea
                                value={form.delivery_notes}
                                onChange={(e) => setranslate('delivery_notes', e.target.value)}
                                rows={3}
                                placeholder={translate('e.g. Leave at reception, handle with care...')}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
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
