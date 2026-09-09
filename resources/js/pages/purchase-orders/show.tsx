import { CrudDeleteModal } from '@components/CrudDeleteModal';
import { PageTemplate } from '@components/page-template';
import UserInitials from '@components/user-initials';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/avatar';
import { Button } from '@components/UserInterface/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/UserInterface/table';
import { Textarea } from '@components/UserInterface/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/tooltip';
import { useInitials } from '@hooks/use-initials';
import { Link, router, usePage } from '@inertiajs/react';
import { formatRelativeTime } from '@utils/Helpers/StringFormatters';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import {
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle,
    Edit,
    Eye,
    FileEdit,
    FileText,
    MessageCircle,
    Package,
    Send,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PurchaseOrderShow() {
    const { t: translate } = useTranslation();
    const { purchaseOrder, streamItems, auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<any>(null);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');

    useEffect(() => {
        const main = document.querySelector('main[data-slot="sidebar-inset"]') as HTMLElement | null;
        if (main) main.style.overflowX = 'visible';
        return () => {
            if (main) main.style.overflowX = '';
        };
    }, []);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Purchase Orders'), href: route('purchase-orders.index') },
        { title: translate('View Purchase Order ') },
    ];

    const PO_STATUS_STEPS = ['draft', 'sent', 'confirmed', 'received', 'cancelled'];
    const currentStatusIndex = PO_STATUS_STEPS.indexOf(purchaseOrder.status);

    const poStatusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; ring: string }> = {
        draft: { label: translate('Draft'), icon: FileEdit, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800/40', ring: 'ring-gray-500/20' },
        sent: { label: translate('Sent'), icon: Send, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', ring: 'ring-blue-600/20' },
        confirmed: {
            label: translate('Confirmed'),
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
            ring: 'ring-green-600/20',
        },
        received: {
            label: translate('Received'),
            icon: Package,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            ring: 'ring-purple-600/20',
        },
        cancelled: {
            label: translate('Cancelled'),
            icon: XCircle,
            color: 'text-red-600',
            bg: 'bg-red-50 dark:bg-red-900/20',
            ring: 'ring-red-600/20',
        },
    };

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const formatDate = (dateString: string) => {
        if (!dateString) return translate('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    const calculateProductTotals = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        purchaseOrder.products?.forEach((product: any) => {
            const lineTotal = Number(product.pivot.total_price) || 0;
            const discountAmount = Number(product.pivot.discount_amount) || 0;
            const finalLineTotal = lineTotal - discountAmount;

            subtotal += finalLineTotal;
            totalDiscount += discountAmount;

            if (product.tax) {
                totalTax += (finalLineTotal * Number(product.tax.rate)) / 100;
            }
        });

        return { subtotal, totalTax, totalDiscount, grandTotal: subtotal + totalTax };
    };

    const { subtotal, totalTax, totalDiscount, grandTotal } = calculateProductTotals();

    const getStatusBadge = (status: string) => {
        const cfg = poStatusConfig[status] || poStatusConfig.draft;
        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cfg.bg} ${cfg.color} ${cfg.ring}`}
            >
                {cfg.label}
            </span>
        );
    };

    return (
        <PageTemplate
            title={purchaseOrder.order_number}
            description={translate('Purchase order details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="h-4 w-4 sm:me-2" />,
                    labelClassName: 'hidden sm:inline',
                    variant: 'outline',
                    onClick: () => router.visit(route('purchase-orders.index')),
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
                                    <CardTitle className="text-lg font-bold">{purchaseOrder.name}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-6 py-5">
                            {/* Order Progress */}
                            <p className="text-muted-foreground mb-3 text-xs font-semibold">{translate('Order Progress')}</p>
                            <div className="flex flex-wrap items-center gap-y-2">
                                {PO_STATUS_STEPS.map((step, i) => {
                                    const s = poStatusConfig[step];
                                    const StepIcon = s.icon;
                                    const isActive = step === purchaseOrder.status;
                                    const isDone = i < currentStatusIndex && purchaseOrder.status !== 'cancelled';
                                    const isLast = i === PO_STATUS_STEPS.length - 1;
                                    return (
                                        <React.Fragment key={step}>
                                            <div className="flex flex-shrink-0 flex-col items-center gap-1">
                                                <div
                                                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                                                        isActive
                                                            ? `${s.bg} border-current ${s.color}`
                                                            : isDone
                                                              ? 'bg-primary/10 border-primary text-primary'
                                                              : 'bg-muted border-border text-muted-foreground'
                                                    }`}
                                                >
                                                    <StepIcon className="h-4 w-4" />
                                                </div>
                                                <span
                                                    className={`text-[10px] font-medium whitespace-nowrap ${
                                                        isActive ? s.color : isDone ? 'text-primary' : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {s.label}
                                                </span>
                                            </div>
                                            {!isLast && (
                                                <div
                                                    className={`mx-1 mb-4 h-0.5 flex-1 ${
                                                        i < currentStatusIndex && purchaseOrder.status !== 'cancelled' ? 'bg-primary' : 'bg-border'
                                                    }`}
                                                />
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                            <div className="mt-5 grid grid-cols-1 gap-6 border-t pt-5 xl:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground mb-3 text-xs font-semibold">{translate('Billing Address')}</p>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('Address')}</p>
                                                <p className="text-foreground text-sm font-medium">
                                                    {purchaseOrder.billing_address || translate('-')}
                                                </p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('City')}</p>
                                                <p className="text-foreground text-sm font-medium">{purchaseOrder.billing_city || translate('-')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('State')}</p>
                                                <p className="text-foreground text-sm font-medium">{purchaseOrder.billing_state || translate('-')}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('Postal Code')}</p>
                                                <p className="text-foreground text-sm font-medium">
                                                    {purchaseOrder.billing_postal_code || translate('-')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Country')}</p>
                                            <p className="text-foreground text-sm font-medium">{purchaseOrder.billing_country || translate('-')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t pt-6 xl:border-s xl:border-t-0 xl:ps-6 xl:pt-0">
                                    <p className="text-muted-foreground mb-3 text-xs font-semibold">{translate('Shipping Address')}</p>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('Address')}</p>
                                                <p className="text-foreground text-sm font-medium">
                                                    {purchaseOrder.shipping_address || translate('-')}
                                                </p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('City')}</p>
                                                <p className="text-foreground text-sm font-medium">{purchaseOrder.shipping_city || translate('-')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('State')}</p>
                                                <p className="text-foreground text-sm font-medium">
                                                    {purchaseOrder.shipping_state || translate('-')}
                                                </p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('Postal Code')}</p>
                                                <p className="text-foreground text-sm font-medium">
                                                    {purchaseOrder.shipping_postal_code || translate('-')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Country')}</p>
                                            <p className="text-foreground text-sm font-medium">{purchaseOrder.shipping_country || translate('-')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Products ── */}
                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Package className="text-muted-foreground me-3 h-5 w-5" />
                                {translate('Products')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {purchaseOrder.products && purchaseOrder.products.length > 0 ? (
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
                                                        {translate('Discount')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {translate('Tax')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-end font-semibold whitespace-nowrap">
                                                        {translate('Total')}
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {purchaseOrder.products.map((product: any, index: number) => {
                                                    const quantity = product.pivot?.quantity || 0;
                                                    const unitPrice = product.pivot?.unit_price || 0;
                                                    const discountAmt = Number(product.pivot?.discount_amount) || 0;
                                                    const lineTotal = Number(product.pivot?.total_price) || quantity * unitPrice;
                                                    const afterDisc = lineTotal - discountAmt;
                                                    const taxAmount = product.tax ? (afterDisc * Number(product.tax.rate)) / 100 : 0;
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
                                                            <TableCell className="py-3 text-end">
                                                                <p className="font-mono text-sm font-bold text-emerald-600">
                                                                    {formatCurrency(afterDisc + taxAmount)}
                                                                </p>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    {/* Totals Panel */}
                                    <div className="bg-muted/10 flex flex-col items-start gap-4 border-t px-4 py-5 sm:items-end sm:px-6">
                                        <div className="w-full overflow-hidden rounded-xl border sm:max-w-sm">
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Subtotal')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">
                                                    {formatCurrency(purchaseOrder.subtotal ?? subtotal)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Discount')}</span>
                                                <span className="font-mono text-sm font-semibold text-red-500">
                                                    -{formatCurrency(purchaseOrder.discount_amount || totalDiscount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Total Tax')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">
                                                    {formatCurrency(purchaseOrder.tax_amount ?? totalTax)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-foreground text-sm font-bold">{translate('Grand Total')}</span>
                                                <span className="font-mono text-lg font-bold text-emerald-600">
                                                    {formatCurrency(purchaseOrder.total_amount ?? grandTotal)}
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
                                        {translate('No products added to this purchase order')}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* ── Description ── */}
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
                                        {purchaseOrder.description || translate('-')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ── Activity Stream ── */}
                    {useHasPermission('view-stream') && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <MessageCircle className="text-muted-foreground me-3 h-5 w-5" />
                                    {translate('Activity Stream')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {useHasPermission('create-purchase-orders') && (
                                    <div className="border-b px-5 pt-4 pb-4">
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (newComment.trim()) {
                                                    router.post(
                                                        route('purchase-orders.comments.store', purchaseOrder.id),
                                                        { comment: newComment },
                                                        { preserveScroll: true, onSuccess: () => setNewCommentranslate('') },
                                                    );
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="mt-1 h-9 w-9 flex-shrink-0 cursor-default">
                                                                <AvatarImage src={auth?.user?.avatar} alt={auth?.user?.name || 'User'} />
                                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                                    {getInitials(auth?.user?.name || 'U')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{auth?.user?.name || translate('Me')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <div className="flex-1 overflow-hidden rounded-xl border shadow-sm">
                                                    <Textarea
                                                        placeholder={translate('Write a comment...')}
                                                        value={newComment}
                                                        onChange={(e) => setNewComment(e.target.value)}
                                                        className="resize-none border-0 bg-transparent focus-visible:ring-0"
                                                        rows={2}
                                                    />
                                                    <div className="bg-muted/30 flex items-center justify-end border-t px-3 py-2">
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        type="submit"
                                                                        size="sm"
                                                                        disabled={!newComment.trim()}
                                                                        className="h-7 px-3"
                                                                    >
                                                                        <Send className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <p>{translate('Send')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}
                                <div className="max-h-[520px] overflow-y-auto border-t">
                                    {streamItems && streamItems.length > 0 ? (
                                        <div className="px-5 py-5">
                                            {streamItems.map((activity: any, index: number) => {
                                                const getActivityBadgeColor = (type: string): string => {
                                                    switch (type) {
                                                        case 'created':
                                                            return 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400';
                                                        case 'updated':
                                                            return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400';
                                                        case 'deleted':
                                                            return 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400';
                                                        case 'assigned':
                                                            return 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400';
                                                        case 'comment':
                                                            return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-900/30 dark:text-indigo-400';
                                                        default:
                                                            return 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800/40 dark:text-gray-400';
                                                    }
                                                };
                                                const badgeCls = getActivityBadgeColor(activity.activity_type);
                                                const isEditing = editingComment === activity.id;
                                                return (
                                                    <div key={activity.id || index} className="relative flex gap-3 pb-4">
                                                        <div className="flex w-9 flex-shrink-0 flex-col items-center">
                                                            <TooltipProvider delayDuration={200}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Avatar className="relative z-10 h-9 w-9 flex-shrink-0 cursor-default">
                                                                            <AvatarImage
                                                                                src={activity.user?.avatar}
                                                                                alt={activity.user?.name || 'U'}
                                                                            />
                                                                            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                                                                                {getInitials(activity.user?.name || 'U')}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">
                                                                        <p>{activity.user?.name || translate('System')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                            {index < streamItems.length - 1 && (
                                                                <div className="absolute top-9 bottom-0 left-[18px] w-px bg-gray-300 dark:bg-gray-600" />
                                                            )}
                                                        </div>
                                                        <div
                                                            className={`bg-card min-w-0 flex-1 overflow-hidden rounded-xl border shadow-sm ${isEditing ? 'border-emerald-400 ring-1 ring-emerald-300' : ''}`}
                                                        >
                                                            <div
                                                                className={`flex items-center justify-between gap-2 px-4 py-2.5 ${isEditing ? 'bg-emerald-50/60' : 'bg-muted/30'} border-b`}
                                                            >
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-foreground text-sm font-semibold">
                                                                        {activity.user?.name || translate('System')}
                                                                    </span>
                                                                    <span
                                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeCls}`}
                                                                    >
                                                                        {activity.activity_type.charAt(0).toUpperCase() +
                                                                            activity.activity_type.slice(1)}
                                                                    </span>
                                                                    <span className="text-muted-foreground text-xs">
                                                                        {formatRelativeTime(activity.created_at)}
                                                                    </span>
                                                                </div>
                                                                {!isEditing && (
                                                                    <div className="flex flex-shrink-0 items-center gap-1">
                                                                        {activity.activity_type === 'comment' &&
                                                                            activity.user_id === auth?.user?.id &&
                                                                            useHasPermission('edit-purchase-orders') && (
                                                                                <TooltipProvider delayDuration={200}>
                                                                                    <Tooltip>
                                                                                        <TooltipTrigger asChild>
                                                                                            <Button
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                className="text-muted-foreground h-6 w-6 p-0"
                                                                                                onClick={() => {
                                                                                                    setEditingComment(activity.id);
                                                                                                    setEditCommentText(activity.description);
                                                                                                }}
                                                                                            >
                                                                                                <Edit className="h-3 w-3" />
                                                                                            </Button>
                                                                                        </TooltipTrigger>
                                                                                        <TooltipContent side="top">
                                                                                            <p>{translate('Edit')}</p>
                                                                                        </TooltipContent>
                                                                                    </Tooltip>
                                                                                </TooltipProvider>
                                                                            )}
                                                                        {useHasPermission('delete-stream') && (
                                                                            <TooltipProvider delayDuration={200}>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="text-muted-foreground h-6 w-6 p-0"
                                                                                            onClick={() => {
                                                                                                setCurrentActivity(activity);
                                                                                                setIsDeleteModalOpen(true);
                                                                                            }}
                                                                                        >
                                                                                            <Trash2 className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent side="top">
                                                                                        <p>{translate('Delete')}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="px-4 py-3">
                                                                {activity.activity_type === 'comment' ? (
                                                                    isEditing ? (
                                                                        <div className="space-y-3">
                                                                            <Textarea
                                                                                value={editCommentText}
                                                                                onChange={(e) => setEditCommentText(e.target.value)}
                                                                                className="w-full resize-none border-emerald-300 focus-visible:ring-emerald-400"
                                                                                rows={3}
                                                                                autoFocus
                                                                            />
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => setEditingComment(null)}
                                                                                >
                                                                                    {translate('Cancel')}
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                                                                                    onClick={() => {
                                                                                        router.put(
                                                                                            route('purchase-orders.comments.update-activity', {
                                                                                                purchaseOrder: purchaseOrder.id,
                                                                                                activity: activity.id,
                                                                                            }),
                                                                                            { comment: editCommentText },
                                                                                            { preserveScroll: true },
                                                                                        );
                                                                                        setEditingComment(null);
                                                                                    }}
                                                                                >
                                                                                    {translate('Save')}
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-foreground text-sm break-words">{activity.description}</p>
                                                                    )
                                                                ) : activity.description?.includes('into') ? (
                                                                    <p
                                                                        className="text-muted-foreground text-sm break-words"
                                                                        dangerouslySetInnerHTML={{ __html: activity.description }}
                                                                    />
                                                                ) : activity.title ? (
                                                                    <p className="text-muted-foreground text-sm break-words">{activity.title}</p>
                                                                ) : (
                                                                    <p className="text-muted-foreground text-sm break-words">
                                                                        {activity.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-muted-foreground py-12 text-center">
                                            <MessageCircle className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
                                            <p className="text-sm">{translate('No activities found')}</p>
                                        </div>
                                    )}
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
                                    <p className="text-foreground font-mono text-2xl font-bold">{formatCurrency(purchaseOrder.total_amount)}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {useHasPermission('edit-purchase-orders') && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => router.visit(route('purchase-orders.edit', purchaseOrder.id))}
                                    >
                                        <Edit className="me-2 h-4 w-4" />
                                        {translate('Edit Purchase Order')}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vendor / Account Info */}
                    {purchaseOrder.account && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <User className="me-2 h-4 w-4 text-emerald-600" />
                                    {translate('Customer Info')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="px-4 pt-3 pb-3">
                                    <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs text-[10px]">
                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        {translate('Account')}
                                    </p>
                                    <div className="flex min-w-0 items-center justify-between">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <UserInitials name={purchaseOrder.account.name} />
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-semibold">{purchaseOrder.account.name}</p>
                                                {purchaseOrder.account.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{purchaseOrder.account.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        {useHasPermission('view-accounts') && (
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link href={route('accounts.show', purchaseOrder.account.id)} className="ms-3 flex-shrink-0">
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
                                {(purchaseOrder.billing_contact || purchaseOrder.shipping_contact) && (
                                    <>
                                        <div className="mx-0 border-t" />
                                        <div className="space-y-3 px-4 pt-3 pb-3">
                                            {purchaseOrder.billing_contact && (
                                                <div>
                                                    <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs text-[10px]">
                                                        <User className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                                        {translate('Billing Contact')}
                                                    </p>
                                                    <div className="flex min-w-0 items-center justify-between">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <UserInitials name={purchaseOrder.billing_contact.name} />
                                                            <div className="min-w-0">
                                                                <p className="text-foreground truncate text-sm font-semibold">
                                                                    {purchaseOrder.billing_contact.name}
                                                                </p>
                                                                {purchaseOrder.billing_contact.email && (
                                                                    <p className="text-muted-foreground truncate text-xs">
                                                                        {purchaseOrder.billing_contact.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {useHasPermission('view-contacts') && (
                                                            <TooltipProvider delayDuration={200}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link
                                                                            href={route('contacts.show', purchaseOrder.billing_contact.id)}
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
                                            {purchaseOrder.shipping_contact && (
                                                <div>
                                                    <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs text-[10px]">
                                                        <User className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                                        {translate('Shipping Contact')}
                                                    </p>
                                                    <div className="flex min-w-0 items-center justify-between">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <UserInitials name={purchaseOrder.shipping_contact.name} />
                                                            <div className="min-w-0">
                                                                <p className="text-foreground truncate text-sm font-semibold">
                                                                    {purchaseOrder.shipping_contact.name}
                                                                </p>
                                                                {purchaseOrder.shipping_contact.email && (
                                                                    <p className="text-muted-foreground truncate text-xs">
                                                                        {purchaseOrder.shipping_contact.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {useHasPermission('view-contacts') && (
                                                            <TooltipProvider delayDuration={200}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link
                                                                            href={route('contacts.show', purchaseOrder.shipping_contact.id)}
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
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* PO Details */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <FileText className="me-2 h-4 w-4 text-emerald-600" />
                                {translate('Order Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-5">
                            <div className="flex items-start gap-3">
                                <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Order Number')}</p>
                                    <p className="text-foreground text-sm font-medium">{purchaseOrder.order_number}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Order Date')}</p>
                                    <p className="text-foreground text-sm font-medium">{formatDate(purchaseOrder.order_date)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Expected Delivery')}</p>
                                    <p className="text-foreground text-sm font-medium">
                                        {purchaseOrder.expected_delivery_date ? formatDate(purchaseOrder.expected_delivery_date) : translate('-')}
                                    </p>
                                </div>
                            </div>
                            {purchaseOrder.assigned_user && (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground mb-2 text-xs">{translate('Assigned To')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={purchaseOrder.assigned_user.avatar} alt={purchaseOrder.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(purchaseOrder.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{purchaseOrder.assigned_user.name}</p>
                                            {purchaseOrder.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{purchaseOrder.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {purchaseOrder.creator && (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground mb-2 text-xs">{translate('Created By')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={purchaseOrder.creator.avatar} alt={purchaseOrder.creator.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(purchaseOrder.creator.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{purchaseOrder.creator.name}</p>
                                            {purchaseOrder.creator.email && (
                                                <p className="text-muted-foreground truncate text-xs">{purchaseOrder.creator.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Related Records */}
                    {(purchaseOrder.sales_order || purchaseOrder.shipping_provider_type) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <Package className="me-2 h-4 w-4 text-gray-600" />
                                    {translate('Related Records')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-5">
                                {purchaseOrder.sales_order && useHasPermission('view-sales-orders') && (
                                    <Link
                                        href={route('sales-orders.show', purchaseOrder.sales_order.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Sales Order')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{purchaseOrder.sales_order.name}</p>
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
                                {purchaseOrder.shipping_provider_type && useHasPermission('view-shipping-provider-types') && (
                                    <Link
                                        href={route('shipping-provider-types.show', purchaseOrder.shipping_provider_type.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Shipping Provider')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">
                                                {purchaseOrder.shipping_provider_type.name}
                                            </p>
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

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('purchase-orders.delete-activity', { purchaseOrder: purchaseOrder.id, activity: currentActivity.id }), {
                        preserveScroll: true,
                    });
                    setIsDeleteModalOpen(false);
                }}
                itemName={translate('this activity')}
                entityName={translate('activity')}
            />

            <CrudDeleteModal
                isOpen={isDeleteAllModalOpen}
                onClose={() => setIsDeleteAllModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('purchase-orders.delete-activities', purchaseOrder.id), { preserveScroll: true });
                    setIsDeleteAllModalOpen(false);
                }}
                itemName={translate('all activities for {{name}}', { name: purchaseOrder.name })}
                entityName={translate('activities')}
            />
        </PageTemplate>
    );
}
