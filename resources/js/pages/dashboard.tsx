import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipContent, TooltipProvider, TooltipTrigger, Tooltip as UITooltip } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Banknote,
    BarChart3,
    Briefcase,
    Building2,
    Calendar,
    DollarSign,
    Megaphone,
    RefreshCw,
    Settings,
    Star,
    Target,
    TrendingUp,
} from 'lucide-react';
import React from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface OrganizationDashboardData {
    stats: {
        totalEmployees: number;
        totalLeads: number;
        totalOpportunities: number;
        totalSales: number;
        totalCustomers: number;
        totalProjects: number;
        organizationRevenue: number;
        monthlyGrowth: number;
        conversionRate: number;
        storageUsed: number;
        storageLimit: number;
        storageUsagePercent: number;
        storageUsedMB: number;
        storageLimitGB: number;
    };
    charts: {
        salesTrends: Array<{ month: string; short: string; sales: number }>;
        leadConversions: Array<{ month: string; short: string; leads: number; conversions: number }>;
        revenueChart: Array<{ month: string; short: string; revenue: number }>;
        customerDistribution: Array<{ name: string; value: number; color: string }>;
        employeeDistribution: Array<{ name: string; value: number; color: string }>;
    };
    recentActivities: {
        leads: Array<any>;
        sales: Array<any>;
        projects: Array<any>;
        customers: Array<any>;
        announcements: Array<any>;
    };
}

export default function Dashboard({ dashboardData }: { dashboardData: OrganizationDashboardData }) {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const stats = dashboardData?.stats || {};
    const charts = dashboardData?.charts || {};
    const recentActivities = dashboardData?.recentActivities || { leads: [], sales: [], projects: [], customers: [], announcements: [] };

    const [mounted, setMounted] = React.useState(false);
    const [primaryColor, setPrimaryColor] = React.useState('#A12582');
    const [chartYear, setChartYear] = React.useState<number>(() => new Date().getFullYear());
    const [leadYear, setLeadYear] = React.useState<number>(() => new Date().getFullYear());
    const [salesTab, setSalesTab] = React.useState<'sales' | 'revenue'>('sales');
    const availableYears = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + 2 - i);

    React.useEffect(() => {
        setMounted(true);
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        if (raw) setPrimaryColor(raw);
    }, []);

    const handleChartYearChange = (year: number) => {
        setChartYear(year);
        router.reload({ data: { chart_year: year, lead_year: leadYear }, only: ['dashboardData'], preserveState: true });
    };

    const handleLeadYearChange = (year: number) => {
        setLeadYear(year);
        router.reload({ data: { chart_year: chartYear, lead_year: year }, only: ['dashboardData'], preserveState: true });
    };

    const formatCurrency = (val: number) => window.appSettings?.formatCurrency(val) ?? `$${val.toLocaleString()}`;

    const hour = new Date().getHours();
    const greetingText = hour < 12 ? translate('Good Morning') : hour < 18 ? translate('Good Afternoon') : translate('Good Evening');

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const getStatusColor = (status: string) => {
        const colors = {
            new: 'bg-blue-50 text-blue-700 ring-blue-600/20',
            qualified: 'bg-green-50 text-green-700 ring-green-600/20',
            converted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
            closed: 'bg-green-50 text-green-700 ring-green-600/20',
            pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
            in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20',
            planning: 'bg-purple-50 text-purple-700 ring-purple-600/20',
            completed: 'bg-green-50 text-green-700 ring-green-600/20',
            on_hold: 'bg-orange-50 text-orange-700 ring-orange-600/20',
            cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
            active: 'bg-green-50 text-green-700 ring-green-600/20',
            inactive: 'bg-gray-50 text-gray-700 ring-gray-600/20',
            enterprise: 'bg-purple-50 text-purple-700 ring-purple-600/20',
            startup: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
            customer: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
            draft: 'bg-gray-50 text-gray-700 ring-gray-600/20',
            shipped: 'bg-blue-50 text-blue-700 ring-blue-600/20',
            confirmed: 'bg-green-50 text-green-700 ring-green-600/20',
            delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
            processing: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
            'enterprise customer': 'bg-purple-50 text-purple-700 ring-purple-600/20',
            'smb customer': 'bg-blue-50 text-blue-700 ring-blue-600/20',
            'strategic partner': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
            'supplier/vendor': 'bg-orange-50 text-orange-700 ring-orange-600/20',
            'reseller/channel': 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
            prospect: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
        };
        return colors[status?.toLowerCase()] || 'bg-slate-50 text-slate-700 ring-slate-600/20';
    };

    return (
        <PageTemplate
            title={translate('Dashboard')}
            description={translate('Overview of organization performance, metrics, and recent activities.')}
            url={route('dashboard')}
            actions={[
                {
                    label: translate('Refresh'),
                    icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
                    variant: 'outline',
                    onClick: handleRefresh,
                },
            ]}
        >
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .dash-anim { animation: fadeSlideUp 0.5s ease both; }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(1); }
                    50%      { opacity: 1; transform: scale(1.5); }
                }
                @keyframes glowPulse {
                    0%, 100% { opacity: 0.4; }
                    50%      { opacity: 0.8; }
                }
                .dot-twinkle { animation: twinkle ease-in-out infinite; }
                .glow-pulse  { animation: glowPulse ease-in-out infinite; }
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
            <div className="space-y-6">
                {/* ── Header strip ── */}
                <div
                    className="group dash-anim relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900"
                    style={{ animationDelay: '0ms' }}
                >
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
                        <p className="mb-0.5 text-sm text-slate-400">{greetingText},</p>
                        <div className="flex items-center gap-2">
                            <h2 className="group-hover:text-primary truncate text-xl font-bold text-white transition-colors duration-300 sm:text-2xl">
                                {auth?.user?.name ?? translate('Welcome')}
                            </h2>
                            <span className="animate-hand-wave text-2xl select-none sm:text-3xl">👋</span>
                        </div>
                        <p className="mt-1 hidden text-xs text-slate-400 transition-colors duration-300 group-hover:text-slate-300 sm:block">
                            {translate("Here's what's happening across your platform today.")}
                        </p>
                        {useHasPermission('manage-opportunities') && (
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
                                    {(stats.totalOpportunities || 0).toLocaleString() + ' ' + translate('total opportunities')}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <div className="hidden h-10 w-px bg-white/10 sm:block" />
                        {[
                            useHasPermission('manage-leads') && {
                                icon: Target,
                                label: translate('Leads'),
                                href: route('leads.index'),
                                color: 'text-emerald-300 hover:text-emerald-200',
                                bg: 'hover:bg-emerald-400/10',
                            },
                            useHasPermission('manage-sales-orders') && {
                                icon: DollarSign,
                                label: translate('Sales'),
                                href: route('sales-orders.index'),
                                color: 'text-blue-300 hover:text-blue-200',
                                bg: 'hover:bg-blue-400/10',
                            },
                            useHasPermission('manage-projects') && {
                                icon: Briefcase,
                                label: translate('Projects'),
                                href: route('projects.index'),
                                color: 'text-violet-300 hover:text-violet-200',
                                bg: 'hover:bg-violet-400/10',
                            },
                            useHasPermission('manage-settings') && {
                                icon: Settings,
                                label: translate('Settings'),
                                href: route('settings'),
                                color: 'text-slate-300 hover:text-slate-200',
                                bg: 'hover:bg-white/10',
                            },
                        ]
                            .filter(Boolean)
                            .map(({ icon: Icon, label, href, color, bg }: any) => (
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

                {/* ── KPI cards ── */}
                <div className="dash-anim grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" style={{ animationDelay: '80ms' }}>
                    {/* Total Leads */}
                    {useHasPermission('manage-leads') && (
                        <Link href={route('leads.index')} className="group">
                            <Card className="h-full cursor-pointer border border-green-200 bg-green-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-green-900/50 dark:bg-green-950/30">
                                <CardContent className="relative overflow-hidden p-5">
                                    <span
                                        className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-green-300/40 dark:bg-green-500/10"
                                        style={{ animationDuration: '6s' }}
                                    />
                                    <span
                                        className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-green-200/30 dark:bg-green-600/10"
                                        style={{ animationDuration: '7s' }}
                                    />
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="rounded-xl bg-green-100 p-2.5 dark:bg-green-900/50">
                                            <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-green-200 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-green-500" />
                                    </div>
                                    <p className="mb-1 text-xs text-green-700 dark:text-green-400">{translate('Total Leads')}</p>
                                    <p className="truncate text-xl font-bold tracking-tight text-green-900 sm:text-2xl dark:text-green-100">
                                        {(stats.totalLeads || 0).toLocaleString()}
                                    </p>
                                    <p className="mt-1.5 flex items-center gap-0.5 text-[11px] text-green-600">
                                        <TrendingUp className="h-3 w-3" /> {stats?.monthlyGrowth > 0 ? '+' : ''}
                                        {stats.monthlyGrowth || 0}% {translate('this month')}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {/* Total Sales */}
                    {useHasPermission('manage-sales-orders') && (
                        <Link href={route('sales-orders.index')} className="group">
                            <Card className="h-full cursor-pointer border border-violet-200 bg-violet-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-violet-900/50 dark:bg-violet-950/30">
                                <CardContent className="relative overflow-hidden p-5">
                                    <span
                                        className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-violet-300/40 dark:bg-violet-500/10"
                                        style={{ animationDuration: '8s' }}
                                    />
                                    <span
                                        className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-violet-200/30 dark:bg-violet-600/10"
                                        style={{ animationDuration: '6s' }}
                                    />
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="rounded-xl bg-violet-100 p-2.5 dark:bg-violet-900/50">
                                            <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-violet-200 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-500" />
                                    </div>
                                    <p className="mb-1 text-xs text-violet-700 dark:text-violet-400">{translate('Total Sales')}</p>
                                    <p className="truncate text-xl font-bold tracking-tight text-violet-900 sm:text-2xl dark:text-violet-100">
                                        {(stats.totalSales || 0).toLocaleString()}
                                    </p>
                                    <p className="mt-1.5 text-[11px] text-violet-500 dark:text-violet-400">
                                        {stats.conversionRate || 0}% {translate('conversion')}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {/* Total Customers */}
                    {useHasPermission('manage-accounts') && (
                        <Link href={route('accounts.index')} className="group">
                            <Card className="h-full cursor-pointer border border-orange-200 bg-orange-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-orange-900/50 dark:bg-orange-950/30">
                                <CardContent className="relative overflow-hidden p-5">
                                    <span
                                        className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-orange-300/40 dark:bg-orange-500/10"
                                        style={{ animationDuration: '7s' }}
                                    />
                                    <span
                                        className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-orange-200/30 dark:bg-orange-600/10"
                                        style={{ animationDuration: '9s' }}
                                    />
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="rounded-xl bg-orange-100 p-2.5 dark:bg-orange-900/50">
                                            <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-orange-200 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-orange-500" />
                                    </div>
                                    <p className="mb-1 text-xs text-orange-700 dark:text-orange-400">{translate('Total Accounts')}</p>
                                    <p className="truncate text-xl font-bold tracking-tight text-orange-900 sm:text-2xl dark:text-orange-100">
                                        {(stats.totalCustomers || 0).toLocaleString()}
                                    </p>
                                    <p className="mt-1.5 text-[11px] text-orange-500 dark:text-orange-400">{translate('active customers')}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {/* Total Projects */}
                    {useHasPermission('manage-projects') && (
                        <Link href={route('projects.index')} className="group">
                            <Card className="h-full cursor-pointer border border-indigo-200 bg-indigo-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-indigo-900/50 dark:bg-indigo-950/30">
                                <CardContent className="relative overflow-hidden p-5">
                                    <span
                                        className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-indigo-300/40 dark:bg-indigo-500/10"
                                        style={{ animationDuration: '6s' }}
                                    />
                                    <span
                                        className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-indigo-200/30 dark:bg-indigo-600/10"
                                        style={{ animationDuration: '8s' }}
                                    />
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="rounded-xl bg-indigo-100 p-2.5 dark:bg-indigo-900/50">
                                            <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-indigo-200 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-500" />
                                    </div>
                                    <p className="mb-1 text-xs text-indigo-700 dark:text-indigo-400">{translate('Total Projects')}</p>
                                    <p className="truncate text-xl font-bold tracking-tight text-indigo-900 sm:text-2xl dark:text-indigo-100">
                                        {(stats.totalProjects || 0).toLocaleString()}
                                    </p>
                                    <p className="mt-1.5 text-[11px] text-indigo-500 dark:text-indigo-400">{translate('active projects')}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    )}

                    {/* Organization Revenue */}
                    {useHasPermission('manage-invoices') && (
                        <div className="group">
                            <Card className="h-full border border-emerald-300 bg-emerald-50 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-emerald-800 dark:bg-emerald-950/40">
                                <CardContent className="relative overflow-hidden p-5">
                                    <span
                                        className="pointer-events-none absolute -top-3 right-4 h-10 w-10 animate-ping rounded-full bg-emerald-300/40 dark:bg-emerald-500/10"
                                        style={{ animationDuration: '6s' }}
                                    />
                                    <span
                                        className="pointer-events-none absolute top-1 right-1 h-14 w-14 animate-pulse rounded-full bg-emerald-200/30 dark:bg-emerald-600/10"
                                        style={{ animationDuration: '7s' }}
                                    />
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/60">
                                            <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                    </div>
                                    <p className="mb-1 text-xs text-emerald-700 dark:text-emerald-400">{translate('Organization Revenue')}</p>
                                    <p
                                        className="truncate font-mono text-xl font-bold tracking-tight text-emerald-900 sm:text-2xl dark:text-emerald-100"
                                        title={
                                            window.appSettings?.formatCurrency(stats.organizationRevenue || 0) ??
                                            `$${(stats.organizationRevenue || 0).toLocaleString()}`
                                        }
                                    >
                                        {window.appSettings?.formatCurrency(stats.organizationRevenue || 0) ??
                                            `$${(stats.organizationRevenue || 0).toLocaleString()}`}
                                    </p>
                                    <p className="mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-500">
                                        {stats?.monthlyGrowth > 0 ? '+' : ''}
                                        {stats.monthlyGrowth || 0}% {translate('growth')}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

                {/* ── Storage Usage ── */}
                {/* {useHasPermission('manage-dashboard') && (
                    <div className="dash-anim" style={{ animationDelay: '220ms' }}>
                        <Card className="border border-purple-100 dark:border-purple-900/40 shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                            <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <CardTitle className="text-base font-semibold">{translate('Storage Usage')}</CardTitle>
                                    </div>
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${(stats.storageUsagePercent || 0) > 80 ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                            (stats.storageUsagePercent || 0) > 60 ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                                'bg-purple-50 text-purple-700 ring-purple-600/20'
                                        }`}>
                                        {Math.min(Math.round(stats.storageUsagePercent || 0), 100)}% {translate('used')}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-5">
                                {(() => {
                                    const usedPct = Math.min(Math.round(stats.storageUsagePercent || 0), 100);
                                    const freePct = Math.max(100 - usedPct, 0);
                                    const usedMB = stats.storageUsedMB || 0;
                                    const limitGB = stats.storageLimitGB || 1;
                                    const fmtUsed = usedMB < 1024 ? `${usedMB.toFixed(1)} MB` : `${(usedMB / 1024).toFixed(1)} GB`;
                                    const color = usedPct > 80 ? '#ef4444' : usedPct > 60 ? '#f59e0b' : primaryColor;
                                    return (
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="relative">
                                                <PieChart width={160} height={160}>
                                                    <Pie data={[{ value: usedPct }, { value: freePct }]} cx={75} cy={75} innerRadius={48} outerRadius={65} dataKey="value" startAngle={90} endAngle={-270}>
                                                        <Cell fill={color} />
                                                        <Cell fill="#e5e7eb" />
                                                    </Pie>
                                                    <Tooltip formatter={(v) => [`${v}%`, translate('Storage')]} />
                                                </PieChart>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-xl font-bold" style={{ color }}>{usedPct}%</span>
                                                    <span className="text-xs text-muted-foreground">{translate('Used')}</span>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-sm text-muted-foreground">{fmtUsed} {translate('of')} {limitGB.toFixed(1)} GB {translate('used')}</p>
                                                {usedPct > 80 && <p className="text-xs text-red-600">{translate('Storage limit nearly reached')}</p>}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                )} */}

                {/* ── Row 1: Latest Leads + Recent Sales ── */}
                <div className="dash-anim grid gap-4 lg:grid-cols-2" style={{ animationDelay: '240ms' }}>
                    {/* Latest Leads */}
                    {useHasPermission('manage-leads') && (
                        <Card className="overflow-hidden border border-green-100 shadow-sm dark:border-green-900/40 dark:bg-slate-900">
                            <CardHeader className="border-b px-5 pt-5 pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{translate('Latest Leads')}</CardTitle>
                                        <p className="text-muted-foreground mt-0.5 text-xs">{translate('Most recently created leads')}</p>
                                    </div>
                                    {useHasPermission('view-leads') && (
                                        <Link
                                            href={route('leads.index')}
                                            className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
                                        >
                                            {translate('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.leads.length > 0 ? (
                                    <div>
                                        {recentActivities.leads.map((lead, i) => (
                                            <div
                                                key={i}
                                                className="hover:bg-muted/50 group/row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                            >
                                                <div className="shrink-0">
                                                    <UserInitials name={lead.name} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm leading-tight font-semibold">{lead.name}</p>
                                                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                        {lead.email || lead.organization || ''}
                                                    </p>
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
                    )}

                    {/* Recent Sales */}
                    {useHasPermission('manage-sales-orders') && (
                        <Card className="overflow-hidden border border-violet-100 shadow-sm dark:border-violet-900/40 dark:bg-slate-900">
                            <CardHeader className="border-b px-5 pt-5 pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{translate('Recent Sales')}</CardTitle>
                                        <p className="text-muted-foreground mt-0.5 text-xs">{translate('Latest sales orders')}</p>
                                    </div>
                                    {useHasPermission('view-sales-orders') && (
                                        <Link
                                            href={route('sales-orders.index')}
                                            className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
                                        >
                                            {translate('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.sales.length > 0 ? (
                                    <div>
                                        {recentActivities.sales.map((sale, i) => (
                                            <div
                                                key={i}
                                                className="hover:bg-muted/50 group/row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                            >
                                                <div className="shrink-0">
                                                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                                                        <Banknote className="text-primary h-4 w-4" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm leading-tight font-semibold">{sale.customer}</p>
                                                    <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                                                        {sale.amount
                                                            ? (window.appSettings?.formatCurrency(sale.amount) ?? `$${sale.amount.toLocaleString()}`)
                                                            : ''}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(sale.status)}`}
                                                    >
                                                        {sale.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Draft'}
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
                                    <div className="flex h-40 flex-col items-center justify-center gap-3">
                                        <div className="bg-muted animate-pulse rounded-full p-4">
                                            <DollarSign className="text-muted-foreground/50 h-6 w-6" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">{translate('No sales yet')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
                {/* ── Row 3: Announcements (8) + Storage Donut (4) ── */}
                {useHasPermission('manage-announcements') && (
                    <div className="dash-anim grid gap-4 lg:grid-cols-12" style={{ animationDelay: '320ms' }}>
                        {/* Announcements — col-span-8 */}
                        <Card className="border-border overflow-hidden border shadow-sm lg:col-span-8 dark:bg-slate-900">
                            <CardHeader className="border-b px-5 pt-5 pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{translate('Announcements')}</CardTitle>
                                        <p className="text-muted-foreground mt-0.5 text-xs">{translate('Latest organization announcements')}</p>
                                    </div>
                                    {useHasPermission('view-announcements') && (
                                        <Link
                                            href={route('announcements.index')}
                                            className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
                                        >
                                            {translate('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.announcements.length > 0 ? (
                                    <div>
                                        {recentActivities.announcements.map((a, i) => (
                                            <div
                                                key={i}
                                                onClick={() => router.get(route('announcements.show', a.id))}
                                                className={`hover:bg-muted/50 flex cursor-pointer items-center gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60`}
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                                                    <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="truncate text-sm leading-tight font-semibold">{a.title}</p>
                                                        {a.is_featured && (
                                                            <TooltipProvider>
                                                                <UITooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Star className="h-3 w-3 shrink-0 cursor-pointer text-yellow-500" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{translate('Featured')}</TooltipContent>
                                                                </UITooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        {window.appSettings?.formatDateTime(a.created_at, false) ||
                                                            new Date(a.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {a.category && (
                                                    <span className="inline-flex shrink-0 items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-600/20 ring-inset">
                                                        {a.category}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-40 flex-col items-center justify-center gap-3">
                                        <div className="bg-muted animate-pulse rounded-full p-4">
                                            <Megaphone className="text-muted-foreground/50 h-6 w-6" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">{translate('No announcements yet')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Storage — donut + 3 summary cards inside */}
                        <div className="lg:col-span-4">
                            <Card className="h-full overflow-hidden border border-purple-100 shadow-sm dark:border-purple-900/40 dark:bg-slate-900">
                                <CardHeader className="border-b px-5 pt-5 pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-semibold">{translate('Storage Usage')}</CardTitle>
                                            <p className="text-muted-foreground mt-0.5 text-xs">{translate('Plan storage consumption')}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-4 px-4 pt-13 pb-5">
                                    {(() => {
                                        const usedPct = Math.min(Math.round(stats.storageUsagePercent || 0), 100);
                                        const freePct = Math.max(100 - usedPct, 0);
                                        const usedMB = stats.storageUsedMB || 0;
                                        const limitGB = stats.storageLimitGB || 1;
                                        const fmtUsed = usedMB < 1024 ? `${usedMB.toFixed(1)} MB` : `${(usedMB / 1024).toFixed(1)} GB`;
                                        const freeGB = Math.max((limitGB * 1024 - usedMB) / 1024, 0);
                                        const color = usedPct > 80 ? '#ef4444' : usedPct > 60 ? '#f59e0b' : primaryColor;
                                        const W = 200,
                                            R = 80,
                                            r = 55;
                                        return (
                                            <>
                                                {/* Half-donut */}
                                                <div
                                                    className="relative flex justify-center"
                                                    style={{ width: W, height: R + 10, overflow: 'hidden' }}
                                                >
                                                    <PieChart width={W} height={R + 10}>
                                                        <Pie
                                                            data={[
                                                                { name: translate('Used'), value: usedPct },
                                                                { name: translate('Free'), value: freePct },
                                                            ]}
                                                            cx={W / 2}
                                                            cy={R + 2}
                                                            startAngle={180}
                                                            endAngle={0}
                                                            innerRadius={r}
                                                            outerRadius={R}
                                                            dataKey="value"
                                                            strokeWidth={0}
                                                            isAnimationActive={false}
                                                        >
                                                            <Cell fill={color} />
                                                            <Cell fill="#e5e7eb" />
                                                        </Pie>
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
                                                            formatter={(value: number, name: string) => [
                                                                name === translate('Used') ? fmtUsed : `${freeGB.toFixed(1)} GB`,
                                                                name,
                                                            ]}
                                                        />
                                                    </PieChart>
                                                    <div
                                                        className="absolute flex flex-col items-center"
                                                        style={{ bottom: 5, left: '50%', transform: 'translateX(-50%)' }}
                                                    >
                                                        <span className="text-lg leading-tight font-bold" style={{ color }}>
                                                            {usedPct}%
                                                        </span>
                                                        <span className="text-muted-foreground text-[10px]">{translate('Used')}</span>
                                                    </div>
                                                </div>
                                                {/* scale labels aligned to arc edges */}
                                                <div className="relative -mt-1" style={{ width: W }}>
                                                    <span className="text-muted-foreground absolute text-xs" style={{ left: W / 2 - R, bottom: 0 }}>
                                                        0 GB
                                                    </span>
                                                    <span
                                                        className="text-muted-foreground absolute text-xs"
                                                        style={{ right: W / 2 - R - 16, bottom: 0 }}
                                                    >
                                                        {limitGB.toFixed(1)} GB
                                                    </span>
                                                    <div style={{ height: 16 }} />
                                                </div>

                                                {/* 3 summary mini-cards */}
                                                <div className="mt-3 grid w-full grid-cols-3 gap-2">
                                                    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-orange-200 bg-orange-50 px-2 py-2 dark:border-orange-800 dark:bg-orange-950/30">
                                                        <p className="text-[10px] text-orange-600 dark:text-orange-400">{translate('Used')}</p>
                                                        <p className="text-center text-xs leading-tight font-bold text-orange-700 dark:text-orange-300">
                                                            {fmtUsed}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
                                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{translate('Free')}</p>
                                                        <p className="text-center text-xs leading-tight font-bold text-emerald-700 dark:text-emerald-300">
                                                            {freeGB.toFixed(1)} GB
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 dark:border-blue-800 dark:bg-blue-950/30">
                                                        <p className="text-[10px] text-blue-600 dark:text-blue-400">{translate('Total')}</p>
                                                        <p className="text-center text-xs leading-tight font-bold text-blue-700 dark:text-blue-300">
                                                            {limitGB.toFixed(1)} GB
                                                        </p>
                                                    </div>
                                                </div>

                                                {usedPct > 80 && (
                                                    <p className="text-center text-xs font-medium text-red-500">
                                                        {translate('Storage limit nearly reached')}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ── Sales Trends + Revenue Chart ── */}
                {useHasPermission('view-sales-orders') && (
                    <div className="dash-anim" style={{ animationDelay: '160ms' }}>
                        <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                            <CardHeader className="border-b px-5 pt-5 pb-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            {salesTab === 'sales' ? translate('Sales Trends') : translate('Revenue')}
                                        </CardTitle>
                                        <p className="text-muted-foreground mt-0.5 text-xs">
                                            {salesTab === 'sales' ? translate('Monthly sales performance') : translate('Monthly invoice revenue')} —{' '}
                                            {chartYear}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {useHasPermission('view-invoices') && (
                                            <Tabs value={salesTab} onValueChange={(v) => setSalesTab(v as 'sales' | 'revenue')}>
                                                <TabsList className="h-7">
                                                    <TabsTrigger value="sales" className="cursor-pointer px-3 py-1 text-xs">
                                                        {translate('Sales')}
                                                    </TabsTrigger>
                                                    <TabsTrigger value="revenue" className="cursor-pointer px-3 py-1 text-xs">
                                                        {translate('Revenue')}
                                                    </TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        )}
                                        {salesTab === 'sales' && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                                                {charts.salesTrends?.reduce((s, m) => s + m.sales, 0) || 0} {translate('total')}
                                            </span>
                                        )}
                                        {salesTab === 'revenue' && useHasPermission('view-managemanagemanage') && (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                                                {window.appSettings?.formatCurrency(charts.revenueChart?.reduce((s, m) => s + m.revenue, 0) || 0)}
                                            </span>
                                        )}
                                        <Select value={String(chartYear)} onValueChange={(v) => handleChartYearChange(Number(v))}>
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
                                {salesTab === 'sales' || !useHasPermission('view-invoices') ? (
                                    charts.salesTrends && charts.salesTrends.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={charts.salesTrends} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
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
                                                        backgroundColor: 'rgba(255,255,255,0.7)',
                                                        color: primaryColor,
                                                    }}
                                                    itemStyle={{ color: primaryColor }}
                                                    labelStyle={{ color: primaryColor }}
                                                    formatter={(value: number) => [value, translate('Sales')]}
                                                    labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="sales"
                                                    stroke={primaryColor}
                                                    name={translate('Sales')}
                                                    strokeWidth={2.5}
                                                    dot={{ r: 4, fill: primaryColor, strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-40 flex-col items-center justify-center gap-3">
                                            <div className="bg-muted animate-pulse rounded-full p-4">
                                                <BarChart3 className="text-muted-foreground/50 h-6 w-6" />
                                            </div>
                                            <p className="text-muted-foreground text-sm">{translate('No sales data available')}</p>
                                        </div>
                                    )
                                ) : charts.revenueChart && charts.revenueChart.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={charts.revenueChart} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                                            <XAxis
                                                dataKey="short"
                                                tick={{ fontSize: 11, fill: 'currentColor' }}
                                                className="text-muted-foreground"
                                                axisLine={{ stroke: primaryColor }}
                                                tickLine={{ stroke: primaryColor }}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 11, fill: 'currentColor', fontFamily: 'monospace' }}
                                                className="text-muted-foreground"
                                                axisLine={{ stroke: primaryColor }}
                                                tickLine={{ stroke: primaryColor }}
                                                tickFormatter={(v) => (v === 0 ? '$0' : (window.appSettings?.formatCurrency(v) ?? `$${v}`))}
                                                width={80}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    fontSize: 12,
                                                    borderRadius: 8,
                                                    border: `1px solid ${primaryColor}30`,
                                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                                    color: primaryColor,
                                                }}
                                                formatter={(value: number) => [
                                                    window.appSettings?.formatCurrency(value) ?? `$${value}`,
                                                    translate('Revenue'),
                                                ]}
                                                labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke={primaryColor}
                                                name={translate('Revenue')}
                                                strokeWidth={2.5}
                                                dot={{ r: 4, fill: primaryColor, strokeWidth: 2, stroke: '#fff' }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-40 flex-col items-center justify-center gap-3">
                                        <div className="bg-muted animate-pulse rounded-full p-4">
                                            <BarChart3 className="text-muted-foreground/50 h-6 w-6" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">{translate('No revenue data available')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── Lead Conversions Chart ── */}
                {useHasPermission('view-leads') && (
                    <div className="dash-anim" style={{ animationDelay: '200ms' }}>
                        <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                            <CardHeader className="border-b px-5 pt-5 pb-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{translate('Lead Conversions')}</CardTitle>
                                        <p className="text-muted-foreground mt-0.5 text-xs">
                                            {translate('Leads vs conversions per month')} — {chartYear}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                                            {charts.leadConversions?.reduce((s, m) => s + (m.conversions || 0), 0) || 0} {translate('conversions')}
                                        </span>
                                        <Select value={String(leadYear)} onValueChange={(v) => handleLeadYearChange(Number(v))}>
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
                                {charts.leadConversions && charts.leadConversions.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={charts.leadConversions} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
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
                                                labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="rect" />
                                            <Bar
                                                dataKey="leads"
                                                fill="#A12582"
                                                name={translate('Total Leads')}
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={30}
                                                opacity={0.7}
                                            >
                                                <LabelList
                                                    dataKey="leads"
                                                    position="top"
                                                    style={{ fontSize: 11, fill: '#A12582', fontWeight: 600 }}
                                                    formatter={(v: number) => (v > 0 ? v : '')}
                                                />
                                            </Bar>
                                            <Bar
                                                dataKey="conversions"
                                                fill="#10b981"
                                                name={translate('Conversions')}
                                                radius={[4, 4, 0, 0]}
                                                maxBarSize={30}
                                            >
                                                <LabelList
                                                    dataKey="conversions"
                                                    position="top"
                                                    style={{ fontSize: 11, fill: '#10b981', fontWeight: 600 }}
                                                    formatter={(v: number) => (v > 0 ? v : '')}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-40 flex-col items-center justify-center gap-3">
                                        <div className="bg-muted animate-pulse rounded-full p-4">
                                            <Target className="text-muted-foreground/50 h-6 w-6" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">{translate('No conversion data available')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
                {/* ── Row 2: Active Projects + New Customers ── */}
                <div className="dash-anim grid gap-4 lg:grid-cols-2" style={{ animationDelay: '280ms' }}>
                    {/* Active Projects */}
                    {useHasPermission('manage-projects') && (
                        <Card className="overflow-hidden border border-indigo-100 shadow-sm dark:border-indigo-900/40 dark:bg-slate-900">
                            <CardHeader className="border-b px-5 pt-5 pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{translate('Active Projects')}</CardTitle>
                                        <p className="text-muted-foreground mt-0.5 text-xs">{translate('All active and ongoing projects')}</p>
                                    </div>
                                    {useHasPermission('view-projects') && (
                                        <Link
                                            href={route('projects.index')}
                                            className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
                                        >
                                            {translate('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.projects.length > 0 ? (
                                    <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                                        {recentActivities.projects.map((project, i) => (
                                            <div
                                                key={i}
                                                className="hover:bg-muted/50 group/row flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                            >
                                                <div className="shrink-0">
                                                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                                                        <Briefcase className="text-primary h-4 w-4" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm leading-tight font-semibold">{project.name}</p>
                                                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        {window.appSettings?.formatDateTime(project.created_at, false) ||
                                                            new Date(project.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(project.status)}`}
                                                    >
                                                        {project.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                                                            'Planning'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-40 flex-col items-center justify-center gap-3">
                                        <div className="bg-muted animate-pulse rounded-full p-4">
                                            <Briefcase className="text-muted-foreground/50 h-6 w-6" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">{translate('No projects yet')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* New Customers */}
                    {useHasPermission('manage-accounts') && (
                        <Card className="border-border overflow-hidden border shadow-sm dark:bg-slate-900">
                            <CardHeader className="border-b px-5 pt-5 pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{translate('New Accounts')}</CardTitle>
                                        <p className="text-muted-foreground mt-0.5 text-xs">{translate('Recently added customers')}</p>
                                    </div>
                                    {useHasPermission('view-accounts') && (
                                        <Link
                                            href={route('contacts.index')}
                                            className="text-primary flex shrink-0 items-center gap-1 text-xs font-medium transition-all duration-150 hover:gap-1.5"
                                        >
                                            {translate('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.customers.length > 0 ? (
                                    <div>
                                        {recentActivities.customers.map((customer, i) => (
                                            <div
                                                key={i}
                                                className="hover:bg-muted/50 flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 dark:hover:bg-slate-800/60"
                                            >
                                                <div className="shrink-0">
                                                    <UserInitials name={customer.name} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm leading-tight font-semibold">{customer.name}</p>
                                                    <p className="text-muted-foreground mt-0.5 truncate text-xs">{customer.email}</p>
                                                </div>
                                                <span
                                                    className={`inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(customer.type)}`}
                                                >
                                                    {customer.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Customer'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex h-40 flex-col items-center justify-center gap-3">
                                        <div className="bg-muted animate-pulse rounded-full p-4">
                                            <Building2 className="text-muted-foreground/50 h-6 w-6" />
                                        </div>
                                        <p className="text-muted-foreground text-sm">{translate('No customers yet')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </PageTemplate>
    );
}
