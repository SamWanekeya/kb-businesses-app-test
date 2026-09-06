import { toast } from '@/components/custom-toast';
import MediaPicker from '@/components/MediaPicker';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Banknote, Box, Image, Tag, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const STEPS = [
    { number: 1, label: 'Basic Details', Icon: Box },
    { number: 2, label: 'Pricing & Units', Icon: Banknote },
    { number: 3, label: 'Media Gallery', Icon: Image },
    { number: 4, label: 'Assignment', Icon: UserCheck },
];

export default function ProductEdit() {
    const { t: translate } = useTranslation();
    const { product, categories, brands, taxes, users, mainImage, additionalImages, existingSkus } = usePage().props;
    const [step, setStep] = useState(1);
    const [mainImageUrl, setMainImageUrl] = useState<string | null>(typeof mainImage === 'string' ? mainImage : mainImage?.url || null);

    const validMainImageId = product.main_image_id && mainImage ? product.main_image_id : null;
    const validAdditionalImageIds =
        product.additional_image_ids && additionalImages
            ? product.additional_image_ids.filter((id: number) => additionalImages.some((img: any) => img.id === id))
            : null;

    const { data, setData, setError, clearErrors, put, processing, errors } = useForm({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
        category_id: product.category_id?.toString() || '',
        brand_id: product.brand_id?.toString() || '',
        tax_id: product.tax_id?.toString() || '',
        status: product.status || 'active',
        assigned_to: product.assigned_to?.toString() || '',
        main_image_id: validMainImageId as number | null,
        additional_image_ids: validAdditionalImageIds as number[] | null,
    });

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Products'), href: route('products.index') },
        { title: translate('Edit') },
    ];

    const set = (name: string, value: any) => {
        setData(name as any, value);
        clearErrors(name as any);
    };

    const validateStep = (s: number) => {
        const errs: Record<string, string> = {};
        if (s === 1) {
            if (!data.name) errs.name = translate('Name is required');
            if (!data.sku) errs.sku = translate('SKU is required');
            else if (existingSkus.map((s: string) => s.toLowerCase()).includes(data.sku.toLowerCase())) errs.sku = translate('SKU already exists');
            if (!data.category_id) errs.category_id = translate('Category is required');
            if (!data.tax_id) errs.tax_id = translate('Tax is required');
            if (!data.brand_id) errs.brand_id = translate('Brand is required');
        }
        if (s === 2) {
            if (!data.price) errs.price = translate('Price is required');
            if (data.price && parseFloat(data.price) < 0) errs.price = translate('Price must be at least 0');
            if (!data.stock_quantity) errs.stock_quantity = translate('Stock Quantity is required');
            if (data.stock_quantity && parseFloat(data.stock_quantity) < 0) errs.stock_quantity = translate('Stock Quantity must be at least 0');
        }
        if (s === 3) {
            if (!data.main_image_id) errs.main_image_id = translate('Main Image is required');
            if (!data.additional_image_ids?.length) errs.additional_image_ids = translate('Additional Images are required');
        }
        if (s === 4) {
            if (!data.assigned_to) errs.assigned_to = translate('Assign To is required');
        }
        return errs;
    };

    const handleStepClick = (targetStep: number) => {
        if (targetStep <= step) {
            setStep(targetStep);
            return;
        }
        for (let s = 1; s < targetStep; s++) {
            const errs = validateStep(s);
            if (Object.keys(errs).length > 0) {
                Object.entries(errs).forEach(([k, v]) => setError(k as any, v));
                setStep(s);
                return;
            }
        }
        setStep(targetStep);
    };

    const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const errs = validateStep(step);
        if (Object.keys(errs).length > 0) {
            Object.entries(errs).forEach(([k, v]) => setError(k as any, v));
            return;
        }
        setStep((s) => s + 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const allErrs: Record<string, string> = {};
        [1, 2, 3, 4].forEach((s) => Object.assign(allErrs, validateStep(s)));
        if (Object.keys(allErrs).length > 0) {
            Object.entries(allErrs).forEach(([k, v]) => setError(k as any, v));
            const firstErrStep = [1, 2, 3, 4].find((s) => Object.keys(validateStep(s)).length > 0);
            if (firstErrStep) setStep(firstErrStep);
            Object.values(allErrs).forEach((msg) => toast.error(msg));
            return;
        }
        toast.loading(translate('Updating product...'));
        put(route('products.update', product.id), {
            onSuccess: () => toast.dismiss(),
            onError: (errs) => {
                toast.dismiss();
                Object.values(errs).forEach((msg: any) => toast.error(msg));
                const firstErrStep = [1, 2, 3, 4].find((s) => Object.keys(validateStep(s)).length > 0);
                if (firstErrStep) setStep(firstErrStep);
            },
        });
    };

    const { globalSettings } = usePage().props;
    const currencySymbol = globalSettings?.currencySymbol || '$';

    return (
        <PageTemplate
            title={translate('Edit Product')}
            url={route('products.index')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="me-1 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('products.index')),
                },
            ]}
            noPadding
        >
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col items-start gap-6 xl:flex-row">
                    {/* ── Main Form ── */}
                    <div className="w-full min-w-0 flex-1">
                        {/* Step Wizard Bar */}
                        <div className="bg-card border-border mb-4 rounded-xl border p-4">
                            <div className="flex flex-wrap items-center gap-y-2">
                                {STEPS.map((s, i) => {
                                    const isActive = step === s.number;
                                    const isDone = step > s.number;
                                    return (
                                        <div key={s.number} className="flex flex-1 items-center">
                                            <button
                                                type="button"
                                                onClick={() => handleStepClick(s.number)}
                                                className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors"
                                            >
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                                        isActive
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : isDone
                                                              ? 'border-primary bg-primary text-primary-foreground'
                                                              : 'border-border bg-muted text-muted-foreground'
                                                    }`}
                                                >
                                                    <s.Icon className="h-4 w-4" />
                                                </span>
                                                <span className="hidden text-start sm:block">
                                                    <span className="text-muted-foreground block text-[10px] tracking-wide uppercase">
                                                        STEP {s.number}
                                                    </span>
                                                    <span
                                                        className={`block text-xs font-semibold ${isActive ? 'text-primary' : isDone ? 'text-primary' : 'text-muted-foreground'}`}
                                                    >
                                                        {translate(s.label)}
                                                    </span>
                                                </span>
                                            </button>
                                            {i < STEPS.length - 1 && <span className="bg-border mx-1 h-px flex-1" />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Step Content Card */}
                        <div className="bg-card border-border rounded-xl border p-6">
                            {/* ── Step 1: Basic Details ── */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label required>{translate('Name')}</Label>
                                            <Input
                                                value={data.name}
                                                onChange={(e) => setranslate('name', e.target.value)}
                                                className={errors.name ? 'border-red-500' : ''}
                                                placeholder={translate('Enter Name')}
                                            />
                                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{translate('SKU')}</Label>
                                            <Input
                                                value={data.sku}
                                                onChange={(e) => setranslate('sku', e.target.value)}
                                                className={errors.sku ? 'border-red-500' : ''}
                                                placeholder={translate('Enter SKU')}
                                            />
                                            {errors.sku && <p className="text-xs text-red-500">{errors.sku}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label required>{translate('Category')}</Label>
                                            <Select value={data.category_id} onValueChange={(v) => setranslate('category_id', v)}>
                                                <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder={translate('Select Category')} />
                                                </SelectTrigger>
                                                <SelectContent searchable>
                                                    {categories?.map((c: any) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>
                                                            {c.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.category_id && <p className="text-xs text-red-500">{errors.category_id}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{translate('Brand')}</Label>
                                            <Select value={data.brand_id} onValueChange={(v) => setranslate('brand_id', v)}>
                                                <SelectTrigger className={errors.brand_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder={translate('Select Brand')} />
                                                </SelectTrigger>
                                                <SelectContent searchable>
                                                    {brands?.map((b: any) => (
                                                        <SelectItem key={b.id} value={b.id.toString()}>
                                                            {b.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.brand_id && <p className="text-xs text-red-500">{errors.brand_id}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label required>{translate('Tax')}</Label>
                                            <Select value={data.tax_id} onValueChange={(v) => setranslate('tax_id', v)}>
                                                <SelectTrigger className={errors.tax_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder={translate('Select Taxes')} />
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
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label>{translate('Description')}</Label>
                                        <Textarea
                                            value={data.description}
                                            onChange={(e) => setranslate('description', e.target.value)}
                                            rows={5}
                                            placeholder={translate('Enter description...')}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* ── Step 2: Pricing & Units ── */}
                            {step === 2 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label required>{translate('Price')}</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={data.price}
                                                onChange={(e) => setranslate('price', e.target.value)}
                                                className={errors.price ? 'border-red-500' : ''}
                                                placeholder={translate('e.g. 29.99')}
                                            />
                                            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label required>{translate('Stock Quantity')}</Label>
                                            <Input
                                                type="number"
                                                value={data.stock_quantity}
                                                onChange={(e) => setranslate('stock_quantity', e.target.value)}
                                                className={errors.stock_quantity ? 'border-red-500' : ''}
                                                placeholder={translate('e.g. 100')}
                                            />
                                            {errors.stock_quantity && <p className="text-xs text-red-500">{errors.stock_quantity}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Step 3: Media Gallery ── */}
                            {step === 3 && (
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label>
                                            {translate('Main Image')} <span className="text-red-500">*</span>
                                        </Label>
                                        <MediaPicker
                                            value={data.main_image_id ?? undefined}
                                            onChange={(v) => {
                                                setranslate('main_image_id', v);
                                                if (v) {
                                                    fetch(route('api.media.index'), {
                                                        credentials: 'same-origin',
                                                        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                                                    })
                                                        .then((r) => r.json())
                                                        .then((media) => {
                                                            const item = media.find((m: any) => m.id === Number(v));
                                                            setMainImageUrl(item?.url || null);
                                                        })
                                                        .catch(() => setMainImageUrl(null));
                                                } else {
                                                    setMainImageUrl(null);
                                                }
                                            }}
                                            placeholder={translate('Select main image...')}
                                            showPreview={true}
                                            returnType="id"
                                        />
                                        {errors.main_image_id && <p className="text-xs text-red-500">{errors.main_image_id}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>
                                            {translate('Additional Images')} <span className="text-red-500">*</span>
                                        </Label>
                                        <MediaPicker
                                            value={data.additional_image_ids || []}
                                            onChange={(v) => setranslate('additional_image_ids', v)}
                                            placeholder={translate('Select additional images...')}
                                            multiple={true}
                                            showPreview={true}
                                            returnType="id"
                                        />
                                        {errors.additional_image_ids && <p className="text-xs text-red-500">{errors.additional_image_ids}</p>}
                                    </div>
                                </div>
                            )}

                            {/* ── Step 4: Assignment ── */}
                            {step === 4 && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="space-y-1.5">
                                            <Label required>{translate('Assign To')}</Label>
                                            <Select value={data.assigned_to} onValueChange={(v) => setranslate('assigned_to', v)}>
                                                <SelectTrigger className={errors.assigned_to ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder={translate('Select user')} />
                                                </SelectTrigger>
                                                <SelectContent searchable>
                                                    {users?.map((u: any) => (
                                                        <SelectItem key={u.id} value={u.id.toString()}>
                                                            {u.name} ({u.email})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.assigned_to && <p className="text-xs text-red-500">{errors.assigned_to}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label>{translate('Status')}</Label>
                                            <Select value={data.status} onValueChange={(v) => setranslate('status', v)}>
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
                            )}

                            {/* Step Navigation */}
                            <div className="border-border mt-8 flex justify-between border-t pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => (step > 1 ? setStep((s) => s - 1) : router.visit(route('products.index')))}
                                >
                                    {step > 1 ? translate('Previous') : translate('Cancel')}
                                </Button>
                                {step < 4 ? (
                                    <Button type="button" onClick={(e) => handleNext(e)}>
                                        {translate('Next')}
                                    </Button>
                                ) : (
                                    <Button type="submit" disabled={processing}>
                                        {processing ? translate('Saving...') : translate('Save Product')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Live Preview ── */}
                    <div className="hidden w-72 shrink-0 xl:block">
                        <div className="bg-card border-border sticky top-4 overflow-hidden rounded-xl border">
                            <div className="border-border flex items-center justify-between border-b px-4 py-3">
                                <span className="text-muted-foreground text-xs font-semibold tracking-wide">{translate('Live Preview')}</span>
                            </div>

                            {/* Image area */}
                            <div className="bg-muted border-border flex h-40 items-center justify-center overflow-hidden border-b">
                                {mainImageUrl ? (
                                    <img src={mainImageUrl} alt="preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Box className="text-muted-foreground/30 h-12 w-12" strokeWidth={1} />
                                        <span className="text-muted-foreground text-xs">{translate('No image uploaded')}</span>
                                    </div>
                                )}
                            </div>

                            {/* Product info */}
                            <div className="space-y-3 p-4">
                                <div>
                                    <p className="text-foreground text-sm font-semibold">{data.name || translate('Untitled Item')}</p>
                                    <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                                        <Tag className="h-3 w-3 shrink-0" />
                                        {data.sku || 'SKU-XXXXXXXX'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-muted border-border rounded-lg border p-2">
                                        <p className="text-muted-foreground text-[10px] font-medium tracking-wide">{translate('Sale Price')}</p>
                                        <p className="text-foreground mt-0.5 font-mono text-sm font-bold">
                                            {data.price ? `${currencySymbol}${parseFloat(data.price).toFixed(2)}` : `${currencySymbol}0.00`}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-2 dark:border-orange-800/40 dark:bg-orange-900/20">
                                        <p className="text-muted-foreground text-[10px] font-medium tracking-wide">{translate('Stock')}</p>
                                        <p className="mt-0.5 text-sm font-bold text-orange-500">{data.stock_quantity || '0'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </PageTemplate>
    );
}
