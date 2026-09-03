import { PageTemplate } from '@/components/page-template';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { hasPermission } from '@/utils/authorization';
import { router, usePage } from '@inertiajs/react';
import { ArrowRight, BarChart2, Calendar, Clock, Eye, List, Megaphone, Star, Tag, TrendingUp, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AnnouncementDashboard() {
    const { t } = useTranslation();
    const { auth, announcements = [] } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const initialTab = (() => {
        const p = new URLSearchParams(window.location.search).get('tab');
        return ['all', 'featured', 'upcoming', 'expired'].includes(p ?? '') ? p : 'all';
    })() as 'all' | 'featured' | 'upcoming' | 'expired';
    const [activeTab, setActiveTab] = useState<'all' | 'featured' | 'upcoming' | 'expired'>(initialTab);

    const handleTabChange = (tab: 'all' | 'featured' | 'upcoming' | 'expired') => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        tab === 'all' ? url.searchParams.delete('tab') : url.searchParams.set('tab', tab);
        window.history.replaceState(null, '', url.toString());
    };

    const now = new Date();

    const active = announcements.filter((a: any) => a.status === 'active');
    const expired = announcements.filter((a: any) => a.status === 'expired');
    const featured = announcements.filter((a: any) => a.is_featured);
    const upcoming = announcements.filter((a: any) => a.start_date && new Date(a.start_date) > now);

    const categoryMap: Record<string, number> = {};
    announcements.forEach((a: any) => {
        const name = a.category?.name || t('Uncategorized');
        categoryMap[name] = (categoryMap[name] || 0) + 1;
    });
    const categoryBreakdown = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

    const tabData = [
        { value: 'all', label: t('All'), list: announcements, icon: <Megaphone className="h-3.5 w-3.5" /> },
        { value: 'featured', label: t('Featured'), list: featured, icon: <Star className="h-3.5 w-3.5" /> },
        { value: 'upcoming', label: t('Upcoming'), list: upcoming, icon: <Clock className="h-3.5 w-3.5" /> },
        { value: 'expired', label: t('Expired'), list: expired, icon: <XCircle className="h-3.5 w-3.5" /> },
    ];

    const displayed = tabData.find((tab) => tab.value === activeTab)?.list ?? announcements;
    const sorted = [...displayed].sort((a: any, b: any) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const getStatusBadge = (status: string) => {
        const map: Record<string, string> = {
            active: 'bg-green-50 text-green-700 ring-green-600/20',
            inactive: 'bg-red-50 text-red-700 ring-red-600/20',
            expired: 'bg-gray-50 text-gray-700 ring-gray-600/20',
        };
        const cls = map[status] ?? map.inactive;
        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}>
                {status?.charAt(0).toUpperCase() + status?.slice(1)}
            </span>
        );
    };

    return (
        <PageTemplate
            title={t('Announcement Dashboard')}
            description={t('Organization-wide announcements and notices')}
            actions={[
                ...(hasPermission(permissions, 'manage-announcements')
                    ? [
                          {
                              label: t('List View'),
                              icon: <List className="me-0 h-4 w-4 min-[400px]:me-2" />,
                              variant: 'outline',
                              className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
                              labelClassName: 'hidden min-[400px]:inline',
                              tooltip: t('List View'),
                              tooltipClassName: 'min-[400px]:hidden',
                              onClick: () => router.get(route('announcements.index')),
                          },
                      ]
                    : []),
            ]}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Announcements'), href: route('announcements.index') },
                { title: t('Dashboard') },
            ]}
            noPadding
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                {/* ── Left: Feed ─────────────────────────────────────────── */}
                <div className="min-w-0 flex-1 space-y-4">
                    {/* Tab switcher + feed */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700">
                            {tabData.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => handleTabChange(tab.value as any)}
                                    className={`flex cursor-pointer items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                                        activeTab === tab.value
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                                            activeTab === tab.value
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                        }`}
                                    >
                                        {tab.list.length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="overflow-y-auto lg:max-h-[700px]">
                            <div className="space-y-2 p-3">
                                {sorted.length === 0 ? (
                                    <div className="flex flex-col items-center py-14 text-center">
                                        <Megaphone className="mb-2 h-10 w-10 text-gray-200 dark:text-gray-700" />
                                        <p className="text-muted-foreground text-sm">{t('No announcements')}</p>
                                    </div>
                                ) : (
                                    sorted.map((a: any) => (
                                        <div
                                            key={a.id}
                                            className={`rounded-lg border p-3 transition-colors sm:p-4 ${
                                                a.is_featured
                                                    ? 'border-yellow-300 bg-yellow-50/50 dark:border-yellow-700 dark:bg-yellow-900/10'
                                                    : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50'
                                            }`}
                                        >
                                            {/* Content */}
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 flex items-start justify-between gap-2">
                                                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{a.title}</h3>
                                                        {a.is_featured && (
                                                            <span className="inline-flex items-center gap-0.5 rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-600/20 ring-inset">
                                                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                                {t('Featured')}
                                                            </span>
                                                        )}
                                                        {a.category?.name && (
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                                                                <Tag className="h-3 w-3" />
                                                                {a.category.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {hasPermission(permissions, 'view-announcements') && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => router.get(route('announcements.show', a.id))}
                                                                        className="cursor-pointer text-gray-400"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{t('View')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                                <div
                                                    className="mb-2 line-clamp-2 text-xs text-gray-500 dark:text-gray-400"
                                                    dangerouslySetInnerHTML={{ __html: a.content }}
                                                />
                                                <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        {a.start_date && <span>{window.appSettings?.formatDateTime(a.start_date, false)}</span>}
                                                        {a.end_date && (
                                                            <>
                                                                <ArrowRight className="h-3 w-3 text-gray-300" />
                                                                <span>{window.appSettings?.formatDateTime(a.end_date, false)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {a.creator && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="shrink-0 cursor-default">
                                                                        {a.creator.avatar ? (
                                                                            <img
                                                                                src={a.creator.avatar}
                                                                                className="h-6 w-6 rounded-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold">
                                                                                {a.creator.name?.charAt(0).toUpperCase()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <div className="font-medium">{a.creator.name}</div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Sidebar ──────────────────────────────────────── */}
                <div className="w-full shrink-0 space-y-4 lg:sticky lg:top-6 lg:w-64" style={{ alignSelf: 'flex-start' }}>
                    {/* Stats */}
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                            <BarChart2 className="text-muted-foreground h-4 w-4" />
                            <span className="text-sm font-semibold">{t('Overview')}</span>
                        </div>
                        <div className="space-y-3 p-4">
                            {[
                                { label: t('Total'), count: announcements.length, color: 'bg-blue-500' },
                                { label: t('Active'), count: active.length, color: 'bg-green-500' },
                                { label: t('Featured'), count: featured.length, color: 'bg-yellow-500' },
                                { label: t('Upcoming'), count: upcoming.length, color: 'bg-purple-500' },
                                { label: t('Expired'), count: expired.length, color: 'bg-gray-400' },
                            ].map((s) => (
                                <div key={s.label} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${s.color}`} />
                                        <span className="text-sm text-gray-600 dark:text-gray-300">{s.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{s.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Category breakdown */}
                    {categoryBreakdown.length > 0 && (
                        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                            <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                                <TrendingUp className="text-muted-foreground h-4 w-4" />
                                <span className="text-sm font-semibold">{t('By Category')}</span>
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: categoryBreakdown.length > 5 ? '205px' : 'none' }}>
                                <div className="space-y-2.5 px-4 pt-4 pb-3">
                                    {categoryBreakdown.map(([name, count]) => {
                                        const pct = announcements.length > 0 ? Math.round((count / announcements.length) * 100) : 0;
                                        return (
                                            <div key={name}>
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="truncate text-xs text-gray-600 dark:text-gray-300">{name}</span>
                                                    <span className="ml-2 text-xs font-semibold text-gray-800 dark:text-gray-200">{count}</span>
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                                    <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
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
        </PageTemplate>
    );
}
