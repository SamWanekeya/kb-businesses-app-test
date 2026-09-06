import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserInitials from '@/components/user-initials';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowUpRight,
    Banknote,
    Building2,
    ChevronRight,
    CreditCard,
    DollarSign,
    Gift,
    RefreshCw,
    Settings,
    Tag,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SuperAdminDashboardData {
    stats: {
        totalOrganizations: number;
        totalActivePlanOrganizations: number;
        totalUsers: number;
        totalRevenue: number;
        activePlans: number;
        pendingRequests: number;
        monthlyGrowth: number;
        activeCoupons: number;
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
    const [mounted, setMounted] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(() => dashboardData?.revenueYear ?? new Date().getFullYear());
    const [selectedOrganizationsYear, setSelectedOrganizationsYear] = useState<number>(
        () => dashboardData?.organizationsYear ?? new Date().getFullYear(),
    );
    const [primaryColor, setPrimaryColor] = useState('#A12582');

    useEffect(() => {
        setMounted(true);
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        if (raw) setPrimaryColor(raw);
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({ only: ['dashboardData'] });
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const pageActions = [
        {
            label: translate('Refresh'),
            icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
            variant: 'outline' as const,
            onClick: handleRefresh,
        },
    ];

    const stats = dashboardData?.stats || {
        totalOrganizations: 0,
        totalUsers: 0,
        totalRevenue: 0,
        activePlans: 0,
        pendingRequests: 0,
        monthlyGrowth: 0,
        activeCoupons: 0,
    };

    const recentActivity = dashboardData?.recentActivity || [];
    const topPlans = dashboardData?.topPlans || [];
    const monthlyRevenue = dashboardData?.monthlyRevenue || [];
    const availableYears = dashboardData?.availableYears || [new Date().getFullYear()];
    const monthlyOrganizations = dashboardData?.monthlyOrganizations || [];
    const availableOrganizationYears = dashboardData?.availableOrganizationYears || [new Date().getFullYear()];
    const maxRevenue = topPlans.length > 0 ? Math.max(...topPlans.map((p) => p.revenue)) : 1;

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        router.reload({ data: { revenueYear: year, organizationsYear: selectedOrganizationsYear }, only: ['dashboardData'], preserveState: true });
    };

    const handleOrganizationsYearChange = (year: number) => {
        setSelectedOrganizationsYear(year);
        router.reload({ data: { revenueYear: selectedYear, organizationsYear: year }, only: ['dashboardData'], preserveState: true });
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return translate('Good morning');
        if (h < 17) return translate('Good afternoon');
        return translate('Good evening');
    };

    const formatCurrency = (val: number) => window.appSettings?.formatCurrency(val) ?? `$${val.toLocaleString()}`;

    const fadeUp = (delay = 0) =>
        `transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}` + (delay ? ` delay-${delay}` : '');

    return (
        <PageTemplate
            title={translate('Dashboard')}
            url="/dashboard"
            actions={pageActions}
            description={translate('System overview — organizations, revenue, plans and recent activity.')}
        >
            <div className="space-y-6">
                <style>{`
          @keyframes waterWave {
            0%   { transform: translateX(0); }
            50%  { transform: translateX(-25%); }
            100% { transform: translateX(0); }
          }
          .animate-water-wave-1 { animation: waterWave 4s ease-in-out infinite; will-change: transform; }
          .animate-water-wave-2 { animation: waterWave 6s ease-in-out infinite reverse; will-change: transform; }
          .animate-water-wave-3 { animation: waterWave 8s ease-in-out infinite; will-change: transform; }
          @keyframes handWave {
            0%   { transform: rotate(0deg); }
            10%  { transform: rotate(18deg); }
            20%  { transform: rotate(-8deg); }
            30%  { transform: rotate(18deg); }
            40%  { transform: rotate(-4deg); }
            50%  { transform: rotate(12deg); }
            60%  { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
          .animate-hand-wave { animation: handWave 2.2s ease-in-out infinite; transform-origin: 70% 70%; display: inline-block; }
        `}</style>
                {/* ── Greeting Banner ── */}
                <div
                    className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-slate-800 px-6 py-5 lg:flex-row lg:items-center lg:justify-between dark:bg-slate-900 ${fadeUp(0)}`}
                >
                    {/* flowing gradient orbs */}
                    <span
                        className="pointer-events-none absolute -top-10 -left-10 h-48 w-48 animate-pulse rounded-full bg-emerald-500/10 blur-2xl"
                        style={{ animationDuration: '4s' }}
                    />
                    <span
                        className="pointer-events-none absolute right-0 -bottom-10 h-56 w-56 animate-pulse rounded-full bg-blue-500/10 blur-2xl"
                        style={{ animationDuration: '5s', animationDelay: '1.5s' }}
                    />
                    <span
                        className="pointer-events-none absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-violet-500/5 blur-2xl"
                        style={{ animationDuration: '6s', animationDelay: '0.8s' }}
                    />
                    {/* crisp glowing dots */}
                    <span
                        className="pointer-events-none absolute top-4 left-1/3 h-1.5 w-1.5 animate-ping rounded-full bg-emerald-400/80 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)]"
                        style={{ animationDuration: '3s' }}
                    />
                    <span
                        className="pointer-events-none absolute bottom-4 left-1/4 h-1 w-1 animate-ping rounded-full bg-blue-400/70 shadow-[0_0_4px_2px_rgba(96,165,250,0.5)]"
                        style={{ animationDuration: '4s', animationDelay: '1s' }}
                    />
                    <span
                        className="pointer-events-none absolute top-3 right-1/4 h-1.5 w-1.5 animate-ping rounded-full bg-violet-400/70 shadow-[0_0_6px_2px_rgba(167,139,250,0.5)]"
                        style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}
                    />
                    <span
                        className="pointer-events-none absolute right-1/3 bottom-3 h-1 w-1 animate-ping rounded-full bg-emerald-300/80 shadow-[0_0_4px_2px_rgba(110,231,183,0.5)]"
                        style={{ animationDuration: '2.8s', animationDelay: '1.8s' }}
                    />
                    {/* water wave layers at bottom */}
                    <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: '40px' }}>
                        <div className="animate-water-wave-1 absolute bottom-0 left-0 w-[200%]">
                            <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="h-[40px] w-full">
                                <path
                                    fill="rgba(52,211,153,0.12)"
                                    d="M0,20 C150,38 350,0 600,20 C850,38 1050,0 1200,20 C1350,38 1550,0 1800,20 C2050,38 2250,0 2400,20 L2400,40 L0,40 Z"
                                />
                            </svg>
                        </div>
                        <div className="animate-water-wave-2 absolute bottom-0 left-0 w-[200%]">
                            <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="h-[40px] w-full">
                                <path
                                    fill="rgba(96,165,250,0.09)"
                                    d="M0,26 C200,10 400,38 600,22 C800,8 1000,36 1200,24 C1400,10 1600,38 1800,22 C2000,8 2200,36 2400,24 L2400,40 L0,40 Z"
                                />
                            </svg>
                        </div>
                        <div className="animate-water-wave-3 absolute bottom-0 left-0 w-[200%]">
                            <svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="h-[40px] w-full">
                                <path
                                    fill="rgba(167,139,250,0.07)"
                                    d="M0,30 C300,14 500,38 700,28 C900,16 1100,38 1200,28 C1400,14 1600,38 1900,28 C2100,16 2300,38 2400,28 L2400,40 L0,40 Z"
                                />
                            </svg>
                        </div>
                    </div>
                    <div className="min-w-0 transition-transform duration-300 group-hover:translate-x-2">
                        <p className="mb-0.5 text-sm text-slate-400 transition-colors duration-300">{greeting()},</p>
                        <div className="flex items-center gap-2">
                            <h2 className="group-hover:text-primary truncate text-xl font-bold text-white transition-colors duration-300 sm:text-2xl">
                                {auth?.user?.name ?? 'Super Admin'}
                            </h2>
                            <span className="animate-hand-wave text-2xl select-none sm:text-3xl">👋</span>
                        </div>
                        <p className="mt-1 hidden text-xs text-slate-400 transition-colors duration-300 group-hover:text-slate-300 sm:block">
                            {translate("Here's what's happening across your platform today.")}
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="bg-primary/70 h-2 w-2 animate-bounce rounded-full"
                                    style={{ animationDelay: '0ms', animationDuration: '1.2s' }}
                                />
                                <div
                                    className="bg-primary/50 h-2 w-2 animate-bounce rounded-full"
                                    style={{ animationDelay: '150ms', animationDuration: '1.2s' }}
                                />
                                <div
                                    className="bg-primary/40 h-2 w-2 animate-bounce rounded-full"
                                    style={{ animationDelay: '300ms', animationDuration: '1.2s' }}
                                />
                            </div>
                            <span className="text-primary text-sm font-semibold transition-transform duration-200 group-hover:scale-105">
                                {stats.totalActivePlanOrganizations.toLocaleString()} {translate('active plan organizations')}
                            </span>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <div className="min-w-[80px] rounded-xl bg-white/10 px-4 py-2.5 text-center transition-all duration-300 hover:scale-105 hover:bg-white/15">
                            <p className="text-lg leading-tight font-bold text-white">{stats.totalOrganizations}</p>
                            <p className="text-[11px] text-slate-400">{translate('Organizations')}</p>
                        </div>
                        <div className="min-w-[80px] rounded-xl bg-white/10 px-4 py-2.5 text-center transition-all duration-300 hover:scale-105 hover:bg-white/15">
                            <p className="text-lg leading-tight font-bold text-emerald-400">{stats.monthlyGrowth}%</p>
                            <p className="text-[11px] text-slate-400">{translate('Growth')}</p>
                        </div>
                        <div className="hidden h-10 w-px bg-white/10 sm:block" />
                        {[
                            {
                                icon: Tag,
                                label: translate('Coupons'),
                                href: route('coupons.index'),
                                color: 'text-rose-300 hover:text-rose-200',
                                bg: 'hover:bg-rose-400/10',
                            },
                            {
                                icon: Gift,
                                label: translate('Referral'),
                                href: route('referral.index'),
                                color: 'text-violet-300 hover:text-violet-200',
                                bg: 'hover:bg-violet-400/10',
                            },
                            {
                                icon: Settings,
                                label: translate('Settings'),
                                href: route('settings'),
                                color: 'text-slate-300 hover:text-slate-200',
                                bg: 'hover:bg-white/10',
                            },
                        ].map(({ icon: Icon, label, href, color, bg }) => (
                            <Link
                                key={label}
                                href={href}
                                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${bg} group/qa`}
                            >
                                <Icon className={`h-5 w-5 transition-all duration-200 ${color} group-hover/qa:-translate-y-0.5`} />
                                <span className="text-[10px] text-slate-400 transition-colors duration-200 group-hover/qa:text-slate-300">
                                    {label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── KPI Row ── */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {/* Revenue */}
                    <Link href={route('plan-orders.index')} className={`group ${fadeUp(100)}`}>
                        <Card className="h-full cursor-pointer border border-emerald-300 bg-emerald-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-emerald-800 dark:bg-emerald-950/40">
                            <CardContent className="relative overflow-hidden p-4 sm:p-5">
                                <span
                                    className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-emerald-300/40 dark:bg-emerald-500/10"
                                    style={{ animationDuration: '6s' }}
                                />
                                <span
                                    className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-emerald-200/30 dark:bg-emerald-600/10"
                                    style={{ animationDuration: '7s' }}
                                />
                                <span
                                    className="pointer-events-none absolute right-8 bottom-1 h-7 w-7 animate-ping rounded-full bg-emerald-400/30 dark:bg-emerald-400/10"
                                    style={{ animationDuration: '5s', animationDelay: '2s' }}
                                />
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/60">
                                        <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-emerald-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-600" />
                                </div>
                                <p className="mb-1 text-xs text-emerald-700 dark:text-emerald-400">{translate('Total Revenue')}</p>
                                <p className="font-mono text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-100">
                                    {formatCurrency(stats.totalRevenue)}
                                </p>
                                <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-500">{translate('from approved orders')}</p>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Total Organizations */}
                    <Link href={route('organizations.index')} className={`group ${fadeUp(150)}`}>
                        <Card className="h-full cursor-pointer border border-blue-200 bg-blue-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-blue-900/50 dark:bg-blue-950/30 dark:bg-slate-900">
                            <CardContent className="relative overflow-hidden p-4 sm:p-5">
                                <span
                                    className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-blue-300/40 dark:bg-blue-500/10"
                                    style={{ animationDuration: '7s' }}
                                />
                                <span
                                    className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-blue-200/30 dark:bg-blue-600/10"
                                    style={{ animationDuration: '8s' }}
                                />
                                <span
                                    className="pointer-events-none absolute right-8 bottom-1 h-7 w-7 animate-ping rounded-full bg-blue-400/30 dark:bg-blue-400/10"
                                    style={{ animationDuration: '6s', animationDelay: '1.5s' }}
                                />
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
                                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-blue-200 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-500" />
                                </div>
                                <p className="mb-1 text-xs text-blue-700 dark:text-blue-400">{translate('Total Organizations')}</p>
                                <p className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
                                    {stats.totalOrganizations.toLocaleString()}
                                </p>
                                <p className="mt-1.5 flex items-center gap-0.5 text-[11px] text-emerald-600">
                                    <TrendingUp className="h-3 w-3" /> +{stats.monthlyGrowth}% {translate('this month')}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Active Plans */}
                    <Link href={route('plans.index')} className={`group ${fadeUp(200)}`}>
                        <Card className="h-full cursor-pointer border border-violet-200 bg-violet-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-violet-900/50 dark:bg-violet-950/30">
                            <CardContent className="relative overflow-hidden p-4 sm:p-5">
                                <span
                                    className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-violet-300/40 dark:bg-violet-500/10"
                                    style={{ animationDuration: '8s' }}
                                />
                                <span
                                    className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-violet-200/30 dark:bg-violet-600/10"
                                    style={{ animationDuration: '6s' }}
                                />
                                <span
                                    className="pointer-events-none absolute right-8 bottom-1 h-7 w-7 animate-ping rounded-full bg-violet-400/30 dark:bg-violet-400/10"
                                    style={{ animationDuration: '5s', animationDelay: '2.5s' }}
                                />
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="rounded-xl bg-violet-100 p-2.5 dark:bg-violet-900/50">
                                        <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-violet-200 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-500" />
                                </div>
                                <p className="mb-1 text-xs text-violet-700 dark:text-violet-400">{translate('Active Plans')}</p>
                                <p className="text-2xl font-bold tracking-tight text-violet-900 dark:text-violet-100">
                                    {stats.activePlans.toLocaleString()}
                                </p>
                                <p className="mt-1.5 text-[11px] text-violet-500 dark:text-violet-400">{translate('subscription plans')}</p>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Total Users */}
                    <div className={`group ${fadeUp(300)}`}>
                        <Card className="h-full border border-indigo-200 bg-indigo-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-900/50 dark:bg-indigo-950/30">
                            <CardContent className="relative overflow-hidden p-4 sm:p-5">
                                <span
                                    className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-indigo-300/40 dark:bg-indigo-500/10"
                                    style={{ animationDuration: '7s' }}
                                />
                                <span
                                    className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-indigo-200/30 dark:bg-indigo-600/10"
                                    style={{ animationDuration: '8s' }}
                                />
                                <span
                                    className="pointer-events-none absolute right-8 bottom-1 h-7 w-7 animate-ping rounded-full bg-indigo-400/30 dark:bg-indigo-400/10"
                                    style={{ animationDuration: '6s', animationDelay: '1s' }}
                                />
                                <div className="mb-4 flex items-start justify-between">
                                    <div className="rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/50">
                                        <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                </div>
                                <p className="mb-1 text-xs text-indigo-700 dark:text-indigo-400">{translate('Total Users')}</p>
                                <p className="text-2xl font-bold tracking-tight text-indigo-900 dark:text-indigo-100">
                                    {stats.totalUsers.toLocaleString()}
                                </p>
                                <p className="mt-1.5 text-[11px] text-indigo-500 dark:text-indigo-400">{translate('registered users')}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Pending Requests */}
                    <Link href={route('plan-requests.index')} className={`group ${fadeUp(250)}`}>
                        <Card
                            className={`h-full cursor-pointer border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                                stats.pendingRequests > 0
                                    ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
                            }`}
                        >
                            <CardContent className="relative overflow-hidden p-4 sm:p-5">
                                <span
                                    className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-amber-300/40 dark:bg-amber-500/10"
                                    style={{ animationDuration: '7s' }}
                                />
                                <span
                                    className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-amber-200/30 dark:bg-amber-600/10"
                                    style={{ animationDuration: '9s' }}
                                />
                                <span
                                    className="pointer-events-none absolute right-8 bottom-1 h-7 w-7 animate-ping rounded-full bg-amber-400/30 dark:bg-amber-400/10"
                                    style={{ animationDuration: '6s', animationDelay: '3s' }}
                                />
                                <div className="mb-4 flex items-start justify-between">
                                    <div
                                        className={`rounded-xl p-2.5 ${stats.pendingRequests > 0 ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-muted'}`}
                                    >
                                        <AlertCircle
                                            className={`h-5 w-5 ${stats.pendingRequests > 0 ? 'animate-pulse text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}
                                        />
                                    </div>
                                    {stats.pendingRequests > 0 && (
                                        <span className="inline-flex animate-bounce items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                                            {translate('Action needed')}
                                        </span>
                                    )}
                                </div>
                                <p className="mb-1 text-xs text-amber-700 dark:text-amber-400">{translate('Pending Requests')}</p>
                                <p
                                    className={`text-2xl font-bold tracking-tight ${stats.pendingRequests > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}
                                >
                                    {stats.pendingRequests.toLocaleString()}
                                </p>
                                <p className="mt-1.5 text-[11px] text-amber-500 dark:text-amber-500">{translate('awaiting approval')}</p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* ── Main Content ── */}
                <div className={`grid gap-4 lg:grid-cols-5 ${fadeUp(300)}`}>
                    {/* Recently Registered Organizations */}
                    <Card className="overflow-hidden border border-blue-100 shadow-sm lg:col-span-3 dark:border-blue-900/40 dark:bg-slate-900">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold">{translate('Recently Registered Organizations')}</CardTitle>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {translate('Latest organizations that joined the platform')}
                                    </p>
                                </div>
                                <Link
                                    href={route('organizations.index')}
                                    className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
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
                                            className="hover:bg-muted/50 group/row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                            style={{ animationDelay: `${i * 60}ms` }}
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
                                                <p className="truncate text-sm leading-tight font-semibold">{organization.name}</p>
                                                <p className="text-muted-foreground mt-0.5 truncate text-xs">{organization.email}</p>
                                            </div>
                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                                                    {translate('Active')}
                                                </span>
                                                <span className="text-muted-foreground text-[11px]">{organization.registered_at}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-3">
                                    <div className="bg-muted animate-pulse rounded-full p-4">
                                        <Building2 className="text-muted-foreground/50 h-6 w-6" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">{translate('No organizations registered yet')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Plans */}
                    <Card className="overflow-hidden border border-violet-100 shadow-sm lg:col-span-2 dark:border-violet-900/40 dark:bg-slate-900">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold">{translate('Top Plans')}</CardTitle>
                                    <p className="text-muted-foreground mt-0.5 text-xs">{translate('By revenue generated')}</p>
                                </div>
                                <Link
                                    href={route('plans.index')}
                                    className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
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
                                                className="hover:bg-muted/50 group/plan flex items-center gap-3 px-5 py-4 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                            >
                                                <UserInitials name={`${index + 1}`} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1.5 flex items-center gap-2">
                                                        <p className="truncate text-sm font-semibold">{plan.name}</p>
                                                    </div>
                                                    <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full dark:bg-slate-700">
                                                        <div
                                                            className={`bg-primary h-1.5 rounded-full transition-all duration-1000 ease-out`}
                                                            style={{ width: mounted ? `${barPct}%` : '0%' }}
                                                        />
                                                    </div>
                                                    <p className="text-muted-foreground mt-1 text-[11px]">
                                                        {plan.subscribers} {translate('subscribers')}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="font-mono text-sm font-bold">{formatCurrency(plan.revenue)}</p>
                                                    <p className="text-muted-foreground text-[11px]">{translate('revenue')}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-3">
                                    <div className="bg-muted animate-pulse rounded-full p-4">
                                        <CreditCard className="text-muted-foreground/50 h-6 w-6" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">{translate('No plan data available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Monthly Organizations Chart ── */}
                <div className={fadeUp(375)}>
                    <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-semibold">{translate('New Organizations Registered')}</CardTitle>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {translate('Organizations joined per month')} — {selectedOrganizationsYear}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                                        {monthlyOrganizations.reduce((s, m) => s + m.count, 0)} {translate('total')}
                                    </span>
                                    <Select value={String(selectedOrganizationsYear)} onValueChange={(v) => handleOrganizationsYearChange(Number(v))}>
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
                                        <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                                        <XAxis
                                            dataKey="short"
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
                                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                                color: primaryColor,
                                            }}
                                            formatter={(value: number) => [value, translate('Organizations')]}
                                            labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                                        />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false}>
                                            <LabelList
                                                dataKey="count"
                                                position="top"
                                                style={{ fontSize: 11, fill: primaryColor, fontWeight: 600 }}
                                                formatter={(v: number) => (v > 0 ? v : '')}
                                            />
                                            {monthlyOrganizations.map((_, i) => (
                                                <Cell key={i} fill={primaryColor} fillOpacity={0.7} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-3">
                                    <div className="bg-muted animate-pulse rounded-full p-4">
                                        <Building2 className="text-muted-foreground/50 h-6 w-6" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">{translate('No organization data available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Monthly Revenue Chart ── */}
                <div className={fadeUp(350)}>
                    <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                        <CardHeader className="border-b px-5 pt-5 pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-semibold">{translate('Monthly Revenue')}</CardTitle>
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {translate('Approved plan orders')} — {selectedYear}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 font-mono text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30">
                                        {formatCurrency(monthlyRevenue.reduce((s, m) => s + m.revenue, 0))}
                                    </span>
                                    <Select value={String(selectedYear)} onValueChange={(v) => handleYearChange(Number(v))}>
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
                                    <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} accessibilityLayer={false}>
                                        <defs>
                                            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                                        <XAxis
                                            dataKey="short"
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
                                            tickFormatter={(v) => formatCurrency(v)}
                                            width={72}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                fontSize: 12,
                                                borderRadius: 8,
                                                border: `1px solid ${primaryColor}30`,
                                                background: 'hsl(var(--popover))',
                                                color: 'hsl(var(--popover-foreground))',
                                            }}
                                            formatter={(value: number) => [formatCurrency(value), translate('Revenue')]}
                                            labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke={primaryColor}
                                            strokeWidth={2}
                                            fill="url(#revenueGrad)"
                                            dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }}
                                            activeDot={{ r: 5, fill: primaryColor, strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-40 flex-col items-center justify-center gap-3">
                                    <div className="bg-muted animate-pulse rounded-full p-4">
                                        <DollarSign className="text-muted-foreground/50 h-6 w-6" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">{translate('No revenue data available')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}
