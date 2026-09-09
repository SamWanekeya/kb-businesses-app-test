import { PageTemplate } from '@components/page-template';
import UserInitials from '@components/user-initials';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/avatar';
import { Button } from '@components/UserInterface/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/UserInterface/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/tooltip';
import { useInitials } from '@hooks/use-initials';
import { Link, router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { ArrowLeft, Building2, Calendar, ClipboardCheck, Edit, Eye, FileText, Package, ShoppingCart, User } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ShowReceiptOrder() {
    const { t: translate } = useTranslation();
    const { receiptOrder, auth } = usePage().props;
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
        { title: translate('Receipt Orders'), href: route('receipt-orders.index') },
        { title: translate('View Receipt Order') },
    ];

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400',
            received: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
            partial: 'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-900/30 dark:text-orange-400',
            completed: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400',
            cancelled: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400',
        };
        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status] || statusColors.pending}`}
            >
                {translate(status?.charAt(0).toUpperCase() + status?.slice(1))}
            </span>
        );
    };

    const formatDate = (d: string) => {
        if (!d) return translate('-');
        return window.appSettings?.formatDateTime(d, false) || new Date(d).toLocaleDateString();
    };

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const calculateTotals = () => {
        let subtotal = 0,
            totalTax = 0,
            totalDiscount = 0;
        receiptOrder.products?.forEach((p: any) => {
            const lineTotal = Number(p.pivot?.total_price || 0);
            const discount = Number(p.pivot?.discount_amount || 0);
            const afterDisc = lineTotal - discount;
            subtotal += afterDisc;
            totalDiscount += discount;
            if (p.tax) totalTax += (afterDisc * Number(p.tax.rate || 0)) / 100;
        });
        return { subtotal, totalTax, totalDiscount, grandTotal: subtotal + totalTax };
    };

    const { subtotal, totalTax, totalDiscount, grandTotal } = calculateTotals();

    return (
        <PageTemplate
            title={receiptOrder.name}
            description={translate('Receipt order details and related information')}
            breadcrumbs={breadcrumbs}
            noPadding
            actions={[
                {
                    label: translate('Back'),

                    labelClassName: 'hidden sm:inline',
                    icon: <ArrowLeft className="h-4 w-4 sm:me-2" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('receipt-orders.index')),
                },
            ]}
        >
            <div className="grid w-full max-w-full min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Left Column */}
                <div className="w-full max-w-full min-w-0 space-y-6">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {(
                            [
                                {
                                    label: translate('Receipt Number'),
                                    value: receiptOrder.receipt_number || '—',
                                    icon: FileText,
                                    iconCls: 'text-blue-600',
                                    blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                                },
                                {
                                    label: translate('Receipt Date'),
                                    value: formatDate(receiptOrder.receipt_date),
                                    icon: Calendar,
                                    iconCls: 'text-orange-600',
                                    blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                                },
                                {
                                    label: translate('Expected Date'),
                                    value: formatDate(receiptOrder.expected_date),
                                    icon: Calendar,
                                    iconCls: 'text-purple-600',
                                    blobCls: 'bg-purple-50 dark:bg-purple-900/30',
                                },
                            ] as const
                        ).map(({ label, value, icon: Icon, iconCls, blobCls }) => (
                            <Card key={label} className="relative overflow-hidden">
                                <div className={`absolute top-0 right-0 h-20 w-20 ${blobCls} rounded-bl-full`} />
                                <CardContent className="relative p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 pr-2">
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
                                <ShoppingCart className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Products')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {receiptOrder.products && receiptOrder.products.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[850px]">
                                            <TableHeader>
                                                <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                                                    <TableHead className="py-2.5 font-semibold whitespace-nowrap">{translate('Product')}</TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {translate('Quantity')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {translate('Unit Price')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {translate('Discount')}
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
                                                {receiptOrder.products.map((product: any, index: number) => {
                                                    const quantity = product.pivot?.quantity || 0;
                                                    const unitPrice = product.pivot?.unit_price || 0;
                                                    const discountAmt = Number(product.pivot?.discount_amount) || 0;
                                                    const lineTotal = Number(product.pivot?.total_price) || quantity * unitPrice;
                                                    const afterDisc = lineTotal - discountAmt;
                                                    const taxAmount = product.tax ? (afterDisc * Number(product.tax.rate)) / 100 : 0;
                                                    return (
                                                        <TableRow
                                                            key={index}
                                                            className="border-b hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700"
                                                        >
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
                                                                <p className="text-foreground text-sm font-semibold">{quantity}</p>
                                                            </TableCell>
                                                            <TableCell className="py-3 text-center">
                                                                <p className="text-foreground font-mono text-sm font-semibold">
                                                                    {formatCurrency(unitPrice)}
                                                                </p>
                                                            </TableCell>
                                                            <TableCell className="py-3 text-center">
                                                                {product.pivot?.discount_type &&
                                                                product.pivot.discount_type !== 'none' &&
                                                                discountAmt > 0 ? (
                                                                    <>
                                                                        <p className="text-foreground text-sm font-semibold">
                                                                            {product.pivot.discount_type === 'percentage' ? (
                                                                                `${Number(product.pivot.discount_value)}%`
                                                                            ) : (
                                                                                <span className="font-mono">
                                                                                    {formatCurrency(Number(product.pivot.discount_value))}
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                        <p className="mt-0.5 font-mono text-xs text-red-500">
                                                                            -{formatCurrency(discountAmt)}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-muted-foreground text-xs">—</span>
                                                                )}
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
                                                                {discountAmt > 0 ? (
                                                                    <>
                                                                        <p className="text-muted-foreground font-mono text-xs line-through">
                                                                            {formatCurrency(lineTotal)}
                                                                        </p>
                                                                        <p className="font-mono text-sm font-bold text-emerald-600">
                                                                            {formatCurrency(afterDisc + taxAmount)}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    <p className="font-mono text-sm font-bold text-emerald-600">
                                                                        {formatCurrency(lineTotal + taxAmount)}
                                                                    </p>
                                                                )}
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
                                                    {formatCurrency(receiptOrder.subtotal ?? subtotal)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Discount')}</span>
                                                <span className="font-mono text-sm font-semibold text-red-500">
                                                    -{formatCurrency(receiptOrder.discount_amount || totalDiscount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Total Tax')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">
                                                    {formatCurrency(receiptOrder.tax_amount ?? totalTax)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-foreground text-sm font-bold">{translate('Grand Total')}</span>
                                                <span className="font-mono text-lg font-bold text-emerald-600">
                                                    {formatCurrency(receiptOrder.total_amount ?? grandTotal)}
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
                                    <p className="text-muted-foreground text-sm font-medium">
                                        {translate('No products added to this receipt order')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Notes & Description */}
                    <div className="space-y-6">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                    {translate('Notes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[150px] overflow-y-auto">
                                    <div className="px-5 py-4">
                                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                                            {receiptOrder.notes || translate('-')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                    {translate('Description')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[150px] overflow-y-auto">
                                    <div className="px-5 py-4">
                                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                                            {receiptOrder.description || translate('-')}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
                {/* end left column */}

                {/* Right Sticky Sidebar */}
                <div className="w-full min-w-0 space-y-4 lg:sticky lg:top-6 lg:w-[320px] lg:self-start">
                    {/* Summary */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <ClipboardCheck className="mr-2 h-4 w-4 text-emerald-600" />
                                {translate('Summary')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="text-muted-foreground mb-1 text-xs">{translate('Total Amount')}</p>
                                    <p className="text-foreground font-mono text-2xl font-bold">{formatCurrency(receiptOrder.total_amount)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">{getStatusBadge(receiptOrder.status)}</div>
                            </div>
                            <div className="space-y-2">
                                {useHasPermission('edit-receipt-orders') && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.visit(route('receipt-orders.edit', receiptOrder.id))}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        {translate('Edit Receipt Order')}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    {(receiptOrder.contact || receiptOrder.account) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <User className="mr-2 h-4 w-4 text-emerald-600" />
                                    {translate('Customer Info')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {receiptOrder.contact && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                                            <User className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {translate('Contact')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={receiptOrder.contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{receiptOrder.contact.name}</p>
                                                    {receiptOrder.contact.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{receiptOrder.contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-contacts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route('contacts.show', receiptOrder.contact.id)}
                                                                className="ml-3 flex-shrink-0"
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
                                {receiptOrder.contact && receiptOrder.account && <div className="mx-0 border-t" />}
                                {receiptOrder.account && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                                            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {translate('Account')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={receiptOrder.account.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{receiptOrder.account.name}</p>
                                                    {receiptOrder.account.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{receiptOrder.account.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-accounts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route('accounts.show', receiptOrder.account.id)}
                                                                className="ml-3 flex-shrink-0"
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

                    {/* Assigned To */}
                    {(receiptOrder.assigned_user || receiptOrder.creator) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <User className="mr-2 h-4 w-4 text-emerald-600" />
                                    {translate('Assigned To')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {receiptOrder.assigned_user && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 text-xs">{translate('Assigned To')}</p>
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Avatar className="h-9 w-9 flex-shrink-0">
                                                <AvatarImage src={receiptOrder.assigned_user.avatar} alt={receiptOrder.assigned_user.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(receiptOrder.assigned_user.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-semibold">{receiptOrder.assigned_user.name}</p>
                                                {receiptOrder.assigned_user.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{receiptOrder.assigned_user.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {receiptOrder.assigned_user && receiptOrder.creator && <div className="mx-0 border-t" />}
                                {receiptOrder.creator && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 text-xs">{translate('Created By')}</p>
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Avatar className="h-9 w-9 flex-shrink-0">
                                                <AvatarImage src={receiptOrder.creator.avatar} alt={receiptOrder.creator.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(receiptOrder.creator.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-semibold">{receiptOrder.creator.name}</p>
                                                {receiptOrder.creator.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{receiptOrder.creator.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Related Records */}
                    {(receiptOrder.purchase_order || receiptOrder.return_order) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <Package className="mr-2 h-4 w-4 text-gray-600" />
                                    {translate('Related Records')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-5">
                                {receiptOrder.purchase_order && useHasPermission('view-purchase-orders') && (
                                    <Link
                                        href={route('purchase-orders.show', receiptOrder.purchase_order.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Purchase Order')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{receiptOrder.purchase_order.name}</p>
                                        </div>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Eye className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    <p>{translate('View')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </Link>
                                )}
                                {receiptOrder.return_order && useHasPermission('view-return-orders') && (
                                    <Link
                                        href={route('return-orders.show', receiptOrder.return_order.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Return Order')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{receiptOrder.return_order.name}</p>
                                        </div>
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Eye className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
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
