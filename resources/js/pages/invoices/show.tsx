import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { formatRelativeTime, getDisplayUrl } from '@/utils/helper';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Bell,
    Building2,
    Calendar,
    Check,
    DollarSign,
    Edit,
    Eye,
    FileText,
    MessageCircle,
    Package,
    Plus,
    Send,
    ShoppingCart,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function InvoiceShow() {
    const { t } = useTranslation();
    const { invoice, streamItems, pendingPayments, invoiceReminders, availableSalesOrders, auth, flash } = usePage().props;
    const isOrganization = auth?.user?.type === 'organization';
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();
    const [isAssignSalesOrderModalOpen, setIsAssignSalesOrderModalOpen] = useState(false);
    const [selectedSalesOrderId, setSelectedSalesOrderId] = useState('empty');
    const [showStream, setShowStream] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<any>(null);
    const [isRejectPaymentModalOpen, setIsRejectPaymentModalOpen] = useState(false);
    const [currentPayment, setCurrentPayment] = useState<any>(null);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');

    const [reminderHistory, setReminderHistory] = useState<any[]>([]);
    useEffect(() => {
        fetch(route('invoices.reminder-history', invoice.id))
            .then((r) => r.json())
            .then((data) => setReminderHistory(data.reminders || []))
            .catch(() => {});
    }, [invoice.id]);
    useEffect(() => {
        const main = document.querySelector('main[data-slot="sidebar-inset"]') as HTMLElement | null;
        if (main) main.style.overflowX = 'visible';
        return () => {
            if (main) main.style.overflowX = '';
        };
    }, []);

    // Calculate paid amount from completed payments
    const paidAmount =
        invoice.payments?.reduce((total: number, payment: any) => {
            const amount = parseFloat(payment.amount) || 0;
            return payment.status === 'completed' ? total + amount : total;
        }, 0) || 0;

    // Calculate due amount
    const dueAmount = Math.max(0, (parseFloat(invoice.total_amount) || 0) - paidAmount);

    const handleRejectPaymentConfirm = (reason: string) => {
        router.post(
            route('invoice.payments.reject', currentPayment.payment_id),
            { reason },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsRejectPaymentModalOpen(false);
                    setCurrentPayment(null);
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    } else {
                        toast.success(t('Payment rejected successfully'));
                    }
                },
                onError: (errors) => {
                    toast.error(typeof errors === 'string' ? errors : t('Failed to reject payment'));
                },
            },
        );
    };

    const handleAssignSalesOrder = (formData?: any) => {
        const salesOrderId = formData?.sales_order_id || selectedSalesOrderId;
        if (!salesOrderId || salesOrderId === 'empty') {
            toast.error(t('Please select a sales order'));
            return;
        }

        toast.loading(t('Assigning sales order...'));

        router.put(
            route('invoices.add-sales-order', invoice.id),
            {
                sales_order_id: salesOrderId,
            },
            {
                onSuccess: (page) => {
                    setIsAssignSalesOrderModalOpen(false);
                    setSelectedSalesOrderId('empty');
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to assign sales order: ${Object.values(errors).join(', ')}`);
                    }
                },
            },
        );
    };

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Invoices'), href: route('invoices.index') },
        { title: t('View Invoice') },
    ];

    const getStatusBadge = (status: string) => {
        const statusColors = {
            draft: 'bg-gray-50 text-gray-600 ring-gray-500/10',
            sent: 'bg-blue-50 text-blue-700 ring-blue-700/10',
            paid: 'bg-green-50 text-green-700 ring-green-600/20',
            partially_paid: 'bg-orange-50 text-orange-800 ring-orange-600/20',
            overdue: 'bg-red-50 text-red-700 ring-red-600/10',
            cancelled: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
        };

        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status as keyof typeof statusColors] || statusColors.draft}`}
            >
                {status === 'partially_paid' ? t('Partially Paid') : status?.charAt(0).toUpperCase() + status?.slice(1) || t('Draft')}
            </span>
        );
    };

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const formatDate = (dateString: string) => {
        if (!dateString) return t('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    const handleSendReminder = () => {
        toast.loading(t('Sending payment reminder...'));
        router.post(
            route('invoices.send-reminder', invoice.id),
            { type: 'email' },
            {
                preserveScroll: true,
                preserveState: false,
                onSuccess: (page: any) => {
                    toast.dismiss();
                    if (page.props.flash?.success) toast.success(t(page.props.flash.success));
                    else if (page.props.flash?.error) toast.error(t(page.props.flash.error));
                    fetch(route('invoices.reminder-history', invoice.id))
                        .then((r) => r.json())
                        .then((data) => setReminderHistory(data.reminders || []))
                        .catch(() => {});
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to send reminder: ${Object.values(errors).join(', ')}`);
                    }
                },
            },
        );
    };

    const calculateProductTotals = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        invoice.products?.forEach((product: any) => {
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

    return (
        <PageTemplate
            title={invoice.invoice_number}
            description={t('Invoice details and related information')}
            breadcrumbs={breadcrumbs}
            noPadding
            actions={[
                {
                    label: t('Back'),

                    labelClassName: 'hidden sm:inline',
                    icon: <ArrowLeft className="h-4 w-4 sm:mr-2" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('invoices.index')),
                },
                ...(!invoice.sales_order
                    ? [
                          {
                              label: t('Assign Sales Order'),
                              icon: <Plus className="mr-2 h-4 w-4" />,
                              variant: 'default',
                              onClick: () => setIsAssignSalesOrderModalOpen(true),
                          },
                      ]
                    : []),
            ]}
        >
            <div className="grid w-full max-w-full min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Left Column */}
                <div className="w-full max-w-full min-w-0 space-y-6">
                    {/* Hero Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold">{invoice.name}</CardTitle>
                                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                                        {invoice.description || t('No description provided')}
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                            <p className="text-muted-foreground mb-3 text-xs font-semibold">{t('Billing Address')}</p>
                            <div className="grid grid-cols-1 gap-x-2 gap-y-2 xl:grid-cols-2">
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{t('Address')}</p>
                                    <p className="text-foreground text-sm font-medium">{invoice.billing_address || t('-')}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{t('City')}</p>
                                    <p className="text-foreground text-sm font-medium">{invoice.billing_city || t('-')}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{t('State')}</p>
                                    <p className="text-foreground text-sm font-medium">{invoice.billing_state || t('-')}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{t('Postal Code')}</p>
                                    <p className="text-foreground text-sm font-medium">{invoice.billing_postal_code || t('-')}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{t('Country')}</p>
                                    <p className="text-foreground text-sm font-medium">{invoice.billing_country || t('-')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Products */}
                    <Card className="overflow-hidden shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <ShoppingCart className="text-muted-foreground mr-3 h-5 w-5" />
                                {t('Products')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {invoice.products && invoice.products.length > 0 ? (
                                <>
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-[850px]">
                                            <TableHeader>
                                                <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                                                    <TableHead className="py-2.5 font-semibold whitespace-nowrap">{t('Product')}</TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {t('Quantity')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {t('Unit Price')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">
                                                        {t('Discount')}
                                                    </TableHead>
                                                    <TableHead className="py-2.5 text-center font-semibold whitespace-nowrap">{t('Tax')}</TableHead>
                                                    <TableHead className="py-2.5 text-right font-semibold whitespace-nowrap">{t('Total')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoice.products.map((product: any, index: number) => {
                                                    const lineTotal = Number(product.pivot.total_price) || 0;
                                                    const discountAmount = Number(product.pivot.discount_amount) || 0;
                                                    const finalTotal = lineTotal - discountAmount;
                                                    const taxAmount = product.tax ? (finalTotal * Number(product.tax.rate)) / 100 : 0;
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
                                                                <p className="text-foreground text-sm font-semibold">{product.pivot.quantity}</p>
                                                            </TableCell>
                                                            <TableCell className="py-3 text-center">
                                                                <p className="text-foreground font-mono text-sm font-semibold">
                                                                    {formatCurrency(product.pivot.unit_price)}
                                                                </p>
                                                            </TableCell>
                                                            <TableCell className="py-3 text-center">
                                                                {product.pivot.discount_type &&
                                                                product.pivot.discount_type !== 'none' &&
                                                                product.pivot.discount_value > 0 ? (
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
                                                                            -{formatCurrency(discountAmount)}
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
                                                                {discountAmount > 0 ? (
                                                                    <>
                                                                        <p className="text-muted-foreground font-mono text-xs line-through">
                                                                            {formatCurrency(lineTotal)}
                                                                        </p>
                                                                        <p className="font-mono text-sm font-bold text-emerald-600">
                                                                            {formatCurrency(finalTotal + taxAmount)}
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
                                        <div className="w-full overflow-hidden rounded-xl border sm:max-w-sm">
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{t('Subtotal')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">
                                                    {formatCurrency(subtotal + totalDiscount)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{t('Discount')}</span>
                                                <span className="font-mono text-sm font-semibold text-red-500">-{formatCurrency(totalDiscount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{t('Total Tax')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">{formatCurrency(totalTax)}</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-foreground text-sm font-bold">{t('Grand Total')}</span>
                                                <span className="font-mono text-lg font-bold text-emerald-600">{formatCurrency(grandTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                                        <Package className="text-muted-foreground/40 h-8 w-8" />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-medium">{t('No products added to this invoice')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {/* Notes + Terms */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                    {t('Notes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[150px] overflow-y-auto">
                                    <div className="px-5 py-4">
                                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{invoice.notes || t('-')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                    {t('Terms')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[150px] overflow-y-auto">
                                    <div className="px-5 py-4">
                                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{invoice.terms || t('-')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Payments */}
                    {pendingPayments && pendingPayments.length > 0 && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <DollarSign className="mr-3 h-5 w-5 text-gray-500" />
                                    {t('Pending Payments')} ({pendingPayments.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                                            <TableHead className="py-2.5 font-semibold">{t('Date')}</TableHead>
                                            <TableHead className="py-2.5 font-semibold">{t('Method')}</TableHead>
                                            <TableHead className="py-2.5 font-semibold">{t('Type')}</TableHead>
                                            <TableHead className="py-2.5 text-right font-semibold">{t('Amount')}</TableHead>
                                            <TableHead className="py-2.5 font-semibold">{t('Payment ID')}</TableHead>
                                            <TableHead className="py-2.5 text-center font-semibold">{t('Actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingPayments.map((payment: any, index: number) => (
                                            <TableRow key={index} className="border-b hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700">
                                                <TableCell className="py-3">{formatDate(payment.created_at)}</TableCell>
                                                <TableCell className="py-3 capitalize">{payment.payment_method}</TableCell>
                                                <TableCell className="py-3 capitalize">{payment.payment_type}</TableCell>
                                                <TableCell className="py-3 text-right font-mono font-semibold">
                                                    {formatCurrency(payment.amount)}
                                                </TableCell>
                                                <TableCell className="py-3 font-mono text-sm">{payment.payment_id}</TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex justify-center gap-1">
                                                        {payment.receipt_path && (
                                                            <TooltipProvider delayDuration={200}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 w-7 p-0"
                                                                            onClick={() => window.open(getDisplayUrl(payment.receipt_path), '_blank')}
                                                                        >
                                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">
                                                                        <p>{t('View Receipt')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 p-0 text-green-600"
                                                                        onClick={() => {
                                                                            router.post(
                                                                                route('invoice.payments.approve', payment.payment_id),
                                                                                {},
                                                                                {
                                                                                    preserveScroll: true,
                                                                                    onSuccess: (page) => {
                                                                                        if (page.props.flash.success)
                                                                                            toast.success(t(page.props.flash.success));
                                                                                        if (page.props.flash.error)
                                                                                            toast.error(t(page.props.flash.error));
                                                                                    },
                                                                                    onError: () => toast.error(t('Failed to approve payment')),
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Check className="h-4 w-4 text-gray-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <p>{t('Approve')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 p-0 text-red-600"
                                                                        onClick={() => {
                                                                            setCurrentPayment(payment);
                                                                            setIsRejectPaymentModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <X className="h-4 w-4 text-gray-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <p>{t('Reject')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {/* Reminder History */}
                    {reminderHistory.length > 0 && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <Bell className="text-muted-foreground mr-3 h-5 w-5" />
                                    {t('Reminder History')} ({reminderHistory.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[287px] overflow-y-auto">
                                    <table className="text-foreground w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                                                <th className="text-muted-foreground sticky top-0 z-10 bg-[#F0F0F1] px-4 py-2.5 text-left font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Sent By')}
                                                </th>
                                                <th className="text-muted-foreground sticky top-0 z-10 bg-[#F0F0F1] px-4 py-2.5 text-left font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Type')}
                                                </th>
                                                <th className="text-muted-foreground sticky top-0 z-10 bg-[#F0F0F1] px-4 py-2.5 text-left font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Date')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {reminderHistory.map((reminder: any, i: number) => (
                                                <tr
                                                    key={i}
                                                    className="hover:bg-muted/50 border-b transition-colors dark:border-gray-700 dark:bg-gray-900"
                                                >
                                                    <td className="text-foreground px-4 py-3 align-middle text-sm font-medium">
                                                        {reminder.sent_by?.name || t('-')}
                                                    </td>
                                                    <td className="px-4 py-3 align-middle capitalize">
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset dark:bg-blue-900/20 dark:text-blue-400">
                                                            {reminder.type || 'email'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 align-middle">
                                                        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                            {window.appSettings?.formatDateTime(reminder.created_at, true) ||
                                                                new Date(reminder.created_at).toLocaleString()}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment History */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <DollarSign className="text-muted-foreground mr-3 h-5 w-5" />
                                    {t('Payment History')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[385px] overflow-y-auto">
                                    <table className="text-foreground w-full caption-bottom text-sm">
                                        <thead>
                                            <tr className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                                                <th className="text-muted-foreground sticky top-0 z-10 w-[170px] bg-[#F0F0F1] px-4 py-2.5 text-left font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Date')}
                                                </th>
                                                <th className="text-muted-foreground sticky top-0 z-10 w-[130px] bg-[#F0F0F1] px-4 py-2.5 text-left font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Method')}
                                                </th>
                                                <th className="text-muted-foreground sticky top-0 z-10 w-[110px] bg-[#F0F0F1] px-4 py-2.5 text-left font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Type')}
                                                </th>
                                                <th className="text-muted-foreground sticky top-0 z-10 w-[140px] bg-[#F0F0F1] px-4 py-2.5 pr-6 text-right font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Amount')}
                                                </th>
                                                <th className="text-muted-foreground sticky top-0 z-10 w-[130px] bg-[#F0F0F1] px-4 py-2.5 pl-6 text-left font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Status')}
                                                </th>
                                                <th className="text-muted-foreground sticky top-0 z-10 w-[200px] bg-[#F0F0F1] px-4 py-2.5 text-left font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Payment ID')}
                                                </th>
                                                <th className="text-muted-foreground sticky top-0 z-10 w-[80px] bg-[#F0F0F1] px-4 py-2.5 text-center font-semibold dark:bg-gray-800 dark:text-gray-300">
                                                    {t('Receipt')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            {invoice.payments.map((payment: any, index: number) => (
                                                <tr
                                                    key={index}
                                                    className="border-b transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-700"
                                                >
                                                    <td className="px-4 py-3 align-middle">
                                                        <span className="flex items-center gap-2 whitespace-nowrap text-gray-500">
                                                            <Calendar className="h-4 w-4 shrink-0" />
                                                            <span className="text-sm">
                                                                {window.appSettings?.formatDateTime(
                                                                    payment.processed_at || payment.created_at,
                                                                    false,
                                                                ) || new Date(payment.processed_at || payment.created_at).toLocaleDateString()}
                                                            </span>
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 align-middle capitalize">{payment.payment_method}</td>
                                                    <td className="px-4 py-3 align-middle">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                                payment.payment_type === 'full'
                                                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                                    : payment.payment_type === 'partial'
                                                                      ? 'bg-orange-50 text-orange-700 ring-orange-600/20'
                                                                      : payment.payment_type === 'deposit'
                                                                        ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                                                                        : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                                                            }`}
                                                        >
                                                            {payment.payment_type?.charAt(0).toUpperCase() + payment.payment_type?.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 pr-6 text-right align-middle font-mono whitespace-nowrap">
                                                        {formatCurrency(payment.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 pl-6 align-middle">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                                payment.status === 'completed'
                                                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                                    : payment.status === 'pending'
                                                                      ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                                      : 'bg-red-50 text-red-700 ring-red-600/10'
                                                            }`}
                                                        >
                                                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 align-middle font-mono text-sm">{payment.payment_id || t('-')}</td>
                                                    <td className="px-4 py-3 text-center align-middle">
                                                        {payment.receipt_path ? (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="text-blue-500"
                                                                            onClick={() => {
                                                                                window.open(getDisplayUrl(payment.receipt_path), '_blank');
                                                                            }}
                                                                        >
                                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{t('View Receipt')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <span className="px-4 py-2">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Activity Stream - moved inside left column so sidebar can stick */}
                    {useHasPermission('view-stream') && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <MessageCircle className="text-muted-foreground mr-3 h-5 w-5" />
                                    {t('Activity Stream')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {useHasPermission('create-invoices') && (
                                    <div className="border-b px-5 pt-4 pb-4">
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (newComment.trim()) {
                                                    router.post(
                                                        route('invoices.comments.store', invoice.id),
                                                        { comment: newComment },
                                                        { preserveScroll: true, onSuccess: () => setNewComment('') },
                                                    );
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="mt-1 h-8 w-8 flex-shrink-0">
                                                                <AvatarImage src={auth?.user?.avatar} alt={auth?.user?.name || 'User'} />
                                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                                    {getInitials(auth?.user?.name || 'U')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{auth?.user?.name || t('User')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                                <div className="flex-1 overflow-hidden rounded-xl border shadow-sm">
                                                    <Textarea
                                                        placeholder={t('Write a comment...')}
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
                                                                    <p>{t('Send')}</p>
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
                                                            return 'bg-green-50 text-green-700 ring-green-600/20';
                                                        case 'updated':
                                                            return 'bg-blue-50 text-blue-700 ring-blue-600/20';
                                                        case 'deleted':
                                                            return 'bg-red-50 text-red-700 ring-red-600/20';
                                                        case 'assigned':
                                                            return 'bg-purple-50 text-purple-700 ring-purple-600/20';
                                                        case 'comment':
                                                            return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
                                                        default:
                                                            return 'bg-gray-50 text-gray-700 ring-gray-600/20';
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
                                                                        <Avatar className="relative z-10 h-9 w-9 flex-shrink-0">
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
                                                                        <p>{activity.user?.name || t('System')}</p>
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
                                                                        {activity.user?.name || t('System')}
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
                                                                            useHasPermission('edit-invoices') && (
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
                                                                                            <p>{t('Edit')}</p>
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
                                                                                        <p>{t('Delete')}</p>
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
                                                                                    {t('Cancel')}
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="bg-emerald-500 text-white hover:bg-emerald-600"
                                                                                    onClick={() => {
                                                                                        router.put(
                                                                                            route('invoices.comments.update-activity', {
                                                                                                invoice: invoice.id,
                                                                                                activity: activity.id,
                                                                                            }),
                                                                                            { comment: editCommentText },
                                                                                            { preserveScroll: true },
                                                                                        );
                                                                                        setEditingComment(null);
                                                                                    }}
                                                                                >
                                                                                    {t('Save')}
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
                                            <Calendar className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
                                            <p className="text-sm">{t('No activities found')}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
                {/* end left column */}

                {/* Right Sticky Sidebar */}
                <div className="w-full min-w-0 space-y-4 lg:sticky lg:top-6 lg:w-[320px] lg:self-start">
                    {/* Summary & Actions */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <FileText className="mr-2 h-4 w-4 text-emerald-600" />
                                {t('Summary & Actions')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="text-muted-foreground mb-1 text-xs">{t('Balance Due')}</p>
                                    <p className="text-foreground font-mono text-2xl font-bold">{formatCurrency(dueAmount)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">{getStatusBadge(invoice.status)}</div>
                            </div>
                            {/* Payment Progress Bar */}
                            {parseFloat(invoice.total_amount) > 0 && (
                                <div className="mb-4">
                                    <div className="text-muted-foreground mb-1 flex justify-between text-xs">
                                        <span>
                                            {t('Paid')}: <span className="font-mono">{formatCurrency(paidAmount)}</span>
                                        </span>
                                        <span>{Math.round((paidAmount / parseFloat(invoice.total_amount)) * 100)}%</span>
                                    </div>
                                    <div className="bg-muted h-2 w-full rounded-full">
                                        <div
                                            className="h-2 rounded-full bg-emerald-500 transition-all"
                                            style={{ width: `${Math.min(100, (paidAmount / parseFloat(invoice.total_amount)) * 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {t('of')} <span className="font-mono">{formatCurrency(invoice.total_amount)}</span>
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                {['pending', 'overdue', 'partially_paid'].includes(invoice.status) &&
                                    useHasPermission('send-reminder-invoices') && (
                                        <Button variant="default" size="sm" className="w-full cursor-pointer" onClick={handleSendReminder}>
                                            <Bell className="mr-2 h-4 w-4" />
                                            {t('Send Reminder')}
                                        </Button>
                                    )}
                                {useHasPermission('edit-invoices') && (
                                    <Button variant="outline" className="w-full" onClick={() => router.visit(route('invoices.edit', invoice.id))}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        {t('Edit Invoice')}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    {(invoice.contact || invoice.account) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <User className="mr-2 h-4 w-4 text-emerald-600" />
                                    {t('Customer Info')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {invoice.contact && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs text-[10px]">
                                            <User className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {t('Contact')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={invoice.contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{invoice.contact.name}</p>
                                                    {invoice.contact.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{invoice.contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-contacts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={route('contacts.show', invoice.contact.id)} className="ml-3 flex-shrink-0">
                                                                <Eye className="h-4 w-4 text-gray-500" />
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{t('View')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {invoice.contact && invoice.account && <div className="mx-0 border-t" />}
                                {invoice.account && (
                                    <div className="px-4 pt-3 pb-3">
                                        <p className="mb-2 flex items-center gap-1 text-[10px] text-gray-600">
                                            <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {t('Account')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={invoice.account.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{invoice.account.name}</p>
                                                    {invoice.account.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{invoice.account.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-accounts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={route('accounts.show', invoice.account.id)} className="ml-3 flex-shrink-0">
                                                                <Eye className="h-4 w-4 text-gray-500" />
                                                            </Link>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{t('View')}</p>
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

                    {/* Invoice Details */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <FileText className="mr-2 h-4 w-4 text-emerald-600" />
                                {t('Invoice Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-5">
                            <div className="flex items-start gap-3">
                                <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="text-muted-foreground text-xs">{t('Invoice Number')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <p className="text-foreground text-sm font-medium">{invoice.invoice_number}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{t('Invoice Date')}</p>
                                    <p className="text-foreground text-sm font-medium">{formatDate(invoice.invoice_date)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{t('Due Date')}</p>
                                    <p className="text-foreground text-sm font-medium">{formatDate(invoice.due_date)}</p>
                                </div>
                            </div>

                            {invoice.assigned_user && (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground mb-2 text-xs">{t('Assigned To')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={invoice.assigned_user.avatar} alt={invoice.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(invoice.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{invoice.assigned_user.name}</p>
                                            {invoice.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{invoice.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {invoice.creator && (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground mb-2 text-xs">{t('Created By')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={invoice.creator.avatar} alt={invoice.creator.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(invoice.creator.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{invoice.creator.name}</p>
                                            {invoice.creator.email && (
                                                <p className="text-muted-foreground truncate text-xs">{invoice.creator.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Related Records */}
                    {(invoice.sales_order || invoice.quote) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <Package className="mr-2 h-4 w-4 text-gray-600" />
                                    {t('Related Records')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-5">
                                {invoice.sales_order && useHasPermission('view-sales-orders') && (
                                    <Link
                                        href={route('sales-orders.show', invoice.sales_order.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className="min-w-0">
                                                <p className="text-muted-foreground text-xs">{t('Sales Order')}</p>
                                                <p className="text-foreground truncate text-sm font-medium">{invoice.sales_order.name}</p>
                                            </div>
                                        </div>
                                        <Eye className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                    </Link>
                                )}
                                {invoice.quote && useHasPermission('view-quotes') && (
                                    <Link
                                        href={route('quotes.show', invoice.quote.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className="min-w-0">
                                                <p className="text-muted-foreground text-xs">{t('Quote')}</p>
                                                <p className="text-foreground truncate text-sm font-medium">{invoice.quote.name}</p>
                                            </div>
                                        </div>
                                        <Eye className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
                {/* end right sidebar */}
            </div>
            {/* end flex */}

            <CrudFormModal
                isOpen={isAssignSalesOrderModalOpen}
                onClo
                se={() => {
                    setIsAssignSalesOrderModalOpen(false);
                    setSelectedSalesOrderId('empty');
                }}
                onSubmit={handleAssignSalesOrder}
                formConfig={{
                    modalSize: 'md',
                    layout: 'vertical',
                    fields: [
                        {
                            name: 'sales_order_id',
                            label: t('Select Sales Order'),
                            type: 'select',
                            required: true,
                            options: [
                                { value: 'empty', label: t('Select Sales Order') },
                                ...(availableSalesOrders?.map((so: any) => ({
                                    value: so.id.toString(),
                                    label: `${so.order_number} - ${so.name}`,
                                })) || []),
                            ],
                        },
                    ],
                }}
                initialData={{ sales_order_id: selectedSalesOrderId || 'empty' }}
                title={t('Assign Sales Order to Invoice')}
                mode="create"
                onFieldChange={(field, value) => {
                    if (field === 'sales_order_id') {
                        setSelectedSalesOrderId(value);
                    }
                }}
            />

            {/* Delete Activity Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('invoices.delete-activity', { invoice: invoice.id, activity: currentActivity.id }), {
                        preserveScroll: true,
                    });
                    setIsDeleteModalOpen(false);
                }}
                itemName={t('this activity')}
                entityName={t('activity')}
            />

            {/* Delete All Activities Modal */}
            <CrudDeleteModal
                isOpen={isDeleteAllModalOpen}
                onClose={() => setIsDeleteAllModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('invoices.delete-activities', invoice.id), {
                        preserveScroll: true,
                    });
                    setIsDeleteAllModalOpen(false);
                }}
                itemName={t('all activities for {{invoiceName}}', { invoiceName: invoice.name })}
                entityName={t('activities')}
            />

            {/* Reject Payment Modal */}
            <Dialog open={isRejectPaymentModalOpen} onOpenChange={setIsRejectPaymentModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Reject Payment')}</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleRejectPaymentConfirm((formData.get('reason') as string) || '');
                        }}
                    >
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="reason">{t('Rejection Reason (Optional)')}</Label>
                                <Textarea id="reason" name="reason" placeholder={t('Enter rejection reason...')} className="mt-1" />
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsRejectPaymentModalOpen(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" variant="destructive">
                                {t('Reject')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
