import PageTemplate from '@components/PageTemplate';
import { ReportFilters } from '@components/Reports/ReportFilters';
import { SummaryCards } from '@components/Reports/SummaryCards';
import UserInitials from '@components/UserInitials';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Tabs, TabsList, TabsTrigger } from '@components/UserInterface/Tabs';
import useInitials from '@hooks/useInitials';
import { Link, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowUpRight, Calendar, Clock, Target, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function LeadReports() {
    const { t: translate } = useTranslation();
    const { filters, summary, monthlyData, dailyData, leadsBySource, conversionBySource, recentLeads, auth } = usePage().props;
    const [chartView, setChartView] = useState<'daily' | 'monthly'>('monthly');
    const getInitials = useInitials();
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');

    const getStatusColor = (status: string) => {
        const colors = {
            new: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30',
            qualified: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30',
            converted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30',
            closed: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30',
            pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-500/30',
            in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-500/30',
            active: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30',
            inactive: 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800/30 dark:text-gray-400 dark:ring-gray-700/30',
        } as Record<string, string>;
        return (
            colors[status?.toLowerCase()] || 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800/30 dark:text-gray-400 dark:ring-gray-700/30'
        );
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobileOrTablet(window.innerWidth < 1400);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        if (raw) setPrimaryColor(raw);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const chartData = chartView === 'daily' ? dailyData : monthlyData;

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Reports'), href: '#' },
        { title: translate('Lead Reports') },
    ];

    const summaryCards = [
        {
            title: translate('Total Leads'),
            value: summary.total_leads.toLocaleString(),
            icon: <Users />,
            iconColor: 'bg-indigo-100/50',
            iconCls: 'text-indigo-600 dark:text-indigo-400 [&>svg]:w-5 [&>svg]:h-5',
            blobCls: 'bg-indigo-50 dark:bg-indigo-900/30',
        },
        {
            title: translate('Converted Leads'),
            value: summary.converted_leads.toLocaleString(),
            icon: <TrendingUp />,
            iconColor: 'bg-emerald-100/50',
            iconCls: 'text-emerald-600 dark:text-emerald-400 [&>svg]:w-5 [&>svg]:h-5',
            blobCls: 'bg-emerald-50 dark:bg-emerald-900/30',
        },
        {
            title: translate('Conversion Rate'),
            value: `${summary.conversion_rate.toFixed(2)}%`,
            icon: <Target />,
            iconColor: 'bg-amber-100/50',
            iconCls: 'text-amber-600 dark:text-amber-400 [&>svg]:w-5 [&>svg]:h-5',
            blobCls: 'bg-amber-50 dark:bg-amber-900/30',
        },
        {
            title: translate('Avg Conversion Time'),
            value: `${summary.avg_conversion_time} days`,
            icon: <Clock />,
            iconColor: 'bg-rose-100/50',
            iconCls: 'text-rose-600 dark:text-rose-400 [&>svg]:w-5 [&>svg]:h-5',
            blobCls: 'bg-rose-50 dark:bg-rose-900/30',
        },
    ];

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

    return (
        <PageTemplate
            title={translate('Lead Reports')}
            description={translate('View and analyze lead reports to track performance and conversion rates.')}
            url="/reports/leads"
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
                                    <CardTitle className="text-base font-semibold">{translate('Lead Trends')}</CardTitle>
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
                                        width={36}
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
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke={primaryColor}
                                        name={translate('Leads')}
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: primaryColor, strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                    <CardHeader className="border-border flex shrink-0 flex-row items-center border-b px-5" style={{ minHeight: '64px' }}>
                        <CardTitle className="text-base font-semibold">{translate('Leads by Source')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-5" dir="ltr">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={leadsBySource}
                                    cx="50%"
                                    cy={isMobileOrTablet ? '45%' : '50%'}
                                    labelLine={!isMobileOrTablet}
                                    label={
                                        isMobileOrTablet
                                            ? ({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '')
                                            : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`
                                    }
                                    outerRadius={isMobileOrTablet ? 75 : 85}
                                    paddingAngle={2}
                                    fill="#8884d8"
                                    dataKey="total"
                                    stroke="none"
                                >
                                    {leadsBySource.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name, props) => [value, props.payload.name]} />
                                {isMobileOrTablet && (
                                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                )}
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border border-green-100 shadow-sm dark:border-green-900/40 dark:bg-slate-900">
                    <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b px-5 py-3.5">
                        <div className="flex w-full items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">{translate('Recent Leads')}</CardTitle>
                                <p className="text-muted-foreground mt-0.5 text-xs">{translate('Most recently created leads')}</p>
                            </div>
                            <Link
                                href={route('leads.index')}
                                className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
                            >
                                {translate('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentLeads && recentLeads.length > 0 ? (
                            <div>
                                {recentLeads.map((lead: any, i: number) => (
                                    <div
                                        key={i}
                                        className="hover:bg-muted/50 group/row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                    >
                                        <div className="shrink-0">
                                            <UserInitials name={lead.name} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm leading-tight font-semibold">{lead.name}</p>
                                            <p className="text-muted-foreground mt-0.5 truncate text-xs">{lead.email || lead.organization || ''}</p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(lead.status)}`}
                                            >
                                                {lead.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'New'}
                                            </span>
                                            <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                                                <Calendar className="h-3 w-3 shrink-0" />
                                                {window.appSettings?.formatDateTime(lead.created_at, false) ||
                                                    new Date(lead.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-40 flex-col items-center justify-center gap-3">
                                <div className="bg-muted animate-pulse rounded-full p-4">
                                    <Target className="text-muted-foreground/50 h-6 w-6" />
                                </div>
                                <p className="text-muted-foreground text-sm">{translate('No leads yet')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
