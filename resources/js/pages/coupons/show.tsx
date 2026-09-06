import { PageTemplate } from '@/components/page-template';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CouponUsage {
    id: number;
    user_name: string;
    user_email: string;
    order_id: string;
    amount: number;
    discount_amount: number;
    used_at: string;
}

interface CouponData {
    id: number;
    name: string;
    code: string;
    type: string;
    discount_amount: number;
    minimum_spend?: number;
    maximum_spend?: number;
    use_limit_per_coupon?: number;
    use_limit_per_user?: number;
    used_count: number;
    expiry_date?: string;
    status: boolean;
    created_at: string;
    creator: {
        name: string;
        email: string;
    };
}

export default function CouponDetailsPage() {
    const { t: translate } = useTranslation();
    const { coupon, usage_history } = usePage().props as { coupon: CouponData; usage_history: any };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Coupons'), href: route('coupons.index') },
        { title: translate('Coupon Details') },
    ];

    const usageColumns = [
        { key: 'user_name', label: translate('User'), sortable: true },
        { key: 'user_email', label: translate('Email'), sortable: true },
        { key: 'order_id', label: translate('Order ID'), sortable: true },
        {
            key: 'amount',
            label: translate('Order Amount'),
            render: (value: number) => <span className="font-mono">{window.appSettings?.formatCurrency(value) || `$${value.toFixed(2)}`}</span>,
        },
        {
            key: 'discount_amount',
            label: translate('Discount Applied'),
            render: (value: number) => <span className="font-mono">{window.appSettings?.formatCurrency(value) || `$${value.toFixed(2)}`}</span>,
        },
        {
            key: 'used_at',
            label: translate('Used At'),
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-1.5 whitespace-nowrap text-gray-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{window.appSettings?.formatDateTime(value, false) || value}</span>
                </div>
            ),
        },
    ];

    const formatDiscount = (type: string, amount: number) => {
        return type === 'percentage' ? `${amount}%` : window.appSettings?.formatCurrency(amount) || `$${amount.toFixed(2)}`;
    };

    const getStatusBadge = (status: boolean) => {
        return status ? (
            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                {translate('Active')}
            </span>
        ) : (
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/20 ring-inset">
                {translate('Inactive')}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        const className = type === 'percentage' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-green-50 text-green-700 ring-blue-600/20';
        const label = type === 'percentage' ? translate('Percentage') : translate('Flat Amount');
        return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${className}`}>{label}</span>;
    };
    return (
        <PageTemplate
            title={coupon.name}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => window.history.back(),
                },
            ]}
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-l font-bold">{translate('Coupon Details & Usage History')}</p>
                        </div>
                    </div>
                    {getStatusBadge(coupon.status)}
                </div>

                {/* Coupon Info Cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Discount Value')}</p>
                                    <h3 className="mt-2 font-mono text-xl font-semibold">{formatDiscount(coupon.type, coupon.discount_amount)}</h3>
                                </div>
                                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Times Used')}</p>
                                    <h3 className="mt-2 text-xl font-semibold">
                                        {coupon.used_count}
                                        {coupon.use_limit_per_coupon && ` / ${coupon.use_limit_per_coupon}`}
                                    </h3>
                                </div>
                                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('User Limit')}</p>
                                    <h3 className="mt-2 text-xl font-semibold"> {coupon.use_limit_per_user || translate('Unlimited')}</h3>
                                </div>
                                <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Expires')}</p>
                                    <h3 className="mt-2 text-xl font-semibold">
                                        {' '}
                                        {coupon.expiry_date
                                            ? window.appSettings?.formatDateTime(coupon.expiry_date, false) || coupon.expiry_date
                                            : translate('Never')}
                                    </h3>
                                </div>
                                <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                                    <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coupon Details */}
                <Card className="p-6">
                    <h2 className="mb-4 text-lg font-semibold">{translate('Coupon Information')}</h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold">{translate('Coupon Code')}</label>
                                <p className="mt-1 rounded bg-gray-100 px-3 py-2 font-mono text-base dark:bg-gray-800">{coupon.code}</p>
                            </div>
                            <div>
                                <label className="text-sm font-bold">{translate('Type')}</label>
                                <div className="mt-1 py-2">{getTypeBadge(coupon.type)}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {coupon.minimum_spend && (
                                <div>
                                    <label className="text-sm font-bold">{translate('Minimum Spend')}</label>
                                    <p className="mt-1 py-2 font-mono text-sm">
                                        {window.appSettings?.formatCurrency(coupon.minimum_spend) || `$${coupon.minimum_spend.toFixed(2)}`}
                                    </p>
                                </div>
                            )}
                            {coupon.maximum_spend && (
                                <div>
                                    <label className="text-sm font-bold">{translate('Maximum Spend')}</label>
                                    <p className="mt-1 py-2 font-mono text-sm">
                                        {window.appSettings?.formatCurrency(coupon.maximum_spend) || `$${coupon.maximum_spend.toFixed(2)}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Usage History */}
                <Card className="p-6">
                    <h2 className="mb-4 text-lg font-semibold">{translate('Usage History')}</h2>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {usageColumns.map((column) => (
                                        <TableHead key={column.key}>{column.label}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {usage_history.data && usage_history.data.length > 0 ? (
                                    usage_history.data.map((item: any, index: number) => (
                                        <TableRow key={index}>
                                            {usageColumns.map((column) => (
                                                <TableCell key={column.key}>
                                                    {column.render ? column.render(item[column.key]) : item[column.key]}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={usageColumns.length} className="py-8 text-center text-gray-500">
                                            {translate('No usage history found')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {usage_history.last_page > 1 && (
                        <div className="mt-4 overflow-hidden rounded-lg border dark:border-gray-700">
                            <Pagination
                                from={usage_history.from || 0}
                                to={usage_history.to || 0}
                                total={usage_history.total || 0}
                                currentPage={usage_history.current_page}
                                lastPage={usage_history.last_page}
                                entityName={translate('records')}
                                onPageChange={(url) => {
                                    const urlObj = new URL(url, window.location.origin);
                                    const page = urlObj.searchParams.getranslate('page');
                                    window.location.href = route('coupons.show', {
                                        coupon: coupon.id,
                                        page: page,
                                    });
                                }}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </PageTemplate>
    );
}
