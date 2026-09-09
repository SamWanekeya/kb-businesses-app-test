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
import { ArrowLeft, Building2, Calendar, Edit, Eye, FileText, MessageCircle, Package, Send, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function QuoteShow() {
    const { t: translate } = useTranslation();
    const { quote, streamItems, auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<any>(null);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
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
        { title: translate('Quotes'), href: route('quotes.index') },
        { title: translate('View Quote') },
    ];

    const getStatusBadge = (status: string) => {
        const statusColors = {
            draft: 'bg-gray-50 text-gray-600 ring-gray-500/10',
            sent: 'bg-blue-50 text-blue-700 ring-blue-700/10',
            accepted: 'bg-green-50 text-green-700 ring-green-600/20',
            rejected: 'bg-red-50 text-red-700 ring-red-600/10',
            expired: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
        };

        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status as keyof typeof statusColors] || statusColors.draft}`}
            >
                {translate(status?.charAt(0).toUpperCase() + status?.slice(1)) || translate('Draft')}
            </span>
        );
    };

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const formatDate = (dateString: string) => {
        if (!dateString) return translate('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    const calculateProductTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        quote.products?.forEach((product: any) => {
            const lineTotal = Number(product.pivot.total_price) || 0;
            const discountAmount = Number(product.pivot.discount_amount) || 0;
            const afterDiscount = lineTotal - discountAmount;
            const taxAmount = product.tax ? (afterDiscount * Number(product.tax.rate)) / 100 : 0;

            subtotal += lineTotal;
            totalDiscount += discountAmount;
            totalTax += taxAmount;
        });

        return { subtotal, totalDiscount, totalTax, grandTotal: subtotal - totalDiscount + totalTax };
    };

    const { subtotal, totalDiscount, totalTax, grandTotal } = calculateProductTotals();

    return (
        <PageTemplate
            title={quote.quote_number}
            description={translate('Quote details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="h-4 w-4 sm:me-2" />,
                    labelClassName: 'hidden sm:inline',
                    variant: 'outline',
                    onClick: () => router.visit(route('quotes.index')),
                },
            ]}
            noPadding
        >
            <div className="grid w-full max-w-full min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Left Column */}
                <div className="w-full max-w-full min-w-0 space-y-6">
                    {/* Hero Card */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg font-bold">{quote.name}</CardTitle>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                                <div>
                                    <p className="text-muted-foreground mb-3 text-xs font-semibold">{translate('Billing Address')}</p>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('Address')}</p>
                                                <p className="text-foreground text-sm font-medium">{quote.billing_address || translate('-')}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('City')}</p>
                                                <p className="text-foreground text-sm font-medium">{quote.billing_city || translate('-')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('State')}</p>
                                                <p className="text-foreground text-sm font-medium">{quote.billing_state || translate('-')}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('Postal Code')}</p>
                                                <p className="text-foreground text-sm font-medium">{quote.billing_postal_code || translate('-')}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Country')}</p>
                                            <p className="text-foreground text-sm font-medium">{quote.billing_country || translate('-')}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="xl:border-s xl:ps-6">
                                    <p className="text-muted-foreground mb-3 text-xs font-semibold">{translate('Shipping Address')}</p>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('Address')}</p>
                                                <p className="text-foreground text-sm font-medium">{quote.shipping_address || translate('-')}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('City')}</p>
                                                <p className="text-foreground text-sm font-medium">{quote.shipping_city || translate('-')}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 min-[450px]:grid-cols-2">
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('State')}</p>
                                                <p className="text-foreground text-sm font-medium">{quote.shipping_state || translate('-')}</p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{translate('Postal Code')}</p>
                                                <p className="text-foreground text-sm font-medium">{quote.shipping_postal_code || translate('-')}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Country')}</p>
                                            <p className="text-foreground text-sm font-medium">{quote.shipping_country || translate('-')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Products */}
                    <Card className="overflow-hidden shadow-sm" id="products-section">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Package className="text-muted-foreground me-3 h-5 w-5" />
                                {translate('Products')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {quote.products && quote.products.length > 0 ? (
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
                                                {quote.products.map((product: any, index: number) => {
                                                    const lineTotal = Number(product.pivot.total_price) || 0;
                                                    const discountAmount = Number(product.pivot.discount_amount) || 0;
                                                    const afterDiscount = lineTotal - discountAmount;
                                                    const taxAmount = product.tax ? (afterDiscount * Number(product.tax.rate)) / 100 : 0;
                                                    const finalTotal = afterDiscount + taxAmount;
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
                                                                <p className="font-mono text-sm font-bold text-emerald-600">
                                                                    {formatCurrency(finalTotal)}
                                                                </p>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="bg-muted/10 flex flex-col items-start justify-end gap-4 border-t px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-end">
                                        <div className="w-full overflow-hidden rounded-xl border sm:max-w-sm">
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Subtotal')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">{formatCurrency(subtotal)}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Discount')}</span>
                                                <span className="font-mono text-sm font-semibold text-red-500">-{formatCurrency(totalDiscount)}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b px-4 py-3">
                                                <span className="text-muted-foreground text-sm font-medium">{translate('Total Tax')}</span>
                                                <span className="text-foreground font-mono text-sm font-semibold">{formatCurrency(totalTax)}</span>
                                            </div>
                                            <div className="flex items-center justify-between px-4 py-3">
                                                <span className="text-foreground text-sm font-bold">{translate('Grand Total')}</span>
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
                                    <p className="text-muted-foreground text-sm font-medium">{translate('No products added to this quote')}</p>
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
                                <div className="px-4 py-4 sm:px-5">
                                    <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                                        {quote.description || translate('-')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Stream */}
                    {useHasPermission('view-stream') && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <MessageCircle className="text-muted-foreground me-3 h-5 w-5" />
                                    {translate('Activity Stream')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {useHasPermission('create-quotes') && (
                                    <div className="border-b px-4 pt-4 pb-4 sm:px-5">
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                if (newComment.trim()) {
                                                    router.post(
                                                        route('quotes.comments.store', quote.id),
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
                                                            <Avatar className="mt-1 h-8 w-8 flex-shrink-0">
                                                                <AvatarImage src={auth?.user?.avatar} alt={auth?.user?.name || 'User'} />
                                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                                    {getInitials(auth?.user?.name || 'U')}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{auth?.user?.name || translate('User')}</p>
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
                                        <div className="px-4 py-4 sm:px-5 sm:py-5">
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
                                                                className={`flex flex-col justify-between gap-2 px-4 py-2.5 sm:flex-row sm:items-center ${isEditing ? 'bg-emerald-50/60' : 'bg-muted/30'} border-b`}
                                                            >
                                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                                    <span className="text-foreground truncate text-sm font-semibold">
                                                                        {activity.user?.name || translate('System')}
                                                                    </span>
                                                                    <span
                                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeCls} shrink-0`}
                                                                    >
                                                                        {activity.activity_type.charAt(0).toUpperCase() +
                                                                            activity.activity_type.slice(1)}
                                                                    </span>
                                                                    <span className="text-muted-foreground shrink-0 text-xs">
                                                                        {formatRelativeTime(activity.created_at)}
                                                                    </span>
                                                                </div>
                                                                {!isEditing && (
                                                                    <div className="flex flex-shrink-0 items-center gap-1 self-end sm:self-auto">
                                                                        {activity.activity_type === 'comment' &&
                                                                            activity.user_id === auth?.user?.id &&
                                                                            useHasPermission('edit-quotes') && (
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
                                                            <div className="px-3 py-3 sm:px-4">
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
                                                                                            route('quotes.comments.update-activity', {
                                                                                                quote: quote.id,
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
                                            <Calendar className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
                                            <p className="text-sm">{translate('No activities found')}</p>
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
                                <FileText className="me-2 h-4 w-4 text-emerald-600" />
                                {translate('Summary & Actions')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-5">
                            <div className="mb-4 flex items-start justify-between">
                                <div>
                                    <p className="text-muted-foreground mb-1 text-xs">{translate('Total Amount')}</p>
                                    <p className="text-foreground font-mono text-2xl font-bold">{formatCurrency(quote.total_amount)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">{getStatusBadge(quote.status)}</div>
                            </div>
                            <div className="space-y-2">
                                {useHasPermission('edit-quotes') && (
                                    <Button variant="outline" className="w-full" onClick={() => router.visit(route('quotes.edit', quote.id))}>
                                        <Edit className="me-2 h-4 w-4" />
                                        {translate('Edit Quote')}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Customer Info */}
                    {(quote.contact || quote.account || quote.billing_contact || quote.shipping_contact) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <User className="me-2 h-4 w-4 text-emerald-600" />
                                    {translate('Customer Info')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {quote.contact && quote.account && <div className="mx-0 border-t" />}
                                {quote.account && (
                                    <div className="px-3 pt-3 pb-3 sm:px-4">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                                            <Building2 className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                            {translate('Account')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={quote.account.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{quote.account.name}</p>
                                                    {quote.account.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{quote.account.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-accounts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={route('accounts.show', quote.account.id)} className="ms-3 flex-shrink-0">
                                                                <Eye className="text-muted-foreground h-4 w-4" />
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
                                {(quote.contact || quote.account) && quote.billing_contact && <div className="mx-0 border-t" />}
                                {quote.billing_contact && (
                                    <div className="px-3 pt-3 pb-3 sm:px-4">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                                            <User className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                            {translate('Billing Contact')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={quote.billing_contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{quote.billing_contact.name}</p>
                                                    {quote.billing_contact.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{quote.billing_contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-contacts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route('contacts.show', quote.billing_contact.id)}
                                                                className="ms-3 flex-shrink-0"
                                                            >
                                                                <Eye className="text-muted-foreground h-4 w-4" />
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
                                {quote.billing_contact && quote.shipping_contact && <div className="mx-0 border-t" />}
                                {quote.shipping_contact && (
                                    <div className="px-3 pt-3 pb-3 sm:px-4">
                                        <p className="text-muted-foreground mb-2 flex items-center gap-1 text-xs">
                                            <User className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                            {translate('Shipping Contact')}
                                        </p>
                                        <div className="flex min-w-0 items-center justify-between">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={quote.shipping_contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{quote.shipping_contact.name}</p>
                                                    {quote.shipping_contact.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{quote.shipping_contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {useHasPermission('view-contacts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link
                                                                href={route('contacts.show', quote.shipping_contact.id)}
                                                                className="ms-3 flex-shrink-0"
                                                            >
                                                                <Eye className="text-muted-foreground h-4 w-4" />
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

                    {/* Quote Details */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-base font-semibold">
                                <FileText className="me-2 h-4 w-4 text-emerald-600" />
                                {translate('Quote Details')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <FileText className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Quote Number')}</p>
                                    <p className="text-foreground text-sm font-medium">{quote.quote_number}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Quote Date')}</p>
                                    <p className="text-foreground text-sm font-medium">{formatDate(quote.quote_date || quote.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                                <div>
                                    <p className="text-muted-foreground text-xs">{translate('Valid Until')}</p>
                                    <p className="text-foreground text-sm font-medium">{formatDate(quote.valid_until)}</p>
                                </div>
                            </div>
                            {quote.assigned_user && (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground mb-2 text-xs">{translate('Assigned To')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={quote.assigned_user.avatar} alt={quote.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(quote.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{quote.assigned_user.name}</p>
                                            {quote.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{quote.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {quote.creator && (
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground mb-2 text-xs">{translate('Created By')}</p>
                                    <div className="flex min-w-0 items-center gap-2">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarImage src={quote.creator.avatar} alt={quote.creator.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(quote.creator.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{quote.creator.name}</p>
                                            {quote.creator.email && <p className="text-muted-foreground truncate text-xs">{quote.creator.email}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Related Records */}
                    {(quote.shipping_provider_type || quote.opportunity) && (
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-base font-semibold">
                                    <Package className="text-muted-foreground me-2 h-4 w-4" />
                                    {translate('Related Records')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-4 sm:p-5">
                                {quote.opportunity && useHasPermission('view-opportunities') && (
                                    <Link
                                        href={route('opportunities.show', quote.opportunity.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Opportunity')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{quote.opportunity.name}</p>
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
                                {quote.opportunity && !useHasPermission('view-opportunities') && (
                                    <div className="flex items-center justify-between rounded-lg border p-2.5">
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Opportunity')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{quote.opportunity.name}</p>
                                        </div>
                                    </div>
                                )}
                                {quote.shipping_provider_type && useHasPermission('view-shipping-provider-types') && (
                                    <Link
                                        href={route('shipping-provider-types.show', quote.shipping_provider_type.id)}
                                        className="hover:bg-muted/40 flex min-w-0 items-center justify-between rounded-lg border p-2.5 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Shipping Provider')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{quote.shipping_provider_type.name}</p>
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
                                {quote.shipping_provider_type && !useHasPermission('view-shipping-provider-types') && (
                                    <div className="flex items-center justify-between rounded-lg border p-2.5">
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs">{translate('Shipping Provider')}</p>
                                            <p className="text-foreground truncate text-sm font-medium">{quote.shipping_provider_type.name}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
                {/* end right sidebar */}
            </div>
            {/* end grid */}

            {/* Delete Activity Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('quotes.delete-activity', { quote: quote.id, activity: currentActivity.id }), {
                        preserveScroll: true,
                    });
                    setIsDeleteModalOpen(false);
                }}
                itemName={translate('this activity')}
                entityName={translate('activity')}
            />

            {/* Delete All Activities Modal */}
            <CrudDeleteModal
                isOpen={isDeleteAllModalOpen}
                onClose={() => setIsDeleteAllModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('quotes.delete-activities', quote.id), {
                        preserveScroll: true,
                    });
                    setIsDeleteAllModalOpen(false);
                }}
                itemName={translate('all activities for {{name}}', { name: quote.name })}
                entityName={translate('activities')}
            />
        </PageTemplate>
    );
}
