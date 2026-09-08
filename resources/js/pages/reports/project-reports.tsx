import { PageTemplate } from '@/components/page-template';
import { ReportFilters } from '@/components/reports/report-filters';
import { SummaryCards } from '@/components/reports/summary-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePage } from '@inertiajs/react';
import { Briefcase, Calendar, CheckCircle, Percent, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ProjectReports() {
    const { t: translate } = useTranslation();
    const { filters, summary, monthlyData, dailyData, projectsByStatus, overdueProjects } = usePage().props;
    const [chartView, setChartView] = useState<'daily' | 'monthly'>('monthly');
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

    const [primaryColor, setPrimaryColor] = useState('#4f46e5');

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
        { title: translate('Project Reports') },
    ];

    const summaryCards = [
        {
            title: translate('Total Projects'),
            value: summary.total_projects.toLocaleString(),
            icon: <Briefcase className="h-6 w-6 text-blue-600" />,
            iconColor: 'bg-blue-100',
        },
        {
            title: translate('Active Projects'),
            value: summary.active_projects.toLocaleString(),
            icon: <Play className="h-6 w-6 text-green-600" />,
            iconColor: 'bg-green-100',
        },
        {
            title: translate('Completed Projects'),
            value: summary.completed_projects.toLocaleString(),
            icon: <CheckCircle className="h-6 w-6 text-purple-600" />,
            iconColor: 'bg-purple-100',
        },
        {
            title: translate('Completion Rate'),
            value: `${summary.completion_rate.toFixed(2)}%`,
            icon: <Percent className="h-6 w-6 text-orange-600" />,
            iconColor: 'bg-orange-100',
        },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <PageTemplate
            title={translate('Project Reports')}
            description={translate('View and analyze project reports to track performance and progress.')}
            url="/reports/projects"
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <SummaryCards cards={summaryCards} />
            <ReportFilters filters={filters} />

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="col-span-full">
                    <Card className="border-border flex h-full flex-col overflow-hidden border shadow-sm dark:bg-slate-900">
                        <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b px-5 pt-5 pb-3">
                            <CardTitle className="text-base font-semibold">{translate('Project Trend')}</CardTitle>
                            <div className="flex gap-2">
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
                        <CardContent className="min-h-0 flex-1 p-4 pt-5" dir="ltr">
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
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke={primaryColor}
                                        name={translate('Projects')}
                                        strokeWidth={2.5}
                                        dot={{ r: 3, fill: primaryColor, strokeWidth: 0 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-full lg:col-span-1">
                    <Card className="border-border flex h-full flex-col overflow-hidden border shadow-sm dark:bg-slate-900">
                        <CardHeader
                            className="border-border bg-muted/30 flex shrink-0 flex-row items-center border-b px-5"
                            style={{ minHeight: '72px' }}
                        >
                            <CardTitle className="text-foreground text-base font-semibold">{translate('Projects by Status')}</CardTitle>
                        </CardHeader>

                        <CardContent className="min-h-0 flex-1 p-4 pt-5" dir="ltr">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={projectsByStatus}
                                        cx="50%"
                                        cy={isMobileOrTablet ? '45%' : '50%'}
                                        labelLine={!isMobileOrTablet}
                                        label={
                                            isMobileOrTablet
                                                ? ({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '')
                                                : ({ status, percent, total }) => {
                                                      const statusLabels: { [key: string]: string } = {
                                                          active: translate('Active'),
                                                          completed: translate('Completed'),
                                                          on_hold: translate('On Hold'),
                                                          inactive: translate('Inactive'),
                                                      };
                                                      const label = statusLabels[status] || status;
                                                      return `${label} ${(percent * 100).toFixed(0)}% (${total})`;
                                                  }
                                        }
                                        outerRadius={isMobileOrTablet ? 75 : 80}
                                        fill="#8884d8"
                                        dataKey="total"
                                    >
                                        {projectsByStatus.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name, props) => {
                                            const statusLabels: { [key: string]: string } = {
                                                active: translate('Active'),
                                                completed: translate('Completed'),
                                                on_hold: translate('On Hold'),
                                                inactive: translate('Inactive'),
                                            };
                                            const label = statusLabels[props.payload.status] || props.payload.status;
                                            return [value, label];
                                        }}
                                    />
                                    {isMobileOrTablet && (
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                            formatter={(value, entry: any) => {
                                                const statusLabels: { [key: string]: string } = {
                                                    active: translate('Active'),
                                                    completed: translate('Completed'),
                                                    on_hold: translate('On Hold'),
                                                    inactive: translate('Inactive'),
                                                };
                                                return statusLabels[entry.payload.status] || entry.payload.status;
                                            }}
                                        />
                                    )}
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-full lg:col-span-1">
                    <Card className="border-border flex h-full flex-col overflow-hidden border shadow-sm dark:bg-slate-900">
                        <div className="border-border bg-muted/30 flex shrink-0 items-center border-b px-5" style={{ minHeight: '72px' }}>
                            <div>
                                <h3 className="text-foreground text-base font-semibold">{translate('Overdue Projects')}</h3>
                                <p className="text-muted-foreground mt-0.5 text-xs">{translate('Active projects past their deadline')}</p>
                            </div>
                        </div>

                        <div className="custom-scrollbar max-h-[340px] overflow-y-auto p-0">
                            {overdueProjects && overdueProjects.length > 0 ? (
                                <div>
                                    {overdueProjects.map((project: any, index: number) => (
                                        <div
                                            key={index}
                                            className="hover:bg-muted/50 group/row border-border flex min-h-[64px] flex-col justify-between gap-3 border-b px-5 py-3.5 transition-colors duration-150 last:border-0 sm:flex-row sm:items-center dark:hover:bg-slate-800/60"
                                        >
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                {/* <div className="shrink-0 mt-0.5 flex items-center justify-center bg-primary/10 text-primary h-8 w-8 rounded-full">
                            <Briefcase className="h-4 w-4" />
                          </div> */}

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-foreground truncate text-sm leading-tight font-semibold">{project.name}</p>

                                                    <p className="text-muted-foreground mt-0.5 truncate text-xs">{project.code}</p>
                                                </div>
                                            </div>

                                            <div className="mt-2 flex min-w-[140px] shrink-0 items-center justify-end sm:mt-0">
                                                <div className="flex items-center gap-1 text-[11px] whitespace-nowrap text-gray-500 dark:text-gray-500">
                                                    <Calendar className="h-3 w-3 shrink-0" />
                                                    <span className="text-end">
                                                        {window.appSettings?.formatDateTime(project.end_date, false) ||
                                                            new Date(project.end_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3">
                                    <CheckCircle className="h-10 w-10 text-emerald-500/50" />

                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-500">{translate('No overdue projects')}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </PageTemplate>
    );
}
