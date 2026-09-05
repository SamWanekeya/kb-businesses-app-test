import { toast } from '@/components/custom-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { hasPermission } from '@/utils/authorization';
import { Head, usePage } from '@inertiajs/react';
import { Calendar, Check, Clock, Copy, DollarSign, MessageCircle, Package, Printer, Truck, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import IframePortal, { IframePortalHandles } from '@/components/IframePortal';
import { formatRelativeTime, getDisplayUrl } from '@/utils/helper';
import Template1 from '@pages/quotes/templates/Template1';
import Template10 from '@pages/quotes/templates/Template10';
import Template2 from '@pages/quotes/templates/Template2';
import Template3 from '@pages/quotes/templates/Template3';
import Template4 from '@pages/quotes/templates/Template4';
import Template5 from '@pages/quotes/templates/Template5';
import Template6 from '@pages/quotes/templates/Template6';
import Template7 from '@pages/quotes/templates/Template7';
import Template8 from '@pages/quotes/templates/Template8';
import Template9 from '@pages/quotes/templates/Template9';

const templateComponents = {
    template1: Template1,
    template2: Template2,
    template3: Template3,
    template4: Template4,
    template5: Template5,
    template6: Template6,
    template7: Template7,
    template8: Template8,
    template9: Template9,
    template10: Template10,
};

interface SalesOrder {
    id: number;
    order_number: string;
    name: string;
    description?: string;
    order_date: string;
    delivery_date: string;
    created_at: string;
    updated_at: string;
    status: string;
    subtotal: number;
    total_tax: number;
    total_amount: number;
    notes?: string;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
    shipping_address?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_postal_code?: string;
    shipping_country?: string;
    account?: { id: number; name: string; email?: string };
    quote?: { id: number; name: string };
    billing_contact?: { id: number; name: string; email?: string; phone?: string };
    shipping_contact?: { id: number; name: string; email?: string; phone?: string };
    shipping_provider_type?: { id: number; name: string };
    creator?: { id: number; name: string; email?: string; avatar?: string };
    assigned_user?: { id: number; name: string; email?: string; avatar?: string };
    activities?: any[];
    products: {
        id: number;
        name: string;
        sku?: string;
        main_image_url?: string;
        category?: { name: string };
        pivot: {
            quantity: number;
            unit_price: number;
            total_price: number;
            discount_type?: string;
            discount_value?: number;
            discount_amount?: number;
        };
        tax?: { name: string; rate: number };
    }[];
}

interface Props {
    salesOrder: SalesOrder;
    templateId?: string;
    color?: string;
    qrEnabled?: boolean;
    settings?: any;
    themeColor?: string;
    customColor?: string;
}

export default function PublicSalesOrder({
    salesOrder,
    templateId = 'template1',
    color = 'ffffff',
    qrEnabled = false,
    settings = {},
    themeColor = 'blue',
    customColor = null,
}: Props) {
    const { t } = useTranslation();
    const { props } = usePage<any>();
    const globalSettings = props.globalSettings;
    const [copied, setCopied] = useState(false);

    const auth = props.auth || {};
    const permissions = auth?.permissions || [];

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(t(props.flash.success));
        }
        if (props.flash?.error) {
            toast.error(t(props.flash.error));
        }
    }, [props.flash, t]);

    const themeColors = { blue: '#A12582', green: '#10b77f', purple: '#8b5cf6', orange: '#f97316', red: '#ef4444' };
    const currentThemeColor = themeColor === 'custom' ? customColor : themeColors[themeColor as keyof typeof themeColors] || '#A12582';
    const template = { primary: currentThemeColor, secondary: currentThemeColor };

    const formatCurrency = (amount: number) => {
        const val = window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;
        return <span className="font-mono">{val}</span>;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return t('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    const calculateProductTotals = () => {
        let subtotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;

        salesOrder.products?.forEach((product: any) => {
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

    const items = salesOrder.products.map((product: any) => {
        const lineTotal = product.pivot.quantity * product.pivot.unit_price;
        const discountAmount = product.pivot.discount_amount || 0;
        const afterDiscount = lineTotal - discountAmount;
        const taxAmount = product.tax ? (afterDiscount * product.tax.rate) / 100 : 0;

        return {
            name: product.name,
            quantity: product.pivot.quantity,
            price: product.pivot.unit_price,
            tax: product.tax?.rate || 0,
            discount: discountAmount,
            itemTax: product.tax
                ? [
                      {
                          name: product.tax.name,
                          rate: `${product.tax.rate}%`,
                          price: formatCurrency(taxAmount),
                      },
                  ]
                : [],
        };
    });

    const taxesData = salesOrder.products.reduce((acc: any, product: any) => {
        if (product.tax) {
            const lineTotal = product.pivot.quantity * product.pivot.unit_price;
            const discountAmount = product.pivot.discount_amount || 0;
            const afterDiscount = lineTotal - discountAmount;
            const taxAmount = (afterDiscount * product.tax.rate) / 100;
            acc[product.tax.name] = (acc[product.tax.name] || 0) + taxAmount;
        }
        return acc;
    }, {});

    const salesOrderData = {
        ...salesOrder,
        sales_order_number: salesOrder.order_number,
        order_date: formatDate(salesOrder.order_date || new Date().toISOString()),
        delivery_date: formatDate(salesOrder.delivery_date || new Date().toISOString()),
        sub_total: subtotal,
        total_tax: totalTax,
        total_amount: grandTotal,
        totalQuantity: salesOrder.products.reduce((sum: number, p: any) => sum + p.pivot.quantity, 0),
        totalRate: salesOrder.products.reduce((sum: number, p: any) => sum + p.pivot.quantity * p.pivot.unit_price, 0),
        totalTaxPrice: totalTax,
        totalDiscount: totalDiscount,
        total_discount: totalDiscount,
    };

    const TemplateComponent = templateComponents[templateId as keyof typeof templateComponents] || Template1;

    // const handlePrint = () => window.print();
    const iframeRef = useRef<IframePortalHandles>(null);

    const handlePrint = () => {
        iframeRef.current?.print(); // calls the print function inside IframePortal
    };

    const copySalesOrderLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {}
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            draft: 'bg-gray-50 text-gray-600 ring-gray-500/10',
            confirmed: 'bg-blue-50 text-blue-700 ring-blue-700/10',
            processing: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
            shipped: 'bg-purple-50 text-purple-700 ring-purple-700/10',
            delivered: 'bg-green-50 text-green-700 ring-green-600/20',
            cancelled: 'bg-red-50 text-red-700 ring-red-600/10',
        };

        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status as keyof typeof statusColors] || statusColors.draft}`}
            >
                {t(status?.charAt(0).toUpperCase() + status?.slice(1)) || t('Draft')}
            </span>
        );
    };

    return (
        <>
            <Head title={t('Sales Order {{orderNumber}}', { orderNumber: salesOrder.order_number })}>
                {settings?.favicon && <link rel="icon" href={getDisplayUrl(settings.favicon, globalSettings)} />}
            </Head>

            <div className="min-h-screen bg-gray-50 py-8 dark:from-gray-900 dark:to-gray-800 print:m-0 print:bg-white print:p-0">
                <div className="print-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center print:hidden">
                        <div className="mb-4 sm:mb-0">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('Sales Order Details')} - {salesOrder.order_number}
                            </h1>
                            <p className="mt-1 text-gray-600">{t('View your sales order')}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {hasPermission(permissions, 'view-sales-orders') && (
                                <button
                                    onClick={copySalesOrderLink}
                                    className="inline-flex cursor-pointer items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md"
                                >
                                    {copied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                                    {copied ? t('Copied!') : t('Copy Link')}
                                </button>
                            )}
                            <button
                                onClick={handlePrint}
                                className="inline-flex cursor-pointer items-center rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md"
                                style={{
                                    backgroundColor: currentThemeColor,
                                    ':hover': { filter: 'brightness(0.9)' },
                                }}
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                {t('Print Sales Order')}
                            </button>
                        </div>
                    </div>

                    {/* Template for Print */}
                    <div className="hidden print:block">
                        <IframePortal ref={iframeRef}>
                            <TemplateComponent
                                salesOrder={salesOrderData}
                                items={items}
                                taxesData={taxesData}
                                settings={settings}
                                color={color}
                                qr_invoice={qrEnabled ? 'on' : 'off'}
                            />
                        </IframePortal>
                    </div>

                    <div className="mx-auto space-y-6 print:hidden">
                        {/* Header Section */}
                        <div className="rounded-lg border bg-white p-8 shadow-sm print:hidden">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h1 className="text-lg leading-tight font-bold text-gray-900">{salesOrder.name}</h1>
                                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-gray-600">
                                        {salesOrder.description || t('No description provided')}
                                    </p>
                                </div>
                                <div className="ml-6 text-right">
                                    {getStatusBadge(salesOrder.status)}
                                    <p className="mt-2 font-mono text-sm font-medium text-gray-700">{salesOrder.order_number}</p>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards — blob style */}
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            {(
                                [
                                    {
                                        label: t('Total Amount'),
                                        value: <span className="font-mono">{formatCurrency(salesOrder.total_amount)}</span>,
                                        icon: DollarSign,
                                        iconCls: 'text-emerald-600',
                                        blobCls: 'bg-emerald-50',
                                    },
                                    {
                                        label: t('Products'),
                                        value: salesOrder.products?.length || 0,
                                        icon: Package,
                                        iconCls: 'text-blue-600',
                                        blobCls: 'bg-blue-50',
                                    },
                                    {
                                        label: t('Order Date'),
                                        value: formatDate(salesOrder.order_date),
                                        icon: Calendar,
                                        iconCls: 'text-orange-600',
                                        blobCls: 'bg-orange-50',
                                    },
                                    {
                                        label: t('Delivery Date'),
                                        value: formatDate(salesOrder.delivery_date),
                                        icon: Clock,
                                        iconCls: 'text-purple-600',
                                        blobCls: 'bg-purple-50',
                                    },
                                ] as const
                            ).map(({ label, value, icon: Icon, iconCls, blobCls }) => (
                                <div
                                    key={label}
                                    className="relative overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-lg"
                                >
                                    <div className={`absolute top-0 right-0 h-20 w-20 ${blobCls} rounded-bl-full`} />
                                    <div className="relative p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 pr-2">
                                                <p className="mb-1 text-xs font-bold tracking-wide text-gray-500">{label}</p>
                                                <p className="truncate text-lg leading-snug font-bold text-gray-900">{value}</p>
                                            </div>
                                            <div className={`relative z-10 p-2.5 ${blobCls} mt-0.5 flex-shrink-0 rounded-xl`}>
                                                <Icon className={`h-5 w-5 ${iconCls}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Sales Order Information */}
                        <div className="rounded-lg border bg-white shadow-sm">
                            <div className="border-b px-6 py-4">
                                <h3 className="text-lg font-semibold">{t('Sales Order Information')}</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Order Number')}</label>
                                            <p className="mt-1 text-sm">{salesOrder.order_number}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Status')}</label>
                                            <div className="mt-1">{getStatusBadge(salesOrder.status)}</div>
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Created By')}</label>
                                            {salesOrder.creator ? (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                                        <AvatarImage src={salesOrder.creator.avatar} alt={salesOrder.creator.name} />
                                                        <AvatarFallback>
                                                            <UserInitials name={salesOrder.creator.name} />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-gray-900">{salesOrder.creator.name}</p>
                                                        {salesOrder.creator.email && (
                                                            <p className="truncate text-xs text-gray-500">{salesOrder.creator.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-sm text-gray-500">{t('-')}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Assigned To')}</label>
                                            {salesOrder.assigned_user ? (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                                        <AvatarImage src={salesOrder.assigned_user.avatar} alt={salesOrder.assigned_user.name} />
                                                        <AvatarFallback>
                                                            <UserInitials name={salesOrder.assigned_user.name} />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-gray-900">{salesOrder.assigned_user.name}</p>
                                                        {salesOrder.assigned_user.email && (
                                                            <p className="truncate text-xs text-gray-500">{salesOrder.assigned_user.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-sm text-gray-500">{t('-')}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Subtotal')}</label>
                                            <p className="mt-1 text-sm">{formatCurrency(salesOrder.subtotal)}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Discount Amount')}</label>
                                            <p className="mt-1 text-sm">-{formatCurrency(totalDiscount)}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Order Date')}</label>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                <p className="text-sm">{formatDate(salesOrder.order_date)}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Delivery Date')}</label>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                <p className="text-sm">{formatDate(salesOrder.delivery_date)}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">{t('Created At')}</label>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                                <p className="text-sm">{formatDate(salesOrder.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Related Data */}
                        {(salesOrder.account || salesOrder.quote || salesOrder.shipping_provider_type) && (
                            <div className="rounded-lg border bg-white shadow-sm">
                                <div className="border-b px-6 py-4">
                                    <h3 className="flex items-center text-lg font-semibold">
                                        <User className="mr-3 h-5 w-5 text-gray-400" />
                                        {t('Related Data')}
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        {salesOrder.account && (
                                            <div className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md">
                                                <p className="mb-3 text-xs font-medium text-gray-500">{t('Account')}</p>
                                                <div className="flex items-center gap-2">
                                                    <UserInitials name={salesOrder.account.name} />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">{salesOrder.account.name}</p>
                                                        {salesOrder.account.email && (
                                                            <p className="truncate text-xs text-gray-500">{salesOrder.account.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {salesOrder.quote && (
                                            <div className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md">
                                                <p className="mb-3 text-xs font-medium text-gray-500">{t('Quote')}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">{salesOrder.quote.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {salesOrder.shipping_provider_type && (
                                            <div className="rounded-xl border border-gray-200 p-4 transition-shadow hover:shadow-md">
                                                <p className="mb-3 text-xs font-medium text-gray-500">{t('Shipping Provider')}</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-50">
                                                        <Truck className="h-4 w-4 text-orange-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-gray-900">
                                                            {salesOrder.shipping_provider_type.name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Customer & Delivery Info */}
                        <div className="rounded-lg border bg-white shadow-sm">
                            <div className="border-b px-6 py-4">
                                <h3 className="flex items-center text-lg font-semibold">
                                    <svg className="text-muted-foreground mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    {t('Billing & Shipping Details')}
                                </h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {/* Billing */}
                                    <div>
                                        <p className="text-muted-foreground mb-3 text-xs font-semibold">{t('Billing Address')}</p>
                                        {salesOrder.billing_contact && (
                                            <div className="mb-3 flex items-center gap-2">
                                                <UserInitials name={salesOrder.billing_contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-medium">{salesOrder.billing_contact.name}</p>
                                                    {salesOrder.billing_contact.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{salesOrder.billing_contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-muted-foreground text-xs font-medium">{t('Address')}</p>
                                                    <p className="text-foreground text-sm font-medium">{salesOrder.billing_address || t('-')}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-muted-foreground text-xs font-medium">{t('City')}</p>
                                                    <p className="text-foreground text-sm font-medium">{salesOrder.billing_city || t('-')}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-muted-foreground text-xs font-medium">{t('State')}</p>
                                                    <p className="text-foreground text-sm font-medium">{salesOrder.billing_state || t('-')}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-muted-foreground text-xs font-medium">{t('Postal Code')}</p>
                                                    <p className="text-foreground text-sm font-medium">{salesOrder.billing_postal_code || t('-')}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{t('Country')}</p>
                                                <p className="text-foreground text-sm font-medium">{salesOrder.billing_country || t('-')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Shipping */}
                                    <div className="sm:border-s sm:ps-6">
                                        <p className="text-muted-foreground mb-3 text-xs font-semibold">{t('Shipping Address')}</p>
                                        {salesOrder.shipping_contact && (
                                            <div className="mb-3 flex items-center gap-2">
                                                <UserInitials name={salesOrder.shipping_contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-medium">{salesOrder.shipping_contact.name}</p>
                                                    {salesOrder.shipping_contact.email && (
                                                        <p className="text-muted-foreground truncate text-xs">{salesOrder.shipping_contact.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-muted-foreground text-xs font-medium">{t('Address')}</p>
                                                    <p className="text-foreground text-sm font-medium">{salesOrder.shipping_address || t('-')}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-muted-foreground text-xs font-medium">{t('City')}</p>
                                                    <p className="text-foreground text-sm font-medium">{salesOrder.shipping_city || t('-')}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-muted-foreground text-xs font-medium">{t('State')}</p>
                                                    <p className="text-foreground text-sm font-medium">{salesOrder.shipping_state || t('-')}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-muted-foreground text-xs font-medium">{t('Postal Code')}</p>
                                                    <p className="text-foreground text-sm font-medium">{salesOrder.shipping_postal_code || t('-')}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-muted-foreground text-xs font-medium">{t('Country')}</p>
                                                <p className="text-foreground text-sm font-medium">{salesOrder.shipping_country || t('-')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products Table */}
                        <div className="rounded-lg border bg-white shadow-sm">
                            <div className="border-b px-6 py-4">
                                <h3 className="flex items-center text-lg font-semibold">
                                    <Package className="mr-3 h-5 w-5 text-gray-400" />
                                    {t('Products')}
                                </h3>
                            </div>
                            <div className="p-0">
                                {salesOrder.products && salesOrder.products.length > 0 ? (
                                    <>
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1]">
                                                        <TableHead className="py-2.5 font-semibold">{t('Product')}</TableHead>
                                                        <TableHead className="py-2.5 text-center font-semibold">{t('Quantity')}</TableHead>
                                                        <TableHead className="py-2.5 text-center font-semibold">{t('Unit Price')}</TableHead>
                                                        <TableHead className="py-2.5 text-center font-semibold">{t('Discount')}</TableHead>
                                                        <TableHead className="py-2.5 text-center font-semibold">{t('Tax')}</TableHead>
                                                        <TableHead className="py-2.5 text-right font-semibold">{t('Total')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {salesOrder.products.map((product: any, index: number) => {
                                                        const lineTotal = Number(product.pivot.total_price) || 0;
                                                        const discountAmount = Number(product.pivot.discount_amount) || 0;
                                                        const afterDiscount = lineTotal - discountAmount;
                                                        const taxAmount = product.tax ? (afterDiscount * Number(product.tax.rate)) / 100 : 0;
                                                        const finalTotal = afterDiscount + taxAmount;
                                                        return (
                                                            <TableRow key={index} className="border-b hover:bg-gray-50">
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
                                                                                    className="h-11 w-11 cursor-pointer rounded-lg border border-gray-200 object-cover transition-opacity hover:opacity-80"
                                                                                />
                                                                            </a>
                                                                        ) : (
                                                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
                                                                                <Package className="h-4 w-4 text-gray-300" />
                                                                            </div>
                                                                        )}
                                                                        <div className="min-w-0">
                                                                            <p className="truncate text-sm font-bold text-gray-900">{product.name}</p>
                                                                            {product.sku && (
                                                                                <p className="mt-0.5 text-xs text-gray-500">SKU: {product.sku}</p>
                                                                            )}
                                                                            {product.category?.name && (
                                                                                <span className="mt-1 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                                                                                    {product.category.name}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-3 text-center">
                                                                    <p className="text-sm font-semibold text-gray-900">{product.pivot.quantity}</p>
                                                                </TableCell>
                                                                <TableCell className="py-3 text-center">
                                                                    <p className="font-mono text-sm font-semibold text-gray-900">
                                                                        {formatCurrency(product.pivot.unit_price)}
                                                                    </p>
                                                                </TableCell>
                                                                <TableCell className="py-3 text-center">
                                                                    {product.pivot.discount_type &&
                                                                    product.pivot.discount_type !== 'none' &&
                                                                    product.pivot.discount_value > 0 ? (
                                                                        <>
                                                                            <p className="text-sm font-semibold text-gray-900">
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
                                                                        <span className="text-xs text-gray-400">—</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="py-3 text-center">
                                                                    {product.tax ? (
                                                                        <>
                                                                            <p className="text-sm font-semibold text-gray-900">
                                                                                {product.tax.name} ({parseFloat(product.tax.rate).toFixed(2)}%)
                                                                            </p>
                                                                            <p className="mt-0.5 font-mono text-xs text-gray-500">
                                                                                {formatCurrency(taxAmount)}
                                                                            </p>
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-400">—</span>
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
                                        {/* Summary box */}
                                        <div className="flex justify-end border-t bg-gray-50/50 px-6 py-5">
                                            <div className="w-full max-w-sm overflow-hidden rounded-xl border">
                                                <div className="flex items-center justify-between border-b px-4 py-3">
                                                    <span className="text-sm font-medium text-gray-500">{t('Subtotal')}</span>
                                                    <span className="font-mono text-sm font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                                                </div>
                                                <div className="flex items-center justify-between border-b px-4 py-3">
                                                    <span className="text-sm font-medium text-gray-500">{t('Discount')}</span>
                                                    <span className="font-mono text-sm font-semibold text-red-500">
                                                        -{formatCurrency(totalDiscount)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-b px-4 py-3">
                                                    <span className="text-sm font-medium text-gray-500">{t('Total Tax')}</span>
                                                    <span className="font-mono text-sm font-semibold text-gray-900">{formatCurrency(totalTax)}</span>
                                                </div>
                                                <div className="flex items-center justify-between px-4 py-3">
                                                    <span className="text-sm font-bold text-gray-900">{t('Grand Total')}</span>
                                                    <span className="font-mono text-lg font-bold text-emerald-600">{formatCurrency(grandTotal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="py-16 text-center text-gray-500">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                                            <Package className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <p className="text-lg font-medium">{t('No products added to this sales order')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes */}
                        {salesOrder.notes && (
                            <div className="rounded-lg border bg-white p-6 shadow-sm">
                                <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('Notes')}</h3>
                                <p className="whitespace-pre-wrap text-gray-700">{salesOrder.notes}</p>
                            </div>
                        )}

                        {/* Activity Stream */}
                        {salesOrder.activities && salesOrder.activities.length > 0 && (
                            <div className="rounded-lg border bg-white shadow-sm">
                                <div className="border-b px-6 py-4">
                                    <h3 className="flex items-center text-lg font-semibold">
                                        <MessageCircle className="mr-3 h-5 w-5 text-gray-400" />
                                        {t('Activity Stream')}
                                    </h3>
                                </div>
                                <div className="max-h-[520px] overflow-y-auto p-6">
                                    <div className="space-y-0 py-1">
                                        {salesOrder.activities.map((activity: any, index: number) => {
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
                                            return (
                                                <div key={activity.id || index} className="relative flex gap-3 pb-4">
                                                    <div className="flex w-9 flex-shrink-0 flex-col items-center">
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Avatar className="relative z-10 h-9 w-9 flex-shrink-0">
                                                                        <AvatarImage src={activity.user?.avatar} alt={activity.user?.name || 'U'} />
                                                                        <AvatarFallback>
                                                                            <UserInitials name={activity.user?.name || 'U'} />
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <p>{activity.user?.name || t('System')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        {index < salesOrder.activities.length - 1 && (
                                                            <div className="absolute top-9 bottom-0 left-[18px] w-px bg-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1 overflow-hidden rounded-xl border bg-white shadow-sm">
                                                        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-sm font-semibold text-gray-900">
                                                                    {activity.user?.name || t('System')}
                                                                </span>
                                                                <span
                                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeCls}`}
                                                                >
                                                                    {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {formatRelativeTime(activity.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="px-4 py-3">
                                                            {activity.description?.includes('into') ? (
                                                                <p
                                                                    className="text-sm text-gray-500"
                                                                    dangerouslySetInnerHTML={{ __html: activity.description }}
                                                                />
                                                            ) : activity.title ? (
                                                                <p className="text-sm text-gray-500">{activity.title}</p>
                                                            ) : (
                                                                <p className="text-sm text-gray-500">{activity.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
