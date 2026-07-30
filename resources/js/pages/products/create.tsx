import { PageTemplate } from '@/components/page-template';
import { usePage, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import MediaPicker from '@/components/MediaPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/custom-toast';

export default function ProductCreate() {
    const { t } = useTranslation();
    const { categories, brands, taxes, users } = usePage().props as any;

    const { data, setData, setError,clearErrors, post, processing, errors } = useForm({
        name: '',
        sku: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '',
        brand_id: '',
        tax_id: '',
        status: 'active',
        assigned_to: '',
        main_image_id: null as number | null,
        additional_image_ids: null as number[] | null,
    });

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Products'), href: route('products.index') },
        { title: t('Create') },
    ];

  
        const set = (name: string, value: string) => {
        setData(name as any, value);
        clearErrors(name as any);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errs: Record<string, string> = {};
        if (!data.name) errs.name = t('Product Name is required');
        if (!data.sku) errs.sku = t('SKU is required');
        if (!data.price) errs.price = t('Price is required');
        if (!data.stock_quantity) errs.stock_quantity = t('Stock Quantity is required');
        if (!data.category_id) errs.category_id = t('Category is required');
        if (!data.brand_id) errs.brand_id = t('Brand is required');
        if (!data.tax_id) errs.tax_id = t('Tax is required');
        if (!data.main_image_id) errs.main_image_id = t('Main Image is required');
        if (!data.additional_image_ids?.length) errs.additional_image_ids = t('Additional Images is required');
        if (!data.assigned_to) errs.assigned_to = t('Assign To is required');
        if (data.price && parseFloat(data.price) < 0) errs.price = t('Price must be at least 0');
        if (data.stock_quantity && parseFloat(data.stock_quantity) < 0) errs.stock_quantity = t('Stock Quantity must be at least 0');

        if (Object.keys(errs).length > 0) {
            Object.entries(errs).forEach(([k, v]) => setError(k as any, v));
            return;
        }

        toast.loading(t('Creating product...'));
        post(route('products.store'), {
            onSuccess: () => toast.dismiss(),
            onError: () => toast.dismiss(),
        });
    };

    return (
        <PageTemplate
            title={t('Create Product')}
            breadcrumbs={breadcrumbs}
            actions={[{
                label: t('Back'),
                icon: <ArrowLeft className="h-4 w-4 mr-2" />,
                variant: 'outline',
                onClick: () => window.history.back(),
            }]}
        >
            <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

                    {/* Basic Information */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-5">{t('Basic Information')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="name" required>{t('Product Name')}</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={e => set('name', e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                    placeholder={t('e.g. Wireless Headphones, Office Chair')}
                                />
                                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="sku" required>{t('SKU')}</Label>
                                <Input
                                    id="sku"
                                    value={data.sku}
                                    onChange={e => set('sku', e.target.value)}
                                    className={errors.sku ? 'border-red-500' : ''}
                                    placeholder={t('e.g. WH-1000XM5, OC-2024-BLK')}
                                />
                                {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
                            </div>
                        </div>
                        <div className="space-y-1.5 mb-4">
                            <Label htmlFor="description">{t('Description')}</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={e => set('description', e.target.value)}
                                rows={4}
                                placeholder={t('Enter product description...')}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="price" required>{t('Price')}</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={data.price}
                                    onChange={e => set('price', e.target.value)}
                                    className={errors.price ? 'border-red-500' : ''}
                                    placeholder={t('e.g. 29.99')}
                                />
                                {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="stock_quantity" required>{t('Stock Quantity')}</Label>
                                <Input
                                    id="stock_quantity"
                                    type="number"
                                    value={data.stock_quantity}
                                    onChange={e => set('stock_quantity', e.target.value)}
                                    className={errors.stock_quantity ? 'border-red-500' : ''}
                                    placeholder={t('e.g. 100')}
                                />
                                {errors.stock_quantity && <p className="text-xs text-red-500">{errors.stock_quantity}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Product Images */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-5">{t('Product Images')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-bold  tracking-wide text-gray-500 dark:text-white">
                                    {t('Main Image')} <span className="text-red-500">*</span>
                                </p>
                                <MediaPicker
                                    value={data.main_image_id}
                                    onChange={v => set('main_image_id', v)}
                                    placeholder={t('Select main image...')}
                                    showPreview={true}
                                    returnType="id"
                                />
                                {errors.main_image_id && <p className="text-xs text-red-500">{errors.main_image_id}</p>}
                            </div>
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                                <p className="text-xs font-bold  tracking-wide text-gray-500 dark:text-white">
                                    {t('Additional Images')} <span className="text-red-500">*</span>
                                </p>
                                <MediaPicker
                                    value={data.additional_image_ids || []}
                                    onChange={v => set('additional_image_ids', v)}
                                    placeholder={t('Select additional images...')}
                                    multiple={true}
                                    showPreview={true}
                                    returnType="id"
                                />
                                {errors.additional_image_ids && <p className="text-xs text-red-500">{errors.additional_image_ids}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Categories & Settings */}
                    <div className="p-6">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-5">{t('Categories & Settings')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="space-y-1.5">
                                <Label required>{t('Category')}</Label>
                                <Select value={data.category_id} onValueChange={v => set('category_id', v)}>
                                    <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select category')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {categories?.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category_id && <p className="text-xs text-red-500">{errors.category_id}</p>}
                                {categories?.length === 0 && (
                                    <p className="text-xs mt-1">
                                        {t('Click here to add')} <a href={route('categories.index')} className="underline font-medium">{t('Categories')}</a>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label required>{t('Brand')}</Label>
                                <Select value={data.brand_id} onValueChange={v => set('brand_id', v)}>
                                    <SelectTrigger className={errors.brand_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select brand')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {brands?.map((b: any) => (
                                            <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.brand_id && <p className="text-xs text-red-500">{errors.brand_id}</p>}
                                {brands?.length === 0 && (
                                    <p className="text-xs mt-1">
                                        {t('Click here to add')} <a href={route('brands.index')} className="underline font-medium">{t('Brands')}</a>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label required>{t('Tax')}</Label>
                                <Select value={data.tax_id} onValueChange={v => set('tax_id', v)}>
                                    <SelectTrigger className={errors.tax_id ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select tax')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {taxes?.map((tax: any) => (
                                            <SelectItem key={tax.id} value={tax.id.toString()}>
                                                {tax.name} ({tax?.type === 'percentage' ? tax.rate + '%' : '$' + tax.rate})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.tax_id && <p className="text-xs text-red-500">{errors.tax_id}</p>}
                                {taxes?.length === 0 && (
                                    <p className="text-xs mt-1">
                                        {t('Click here to add')} <a href={route('taxes.index')} className="underline font-medium">{t('Taxes')}</a>
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label required>{t('Assign To')}</Label>
                                <Select value={data.assigned_to} onValueChange={v => set('assigned_to', v)}>
                                    <SelectTrigger className={errors.assigned_to ? 'border-red-500' : ''}>
                                        <SelectValue placeholder={t('Select user')} />
                                    </SelectTrigger>
                                    <SelectContent searchable>
                                        {users?.map((u: any) => (
                                            <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.email})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.assigned_to && <p className="text-xs text-red-500">{errors.assigned_to}</p>}
                                {users?.length === 0 && (
                                    <p className="text-xs mt-1">
                                        {t('Click here to add')} <a href={route('users.index')} className="underline font-medium">{t('Users')}</a>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1.5">
                                <Label>{t('Status')}</Label>
                                <Select value={data.status} onValueChange={v => set('status', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{t('Active')}</SelectItem>
                                        <SelectItem value="inactive">{t('Inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                        {t('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? t('Saving...') : t('Save')}
                    </Button>
                </div>
            </form>
        </PageTemplate>
    );
}
