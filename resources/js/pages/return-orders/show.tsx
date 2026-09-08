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
import { ArrowLeft, Building2, Calendar, Edit, Eye, FileText, Hash, Package, User } from 'lucide-react';
import { useEffect } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function ReturnOrderShow() {
    const { t: translate } = useTranslation();
    const { returnOrder, auth } = usePage().props;
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
        { title: translate('Return Orders'), href: route('return-orders.index') },
        { title: translate('View Return Order') },
    ];

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            processed: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
            received: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
            approved: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
            shipped: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400',
            cancelled: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400',
            pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400',
        };
        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status] || statusColors.pending}`}
            >
                {translate(status?.charAt(0).toUpperCase() + status?.slice(1)) || translate('Pending')}
            </span>
        );
    };

    const getReasonLabel = (reason: string) => {
        const reasonLabels: Record<string, string> = {
            defective: translate('Defective'),
            wrong_item: translate('Wrong Item'),
            damaged: translate('Damaged'),
            not_needed: translate('Not Needed'),
            other: translate('Other'),
        };
        return reasonLabels[reason] || reason;
    };

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const formatDate = (dateString: string) => {
        if (!dateString) return translate('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    return (
        <PageTemplate
            title={returnOrder.name}
            description={translate('Return order details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="h-4 w-4 sm:me-2" />,
                    labelClassName: 'hidden sm:inline',
                    variant: 'outline',
                    onClick: () => router.visit(route('return-orders.index')),
                },
            ]}
            noPadding
        >
            <div className="grid w-full max-w-full min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                {/* ── Left Column ── */}
                <div className="w-full max-w-full min-w-0 space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {(
                            [
                                {
                                    label: translate('Return Number'),
                                    value: returnOrder.return_number || '—',
                                    icon: FileText,
                                    iconCls: 'text-blue-600',
                                    blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                                },
                                {
                                    label: translate('Return Date'),
                                    value: formatDate(returnOrder.return_date),
                                    icon: Calendar,
                                    iconCls: 'text-orange-600',
                                    blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                                },
                                {
                                    label: translate('Return Reason'),
                                    value: returnOrder.reason ? getReasonLabel(returnOrder.reason) : '—',
                                    icon: FileText,
                                    iconCls: 'text-emerald-600',
                                    blobCls: 'bg-emerald-50 dark:bg-emerald-900/30',
                                },
                            ] as const
                        ).map(({ label, value, icon: Icon, iconCls, blobCls }) => (
                            <Card key={label} className="relative overflow-hidden">
                                <div className={`absolute end-0 top-0 h-20 w-20 ${blobCls} rounded-bl-full`} />
                                <CardContent className="relative p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 pe-2">
                                            <p className="text-muted-foreground mb-1 text-sm font-medium">{label}</p>
                                            <p className="text-foreground truncate text-lg leading-snug font-bold">{value}</p>
                                        </div>
                                        <div className={`relative z-10 p-2.5 ${blobCls} mt-0.5 flex-shrink-0 rounded-xl`}>
                                            <Icon className={`h-5 w-5 ${iconCls}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Products */}
                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Package className="text-muted-foreground me-3 h-5 w-5" />
                                {translate('Products')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {returnOrder.products && returnOrder.products.length > 0 ? (
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
                                                        {translate('Unit Price')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {translate('Tax')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-right font-semibold whitespace-nowrap">
                                                        {translate('Total')}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {returnOrder.products.map((product: any, index: number) => {
                                                    const lineTotal = Number(product.pivot.total_price) || 0;
                                                    const discountAmount = Number(product.pivot.discount_amount) || 0;
                                                    const finalTotal = lineTotal - discountAmount;
                                                    const taxAmount = product.tax ? (finalTotal * Number(product.tax.rate)) / 100 : 0;
                                                    return (
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
                                                                                className="border-border h-11 w-11 cursor-pointer rounded-lg border object-cover transition-opacity hover:opacity-80"
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
                                                                <p className="text-foreground text-sm font-semibold">{product.pivot.quantity}</p>
                                                            </TableCell>
                                                            <TableCell className="py-3 text-center">
                                                                <p className="text-foreground font-mono text-sm font-semibold">
                                                                    {formatCurrency(product.pivot.unit_price)}
                                                                </p>
                                                            </TableCell>
                                                            <TableCell className="py-3 text-center">
                                                                {product.tax ? (
                                                                    <>
                                                                        <p className="text-foreground text-sm font-semibold">
                                                                            {product.tax.name} ({parseFloat(product.tax.rate).toFixed(2)}%)
                                                                        </p>
                                                                        <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                                                                            {formatCurrency(taxAmount)}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-3 text-right">
                                                                <p className="font-mono text-sm font-bold text-emerald-600">
                                                                    {formatCurrency(finalTotal + taxAmount)}
                                                                </p>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="bg-muted/10 flex flex-col items-start justify-end gap-4 border-t px-6 py-5 md:flex-row md:items-end">
                                        <div className="w-full max-w-sm overflow-hidden rounded-xl border">
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Subtotal')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">
                                                    {formatCurrency(returnOrder.subtotal)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Total Tax')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">
                                                    {formatCurrency(returnOrder.tax_amount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-foreground text-sm font-bold">{translate('Grand Total')}</span>
                                                <span className="font-mono text-lg font-bold text-emerald-600">
                                                    {formatCurrency(returnOrder.total_amount)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                                        <Package className="text-muted-foreground/40 h-8 w-8" />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('No products added to this return order')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Description */}
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
                                        {returnOrder.description || translate('-')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Reason Description */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground me-3 h-5 w-5" />
                                {translate('Reason Description')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[150px] overflow-y-auto">
                                <div className="px-5 py-4">
                                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                                        {returnOrder.reason_description || translate('-')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {returnOrder.notes && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <FileText className="text-muted-foreground me-3 h-5 w-5" />
                                    {translate('Notes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[150px] overflow-y-auto">
                                    <div className="px-5 py-4">
                                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{returnOrder.notes}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
                {/* end left column */}

                {/* ── Right Sticky Sidebar ── */}
                <div className="w-full min-w-0 space-y-4 xl:sticky xl:top-6 xl:w-[320px] xl:self-start">
                    {/* Summary & Actions */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <FileText className="me-2 h-4 w-4 text-emerald-600" />
                                {translate('Summary & Actions')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="text-muted-foreground mb-1 text-xs">{translate('Total Amount')}</p>
                                    <p className="text-foreground font-mono text-2xl font-bold">{formatCurrency(returnOrder.total_amount)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">{getStatusBadge(returnOrder.status)}</div>
                            </div>
                            <div className="space-y-2">
                                {useHasPermission('edit-return-orders') && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.visit(route('return-orders.edit', returnOrder.id))}
                                    >
                                        <Edit className="me-2 h-4 w-4" />
                                        {translate('Edit Return Order')}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    {(returnOrder.contact || returnOrder.account) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <User className="me-2 h-4 w-4 text-emerald-600" />
                                    {translate('Customer Info')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {returnOrder.contact && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs text-[10px]">
                                            <User className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {translate('Contact')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={returnOrder.contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{returnOrder.contact.name}</p>
                                                    {returnOrder.contact.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{returnOrder.contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-contacts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route('contacts.show', returnOrder.contact.id)}
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
                                {returnOrder.contact && returnOrder.account && <div className="mx-0 border-t" />}
                                {returnOrder.account && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs text-[10px]">
                                            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {translate('Account')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={returnOrder.account.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{returnOrder.account.name}</p>
                                                    {returnOrder.account.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{returnOrder.account.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-accounts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route('accounts.show', returnOrder.account.id)}
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

                    {/* RO Details */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <FileText className="me-2 h-4 w-4 text-emerald-600" />
                                {translate('Order Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-5">
                            {returnOrder.tracking_number && (
                                <div className="flex items-start gap-3">
                                    <Hash className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                    <div>
                                        <p className="text-muted-foreground text-xs">{translate('Tracking Number')}</p>
                                        <p className="text-foreground font-mono text-sm font-medium">{returnOrder.tracking_number}</p>
                                    </div>
                                </div>
                            )}
                            {returnOrder.tracking_number && returnOrder.assigned_user && <div className="border-t" />}
                            {returnOrder.assigned_user && (
                                <div>
                                    <p className="text-muted-foreground mb-2 text-xs">{translate('Assigned To')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={returnOrder.assigned_user.avatar} alt={returnOrder.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(returnOrder.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{returnOrder.assigned_user.name}</p>
                                            {returnOrder.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{returnOrder.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {returnOrder.creator && (
                                <div>
                                    <p className="text-muted-foreground mb-2 text-xs">{translate('Created By')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={returnOrder.creator.avatar} alt={returnOrder.creator.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(returnOrder.creator.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{returnOrder.creator.name}</p>
                                            {returnOrder.creator.email && (
                                                <p className="text-muted-foreground truncate text-xs">{returnOrder.creator.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Related Records */}
                    {(returnOrder.sales_order || returnOrder.shipping_provider_type) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <Package className="me-2 h-4 w-4 text-gray-600" />
                                    {translate('Related Records')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-5">
                                {returnOrder.sales_order && useHasPermission('view-sales-orders') && (
                                    <div className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Sales Order')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{returnOrder.sales_order.name}</p>
                                        </div>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link
                                                        href={route('sales-orders.show', returnOrder.sales_order.id)}
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
                                    </div>
                                )}
                                {returnOrder.shipping_provider_type && useHasPermission('view-shipping-provider-types') && (
                                    <div className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Shipping Provider Type')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{returnOrder.shipping_provider_type.name}</p>
                                        </div>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link
                                                        href={route('shipping-provider-types.show', returnOrder.shipping_provider_type.id)}
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
                                    </div>
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
