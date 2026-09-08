import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, PackagePlus, Plus, Trash2 } from 'lucide-react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function OpportunityEdit() {
    const { t: translate } = useTranslation();
    const {
        opportunity,
        accounts = [],
        contacts = [],
        opportunityStages = [],
        opportunitySources = [],
        products: productOptions = [],
        users = [],
    } = usePage().props;

    const { data, setData, setError, clearErrors, put, processing, errors } = useForm({
        name: opportunity.name || '',
        description: opportunity.description || '',
        close_date: opportunity.close_date ? opportunity.close_date.split('T')[0].split(' ')[0] : '',
        account_id: String(opportunity.account_id || ''),
        contact_id: String(opportunity.contact_id || ''),
        opportunity_stage_id: String(opportunity.opportunity_stage_id || ''),
        opportunity_source_id: String(opportunity.opportunity_source_id || ''),
        notes: opportunity.notes || '',
        assigned_to: String(opportunity.assigned_to || ''),
        status: opportunity.status || 'active',
        products: (opportunity.products || []).map((p: any) => ({
            product_id: String(p.id),
            quantity: String(p.pivot.quantity),
            unit_price: String(p.pivot.unit_price),
        })),
    });

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Opportunity Management') },
        { title: translate('Opportunities'), href: route('opportunities.index') },
        { title: translate('Edit') },
    ];

    const handleInputChange = (name: string, value: string) => {
        setData(name as any, value);
        clearErrors(name as any);
    };

    const addProductRow = () => {
        setData('products', [...data.products, { product_id: '', quantity: '1', unit_price: '' }]);
    };

    const removeProductRow = (index: number) => {
        if (data.products.length <= 1) return;
        setData(
            'products',
            data.products.filter((_, i) => i !== index),
        );
    };

    const updateProductRow = (index: number, field: string, value: string) => {
        const updated = data.products.map((row, i) => {
            if (i !== index) return row;
            const newRow = { ...row, [field]: value };
            if (field === 'product_id') {
                const product = productOptions.find((p: any) => String(p.id) === value);
                if (product) newRow.unit_price = String(product.price);
            }
            return newRow;
        });
        setData('products', updated);
        clearErrors(`products.${index}.${field}` as any);
    };

    const getProductTax = (productId: string) => {
        const product = productOptions.find((p: any) => String(p.id) === productId);
        return product?.tax || null;
    };

    const calcLineTotal = (row: any) => (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0);
    const calcTaxAmount = (row: any) => {
        const tax = getProductTax(row.product_id);
        return tax ? (calcLineTotal(row) * tax.rate) / 100 : 0;
    };

    const subtotal = data.products.reduce((s, r) => s + calcLineTotal(r), 0);
    const totalTax = data.products.reduce((s, r) => s + calcTaxAmount(r), 0);
    const grandTotal = subtotal + totalTax;
    const fmt = (v: number) => window.appSettings?.formatCurrency(v) || `$${v.toFixed(2)}`;

    const requiredFields: { name: keyof typeof data; label: string }[] = [
        { name: 'name', label: translate('Opportunity Name') },
        { name: 'account_id', label: translate('Account') },
        { name: 'contact_id', label: translate('Contact') },
        { name: 'opportunity_stage_id', label: translate('Stage') },
        { name: 'opportunity_source_id', label: translate('Source') },
        { name: 'assigned_to', label: translate('Assign To') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const clientErrors: Record<string, string> = {};

        requiredFields.forEach(({ name, label }) => {
            if (!data[name]) clientErrors[name] = `${label} is required`;
        });

        if (data.products.length === 0) {
            clientErrors['products'] = translate('At least one product is required');
        } else {
            data.products.forEach((row, i) => {
                if (!row.product_id) clientErrors[`products.${i}.product_id`] = translate('Product is required');
                if (!row.quantity || parseFloat(row.quantity) < 1) clientErrors[`products.${i}.quantity`] = translate('Min 1');
                if (row.unit_price === '' || parseFloat(row.unit_price) < 0) clientErrors[`products.${i}.unit_price`] = translate('Required');
            });
        }

        if (Object.keys(clientErrors).length > 0) {
            Object.entries(clientErrors).forEach(([key, msg]) => setError(key as any, msg));
            return;
        }

        toast.loading(translate('Updating opportunity...'));
        put(route('opportunities.update', opportunity.id), {
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    };

    return (
        <PageTemplate
            title={translate('Edit Opportunity')}
            description={translate('Edit opportunity details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('opportunities.index')),
                },
            ]}
            noPadding
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* ROW 1 — Basic Information + Classification */}
                <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
                    {/* Basic Information */}
                    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Basic Information')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium" required>
                                    {translate('Opportunity Name')}
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                    placeholder={translate('eg. Enterprise Software Deal')}
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">
                                    {translate('Description')}
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className={errors.description ? 'border-red-500' : ''}
                                    rows={3}
                                    placeholder={translate('Enter opportunity description...')}
                                />
                                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="close_date" className="text-sm font-medium">
                                        {translate('Close Date')}
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
                                            id="close_date"
                                            type="date"
                                            value={data.close_date}
                                            onChange={(e) => handleInputChange('close_date', e.target.value)}
                                            className={`cursor-pointer ${errors.close_date ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {errors.close_date && <p className="text-xs text-red-500">{errors.close_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">{translate('Status')}</Label>
                                    <Select value={data.status} onValueChange={(v) => handleInputChange('status', v)}>
                                        <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">{translate('Active')}</SelectItem>
                                            <SelectItem value="inactive">{translate('Inactive')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-xs text-red-500">{errors.status}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-sm font-medium">
                                    {translate('Notes')}
                                </Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className={errors.notes ? 'border-red-500' : ''}
                                    rows={3}
                                    placeholder={translate('Enter any additional notes...')}
                                />
                                {errors.notes && <p className="text-xs text-red-500">{errors.notes}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Classification */}
                    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Classification')}</h2>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Account')}
                                </Label>
                                <Select value={data.account_id} onValueChange={(v) => handleInputChange('account_id', v)}>
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

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Contact')}
                                </Label>
                                <Select value={data.contact_id} onValueChange={(v) => handleInputChange('contact_id', v)}>
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

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Stage')}
                                </Label>
                                <Select value={data.opportunity_stage_id} onValueChange={(v) => handleInputChange('opportunity_stage_id', v)}>
                                    <SelectTrigger className={errors.opportunity_stage_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select stage')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {opportunityStages.map((s: any) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.opportunity_stage_id && <p className="text-xs text-red-500">{errors.opportunity_stage_id}</p>}
                                {opportunityStages.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('opportunity-stages.index')} className="font-medium underline">
                                            {translate('Opportunity Stages')}
                                        </a>
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Source')}
                                </Label>
                                <Select value={data.opportunity_source_id} onValueChange={(v) => handleInputChange('opportunity_source_id', v)}>
                                    <SelectTrigger className={errors.opportunity_source_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={translate('Select source')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {opportunitySources.map((s: any) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.opportunity_source_id && <p className="text-xs text-red-500">{errors.opportunity_source_id}</p>}
                                {opportunitySources.length === 0 && (
                                    <p className="mt-1 text-xs">
                                        {translate('Click here to add')}{' '}
                                        <a href={route('opportunity-sources.index')} className="font-medium underline">
                                            {translate('Opportunity Sources')}
                                        </a>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ROW 2 — Products */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Products')}</h2>
                        <Button type="button" size="sm" onClick={addProductRow}>
                            <Plus className="mr-1 h-4 w-4" />
                            {translate('Add Product')}
                        </Button>
                    </div>
                    <div className="p-6">
                        {errors.products && <p className="mb-3 text-xs text-red-500">{errors.products}</p>}

                        {data.products.length === 0 ? (
                            <div
                                className="hover:border-primary/40 hover:bg-primary/5 group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-14 transition-all"
                                onClick={addProductRow}
                            >
                                <div className="bg-primary/10 group-hover:bg-primary/20 mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-colors">
                                    <PackagePlus className="text-primary h-7 w-7" />
                                </div>
                                <p className="text-foreground text-sm font-semibold">{translate('No products added yet')}</p>
                                <p className="text-muted-foreground mt-1 text-xs">{translate('Click here or use the Add Product button above')}</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop/Tablet Table */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-t border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                                                <th className="px-3 py-2 text-left">
                                                    {translate('Product')} <span className="text-red-500">*</span>
                                                </th>
                                                <th className="w-16 px-3 py-2 text-left">
                                                    {translate('Quantity')} <span className="text-red-500">*</span>
                                                </th>
                                                <th className="w-20 px-3 py-2 text-left">
                                                    {translate('Unit Price')} <span className="text-red-500">*</span>
                                                </th>
                                                <th className="w-40 px-3 py-2 text-left">{translate('Tax')}</th>
                                                <th className="w-32 px-3 py-2 text-left">{translate('Line Total')}</th>
                                                <th className="w-10 px-3 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.products.map((row, i) => {
                                                const lineTotal = calcLineTotal(row);
                                                const taxAmt = calcTaxAmount(row);
                                                const tax = getProductTax(row.product_id);
                                                return (
                                                    <tr key={i} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="w-48 px-3 py-2">
                                                            <Select
                                                                value={row.product_id}
                                                                onValueChange={(v) => updateProductRow(i, 'product_id', v)}
                                                            >
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
                                                        <td className="px-3 py-2">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={row.quantity}
                                                                onChange={(e) => updateProductRow(i, 'quantity', e.target.value)}
                                                                className={`w-full text-left ${errors[`products.${i}.quantity`] ? 'border-red-500' : ''}`}
                                                                placeholder="1"
                                                            />
                                                            {errors[`products.${i}.quantity`] && (
                                                                <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.quantity`]}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={row.unit_price}
                                                                onChange={(e) => updateProductRow(i, 'unit_price', e.target.value)}
                                                                className={`w-full text-left ${errors[`products.${i}.unit_price`] ? 'border-red-500' : ''}`}
                                                                placeholder="0.00"
                                                            />
                                                            {errors[`products.${i}.unit_price`] && (
                                                                <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.unit_price`]}</p>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-left">
                                                            <span className="text-muted-foreground text-sm font-medium">
                                                                {tax ? `${tax.name} (${parseFloat(tax.rate).toFixed(2)}%)` : translate('No Tax')}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-left">
                                                            <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                                                                {fmt(lineTotal + taxAmt)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-left">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeProductRow(i)}
                                                                disabled={data.products.length <= 1}
                                                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
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

                                {/* Mobile Stacked Cards */}
                                <div className="block space-y-4 md:hidden">
                                    {data.products.map((row, i) => {
                                        const lineTotal = calcLineTotal(row);
                                        const taxAmt = calcTaxAmount(row);
                                        const tax = getProductTax(row.product_id);
                                        return (
                                            <div
                                                key={i}
                                                className="border-border relative space-y-3 rounded-lg border bg-gray-50/50 p-4 dark:bg-gray-800/30"
                                            >
                                                <div className="flex items-center justify-between border-b pb-2">
                                                    <span className="text-muted-foreground text-xs font-semibold">
                                                        {translate('Product #{{index}}', { index: i + 1 })}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProductRow(i)}
                                                        disabled={data.products.length <= 1}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-gray-500" />
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                                            {translate('Product')} *
                                                        </label>
                                                        <Select value={row.product_id} onValueChange={(v) => updateProductRow(i, 'product_id', v)}>
                                                            <SelectTrigger
                                                                className={errors[`products.${i}.product_id`] ? 'w-full border-red-500' : 'w-full'}
                                                            >
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
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                                                {translate('Quantity')} *
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={row.quantity}
                                                                onChange={(e) => updateProductRow(i, 'quantity', e.target.value)}
                                                                className={`w-full text-left ${errors[`products.${i}.quantity`] ? 'border-red-500' : ''}`}
                                                                placeholder="1"
                                                            />
                                                            {errors[`products.${i}.quantity`] && (
                                                                <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.quantity`]}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="text-muted-foreground mb-1 block text-xs font-medium">
                                                                {translate('Unit Price')} *
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={row.unit_price}
                                                                onChange={(e) => updateProductRow(i, 'unit_price', e.target.value)}
                                                                className={`w-full text-left ${errors[`products.${i}.unit_price`] ? 'border-red-500' : ''}`}
                                                                placeholder="0.00"
                                                            />
                                                            {errors[`products.${i}.unit_price`] && (
                                                                <p className="mt-1 text-xs text-red-500">{errors[`products.${i}.unit_price`]}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs">
                                                        <span className="text-muted-foreground">
                                                            {translate('Tax')}:{' '}
                                                            {tax ? `${tax.name} (${parseFloat(tax.rate).toFixed(2)}%)` : translate('No Tax')}
                                                        </span>
                                                        <span className="text-foreground font-mono font-semibold">
                                                            {translate('Total')}: {fmt(lineTotal + taxAmt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Totals panel — card footer */}
                    {data.products.length > 0 && (
                        <div className="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                            <div className="w-72 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{translate('Subtotal')}</span>
                                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{fmt(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">{translate('Tax')}</span>
                                    <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">{fmt(totalTax)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-600">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{translate('Grand Total')}</span>
                                    <span className="font-mono text-base font-bold text-green-600 dark:text-green-400">{fmt(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ROW 3 — Assignment */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Assignment')}</h2>
                    </div>
                    <div className="space-y-4 p-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium" required>
                                    {translate('Assign To')}
                                </Label>
                                <Select value={data.assigned_to} onValueChange={(v) => handleInputChange('assigned_to', v)}>
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
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row sm:gap-4">
                    <Button type="button" variant="outline" onClick={() => router.visit(route('opportunities.index'))} className="w-full sm:w-auto">
                        {translate('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                        {processing ? translate('Saving...') : translate('Save')}
                    </Button>
                </div>
            </form>
        </PageTemplate>
    );
}
