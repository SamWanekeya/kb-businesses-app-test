import { PageTemplate } from '@/components/page-template';
import { ReportFilters } from '@/components/reports/report-filters';
import { SummaryCards } from '@/components/reports/summary-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePage } from '@inertiajs/react';
import { Award, CheckCircle, DollarSign, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ProductReports() {
    const { t: translate } = useTranslation();
    const { filters, summary, productSales, topProductsByQuantity, lowStockProducts, outOfStockProducts } = usePage().props;
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');

    useEffect(() => {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        if (raw) setPrimaryColor(raw);
    }, []);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Reports'), href: '#' },
        { title: translate('Product Reports') },
    ];

    const summaryCards = [
        {
            title: translate('Total Products'),
            value: summary.total_products.toLocaleString(),
            icon: <Package className="h-6 w-6 text-blue-600" />,
            iconColor: 'bg-blue-100',
        },
        {
            title: translate('Active Products'),
            value: summary.active_products.toLocaleString(),
            icon: <CheckCircle className="h-6 w-6 text-green-600" />,
            iconColor: 'bg-green-100',
        },
        {
            title: translate('Total Revenue'),
            value: (
                <span className="font-mono">
                    {window.appSettings?.formatCurrency(summary.total_revenue) || `$${summary.total_revenue.toLocaleString()}`}
                </span>
            ),
            icon: <DollarSign className="h-6 w-6 text-purple-600" />,
            iconColor: 'bg-purple-100',
        },
        {
            title: translate('Best Seller'),
            value: summary.best_seller || translate('-'),
            icon: <Award className="h-6 w-6 text-orange-600" />,
            iconColor: 'bg-orange-100',
        },
    ];

    const topProducts = productSales.slice(0, 10);

    return (
        <PageTemplate
            title={translate('Product Reports')}
            description={translate('View and analyze product reports to track performance and sales.')}
            url={route('reports.product-reports')}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <SummaryCards cards={summaryCards} />
            <ReportFilters filters={filters} />

            <div className="mb-6 grid grid-cols-1 gap-6">
                <Card className="border-border flex h-full flex-col overflow-hidden border shadow-sm dark:bg-slate-900">
                    <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b px-5 pt-5 pb-3">
                        <CardTitle className="text-base font-semibold">{translate('Top Products by Revenue')}</CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-0 flex-1 p-4 pt-5" dir="ltr">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={topProducts} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} horizontal={false} vertical={true} />
                                <XAxis
                                    type="number"
                                    tick={{ fontSize: 11, fill: 'currentColor' }}
                                    className="text-muted-foreground"
                                    axisLine={{ stroke: primaryColor }}
                                    tickLine={{ stroke: primaryColor }}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={150}
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
                                        translate('Revenue'),
                                    ]}
                                />
                                <Bar dataKey="revenue" fill={primaryColor} radius={[0, 4, 4, 0]} maxBarSize={30} opacity={0.8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                    <div className="border-b px-5 py-5">
                        <h3 className="text-base font-semibold">{translate('Low Stock Products')}</h3>

                        <p className="text-muted-foreground mt-0.5 text-xs">{translate('Inventory between 1 and 10')}</p>
                    </div>

                    <div className="custom-scrollbar max-h-[340px] overflow-y-auto">
                        {lowStockProducts && lowStockProducts.length > 0 ? (
                            <div>
                                {lowStockProducts.map((product: any) => (
                                    <div
                                        key={product.id}
                                        className="hover:bg-muted/50 flex min-h-[64px] items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 p-1 dark:bg-gray-700">
                                                {product.main_image_url ? (
                                                    <a
                                                        href={product.main_image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex h-full w-full items-center justify-center"
                                                    >
                                                        <img
                                                            src={product.main_image_url}
                                                            alt={product.name}
                                                            className="max-h-full max-w-full rounded-md object-contain"
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

                                                        <Package className="text-muted-foreground hidden h-5 w-5" />
                                                    </a>
                                                ) : (
                                                    <Package className="text-muted-foreground h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm leading-tight font-semibold">{product.name}</p>

                                                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                    SKU: {product.sku || translate('N/A')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                            {product.stock_quantity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-[200px] flex-col items-center justify-center gap-3">
                                <p className="text-muted-foreground text-sm">{translate('No low stock products')}</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                    <div className="border-b px-5 py-5">
                        <h3 className="text-base font-semibold">{translate('Out of Stock Products')}</h3>

                        <p className="text-muted-foreground mt-0.5 text-xs">{translate('Inventory at 0')}</p>
                    </div>

                    <div className="custom-scrollbar max-h-[340px] overflow-y-auto">
                        {outOfStockProducts && outOfStockProducts.length > 0 ? (
                            <div>
                                {outOfStockProducts.map((product: any) => (
                                    <div
                                        key={product.id}
                                        className="hover:bg-muted/50 flex min-h-[64px] items-center justify-between gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 p-1 dark:bg-gray-700">
                                                {product.main_image_url ? (
                                                    <a
                                                        href={product.main_image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex h-full w-full items-center justify-center"
                                                    >
                                                        <img
                                                            src={product.main_image_url}
                                                            alt={product.name}
                                                            className="max-h-full max-w-full rounded-md object-contain"
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

                                                        <Package className="text-muted-foreground hidden h-5 w-5" />
                                                    </a>
                                                ) : (
                                                    <Package className="text-muted-foreground h-5 w-5" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm leading-tight font-semibold">{product.name}</p>

                                                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                    SKU: {product.sku || translate('N/A')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            {product.stock_quantity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-40 items-center justify-center">
                                <p className="text-muted-foreground text-sm">{translate('No out of stock products')}</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="border-border col-span-full overflow-hidden border shadow-sm dark:bg-slate-900">
                    <div className="border-b px-5 py-5">
                        <h3 className="text-base font-semibold">{translate('Top 5 Products by Quantity Sold')}</h3>
                        <p className="text-muted-foreground mt-0.5 text-xs">{translate('Highest moving inventory')}</p>
                    </div>
                    <div className="p-0">
                        {topProductsByQuantity && topProductsByQuantity.length > 0 ? (
                            <div>
                                {topProductsByQuantity.map((product: any, index: number) => (
                                    <div
                                        key={index}
                                        className="hover:bg-muted/50 group/row flex min-h-[72px] items-center gap-3 border-b px-5 py-3.5 transition-colors duration-150 last:border-0 dark:hover:bg-slate-800/60"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 p-1 dark:bg-gray-700">
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
                                                        className="max-h-full max-w-full rounded-md object-contain"
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

                                                    <Package className="text-muted-foreground hidden h-5 w-5" />
                                                </a>
                                            ) : (
                                                <Package className="text-muted-foreground h-5 w-5" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm leading-tight font-semibold">{product.name}</p>
                                            <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                {product.quantity} {translate('units sold')}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className={`text-foreground inline-flex items-center text-sm font-bold`}>
                                                {window.appSettings?.formatCurrency(product.revenue) || `$${product.revenue.toLocaleString()}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-40 flex-col items-center justify-center gap-3">
                                <p className="text-muted-foreground text-sm">{translate('No product performance data available')}</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </PageTemplate>
    );
}
