import { PageTemplate } from '@components/page-template';
import { ReportFilters } from '@components/Reports/ReportFilters';
import { SummaryCards } from '@components/Reports/SummaryCards';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { Tabs, TabsList, TabsTrigger } from '@components/UserInterface/tabs';
import { Link, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowUpRight, Calendar, DollarSign, Package, ShoppingCart, Target, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function SalesReports() {
    const { t: translate } = useTranslation();
    const { filters, summary, monthlyData, dailyData, salesByStatus, recentSales, topProducts } = usePage().props;
    const [chartView, setChartView] = useState<'daily' | 'monthly'>('monthly');
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');

    useEffect(() => {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        if (raw) setPrimaryColor(raw);
    }, []);

    const chartData = chartView === 'daily' ? dailyData : monthlyData;

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Reports'), href: '#' },
        { title: translate('Sales Reports') },
    ];

    const summaryCards = [
        {
            title: translate('Total Sales'),
            value: (
                <span className="font-mono">
                    {window.appSettings?.formatCurrency(summary.total_sales) || `$${summary.total_sales.toLocaleString()}`}
                </span>
            ),
            icon: <DollarSign className="h-6 w-6 text-green-600" />,
            iconColor: 'bg-green-100',
        },
        {
            title: translate('Total Orders'),
            value: summary.total_orders.toLocaleString(),
            icon: <ShoppingCart className="h-6 w-6 text-blue-600" />,
            iconColor: 'bg-blue-100',
        },
        {
            title: translate('Average Order Value'),
            value: (
                <span className="font-mono">
                    {window.appSettings?.formatCurrency(summary.avg_order_value) || `$${summary.avg_order_value.toLocaleString()}`}
                </span>
            ),
            icon: <Target className="h-6 w-6 text-purple-600" />,
            iconColor: 'bg-purple-100',
        },
        {
            title: translate('Growth Rate'),
            value: `${summary.growth_rate.toFixed(2)}%`,
            icon: <TrendingUp className="h-6 w-6 text-orange-600" />,
            iconColor: 'bg-orange-100',
        },
    ];

    return (
        <PageTemplate
            title={translate('Sales Reports')}
            description={translate('View and analyze sales reports to track revenue and performance.')}
            url="/reports/sales"
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <SummaryCards cards={summaryCards} />
            <ReportFilters filters={filters} />

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="col-span-full">
                    <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-semibold">{translate('Sales Trends')}</CardTitle>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Tabs value={chartView} onValueChange={(v) => setChartView(v as 'daily' | 'monthly')}>
                                        <TabsList className="h-7">
                                            <TabsTrigger value="daily" className="cursor-pointer px-3 py-1 text-xs">
                                                {translate('Daily')}
                                            </TabsTrigger>
                                            <TabsTrigger value="monthly" className="cursor-pointer px-3 py-1 text-xs">
                                                {translate('Monthly')}
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-5" dir="ltr">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData || []} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 11, fill: 'currentColor' }}
                                        className="text-muted-foreground"
                                        axisLine={{ stroke: primaryColor }}
                                        tickLine={{ stroke: primaryColor }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: 'currentColor' }}
                                        className="text-muted-foreground"
                                        axisLine={{ stroke: primaryColor }}
                                        tickLine={{ stroke: primaryColor }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 8,
                                            border: `1px solid ${primaryColor}30`,
                                            backgroundColor: 'rgba(255,255,255,0.7)',
                                            color: primaryColor,
                                        }}
                                        itemStyle={{ color: primaryColor }}
                                        labelStyle={{ color: primaryColor }}
                                        formatter={(value) => [
                                            window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`,
                                            translate('Revenue'),
                                        ]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke={primaryColor}
                                        name={translate('Revenue')}
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-full">
                    <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <CardTitle className="text-base font-semibold">{translate('Sales by Status')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-5" dir="ltr">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={salesByStatus || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                                    <XAxis
                                        dataKey="status"
                                        tick={{ fontSize: 11, fill: 'currentColor' }}
                                        className="text-muted-foreground"
                                        axisLine={{ stroke: primaryColor }}
                                        tickLine={{ stroke: primaryColor }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: 'currentColor' }}
                                        className="text-muted-foreground"
                                        axisLine={{ stroke: primaryColor }}
                                        tickLine={{ stroke: primaryColor }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: `${primaryColor}10` }}
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 8,
                                            border: `1px solid ${primaryColor}30`,
                                            backgroundColor: 'rgba(255,255,255,0.7)',
                                            color: primaryColor,
                                        }}
                                        itemStyle={{ color: primaryColor }}
                                        labelStyle={{ color: primaryColor }}
                                        formatter={(value) => [
                                            window.appSettings?.formatCurrency(Number(value)) || `$${Number(value).toLocaleString()}`,
                                            translate('Amount'),
                                        ]}
                                    />
                                    <Bar dataKey="amount" fill={primaryColor} radius={[4, 4, 0, 0]} maxBarSize={60} opacity={0.8} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border col-span-full flex h-full flex-col overflow-hidden border shadow-sm lg:col-span-1 dark:bg-slate-900">
                    <CardHeader className="shrink-0 border-b px-5 pt-5 pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">{translate('Recent Sales')}</CardTitle>
                                <p className="text-muted-foreground mt-0.5 text-xs">{translate('Latest sales orders')}</p>
                            </div>
                            <Link
                                href={route('sales-orders.index')}
                                className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
                            >
                                {translate('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col p-0">
                        {recentSales && recentSales.length > 0 ? (
                            <div className="flex-1">
                                {recentSales.map((sale: any, i: number) => (
                                    <div
                                        key={i}
                                        className="hover:bg-muted/50 group/row flex min-h-[72px] items-center gap-3 border-b px-5 py-3.5 transition-colors duration-150 last:border-0 dark:hover:bg-slate-800/60"
                                    >
                                        {/* <div className="shrink-0 h-8 w-8 flex items-center justify-center">
                      <UserInitials name={sale.account?.name || sale.name || 'Unknown'} />
                    </div> */}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm leading-tight font-semibold">
                                                {sale.account?.name || sale.name || 'Unknown'}
                                            </p>
                                            <p className="text-muted-foreground mt-0.5 truncate text-xs">{sale.order_number}</p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className={`text-foreground inline-flex items-center text-sm font-bold`}>
                                                {window.appSettings?.formatCurrency(sale.total_amount) || `$${sale.total_amount}`}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                                                <Calendar className="h-3 w-3 shrink-0" />
                                                {window.appSettings?.formatDateTime(sale.created_at, false) ||
                                                    new Date(sale.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[160px] flex-1 flex-col items-center justify-center gap-3">
                                <p className="text-muted-foreground text-sm">{translate('No recent sales found')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border col-span-full flex h-full flex-col overflow-hidden border shadow-sm lg:col-span-1 dark:bg-slate-900">
                    <CardHeader className="shrink-0 border-b px-5 pt-5 pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">{translate('Top Selling Products')}</CardTitle>
                                <p className="text-muted-foreground mt-0.5 text-xs">{translate('Highest revenue products')}</p>
                            </div>
                            <Link
                                href={route('products.index')}
                                className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
                            >
                                {translate('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col p-0">
                        {topProducts && topProducts.length > 0 ? (
                            <div className="flex-1">
                                {topProducts.map((product: any, i: number) => (
                                    <div
                                        key={i}
                                        className="hover:bg-muted/50 group/row flex min-h-[72px] items-center gap-3 border-b px-5 py-3.5 transition-colors duration-150 last:border-0 dark:hover:bg-slate-800/60"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                                            {product.image ? (
                                                <a
                                                    href={product.image}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex h-full w-full items-center justify-center"
                                                >
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="max-h-full max-w-full rounded-lg object-contain"
                                                        onError={(e) => {
                                                            const target = e.currentTarget as HTMLImageElement;

                                                            if (!target.src.startsWith('data:image/svg+xml')) {
                                                                target.src =
                                                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBMMTQwIDgwVjE0MEwxMDAgMTYwTDYwIDE0MFY4MEwxMDAgNjBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSI4NSIgY3k9Ijk1IiByPSI4IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik03MCAxMzBMODUgMTE1TDEwMCAxMzBMMTMwIDEwMEwxMzAgMTMwSDcwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                                                            } else {
                                                                target.style.display = 'none';

                                                                const icon = target.nextElementSibling as HTMLElement;
                                                                if (icon) {
                                                                    icon.style.display = 'flex';
                                                                }
                                                            }
                                                        }}
                                                    />

                                                    <Package className="hidden h-6 w-6 text-gray-400" />
                                                </a>
                                            ) : (
                                                <Package className="h-6 w-6 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm leading-tight font-semibold">{product.name}</p>
                                            <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                {product.total_quantity} {translate('units sold')}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className={`text-foreground inline-flex items-center text-sm font-bold`}>
                                                {window.appSettings?.formatCurrency(product.total_revenue) || `$${product.total_revenue}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[160px] flex-1 flex-col items-center justify-center gap-3">
                                <p className="text-muted-foreground text-sm">{translate('No products sold yet')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
