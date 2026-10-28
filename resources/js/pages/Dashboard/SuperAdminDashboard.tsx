import PageTemplate from '@components/PageTemplate';
import UserInitials from '@components/UserInitials';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Link, router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Building2, ChevronRight, CreditCard, DollarSign, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

interface SuperAdminDashboardData {
    stats: {
        totalOrganizations: number;
        totalActivePlanOrganizations: number;
        totalUsers: number;
        totalRevenue: number;
        activePlans: number;
        pendingRequests: number;
        monthlyGrowth: number;
        activeDiscounts: number;
    };
    recentActivity: Array<{
        id: number;
        name: string;
        email: string;
        registered_at: string;
        status: string;
        avatar?: string;
    }>;
    monthlyRevenue: Array<{ month: string; short: string; revenue: number }>;
    revenueYear: number;
    availableYears: number[];
    monthlyOrganizations: Array<{ month: string; short: string; count: number }>;
    organizationsYear: number;
    topPlans: Array<{
        name: string;
        subscribers: number;
        revenue: number;
    }>;
}

export default function SuperAdminDashboard({ dashboardData }: { dashboardData: SuperAdminDashboardData }) {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(() => dashboardData?.revenueYear ?? new Date().getFullYear());
    const [selectedOrganizationsYear, setSelectedOrganizationsYear] = useState<number>(
        () => dashboardData?.organizationsYear ?? new Date().getFullYear()
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({ only: ['dashboardData'] });
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    const pageActions = [
        {
            label: translate('Refresh'),
            icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
            variant: 'outline' as const,
            onClick: handleRefresh
        }
    ];

    const stats = dashboardData?.stats || {
        totalOrganizations: 0,
        totalActivePlanOrganizations: 0,
        totalUsers: 0,
        totalRevenue: 0,
        activePlans: 0,
        pendingRequests: 0,
        monthlyGrowth: 0,
        activeDiscounts: 0
    };

    const recentActivity = dashboardData?.recentActivity || [];
    const topPlans = dashboardData?.topPlans || [];
    const monthlyRevenue = dashboardData?.monthlyRevenue || [];
    const availableYears = dashboardData?.availableYears || [new Date().getFullYear()];
    const monthlyOrganizations = dashboardData?.monthlyOrganizations || [];
    const maxRevenue = topPlans.length > 0 ? Math.max(...topPlans.map((p) => p.revenue)) : 1;

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        router.reload({
            data: { revenueYear: year, organizationsYear: selectedOrganizationsYear },
            only: ['dashboardData'],
            preserveState: true
        });
    };

    const handleOrganizationsYearChange = (year: number) => {
        setSelectedOrganizationsYear(year);
        router.reload({
            data: { revenueYear: selectedYear, organizationsYear: year },
            only: ['dashboardData'],
            preserveState: true
        });
    };

    const formatCurrency = (val: number) => window.kbSettings.formatCurrency(val) ?? `$${val.toLocaleString()}`;


    return (
        <PageTemplate
            title={translate('Dashboard')}
            url="/dashboard"
            actions={pageActions}
            description={translate('System overview — organizations, revenue, plans and recent activity.')}
        >
            <div className="space-y-6">
                {/* Page overview */}
                <section
                    className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">{translate('Here’s the latest for')}</p>
                        <h2 className="mt-1 text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
                            {auth?.user?.name}
                        </h2>
                        <p className="mt-3 text-sm text-muted-foreground">
                            <span
                                className="font-medium text-foreground">{stats.totalActivePlanOrganizations.toLocaleString()}</span>{' '}
                            {translate('organizations with active plans')}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Link
                            href={route('discounts.index')}
                            className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            {translate('Discounts')}
                        </Link>
                        <Link
                            href={route('referral-program.index')}
                            className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            {translate('Referral program')}
                        </Link>
                        <Link
                            href={route('settings.index')}
                            className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            {translate('Settings')}
                        </Link>
                    </div>
                </section>

                {/* Key metrics */}
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    <Link href={route('subscriptions.plan-orders.index')}
                          className="group rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40">
                        <p className="text-sm text-muted-foreground">{translate('Total Revenue')}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{translate('from approved orders')}</p>
                    </Link>

                    <Link href={route('organizations.index')}
                          className="group rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40">
                        <p className="text-sm text-muted-foreground">{translate('Total Organizations')}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{stats.totalOrganizations.toLocaleString()}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth}% {translate('this month')}
                        </p>
                    </Link>

                    <Link href={route('subscriptions.plans.index')}
                          className="group rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40">
                        <p className="text-sm text-muted-foreground">{translate('Active Plans')}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{stats.activePlans.toLocaleString()}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{translate('subscription plans')}</p>
                    </Link>

                    <div className="rounded-lg border bg-card p-4">
                        <p className="text-sm text-muted-foreground">{translate('Total Users')}</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{stats.totalUsers.toLocaleString()}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{translate('registered users')}</p>
                    </div>

                    <Link href={route('subscriptions.plan-requests.index')}
                          className="group rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-muted-foreground">{translate('Pending Requests')}</p>
                            {stats.pendingRequests > 0 && (
                                <span
                                    className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    {translate('Action needed')}
                                </span>
                            )}
                        </div>
                        <p className={`mt-2 text-2xl font-semibold tracking-tight tabular-nums ${stats.pendingRequests > 0 ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                            {stats.pendingRequests.toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{translate('awaiting approval')}</p>
                    </Link>
                </section>

                {/* ── Main Content ── */}
                <div className={`grid gap-4 lg:grid-cols-5`}>
                    {/* Recently Registered Organizations */}
                    <Card className="overflow-hidden border shadow-sm lg:col-span-3">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle
                                        className="text-base font-bold">{translate('Recently Registered Organizations')}</CardTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{translate('Latest organizations that joined the platform')}</p>
                                </div>
                                <Link
                                    href={route('organizations.index')}
                                    className="text-primary flex shrink-0 items-center gap-1 text-xs transition-all duration-150 hover:gap-1.5"
                                >
                                    {translate('View all')} <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentActivity.length > 0 ? (
                                <div>
                                    {recentActivity.map((organization, i) => (
                                        <div
                                            key={organization.id}
                                            className="flex items-center gap-3 border-b px-5 py-3.5 last:border-b-0 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="relative h-9 w-9 shrink-0">
                                                {organization.avatar ? (
                                                    <img
                                                        src={organization.avatar}
                                                        alt={organization.name}
                                                        className="h-9 w-9 rounded-full object-cover shadow-sm transition-transform duration-150 group-hover/row:scale-105"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : (
                                                    <UserInitials name={organization?.name} />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm leading-tight font-bold">{organization.name}</p>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">{organization.email}</p>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                <span
                                                    className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                                                    {translate('Active')}
                                                </span>
                                                <span
                                                    className="text-xs text-muted-foreground">{organization.registered_at}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-3">
                                    <div className="rounded-full bg-muted p-4">
                                        <Building2 className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{translate('No organizations registered yet')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Plans */}
                    <Card className="overflow-hidden border shadow-sm lg:col-span-2">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-bold">{translate('Top Plans')}</CardTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{translate('By revenue generated')}</p>
                                </div>
                                <Link
                                    href={route('subscriptions.plans.index')}
                                    className="text-primary flex shrink-0 items-center gap-1 text-xs transition-all duration-150 hover:gap-1.5"
                                >
                                    {translate('View all')} <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {topPlans.length > 0 ? (
                                <div>
                                    {topPlans.map((plan, index) => {
                                        const barPct = maxRevenue > 0 ? Math.round((plan.revenue / maxRevenue) * 100) : 0;
                                        return (
                                            <div
                                                key={plan.name}
                                                className="flex items-center gap-3 border-b px-5 py-4 last:border-b-0 transition-colors hover:bg-muted/40"
                                            >
                                                <UserInitials name={`${index + 1}`} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1.5 flex items-center gap-2">
                                                        <p className="truncate text-sm font-bold">{plan.name}</p>
                                                    </div>
                                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-1.5 rounded-full bg-primary transition-all"
                                                            style={{ width: `${barPct}%` }}
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {plan.subscribers} {translate('subscribers')}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="font-mono text-sm font-extrabold">{formatCurrency(plan.revenue)}</p>
                                                    <p className="text-xs text-muted-foreground">{translate('revenue')}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-3">
                                    <div className="rounded-full bg-muted p-4">
                                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{translate('No plan data available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Monthly Organizations Chart ── */}
                <div>
                    <Card className="overflow-hidden border shadow-sm">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle
                                        className="text-base font-bold">{translate('New Organizations Registered')}</CardTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {translate('Organizations joined per month')} — {selectedOrganizationsYear}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                        {monthlyOrganizations.reduce((s, m) => s + m.count, 0)} {translate('total')}
                                    </span>
                                    <Select
                                        value={String(selectedOrganizationsYear)}
                                        onValueChange={(v) => {
                                            handleOrganizationsYearChange(Number(v));
                                        }}
                                    >
                                        <SelectTrigger className="h-7 w-24 text-xs focus:ring-0 focus:ring-offset-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableYears.map((yr) => (
                                                <SelectItem key={yr} value={String(yr)} className="text-xs">
                                                    {yr}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-5">
                            {monthlyOrganizations.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={monthlyOrganizations}
                                        margin={{ top: 20, right: 8, left: 0, bottom: 0 }}
                                        accessibilityLayer={false}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12}
                                                       vertical={false} />
                                        <XAxis
                                            dataKey="short"
                                            tick={{ fontSize: 11, fill: 'currentColor' }}
                                            className="text-foreground/75"
                                            axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                                            tickLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: 'currentColor' }}
                                            className="text-foreground/75"
                                            axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                                            tickLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                                            allowDecimals={false}
                                            width={36}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                fontSize: 12,
                                                borderRadius: 8,
                                                border: '1px solid hsl(var(--border))',
                                                backgroundColor: 'hsl(var(--popover))',
                                                color: 'hsl(var(--popover-foreground))'
                                            }}
                                            formatter={(value: number) => [value, translate('Organizations')]}
                                            labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={30}
                                             isAnimationActive={false}>
                                            <LabelList
                                                dataKey="count"
                                                position="top"
                                                style={{ fontSize: 11, fill: 'currentColor', fontWeight: 500 }}
                                                formatter={(v: number) => (v > 0 ? v : '')}
                                            />
                                            {monthlyOrganizations.map((_, i) => (
                                                <Cell key={i} fill="#a12582" fillOpacity={0.75} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-3">
                                    <div className="rounded-full bg-muted p-4">
                                        <Building2 className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{translate('No organization data available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Monthly Revenue Chart ── */}
                <div>
                    <Card className="overflow-hidden border shadow-sm">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle
                                        className="text-base font-bold">{translate('Monthly Revenue')}</CardTitle>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {translate('Approved plan orders')} — {selectedYear}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">
                                        {formatCurrency(monthlyRevenue.reduce((s, m) => s + m.revenue, 0))}
                                    </span>
                                    <Select
                                        value={String(selectedYear)}
                                        onValueChange={(v) => {
                                            handleYearChange(Number(v));
                                        }}
                                    >
                                        <SelectTrigger className="h-7 w-24 text-xs focus:ring-0 focus:ring-offset-0">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableYears.map((yr) => (
                                                <SelectItem key={yr} value={String(yr)} className="text-xs">
                                                    {yr}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-5">
                            {monthlyRevenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                                               accessibilityLayer={false}>
                                        <defs>
                                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a12582" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#a12582" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12}
                                                       vertical={false} />
                                        <XAxis
                                            dataKey="short"
                                            tick={{ fontSize: 11, fill: 'currentColor' }}
                                            className="text-foreground/75"
                                            axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                                            tickLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: 'currentColor' }}
                                            className="text-foreground/75"
                                            axisLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                                            tickLine={{ stroke: 'currentColor', strokeOpacity: 0.2 }}
                                            tickFormatter={(v) => formatCurrency(v)}
                                            width={72}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                fontSize: 12,
                                                borderRadius: 8,
                                                border: '1px solid hsl(var(--border))',
                                                background: 'hsl(var(--popover))',
                                                color: 'hsl(var(--popover-foreground))'
                                            }}
                                            formatter={(value: number) => [formatCurrency(value), translate('Revenue')]}
                                            labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#a12582"
                                            strokeWidth={2}
                                            fill="url(#revenueGrad)"
                                            dot={{ r: 3, fill: '#a12582', strokeWidth: 0 }}
                                            activeDot={{ r: 5, fill: '#a12582', strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-3">
                                    <div className="rounded-full bg-muted p-4">
                                        <DollarSign className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">{translate('No revenue data available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}
