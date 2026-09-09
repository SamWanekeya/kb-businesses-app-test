import PageTemplate from '@components/PageTemplate';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import useInitials from '@hooks/useInitials';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, DollarSign, Download, FileText, Layers, Package, Tag, Users, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ProductShow() {
    const { t: translate } = useTranslation();
    const { product, mainImage, additionalImages } = usePage().props;
    const getInitials = useInitials();
    const images: any[] = additionalImages || [];
    const [adIndex, setAdIndex] = useState(0);

    const handlePrev = () => setAdIndex((i) => (i - 1 + images.length) % images.length);
    const handleNext = () => setAdIndex((i) => (i + 1) % images.length);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Items'), href: route('products.index') },
        { title: translate('View Product') },
    ];

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const pageActions = [
        {
            label: translate('Back'),
            icon: <ArrowLeft className="me-2 h-4 w-4" />,
            variant: 'outline',
            onClick: () => router.visit(route('products.index')),
        },
    ];

    return (
        <PageTemplate
            title={product.name}
            description={translate('Product details and related information')}
            noPadding
            breadcrumbs={breadcrumbs}
            actions={pageActions}
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_3fr]">
                {/* ── Left Column ── */}
                <div className="space-y-4">
                    {/* Main Image — always fixed */}
                    <Card className="shadow-sm">
                        <CardHeader className="px-4 pt-4 pb-2">
                            <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                                <Package className="h-4 w-4" />
                                {translate('Product Image')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            <div className="bg-muted flex min-h-[220px] items-center justify-center rounded-lg">
                                {mainImage ? (
                                    <img src={mainImage} alt={product.name} className="max-h-[220px] max-w-full rounded-lg object-contain" />
                                ) : (
                                    <Package className="text-muted-foreground/30 h-20 w-20" />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Images — independent carousel */}
                    {images.length > 0 && (
                        <Card className="shadow-sm">
                            <CardHeader className="px-4 pt-4 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                                        <Package className="h-4 w-4" />
                                        {translate('Additional Images')}
                                    </CardTitle>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground text-xs">
                                            {adIndex + 1}/{images.length}
                                        </span>
                                        <a href={images[adIndex]?.url} target="_blank" rel="noreferrer" className="hover:bg-muted rounded p-1">
                                            <ZoomIn className="text-muted-foreground h-4 w-4" />
                                        </a>
                                        <a href={images[adIndex]?.url} download className="hover:bg-muted rounded p-1">
                                            <Download className="text-muted-foreground h-4 w-4" />
                                        </a>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                {/* Carousel viewer */}
                                <div className="bg-muted relative mb-3 flex min-h-[300px] items-center justify-center rounded-lg">
                                    {images.length > 1 && (
                                        <button onClick={handlePrev} className="bg-card hover:bg-muted absolute start-2 z-10 rounded-full p-1 shadow">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                    )}
                                    <img
                                        src={images[adIndex]?.url}
                                        alt={`${product.name} ${adIndex + 1}`}
                                        className="max-h-[300px] max-w-full rounded-lg object-contain"
                                    />
                                    {images.length > 1 && (
                                        <button onClick={handleNext} className="bg-card hover:bg-muted absolute end-2 z-10 rounded-full p-1 shadow">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                {/* Thumbnails */}
                                <div className="flex gap-2 overflow-x-auto py-1">
                                    {images.map((img: any, idx: number) => (
                                        <button
                                            key={img.id}
                                            onClick={() => setAdIndex(idx)}
                                            className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded border-2 transition-all ${
                                                adIndex === idx ? 'border-primary' : 'border-border hover:border-muted-foreground'
                                            }`}
                                        >
                                            <img src={img.thumb_url || img.url} alt={`thumb-${idx}`} className="h-full w-full object-contain p-1" />
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* ── Right Column ── */}
                <div className="space-y-4">
                    {/* Summary Stat Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {(
                            [
                                {
                                    label: translate('Sale Price'),
                                    value: formatCurrency(product.price),
                                    icon: DollarSign,
                                    iconCls: 'text-emerald-600',
                                    blobCls: 'bg-emerald-50 dark:bg-emerald-900/30',
                                },
                                {
                                    label: translate('Brand'),
                                    value: product.brand?.name || '—',
                                    icon: Bookmark,
                                    iconCls: 'text-blue-600',
                                    blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                                },
                                {
                                    label: translate('Stock'),
                                    value: product.stock_quantity ?? '—',
                                    icon: Layers,
                                    iconCls: 'text-orange-600',
                                    blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                                },
                                {
                                    label: translate('Category'),
                                    value: product.category?.name || '—',
                                    icon: Tag,
                                    iconCls: 'text-purple-600',
                                    blobCls: 'bg-purple-50 dark:bg-purple-900/30',
                                },
                            ] as const
                        ).map(({ label, value, icon: Icon, iconCls, blobCls }) => (
                            <Card key={label} className="relative overflow-hidden">
                                <div className={`absolute end-0 top-0 h-20 w-20 ${blobCls} rounded-bl-full`} />
                                <CardContent className="relative p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 pe-1">
                                            <p className="text-muted-foreground mb-1 text-xs font-medium">{label}</p>
                                            <p className="text-foreground truncate font-mono text-sm leading-snug font-bold">{value}</p>
                                        </div>
                                        <div className={`relative z-10 p-2 ${blobCls} mt-0.5 flex-shrink-0 rounded-lg`}>
                                            <Icon className={`h-4 w-4 ${iconCls}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Basic Information + Additional Information — side by side */}
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <FileText className="text-muted-foreground me-2 h-4 w-4" />
                                    {translate('Basic Information')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Status')}</p>
                                    <div>
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                product.status === 'active'
                                                    ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400'
                                            }`}
                                        >
                                            {product.status === 'active' ? translate('Active') : translate('Inactive')}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('SKU')}</p>
                                    <p className="text-foreground font-mono text-sm font-medium">{product.sku || '—'}</p>
                                </div>

                                {product.tax && (
                                    <div className="space-y-0.5">
                                        <p className="text-muted-foreground text-xs font-medium">{translate('Tax')}</p>
                                        <p className="text-foreground text-sm font-medium">
                                            {product.tax.name}
                                            {product.tax.type === 'percentage' ? ` (${product.tax.rate}%)` : ` (`}
                                            <span className="font-mono">
                                                {product.tax.type !== 'percentage' ? formatCurrency(product.tax.rate) : ''}
                                            </span>
                                            {product.tax.type !== 'percentage' ? `)` : ''}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <Users className="text-muted-foreground me-2 h-4 w-4" />
                                    {translate('Additional Information')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                <div>
                                    <p className="text-muted-foreground mb-2 text-xs font-medium">{translate('Assigned To')}</p>
                                    {product.assigned_user ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarImage src={product.assigned_user.avatar} alt={product.assigned_user.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(product.assigned_user.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-medium">{product.assigned_user.name}</p>
                                                {product.assigned_user.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{product.assigned_user.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{translate('Unassigned')}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-2 text-xs font-medium">{translate('Created By')}</p>
                                    {product.creator ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                <AvatarImage src={product.creator.avatar} alt={product.creator.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(product.creator.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-medium">{product.creator.name}</p>
                                                {product.creator.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{product.creator.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{translate('Unknown')}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <FileText className="text-muted-foreground me-3 h-5 w-5" />
                                    {translate('Description')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[150px] overflow-y-auto px-5 py-4" style={{ scrollbarGutter: 'stable' }}>
                                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </PageTemplate>
    );
}
