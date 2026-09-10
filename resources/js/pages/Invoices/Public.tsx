import { toast } from '@components/CustomToast';
import { InvoicePaymentModal } from '@components/InvoicePaymentModal';
import { Head, usePage } from '@inertiajs/react';
import { resolveImageUrl } from '@utils/Helpers/Url';
import { useHasPermission } from '@utils/Permissions';
import { Calendar, Check, Copy, CreditCard, DollarSign, FileText, MapPin, Package, Printer, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import IframePortal, { IframePortalHandles } from '@components/IframePortal';
import Template1 from '@pages/quotes/Templates/Template1';
import Template10 from '@pages/quotes/Templates/Template10';
import Template2 from '@pages/quotes/Templates/Template2';
import Template3 from '@pages/quotes/Templates/Template3';
import Template4 from '@pages/quotes/Templates/Template4';
import Template5 from '@pages/quotes/Templates/Template5';
import Template6 from '@pages/quotes/Templates/Template6';
import Template7 from '@pages/quotes/Templates/Template7';
import Template8 from '@pages/quotes/Templates/Template8';
import Template9 from '@pages/quotes/Templates/Template9';

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

interface Invoice {
    id: number;
    invoice_number: string;
    name: string;
    description?: string;
    invoice_date: string;
    due_date: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    billing_country?: string;
    notes?: string;
    terms?: string;
    payment_method?: string;
    account?: {
        id: number;
        name: string;
        email?: string;
        phone?: string;
    };
    contact?: {
        id: number;
        name: string;
        email?: string;
        phone?: string;
    };
    products: {
        id: number;
        name: string;
        pivot: {
            quantity: number;
            unit_price: number;
            total_price: number;
            discount_type?: string;
            discount_value?: number;
            discount_amount?: number;
        };
        tax?: {
            name: string;
            rate: number;
        };
    }[];
    payments?: {
        id: number;
        amount: number;
        payment_method: string;
        payment_type: string;
        status: string;
        processed_at?: string;
        created_at: string;
    }[];
}

const templates = {
    1: { primary: '#A12582', secondary: '#1d4ed8' },
    2: { primary: '#6b7280', secondary: '#374151' },
    3: { primary: '#059669', secondary: '#047857' },
    4: { primary: '#ea580c', secondary: '#c2410c' },
    5: { primary: '#7c3aed', secondary: '#5b21b6' },
    6: { primary: '#dc2626', secondary: '#991b1b' },
    7: { primary: '#0891b2', secondary: '#0e7490' },
    8: { primary: '#d97706', secondary: '#92400e' },
    9: { primary: '#db2777', secondary: '#be185d' },
};

interface Props {
    invoice: Invoice;
    templateId?: string;
    color?: string;
    qrEnabled?: boolean;
    settings?: any;
    themeColor?: string;
    customColor?: string;
}

export default function PublicInvoice({
    invoice,
    templateId = 'template1',
    color = 'ffffff',
    qrEnabled = false,
    settings = {},
    themeColor = 'blue',
    customColor = null,
}: Props) {
    const { t: translate } = useTranslation();
    const { props } = usePage<any>();
    const globalSettings = props.globalSettings;
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const auth = props.auth || {};
    const permissions = auth?.permissions || [];

    // Handle flash messages
    useEffect(() => {
        if (props.flash?.success) {
            toast.success(translate(props.flash.success));
        }
        if (props.flash?.error) {
            toast.error(translate(props.flash.error));
        }
    }, [props.flash, t]);

    const themeColors = { blue: '#A12582', green: '#10b77f', purple: '#8b5cf6', orange: '#f97316', red: '#ef4444' };
    const currentThemeColor = themeColor === 'custom' ? customColor : themeColors[themeColor as keyof typeof themeColors] || '#A12582';
    const template = { primary: currentThemeColor, secondary: currentThemeColor };

    // Calculate paid amount from completed payments
    const paidAmount =
        invoice.payments?.reduce((total, payment) => {
            const amount = Number(payment.amount) || 0;
            return payment.status === 'completed' ? total + amount : total;
        }, 0) || 0;

    // Calculate due amount
    const dueAmount = Math.max(0, (Number(invoice.total_amount) || 0) - paidAmount);

    const [paymentAmount, setPaymentAmount] = useState(dueAmount);

    const formatCurrency = (amount: number) => {
        const val = window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;
        return <span className="font-mono">{val}</span>;
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return translate('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
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

    const items = invoice.products.map((product: any) => {
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

    const taxesData = invoice.products.reduce((acc: any, product: any) => {
        if (product.tax) {
            const lineTotal = product.pivot.quantity * product.pivot.unit_price;
            const discountAmount = product.pivot.discount_amount || 0;
            const afterDiscount = lineTotal - discountAmount;
            const taxAmount = (afterDiscount * product.tax.rate) / 100;
            acc[product.tax.name] = (acc[product.tax.name] || 0) + taxAmount;
        }
        return acc;
    }, {});

    const invoiceData = {
        ...invoice,
        invoice_date: formatDate(invoice.invoice_date || new Date().toISOString()),
        due_date: formatDate(invoice.due_date || new Date().toISOString()),
        sub_total: subtotal,
        total_tax: totalTax,
        total_amount: grandTotal,
        totalQuantity: invoice.products.reduce((sum: number, p: any) => sum + p.pivot.quantity, 0),
        totalRate: invoice.products.reduce((sum: number, p: any) => sum + p.pivot.quantity * p.pivot.unit_price, 0),
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

    const copyInvoiceLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {}
    };

    return (
        <>
            <Head title={translate('Invoice {{invoiceNumber}}', { invoiceNumber: invoice.invoice_number })}>
                {settings?.favicon && <link rel="icon" href={resolveImageUrl(settings.favicon, props.globalSettings)} />}
            </Head>

            <div className="min-h-screen bg-gray-50 py-8 dark:from-gray-900 dark:to-gray-800 print:m-0 print:bg-white print:p-0">
                <div className="print-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Action Bar */}
                    <div className="mb-8 flex flex-col items-start justify-between sm:flex-row sm:items-center print:hidden">
                        <div className="mb-4 sm:mb-0">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{translate('Invoice Details')}</h1>
                            <p className="mt-1 text-gray-600 dark:text-gray-400">{translate('View and manage your invoice')}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {useHasPermission('view-invoices') && (
                                <button
                                    onClick={copyInvoiceLink}
                                    className="inline-flex cursor-pointer items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-700"
                                >
                                    {copied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
                                    {copied ? translate('Copied!') : translate('Copy Link')}
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
                                {translate('Print Invoice')}
                            </button>
                            {invoice.status !== 'paid' && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="inline-flex transform cursor-pointer items-center rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                                    style={{
                                        background: `linear-gradient(135deg, ${currentThemeColor}, ${currentThemeColor}dd)`,
                                        ':hover': { filter: 'brightness(0.9)' },
                                    }}
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    {invoice.status === 'partially_paid' ? translate('Pay Remaining') : translate('Pay Invoice')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Template for Print */}
                    <div className="hidden print:block">
                        <IframePortal ref={iframeRef}>
                            <TemplateComponent
                                invoice={invoiceData}
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
                                    <h1 className="text-2xl leading-tight font-bold text-gray-900">{invoice.name}</h1>
                                    <p className="mt-2 max-w-3xl text-base leading-relaxed text-gray-600">
                                        {invoice.description || translate('No description provided')}
                                    </p>
                                </div>
                                <div className="ml-6 text-right">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                            invoice.status === 'paid'
                                                ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                : invoice.status === 'partially_paid'
                                                  ? 'bg-orange-50 text-orange-700 ring-orange-600/20'
                                                  : invoice.status === 'sent'
                                                    ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                                    : invoice.status === 'overdue'
                                                      ? 'bg-red-50 text-red-700 ring-red-600/20'
                                                      : invoice.status === 'cancelled'
                                                        ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                                                        : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                                        }`}
                                    >
                                        {invoice.status === 'partially_paid'
                                            ? translate('Partially Paid')
                                            : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                    </span>
                                    <p className="mt-2 font-mono text-sm font-medium text-gray-700">{invoice.invoice_number}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary Cards */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-lg">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500">{translate('Total Amount')}</p>
                                            <h3 className="mt-2 text-2xl leading-none font-bold" style={{ color: template.primary }}>
                                                {formatCurrency(invoice.total_amount)}
                                            </h3>
                                        </div>
                                        <div className="rounded-full p-4" style={{ backgroundColor: `${template.primary}15` }}>
                                            <DollarSign className="h-5 w-5" style={{ color: template.primary }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-lg">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500">{translate('Paid Amount')}</p>
                                            <h3 className="mt-2 text-2xl leading-none font-bold" style={{ color: template.secondary }}>
                                                {formatCurrency(paidAmount)}
                                            </h3>
                                        </div>
                                        <div className="rounded-full p-4" style={{ backgroundColor: `${template.secondary}15` }}>
                                            <DollarSign className="h-5 w-5" style={{ color: template.secondary }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-lg">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500">{translate('Due Amount')}</p>
                                            <h3 className="mt-2 text-2xl leading-none font-bold text-red-600">{formatCurrency(dueAmount)}</h3>
                                        </div>
                                        <div className="rounded-full bg-red-100 p-4">
                                            <DollarSign className="h-5 w-5 text-red-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Details Cards */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-lg">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500">{translate('Products')}</p>
                                            <h3 className="mt-2 text-2xl leading-none font-bold" style={{ color: template.primary }}>
                                                {invoice.products?.length || 0}
                                            </h3>
                                        </div>
                                        <div className="rounded-full p-4" style={{ backgroundColor: `${template.primary}15` }}>
                                            <Package className="h-5 w-5" style={{ color: template.primary }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-lg">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500">{translate('Invoice Date')}</p>
                                            <h3 className="mt-2 text-lg leading-tight font-bold" style={{ color: template.secondary }}>
                                                {formatDate(invoice.invoice_date)}
                                            </h3>
                                        </div>
                                        <div className="rounded-full p-4" style={{ backgroundColor: `${template.secondary}15` }}>
                                            <Calendar className="h-5 w-5" style={{ color: template.secondary }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-lg">
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-500">{translate('Due Date')}</p>
                                            <h3 className="mt-2 text-lg leading-tight font-bold text-amber-600">{formatDate(invoice.due_date)}</h3>
                                        </div>
                                        <div className="rounded-full bg-amber-100 p-4">
                                            <FileText className="h-5 w-5 text-amber-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Billing Details */}
                        <div className="rounded-lg border bg-white shadow-sm">
                            <div className="border-b px-8 py-6" style={{ backgroundColor: `${template.primary}25` }}>
                                <h3 className="flex items-center text-xl font-bold text-gray-800">
                                    <User className="mr-3 h-5 w-5" />
                                    {translate('Billing Details')}
                                </h3>
                            </div>
                            <div className="p-8">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <h4 className="mb-4 flex items-center text-lg font-bold text-gray-900 dark:text-gray-100">
                                            <MapPin className="mr-2 h-5 w-5" style={{ color: template.primary }} />
                                            {translate('Bill To')}
                                        </h4>
                                        {invoice.account && (
                                            <div className="space-y-2">
                                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{invoice.account.name}</p>
                                                {invoice.account.email && <p className="text-gray-600 dark:text-gray-300">{invoice.account.email}</p>}
                                                {invoice.account.phone && <p className="text-gray-600 dark:text-gray-300">{invoice.account.phone}</p>}
                                            </div>
                                        )}
                                        {invoice.contact && !invoice.account && (
                                            <div className="space-y-2">
                                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{invoice.contact.name}</p>
                                                {invoice.contact.email && <p className="text-gray-600 dark:text-gray-300">{invoice.contact.email}</p>}
                                                {invoice.contact.phone && <p className="text-gray-600 dark:text-gray-300">{invoice.contact.phone}</p>}
                                            </div>
                                        )}
                                        {invoice.billing_address && (
                                            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
                                                <p className="text-gray-700 dark:text-gray-300">{invoice.billing_address}</p>
                                                <p className="text-gray-700 dark:text-gray-300">
                                                    {invoice.billing_city && `${invoice.billing_city}, `}
                                                    {invoice.billing_state && `${invoice.billing_state} `}
                                                    {invoice.billing_postal_code}
                                                </p>
                                                {invoice.billing_country && (
                                                    <p className="text-gray-700 dark:text-gray-300">{invoice.billing_country}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="mb-4 flex items-center text-lg font-bold text-gray-900 dark:text-gray-100">
                                            <Calendar className="mr-2 h-5 w-5" style={{ color: template.primary }} />
                                            {translate('Invoice Details')}
                                        </h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between border-b border-gray-200 py-2 dark:border-gray-600">
                                                <span className="font-medium text-gray-600 dark:text-gray-300">{translate('Invoice Date')}:</span>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {formatDate(invoice.invoice_date)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between border-b border-gray-200 py-2 dark:border-gray-600">
                                                <span className="font-medium text-gray-600 dark:text-gray-300">{translate('Due Date')}:</span>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(invoice.due_date)}</span>
                                            </div>
                                            {invoice.payment_method && (
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="flex items-center font-medium text-gray-600 dark:text-gray-300">
                                                        <CreditCard className="mr-1 h-4 w-4" />
                                                        {translate('Payment Method')}:
                                                    </span>
                                                    <span className="font-semibold text-gray-900 capitalize dark:text-gray-100">
                                                        {invoice.payment_method}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products */}
                        <div className="rounded-lg border bg-white shadow-sm">
                            <div className="border-b bg-gray-50 px-8 py-6">
                                <h3 className="flex items-center text-xl font-bold text-gray-800">
                                    <Package className="mr-3 h-5 w-5" />
                                    {translate('Products')}
                                </h3>
                            </div>
                            <div className="p-0">
                                {invoice.products && invoice.products.length > 0 ? (
                                    <div className="overflow-hidden">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr style={{ backgroundColor: template.primary }}>
                                                    <th className="w-1/3 px-6 py-4 text-left text-base font-bold text-white">
                                                        {translate('Product')}
                                                    </th>
                                                    <th className="px-4 py-4 text-right text-base font-bold text-white">{translate('Quantity')}</th>
                                                    <th className="px-4 py-4 text-right text-base font-bold text-white">{translate('Unit Price')}</th>
                                                    <th className="px-4 py-4 text-right text-base font-bold text-white">{translate('Discount')}</th>
                                                    <th className="px-4 py-4 text-right text-base font-bold text-white">{translate('Tax')}</th>
                                                    <th className="w-1/6 px-4 py-4 text-right text-base font-bold text-white">
                                                        {translate('Total')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoice.products.map((product: any, index: number) => {
                                                    const lineTotal = Number(product.pivot.total_price) || 0;
                                                    const discountAmount = Number(product.pivot.discount_amount) || 0;
                                                    const finalTotal = lineTotal - discountAmount;

                                                    return (
                                                        <tr key={index} className="border-b hover:bg-gray-50">
                                                            <td className="px-6 py-4 text-base font-semibold text-gray-900">{product.name}</td>
                                                            <td className="px-4 py-4 text-right text-base font-medium">{product.pivot.quantity}</td>
                                                            <td className="px-4 py-4 text-right text-base font-semibold">
                                                                {formatCurrency(product.pivot.unit_price)}
                                                            </td>
                                                            <td className="px-4 py-4 text-right">
                                                                {product.pivot.discount_type &&
                                                                product.pivot.discount_type !== 'none' &&
                                                                product.pivot.discount_value > 0 ? (
                                                                    <div className="text-base">
                                                                        <div className="font-semibold text-gray-700">
                                                                            {product.pivot.discount_type === 'percentage'
                                                                                ? `${Number(product.pivot.discount_value)}%`
                                                                                : formatCurrency(Number(product.pivot.discount_value))}
                                                                        </div>
                                                                        <div className="font-bold text-red-600">
                                                                            (-{formatCurrency(discountAmount)})
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="font-medium text-gray-500">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4 text-right text-base">
                                                                {product.tax ? (
                                                                    <div>
                                                                        <span className="text-muted-foreground text-sm font-medium">
                                                                            {product.tax.name} ({parseFloat(product.tax.rate).toFixed(2)}%)
                                                                        </span>
                                                                        <div className="text-sm font-semibold text-gray-900">
                                                                            {formatCurrency(finalTotal * (product.tax.rate / 100))}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="font-medium text-gray-500">{translate('No Tax')}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-4 text-right text-base font-bold">
                                                                {discountAmount > 0 ? (
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-400 line-through">
                                                                            {formatCurrency(lineTotal)}
                                                                        </div>
                                                                        <div className="font-semibold text-green-600">
                                                                            {formatCurrency(finalTotal)}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="font-semibold text-green-600">{formatCurrency(lineTotal)}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr style={{ backgroundColor: `${template.primary}10` }}>
                                                    <td colSpan={4} className="px-4 py-3"></td>
                                                    <td className="px-4 py-3 text-right text-base font-semibold" style={{ color: template.primary }}>
                                                        {translate('Discount')}:
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-base font-semibold" style={{ color: template.primary }}>
                                                        -{formatCurrency(totalDiscount)}
                                                    </td>
                                                </tr>
                                                <tr style={{ backgroundColor: `${template.primary}10` }}>
                                                    <td colSpan={4} className="px-4 py-3"></td>
                                                    <td className="px-4 py-3 text-right text-base font-semibold" style={{ color: template.primary }}>
                                                        {translate('Subtotal')}:
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-base font-semibold" style={{ color: template.primary }}>
                                                        {formatCurrency(invoice.subtotal)}
                                                    </td>
                                                </tr>
                                                <tr style={{ backgroundColor: `${template.primary}10` }}>
                                                    <td colSpan={4} className="px-4 py-3"></td>
                                                    <td className="px-4 py-3 text-right text-base font-semibold" style={{ color: template.primary }}>
                                                        {translate('Tax')}:
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-base font-semibold" style={{ color: template.primary }}>
                                                        {formatCurrency(invoice.tax_amount)}
                                                    </td>
                                                </tr>
                                                <tr
                                                    className="border-t-2"
                                                    style={{ backgroundColor: `${template.primary}15`, borderTopColor: template.primary }}
                                                >
                                                    <td colSpan={4} className="px-4 py-4"></td>
                                                    <td className="px-4 py-4 text-right text-lg font-bold" style={{ color: template.primary }}>
                                                        {translate('Grand Total')}:
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="text-xl font-bold" style={{ color: template.primary }}>
                                                            {formatCurrency(invoice.total_amount)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-16 text-center text-gray-500">
                                        <Package className="mx-auto mb-6 h-16 w-16 text-gray-300" />
                                        <p className="text-lg font-medium">{translate('No products added to this invoice')}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Notes and Terms */}
                        {(invoice.notes || invoice.terms) && (
                            <div className="rounded-lg border bg-white shadow-sm">
                                <div className="border-b px-8 py-6" style={{ backgroundColor: `${template.primary}25` }}>
                                    <h3 className="text-xl font-bold text-gray-800">{translate('Additional Information')}</h3>
                                </div>
                                <div className="p-8">
                                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                        {invoice.notes && (
                                            <div>
                                                <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                                                    {translate('Notes')}
                                                </label>
                                                <p className="mt-2 text-base leading-relaxed text-gray-700">{invoice.notes}</p>
                                            </div>
                                        )}
                                        {invoice.terms && (
                                            <div>
                                                <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                                                    {translate('Terms')}
                                                </label>
                                                <p className="mt-2 text-base leading-relaxed text-gray-700">{invoice.terms}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payments */}
                        {invoice.payments && invoice.payments.length > 0 && (
                            <div className="rounded-lg border bg-white shadow-sm">
                                <div className="border-b bg-gray-50 px-8 py-6">
                                    <h3 className="flex items-center text-xl font-bold text-gray-800">
                                        <DollarSign className="mr-3 h-5 w-5" />
                                        {translate('Payment History')}
                                    </h3>
                                </div>
                                <div className="p-0">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr style={{ backgroundColor: template.primary }}>
                                                <th className="w-1/4 px-6 py-4 text-left text-base font-bold text-white">{translate('Date')}</th>
                                                <th className="w-1/4 px-4 py-4 text-left text-base font-bold text-white">{translate('Method')}</th>
                                                <th className="w-1/4 px-4 py-4 text-right text-base font-bold text-white">{translate('Amount')}</th>
                                                <th className="w-1/4 px-4 py-4 text-left text-base font-bold text-white">{translate('Status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.payments.map((payment: any, index: number) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                    <td className="px-6 py-4">{formatDate(payment.processed_at || payment.created_at)}</td>
                                                    <td className="px-4 py-4 capitalize">{payment.payment_method}</td>
                                                    <td className="px-4 py-4 text-right font-semibold">{formatCurrency(payment.amount)}</td>
                                                    <td className="px-4 py-4 capitalize">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                                payment.status === 'completed'
                                                                    ? 'bg-green-50 text-green-800 ring-green-600/20'
                                                                    : payment.status === 'pending'
                                                                      ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                                                                      : 'bg-red-50 text-red-800 ring-red-600/20'
                                                            }`}
                                                        >
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            <div className="print:hidden">
                {showPaymentModal && (
                    <InvoicePaymentModal
                        isOpen={showPaymentModal}
                        onClose={() => setShowPaymentModal(false)}
                        invoice={invoice}
                        amount={paymentAmount}
                        onAmountChange={setPaymentAmount}
                    />
                )}
            </div>
        </>
    );
}
