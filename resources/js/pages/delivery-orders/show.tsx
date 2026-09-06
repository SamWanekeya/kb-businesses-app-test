import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Edit,
    Eye,
    FileText,
    Hash,
    Package,
    StickyNote,
    Truck,
    User,
    XCircle,
} from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function DeliveryOrderShow() {
    const { t: translate } = useTranslation();
    const { deliveryOrder, auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();
    useEffect(() => {
        const main = document.querySelector('main[data-slot="sidebar-inset"]') as HTMLElement | null;
        if (main) main.style.overflowX = 'visible';
        return () => {
            if (main) main.style.overflowX = '';
        };
    }, []);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Delivery Orders'), href: route('delivery-orders.index') },
        { title: translate('View Delivery Order') },
    ];

    const statusConfig: Record<string, { label: string; cls: string; dot: string; icon: React.ReactNode }> = {
        pending: {
            label: translate('Pending'),
            cls: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400',
            dot: 'bg-yellow-400',
            icon: <Clock className="h-3.5 w-3.5" />,
        },
        in_transit: {
            label: translate('In Transit'),
            cls: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
            dot: 'bg-blue-400',
            icon: <Truck className="h-3.5 w-3.5" />,
        },
        delivered: {
            label: translate('Delivered'),
            cls: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
            dot: 'bg-green-400',
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        },
        cancelled: {
            label: translate('Cancelled'),
            cls: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400',
            dot: 'bg-red-400',
            icon: <XCircle className="h-3.5 w-3.5" />,
        },
    };

    const cfg = statusConfig[deliveryOrder.status] ?? {
        label: deliveryOrder.status,
        cls: 'bg-gray-50 text-gray-700 ring-gray-600/20',
        dot: 'bg-gray-400',
        icon: <AlertCircle className="h-3.5 w-3.5" />,
    };

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const formatDate = (d: string) => {
        if (!d) return translate('-');
        return window.appSettings?.formatDateTime(d, false) || new Date(d).toLocaleDateString();
    };

    return (
        <PageTemplate
            title={deliveryOrder.delivery_number}
            description={translate('Delivery order details and related information')}
            url={route('delivery-orders.index')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="h-4 w-4 sm:me-2" />,
                    labelClassName: 'hidden sm:inline',
                    variant: 'outline',
                    onClick: () => router.visit(route('delivery-orders.index')),
                },
            ]}
            noPadding
        >
            <div className="grid w-full max-w-full min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                {/* ── Left Column ── */}
                <div className="w-full max-w-full min-w-0 space-y-6">
                    {/* Hero Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold">{deliveryOrder.name}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div>
                                <p className="text-muted-foreground mb-3 text-xs font-semibold">{translate('Delivery Address')}</p>
                                <div className="space-y-2">
                                    <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                        <div className="space-y-0.5">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Address')}</p>
                                            <p className="text-foreground text-sm font-medium">{deliveryOrder.delivery_address || translate('-')}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('City')}</p>
                                            <p className="text-foreground text-sm font-medium">{deliveryOrder.delivery_city || translate('-')}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                        <div className="space-y-0.5">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('State')}</p>
                                            <p className="text-foreground text-sm font-medium">{deliveryOrder.delivery_state || translate('-')}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Postal Code')}</p>
                                            <p className="text-foreground text-sm font-medium">{deliveryOrder.delivery_postal_code || translate('-')}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-muted-foreground text-xs font-medium">{translate('Country')}</p>
                                        <p className="text-foreground text-sm font-medium">{deliveryOrder.delivery_country || translate('-')}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes + Description */}
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <StickyNote className="text-muted-foreground me-3 h-5 w-5" />
                                    {translate('Delivery Notes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[150px] overflow-y-auto">
                                    <div className="px-5 py-4">
                                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                                            {deliveryOrder.delivery_notes || translate('-')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <FileText className="text-muted-foreground me-3 h-5 w-5" />
                                    {translate('Description')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[150px] overflow-y-auto">
                                    <div className="px-5 py-4">
                                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                                            {deliveryOrder.description || translate('-')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Products */}
                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Package className="text-muted-foreground me-3 h-5 w-5" />
                                {translate('Products')}
                                {deliveryOrder.products?.length > 0 && (
                                    <span className="bg-muted text-muted-foreground ms-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                                        {deliveryOrder.products.length}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {deliveryOrder.products && deliveryOrder.products.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[850px]">
                                            <TableHeader>
                                                <TableRow className="bg-muted hover:!bg-muted border-b">
                                                    <TableHead className="py-2.5 font-semibold whitespace-nowrap">{translate('Product')}</TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {translate('Quantity')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {translate('Unit Weight')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-end font-semibold whitespace-nowrap">
                                                        {translate('Total Weight')}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {deliveryOrder.products.map((product: any, index: number) => (
                                                    <TableRow key={index} className="hover:bg-muted/50 border-b">
                                                        <TableCell className="py-3">
                                                            <div className="flex min-w-0 items-center gap-3">
                                                                {product.main_image_url ? (
                                                                    <a
                                                                        href={product.main_image_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex-shrink-0"
                                                                    >
                                                                        <img
                                                                            src={product.main_image_url}
                                                                            alt={product.name}
                                                                            className="border-border h-11 w-11 rounded-lg border object-cover transition-opacity hover:opacity-80"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <div className="bg-muted border-border flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border">
                                                                        <Package className="text-muted-foreground/40 h-4 w-4" />
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <p className="text-foreground truncate text-sm font-bold">{product.name}</p>
                                                                    {product.sku && (
                                                                        <p className="text-muted-foreground mt-0.5 text-xs">SKU: {product.sku}</p>
                                                                    )}
                                                                    {product.category?.name && (
                                                                        <span className="mt-1 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                                            {product.category.name}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-3 text-center">
                                                            <p className="text-foreground text-sm font-semibold">{product.pivot?.quantity ?? 0}</p>
                                                        </TableCell>
                                                        <TableCell className="py-3 text-center">
                                                            <p className="text-foreground text-sm font-semibold">
                                                                {product.pivot?.unit_weight ?? 0} kg
                                                            </p>
                                                        </TableCell>
                                                        <TableCell className="py-3 text-end">
                                                            <p className="text-sm font-bold text-emerald-600">
                                                                {product.pivot?.total_weight ?? 0} kg
                                                            </p>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <div className="bg-muted/10 flex flex-col items-start justify-end gap-4 border-t px-6 py-5 md:flex-row md:items-end">
                                        <div className="w-full max-w-sm overflow-hidden rounded-xl border">
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-foreground text-sm font-bold">{translate('Total Weight')}</span>
                                                <span className="text-lg font-bold text-emerald-600">{deliveryOrder.total_weight ?? 0} kg</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                                        <Package className="text-muted-foreground/40 h-8 w-8" />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('No products added to this delivery order')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {/* end left column */}

                {/* ── Right Sticky Sidebar ── */}
                <div className="w-full min-w-0 space-y-4 xl:sticky xl:top-6 xl:w-[320px] xl:self-start">
                    {/* Summary & Actions */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <Truck className="me-2 h-4 w-4 text-emerald-600" />
                                {translate('Summary & Actions')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="text-muted-foreground mb-1 text-xs">{translate('Shipping Cost')}</p>
                                    <p className="text-foreground font-mono text-2xl font-bold">{formatCurrency(deliveryOrder.shipping_cost)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cfg.cls}`}
                                    >
                                        {cfg.label}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {useHasPermission('edit-delivery-orders') && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.visit(route('delivery-orders.edit', deliveryOrder.id))}
                                    >
                                        <Edit className="me-2 h-4 w-4" />
                                        {translate('Edit Delivery Order')}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    {(deliveryOrder.contact || deliveryOrder.account) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <User className="me-2 h-4 w-4 text-emerald-600" />
                                    {translate('Customer Info')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {deliveryOrder.contact && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs text-[10px]">
                                            <User className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {translate('Contact')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={deliveryOrder.contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{deliveryOrder.contact.name}</p>
                                                    {deliveryOrder.contact.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{deliveryOrder.contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-contacts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route('contacts.show', deliveryOrder.contact.id)}
                                                                className="ms-3 flex-shrink-0"
                                                            >
                                                                <Eye className="h-4 w-4 text-gray-500" />
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{translate('View')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {deliveryOrder.contact && deliveryOrder.account && <div className="mx-0 border-t" />}
                                {deliveryOrder.account && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs text-[10px]">
                                            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {translate('Account')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={deliveryOrder.account.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{deliveryOrder.account.name}</p>
                                                    {deliveryOrder.account.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{deliveryOrder.account.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-accounts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route('accounts.show', deliveryOrder.account.id)}
                                                                className="ms-3 flex-shrink-0"
                                                            >
                                                                <Eye className="h-4 w-4 text-gray-500" />
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{translate('View')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* DO Details */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <FileText className="me-2 h-4 w-4 text-emerald-600" />
                                {translate('Order Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-5">
                            <div className="flex items-start gap-3">
                                <Hash className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Delivery Number')}</p>
                                    <p className="text-foreground font-mono text-sm font-medium">{deliveryOrder.delivery_number}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Delivery Date')}</p>
                                    <p className="text-foreground text-sm font-medium">{formatDate(deliveryOrder.delivery_date)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Expected Delivery')}</p>
                                    <p className="text-foreground text-sm font-medium">{formatDate(deliveryOrder.expected_delivery_date)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Hash className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Tracking Number')}</p>
                                    <p className="text-foreground font-mono text-sm font-medium">{deliveryOrder.tracking_number || translate('-')}</p>
                                </div>
                            </div>
                            {deliveryOrder.assigned_user && (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground mb-2 text-xs">{translate('Assigned To')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={deliveryOrder.assigned_user.avatar} alt={deliveryOrder.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(deliveryOrder.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{deliveryOrder.assigned_user.name}</p>
                                            {deliveryOrder.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{deliveryOrder.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {deliveryOrder.creator && (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground mb-2 text-xs">{translate('Created By')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={deliveryOrder.creator.avatar} alt={deliveryOrder.creator.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(deliveryOrder.creator.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{deliveryOrder.creator.name}</p>
                                            {deliveryOrder.creator.email && (
                                                <p className="text-muted-foreground truncate text-xs">{deliveryOrder.creator.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Related Records */}
                    {(deliveryOrder.sales_order || deliveryOrder.shipping_provider_type) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <Package className="me-2 h-4 w-4 text-gray-600" />
                                    {translate('Related Records')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-5">
                                {deliveryOrder.sales_order && useHasPermission('view-sales-orders') && (
                                    <Link
                                        href={route('sales-orders.show', deliveryOrder.sales_order.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Sales Order')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{deliveryOrder.sales_order.name}</p>
                                        </div>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p>{translate('View')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Link>
                                )}
                                {deliveryOrder.shipping_provider_type && useHasPermission('view-shipping-provider-types') && (
                                    <Link
                                        href={route('shipping-provider-types.show', deliveryOrder.shipping_provider_type.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Shipping Provider')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">
                                                {deliveryOrder.shipping_provider_type.name}
                                            </p>
                                        </div>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p>{translate('View')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
                {/* end right sidebar */}
            </div>
            {/* end flex */}
        </PageTemplate>
    );
}
