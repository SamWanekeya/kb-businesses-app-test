import React from 'react';
import { PageTemplate } from '@/components/page-template';
import { RefreshCw, Users, Building2, Briefcase, TrendingUp, BarChart3, DollarSign, Target, Megaphone, Star, ArrowUpRight, Settings, Banknote, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { usePage, router, Link } from '@inertiajs/react';
import { BarChart, Bar, LineChart, Line, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import UserInitials from '@/components/user-initials';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { hasPermission } from '@/utils/authorization';

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
    const { t } = useTranslation();
    const { auth } = usePage().props as any;
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
    const greetingText = hour < 12 ? t('Good Morning') : hour < 18 ? t('Good Afternoon') : t('Good Evening');

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload();
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const getStatusColor = (status: string) => {
        const colors = {
            'new': 'bg-blue-50 text-blue-700 ring-blue-600/20',
            'qualified': 'bg-green-50 text-green-700 ring-green-600/20',
            'converted': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
            'closed': 'bg-green-50 text-green-700 ring-green-600/20',
            'pending': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
            'in_progress': 'bg-blue-50 text-blue-700 ring-blue-600/20',
            'planning': 'bg-purple-50 text-purple-700 ring-purple-600/20',
            'completed': 'bg-green-50 text-green-700 ring-green-600/20',
            'on_hold': 'bg-orange-50 text-orange-700 ring-orange-600/20',
            'cancelled': 'bg-red-50 text-red-700 ring-red-600/20',
            'active': 'bg-green-50 text-green-700 ring-green-600/20',
            'inactive': 'bg-gray-50 text-gray-700 ring-gray-600/20',
            'enterprise': 'bg-purple-50 text-purple-700 ring-purple-600/20',
            'startup': 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
            'customer': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
            'draft': 'bg-gray-50 text-gray-700 ring-gray-600/20',
            'shipped': 'bg-blue-50 text-blue-700 ring-blue-600/20',
            'confirmed': 'bg-green-50 text-green-700 ring-green-600/20',
            'delivered': 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
            'processing': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
            'enterprise customer': 'bg-purple-50 text-purple-700 ring-purple-600/20',
            'smb customer': 'bg-blue-50 text-blue-700 ring-blue-600/20',
            'strategic partner': 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
            'supplier/vendor': 'bg-orange-50 text-orange-700 ring-orange-600/20',
            'reseller/channel': 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
            'prospect': 'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
        };
        return colors[status?.toLowerCase()] || 'bg-slate-50 text-slate-700 ring-slate-600/20';
    };

    return (
        <PageTemplate
            title={t('Dashboard')}
            description={t('Overview of organization performance, metrics, and recent activities.')}
            url={route('dashboard')}
            actions={[{
                label: t('Refresh'),
                icon: <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />,
                variant: 'outline',
                onClick: handleRefresh
            }]}
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
                <div className="group relative overflow-hidden rounded-2xl bg-slate-800 dark:bg-slate-900 px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between dash-anim" style={{ animationDelay: '0ms' }}>
                    <span className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
                    <span className="pointer-events-none absolute -bottom-10 right-0 w-56 h-56 rounded-full bg-blue-500/10 blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1.5s' }} />
                    <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-violet-500/5 blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.8s' }} />
                    <span className="pointer-events-none absolute top-4 left-1/3 w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-[0_0_6px_2px_rgba(52,211,153,0.6)] animate-ping" style={{ animationDuration: '3s' }} />
                    <span className="pointer-events-none absolute bottom-4 left-1/4 w-1 h-1 rounded-full bg-blue-400/70 shadow-[0_0_4px_2px_rgba(96,165,250,0.5)] animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                    <span className="pointer-events-none absolute top-3 right-1/4 w-1.5 h-1.5 rounded-full bg-violet-400/70 shadow-[0_0_6px_2px_rgba(167,139,250,0.5)] animate-ping" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }} />
                    <span className="pointer-events-none absolute bottom-3 right-1/3 w-1 h-1 rounded-full bg-emerald-300/80 shadow-[0_0_4px_2px_rgba(110,231,183,0.5)] animate-ping" style={{ animationDuration: '2.8s', animationDelay: '1.8s' }} />
                    <div className="pointer-events-none absolute bottom-0 left-0 w-full overflow-hidden" style={{ height: '40px' }}>
                        <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-1"><svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(52,211,153,0.12)" d="M0,20 C150,38 350,0 600,20 C850,38 1050,0 1200,20 C1350,38 1550,0 1800,20 C2050,38 2250,0 2400,20 L2400,40 L0,40 Z" /></svg></div>
                        <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-2"><svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(96,165,250,0.09)" d="M0,26 C200,10 400,38 600,22 C800,8 1000,36 1200,24 C1400,10 1600,38 1800,22 C2000,8 2200,36 2400,24 L2400,40 L0,40 Z" /></svg></div>
                        <div className="absolute bottom-0 left-0 w-[200%] animate-water-wave-3"><svg viewBox="0 0 2400 40" preserveAspectRatio="none" className="w-full h-[40px]"><path fill="rgba(167,139,250,0.07)" d="M0,30 C300,14 500,38 700,28 C900,16 1100,38 1200,28 C1400,14 1600,38 1900,28 C2100,16 2300,38 2400,28 L2400,40 L0,40 Z" /></svg></div>
                    </div>
                    <div className="group-hover:translate-x-2 transition-transform duration-300 min-w-0">
                        <p className="text-slate-400 text-sm mb-0.5">{greetingText},</p>
                        <div className="flex items-center gap-2">
                            <h2 className="text-white text-xl sm:text-2xl font-bold truncate group-hover:text-primary transition-colors duration-300">
                                {auth?.user?.name ?? t('Welcome')}
                            </h2>
                            <span className="animate-hand-wave text-2xl sm:text-3xl select-none">👋</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1 hidden sm:block group-hover:text-slate-300 transition-colors duration-300">
                            {t("Here's what's happening across your platform today.")}
                        </p>
                        {(hasPermission(auth?.permissions, 'manage-opportunities')) && (
                            <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-primary/70 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.2s' }} />
                                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1.2s' }} />
                                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1.2s' }} />
                                </div>
                                <span className="text-primary font-semibold text-sm group-hover:scale-105 transition-transform duration-200">
                                    {(stats.totalOpportunities || 0).toLocaleString() + ' ' + t('total opportunities')}
                                </span>
                            </div>
                        )}

                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">

                        <div className="w-px h-10 bg-white/10 hidden sm:block" />
                        {[
                            hasPermission(auth?.permissions, 'manage-leads')        && { icon: Target,     label: t('Leads'),    href: route('leads.index'),        color: 'text-emerald-300 hover:text-emerald-200', bg: 'hover:bg-emerald-400/10' },
                            hasPermission(auth?.permissions, 'manage-sales-orders') && { icon: DollarSign,  label: t('Sales'),    href: route('sales-orders.index'), color: 'text-blue-300 hover:text-blue-200',     bg: 'hover:bg-blue-400/10' },
                            hasPermission(auth?.permissions, 'manage-projects')     && { icon: Briefcase,   label: t('Projects'), href: route('projects.index'),    color: 'text-violet-300 hover:text-violet-200',  bg: 'hover:bg-violet-400/10' },
                            hasPermission(auth?.permissions, 'manage-settings')   && { icon: Settings,    label: t('Settings'), href: route('settings'),          color: 'text-slate-300 hover:text-slate-200',    bg: 'hover:bg-white/10' },
                        ].filter(Boolean).map(({ icon: Icon, label, href, color, bg }: any) => (
                            <Link key={label} href={href} className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 ${bg} group/qa`}>
                                <Icon className={`h-5 w-5 transition-all duration-200 ${color} group-hover/qa:-translate-y-0.5`} />
                                <span className="text-slate-400 text-[10px] group-hover/qa:text-slate-300 transition-colors duration-200">{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ── KPI cards ── */}
                <div className="dash-anim grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" style={{ animationDelay: '80ms' }}>

                    {/* Total Leads */}
                    {hasPermission(auth?.permissions, 'manage-leads') && (
                    <Link href={route('leads.index')} className="group">
                        <Card className="h-full border border-green-200 dark:border-green-900/50 shadow-sm bg-green-50 dark:bg-green-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                            <CardContent className="relative overflow-hidden p-5">
                                <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-green-300/40 dark:bg-green-500/10 animate-ping" style={{ animationDuration: '6s' }} />
                                <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-green-200/30 dark:bg-green-600/10 animate-pulse" style={{ animationDuration: '7s' }} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="rounded-xl bg-green-100 dark:bg-green-900/50 p-2.5">
                                        <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-green-200 group-hover:text-green-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                                <p className="text-green-700 dark:text-green-400 text-xs mb-1">{t('Total Leads')}</p>
                                <p className="text-green-900 dark:text-green-100 text-2xl font-bold tracking-tight">{(stats.totalLeads || 0).toLocaleString()}</p>
                                <p className="text-green-600 text-[11px] mt-1.5 flex items-center gap-0.5">
                                    <TrendingUp className="h-3 w-3" /> {stats?.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth || 0}% {t('this month')}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                    )}

                    {/* Total Sales */}
                    {hasPermission(auth?.permissions, 'manage-sales-orders') && (
                    <Link href={route('sales-orders.index')} className="group">
                        <Card className="h-full border border-violet-200 dark:border-violet-900/50 shadow-sm bg-violet-50 dark:bg-violet-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                            <CardContent className="relative overflow-hidden p-5">
                                <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-violet-300/40 dark:bg-violet-500/10 animate-ping" style={{ animationDuration: '8s' }} />
                                <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-violet-200/30 dark:bg-violet-600/10 animate-pulse" style={{ animationDuration: '6s' }} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="rounded-xl bg-violet-100 dark:bg-violet-900/50 p-2.5">
                                        <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-violet-200 group-hover:text-violet-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                                <p className="text-violet-700 dark:text-violet-400 text-xs mb-1">{t('Total Sales')}</p>
                                <p className="text-violet-900 dark:text-violet-100 text-2xl font-bold tracking-tight">{(stats.totalSales || 0).toLocaleString()}</p>
                                <p className="text-violet-500 dark:text-violet-400 text-[11px] mt-1.5">{stats.conversionRate || 0}% {t('conversion')}</p>
                            </CardContent>
                        </Card>
                    </Link>
                    )}

                    {/* Total Customers */}
                    {hasPermission(auth?.permissions, 'manage-accounts') && (
                    <Link href={route('accounts.index')} className="group">
                        <Card className="h-full border border-orange-200 dark:border-orange-900/50 shadow-sm bg-orange-50 dark:bg-orange-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                            <CardContent className="relative overflow-hidden p-5">
                                <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-orange-300/40 dark:bg-orange-500/10 animate-ping" style={{ animationDuration: '7s' }} />
                                <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-orange-200/30 dark:bg-orange-600/10 animate-pulse" style={{ animationDuration: '9s' }} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="rounded-xl bg-orange-100 dark:bg-orange-900/50 p-2.5">
                                        <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-orange-200 group-hover:text-orange-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                                <p className="text-orange-700 dark:text-orange-400 text-xs mb-1">{t('Total Accounts')}</p>
                                <p className="text-orange-900 dark:text-orange-100 text-2xl font-bold tracking-tight">{(stats.totalCustomers || 0).toLocaleString()}</p>
                                <p className="text-orange-500 dark:text-orange-400 text-[11px] mt-1.5">{t('active customers')}</p>
                            </CardContent>
                        </Card>
                    </Link>
                    )}

                    {/* Total Projects */}
                    {hasPermission(auth?.permissions, 'manage-projects') && (
                    <Link href={route('projects.index')} className="group">
                        <Card className="h-full border border-indigo-200 dark:border-indigo-900/50 shadow-sm bg-indigo-50 dark:bg-indigo-950/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                            <CardContent className="relative overflow-hidden p-5">
                                <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-indigo-300/40 dark:bg-indigo-500/10 animate-ping" style={{ animationDuration: '6s' }} />
                                <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-indigo-200/30 dark:bg-indigo-600/10 animate-pulse" style={{ animationDuration: '8s' }} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/50 p-2.5">
                                        <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-indigo-200 group-hover:text-indigo-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200" />
                                </div>
                                <p className="text-indigo-700 dark:text-indigo-400 text-xs mb-1">{t('Total Projects')}</p>
                                <p className="text-indigo-900 dark:text-indigo-100 text-2xl font-bold tracking-tight">{(stats.totalProjects || 0).toLocaleString()}</p>
                                <p className="text-indigo-500 dark:text-indigo-400 text-[11px] mt-1.5">{t('active projects')}</p>
                            </CardContent>
                        </Card>
                    </Link>
                    )}

                    {/* Organization Revenue */}
                    {hasPermission(auth?.permissions, 'manage-invoices') && (
                    <div className="group">
                        <Card className="h-full border border-emerald-300 dark:border-emerald-800 shadow-sm bg-emerald-50 dark:bg-emerald-950/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                            <CardContent className="relative overflow-hidden p-5">
                                <span className="pointer-events-none absolute -top-3 right-4 w-10 h-10 rounded-full bg-emerald-300/40 dark:bg-emerald-500/10 animate-ping" style={{ animationDuration: '6s' }} />
                                <span className="pointer-events-none absolute top-1 right-1 w-14 h-14 rounded-full bg-emerald-200/30 dark:bg-emerald-600/10 animate-pulse" style={{ animationDuration: '7s' }} />
                                <div className="flex items-start justify-between mb-4">
                                    <div className="rounded-xl bg-emerald-100 dark:bg-emerald-900/60 p-2.5">
                                        <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                                <p className="text-emerald-700 dark:text-emerald-400 text-xs mb-1">{t('Organization Revenue')}</p>
                                <p className="text-emerald-900 dark:text-emerald-100 text-2xl font-bold tracking-tight font-mono">{window.appSettings?.formatCurrency(stats.organizationRevenue || 0) ?? `$${(stats.organizationRevenue || 0).toLocaleString()}`}</p>
                                <p className="text-emerald-600 dark:text-emerald-500 text-[11px] mt-1.5">{stats?.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth || 0}% {t('growth')}</p>
                            </CardContent>
                        </Card>
                    </div>
                    )}

                </div>



                {/* ── Storage Usage ── */}
                {/* {hasPermission(auth?.permissions, 'manage-dashboard') && (
                    <div className="dash-anim" style={{ animationDelay: '220ms' }}>
                        <Card className="border border-purple-100 dark:border-purple-900/40 shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                                            <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <CardTitle className="text-base font-semibold">{t('Storage Usage')}</CardTitle>
                                    </div>
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${(stats.storageUsagePercent || 0) > 80 ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                            (stats.storageUsagePercent || 0) > 60 ? 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' :
                                                'bg-purple-50 text-purple-700 ring-purple-600/20'
                                        }`}>
                                        {Math.min(Math.round(stats.storageUsagePercent || 0), 100)}% {t('used')}
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
                                                    <Tooltip formatter={(v) => [`${v}%`, t('Storage')]} />
                                                </PieChart>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-xl font-bold" style={{ color }}>{usedPct}%</span>
                                                    <span className="text-xs text-muted-foreground">{t('Used')}</span>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-sm text-muted-foreground">{fmtUsed} {t('of')} {limitGB.toFixed(1)} GB {t('used')}</p>
                                                {usedPct > 80 && <p className="text-xs text-red-600">{t('Storage limit nearly reached')}</p>}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>
                    </div>
                )} */}

                {/* ── Row 1: Latest Leads + Recent Sales ── */}
                <div className="grid gap-4 lg:grid-cols-2 dash-anim" style={{ animationDelay: '240ms' }}>

                    {/* Latest Leads */}
                    {hasPermission(auth?.permissions, 'manage-leads') && (
                        <Card className="border border-green-100 dark:border-green-900/40 shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Latest Leads')}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('Most recently created leads')}</p>
                                    </div>
                                    {hasPermission(auth?.permissions, 'view-leads') && (
                                        <Link href={route('leads.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                                            {t('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.leads.length > 0 ? (
                                    <div>
                                        {recentActivities.leads.map((lead, i) => (
                                            <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 group/row">
                                                <div className="shrink-0">
                                                    <UserInitials name={lead.name} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate leading-tight">{lead.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.email || lead.organization || ''}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(lead.status)}`}>
                                                        {lead.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'New'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        {window.appSettings?.formatDateTime(lead.created_at, false) || new Date(lead.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="rounded-full bg-muted p-4 animate-pulse"><Target className="h-6 w-6 text-muted-foreground/50" /></div>
                                        <p className="text-sm text-muted-foreground">{t('No leads yet')}</p>
                                    </div>
                                )}
                            </CardContent>

                        </Card>
                    )}

                    {/* Recent Sales */}
                    {hasPermission(auth?.permissions, 'manage-sales-orders') && (
                        <Card className="border border-violet-100 dark:border-violet-900/40 shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Recent Sales')}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('Latest sales orders')}</p>
                                    </div>
                                    {hasPermission(auth?.permissions, 'view-sales-orders') && (
                                        <Link href={route('sales-orders.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                                            {t('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.sales.length > 0 ? (
                                    <div>
                                        {recentActivities.sales.map((sale, i) => (
                                            <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 group/row">
                                                <div className="shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Banknote className="h-4 w-4 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate leading-tight">{sale.customer}</p>
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">{sale.amount ? (window.appSettings?.formatCurrency(sale.amount) ?? `$${sale.amount.toLocaleString()}`) : ''}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(sale.status)}`}>
                                                        {sale.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Draft'}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        {window.appSettings?.formatDateTime(sale.created_at, false) || new Date(sale.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="rounded-full bg-muted p-4 animate-pulse"><DollarSign className="h-6 w-6 text-muted-foreground/50" /></div>
                                        <p className="text-sm text-muted-foreground">{t('No sales yet')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                </div>
                  {/* ── Row 3: Announcements (8) + Storage Donut (4) ── */}
                {hasPermission(auth?.permissions, 'manage-announcements') && (
                    <div className="dash-anim grid gap-4 lg:grid-cols-12" style={{ animationDelay: '320ms' }}>

                        {/* Announcements — col-span-8 */}
                        <Card className="lg:col-span-8 border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Announcements')}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('Latest organization announcements')}</p>
                                    </div>
                                    {hasPermission(auth?.permissions, 'view-announcements') && (
                                        <Link href={route('announcements.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                                            {t('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
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
                                                className={`flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 cursor-pointer hover:bg-muted/50 dark:hover:bg-slate-800/60`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                                                    <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-sm font-semibold truncate leading-tight">{a.title}</p>
                                                        {a.is_featured && (
                                                            <TooltipProvider>
                                                                <UITooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Star className="h-3 w-3 text-yellow-500 shrink-0 cursor-pointer" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{t('Featured')}</TooltipContent>
                                                                </UITooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        {window.appSettings?.formatDateTime(a.created_at, false) || new Date(a.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {a.category && (
                                                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-indigo-50 text-indigo-700 ring-indigo-600/20 shrink-0">
                                                        {a.category}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="rounded-full bg-muted p-4 animate-pulse"><Megaphone className="h-6 w-6 text-muted-foreground/50" /></div>
                                        <p className="text-sm text-muted-foreground">{t('No announcements yet')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Storage — donut + 3 summary cards inside */}
                        <div className="lg:col-span-4">
                            <Card className="border border-purple-100 dark:border-purple-900/40 shadow-sm dark:bg-slate-900 overflow-hidden h-full">
                                <CardHeader className="pb-3 pt-5 px-5 border-b">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-base font-semibold">{t('Storage Usage')}</CardTitle>
                                            <p className="text-xs text-muted-foreground mt-0.5">{t('Plan storage consumption')}</p>
                                        </div>
                                                                        </div>
                                </CardHeader>
                                <CardContent className="px-4 pt-13 pb-5 flex flex-col items-center gap-4">
                                    {(() => {
                                        const usedPct = Math.min(Math.round(stats.storageUsagePercent || 0), 100);
                                        const freePct = Math.max(100 - usedPct, 0);
                                        const usedMB = stats.storageUsedMB || 0;
                                        const limitGB = stats.storageLimitGB || 1;
                                        const fmtUsed = usedMB < 1024 ? `${usedMB.toFixed(1)} MB` : `${(usedMB / 1024).toFixed(1)} GB`;
                                        const freeGB = Math.max((limitGB * 1024 - usedMB) / 1024, 0);
                                        const color = usedPct > 80 ? '#ef4444' : usedPct > 60 ? '#f59e0b' : primaryColor;
                                        const W = 200, R = 80, r = 55;
                                        return (
                                            <>
                                                {/* Half-donut */}
                                                <div className="relative flex justify-center" style={{ width: W, height: R + 10, overflow: 'hidden' }}>
                                                    <PieChart width={W} height={R + 10}>
                                                        <Pie data={[{ name: t('Used'), value: usedPct }, { name: t('Free'), value: freePct }]} cx={W / 2} cy={R + 2} startAngle={180} endAngle={0} innerRadius={r} outerRadius={R} dataKey="value" strokeWidth={0} isAnimationActive={false}>
                                                            <Cell fill={color} />
                                                            <Cell fill="#e5e7eb" />
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${primaryColor}30`, backgroundColor: 'rgba(255,255,255,0.7)', color: primaryColor }}
                                                            itemStyle={{ color: primaryColor }}
                                                            labelStyle={{ color: primaryColor }}
                                                            formatter={(value: number, name: string) => [
                                                                name === t('Used') ? fmtUsed : `${freeGB.toFixed(1)} GB`,
                                                                name
                                                            ]}
                                                        />
                                                    </PieChart>
                                                    <div className="absolute flex flex-col items-center" style={{ bottom: 5, left: '50%', transform: 'translateX(-50%)' }}>
                                                        <span className="text-lg font-bold leading-tight" style={{ color }}>{usedPct}%</span>
                                                        <span className="text-[10px] text-muted-foreground">{t('Used')}</span>
                                                    </div>
                                                </div>
                                                {/* scale labels aligned to arc edges */}
                                                <div className="relative -mt-1" style={{ width: W }}>
                                                    <span className="absolute text-xs text-muted-foreground" style={{ left: W / 2 - R, bottom: 0 }}>0 GB</span>
                                                    <span className="absolute text-xs text-muted-foreground" style={{ right: W / 2 - R - 16, bottom: 0 }}>{limitGB.toFixed(1)} GB</span>
                                                    <div style={{ height: 16 }} />
                                                </div>

                                                {/* 3 summary mini-cards */}
                                                <div className="grid grid-cols-3 gap-2 w-full mt-3">
                                                    <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30 px-2 py-2 flex flex-col items-center gap-0.5">
                                                        <p className="text-[10px] text-orange-600 dark:text-orange-400">{t('Used')}</p>
                                                        <p className="text-xs font-bold leading-tight text-center text-orange-700 dark:text-orange-300">{fmtUsed}</p>
                                                    </div>
                                                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-2 flex flex-col items-center gap-0.5">
                                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('Free')}</p>
                                                        <p className="text-xs font-bold leading-tight text-center text-emerald-700 dark:text-emerald-300">{freeGB.toFixed(1)} GB</p>
                                                    </div>
                                                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-2 py-2 flex flex-col items-center gap-0.5">
                                                        <p className="text-[10px] text-blue-600 dark:text-blue-400">{t('Total')}</p>
                                                        <p className="text-xs font-bold leading-tight text-center text-blue-700 dark:text-blue-300">{limitGB.toFixed(1)} GB</p>
                                                    </div>
                                                </div>

                                                {usedPct > 80 && <p className="text-xs text-red-500 font-medium text-center">{t('Storage limit nearly reached')}</p>}
                                            </>
                                        );
                                    })()}
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                )}

  {/* ── Sales Trends + Revenue Chart ── */}
                {hasPermission(auth?.permissions, 'view-sales-orders') && (
                    <div className="dash-anim" style={{ animationDelay: '160ms' }}>
                        <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                        <CardTitle className="text-base font-semibold">
                                            {salesTab === 'sales' ? t('Sales Trends') : t('Revenue')}
                                        </CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {salesTab === 'sales' ? t('Monthly sales performance') : t('Monthly invoice revenue')} — {chartYear}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {hasPermission(auth?.permissions, 'view-invoices') && (
                                            <Tabs value={salesTab} onValueChange={(v) => setSalesTab(v as 'sales' | 'revenue')}>
                                                <TabsList className="h-7">
                                                    <TabsTrigger value="sales" className="text-xs px-3 py-1 cursor-pointer">{t('Sales')}</TabsTrigger>
                                                    <TabsTrigger value="revenue" className="text-xs px-3 py-1 cursor-pointer">{t('Revenue')}</TabsTrigger>
                                                </TabsList>
                                            </Tabs>
                                        )}
                                        {salesTab === 'sales' && (
                                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                                                {charts.salesTrends?.reduce((s, m) => s + m.sales, 0) || 0} {t('total')}
                                            </span>
                                        )}
                                        {salesTab === 'revenue' && hasPermission(auth?.permissions, 'view-managemanagemanage') && (
                                            <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                                                {window.appSettings?.formatCurrency(charts.revenueChart?.reduce((s, m) => s + m.revenue, 0) || 0)}
                                            </span>
                                        )}
                                        <Select value={String(chartYear)} onValueChange={(v) => handleChartYearChange(Number(v))}>
                                            <SelectTrigger className="h-7 w-24 text-xs focus:ring-0 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {availableYears.map(yr => <SelectItem key={yr} value={String(yr)} className="text-xs">{yr}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-5">
                                {salesTab === 'sales' || !hasPermission(auth?.permissions, 'view-invoices') ? (
                                    charts.salesTrends && charts.salesTrends.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={charts.salesTrends} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                                                <XAxis dataKey="short" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" axisLine={{ stroke: primaryColor }} tickLine={{ stroke: primaryColor }} />
                                                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" axisLine={{ stroke: primaryColor }} tickLine={{ stroke: primaryColor }} allowDecimals={false} width={36} />
                                                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${primaryColor}30`, backgroundColor: 'rgba(255,255,255,0.7)', color: primaryColor }} itemStyle={{ color: primaryColor }} labelStyle={{ color: primaryColor }} formatter={(value: number) => [value, t('Sales')]} labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label} />
                                                <Line type="monotone" dataKey="sales" stroke={primaryColor} name={t('Sales')} strokeWidth={2.5} dot={{ r: 4, fill: primaryColor, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                                            <div className="rounded-full bg-muted p-4 animate-pulse"><BarChart3 className="h-6 w-6 text-muted-foreground/50" /></div>
                                            <p className="text-sm text-muted-foreground">{t('No sales data available')}</p>
                                        </div>
                                    )
                                ) : (
                                    charts.revenueChart && charts.revenueChart.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={charts.revenueChart} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke={primaryColor} strokeOpacity={0.3} vertical={false} />
                                                <XAxis dataKey="short" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" axisLine={{ stroke: primaryColor }} tickLine={{ stroke: primaryColor }} />
                                                <YAxis tick={{ fontSize: 11, fill: 'currentColor', fontFamily: 'monospace' }} className="text-muted-foreground" axisLine={{ stroke: primaryColor }} tickLine={{ stroke: primaryColor }} tickFormatter={(v) => v === 0 ? '$0' : window.appSettings?.formatCurrency(v) ?? `$${v}`} width={80} />
                                                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${primaryColor}30`, backgroundColor: 'rgba(255,255,255,0.7)', color: primaryColor }} formatter={(value: number) => [window.appSettings?.formatCurrency(value) ?? `$${value}`, t('Revenue')]} labelFormatter={(label, payload) => payload?.[0]?.payload?.month ?? label} />
                                                <Line type="monotone" dataKey="revenue" stroke={primaryColor} name={t('Revenue')} strokeWidth={2.5} dot={{ r: 4, fill: primaryColor, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-40 gap-3">
                                            <div className="rounded-full bg-muted p-4 animate-pulse"><BarChart3 className="h-6 w-6 text-muted-foreground/50" /></div>
                                            <p className="text-sm text-muted-foreground">{t('No revenue data available')}</p>
                                        </div>
                                    )
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── Lead Conversions Chart ── */}
                {hasPermission(auth?.permissions, 'view-leads') && (
                    <div className="dash-anim" style={{ animationDelay: '200ms' }}>
                        <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Lead Conversions')}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('Leads vs conversions per month')} — {chartYear}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-500/30">
                                            {charts.leadConversions?.reduce((s, m) => s + (m.conversions || 0), 0) || 0} {t('conversions')}
                                        </span>
                                        <Select value={String(leadYear)} onValueChange={(v) => handleLeadYearChange(Number(v))}>
                                            <SelectTrigger className="h-7 w-24 text-xs focus:ring-0 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {availableYears.map(yr => <SelectItem key={yr} value={String(yr)} className="text-xs">{yr}</SelectItem>)}
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
                                            <XAxis dataKey="short" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" axisLine={{ stroke: primaryColor }} tickLine={{ stroke: primaryColor }} />
                                            <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} className="text-muted-foreground" axisLine={{ stroke: primaryColor }} tickLine={{ stroke: primaryColor }} allowDecimals={false} width={36} />
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
                                            <Bar dataKey="leads" fill="#A12582" name={t('Total Leads')} radius={[4, 4, 0, 0]} maxBarSize={30} opacity={0.7}>
                                                <LabelList dataKey="leads" position="top" style={{ fontSize: 11, fill: '#A12582', fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ''} />
                                            </Bar>
                                            <Bar dataKey="conversions" fill="#10b981" name={t('Conversions')} radius={[4, 4, 0, 0]} maxBarSize={30}>
                                                <LabelList dataKey="conversions" position="top" style={{ fontSize: 11, fill: '#10b981', fontWeight: 600 }} formatter={(v: number) => v > 0 ? v : ''} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="rounded-full bg-muted p-4 animate-pulse"><Target className="h-6 w-6 text-muted-foreground/50" /></div>
                                        <p className="text-sm text-muted-foreground">{t('No conversion data available')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
                {/* ── Row 2: Active Projects + New Customers ── */}
                <div className="grid gap-4 lg:grid-cols-2 dash-anim" style={{ animationDelay: '280ms' }}>

                    {/* Active Projects */}
                    {hasPermission(auth?.permissions, 'manage-projects') && (
                        <Card className="border border-indigo-100 dark:border-indigo-900/40 shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('Active Projects')}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('All active and ongoing projects')}</p>
                                    </div>
                                    {hasPermission(auth?.permissions, 'view-projects') && (
                                        <Link href={route('projects.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                                            {t('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.projects.length > 0 ? (
                                    <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                                        {recentActivities.projects.map((project, i) => (
                                            <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150 group/row">
                                                <div className="shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Briefcase className="h-4 w-4 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate leading-tight">{project.name}</p>
                                                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        {window.appSettings?.formatDateTime(project.created_at, false) || new Date(project.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(project.status)}`}>
                                                        {project.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Planning'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="rounded-full bg-muted p-4 animate-pulse"><Briefcase className="h-6 w-6 text-muted-foreground/50" /></div>
                                        <p className="text-sm text-muted-foreground">{t('No projects yet')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* New Customers */}
                    {hasPermission(auth?.permissions, 'manage-accounts') && (
                        <Card className="border border-border shadow-sm dark:bg-slate-900 overflow-hidden">
                            <CardHeader className="pb-3 pt-5 px-5 border-b">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-semibold">{t('New Accounts')}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-0.5">{t('Recently added customers')}</p>
                                    </div>
                                    {hasPermission(auth?.permissions, 'view-accounts') && (
                                        <Link href={route('contacts.index')} className="flex items-center gap-1 text-xs text-primary font-medium shrink-0 hover:gap-1.5 transition-all duration-150">
                                            {t('View all')} <ArrowUpRight className="h-3.5 w-3.5" />
                                        </Link>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {recentActivities.customers.length > 0 ? (
                                    <div>
                                        {recentActivities.customers.map((customer, i) => (
                                            <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors duration-150">
                                                <div className="shrink-0">
                                                    <UserInitials name={customer.name} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold truncate leading-tight">{customer.name}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {/* {window.appSettings?.formatDateTime(customer.created_at, false) || new Date(customer.created_at).toLocaleDateString()} */}
                                                    {customer.email}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset shrink-0 ${getStatusColor(customer.type)}`}>
                                                    {customer.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Customer'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 gap-3">
                                        <div className="rounded-full bg-muted p-4 animate-pulse"><Building2 className="h-6 w-6 text-muted-foreground/50" /></div>
                                        <p className="text-sm text-muted-foreground">{t('No customers yet')}</p>
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
