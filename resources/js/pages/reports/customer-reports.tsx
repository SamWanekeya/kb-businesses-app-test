import { PageTemplate } from '@/components/page-template';
import { ReportFilters } from '@/components/reports/report-filters';
import { SummaryCards } from '@/components/reports/summary-cards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserInitials from '@/components/user-initials';
import { usePage } from '@inertiajs/react';
import { DollarSign, MessageSquare, Phone, UserCheck, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function CustomerReports() {
    const { t } = useTranslation();
    const { filters, summary, monthlyData, dailyData, topContacts, contactsByIndustry, recentInteractions } = usePage().props;
    const [chartView, setChartView] = useState<'daily' | 'monthly'>('monthly');
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');
    const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobileOrTablet(window.innerWidth < 1600);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const raw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
        if (raw) setPrimaryColor(raw);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const chartData = chartView === 'daily' ? dailyData : monthlyData;

    const breadcrumbs = [{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Reports'), href: '#' }, { title: t('Contact Reports') }];

    const summaryCards = [
        {
            title: t('Total Contacts'),
            value: summary.total_contacts.toLocaleString(),
            icon: <Users className="h-6 w-6 text-blue-600" />,
            iconColor: 'bg-blue-100',
        },
        {
            title: t('New Contacts'),
            value: summary.new_contacts.toLocaleString(),
            icon: <UserPlus className="h-6 w-6 text-green-600" />,
            iconColor: 'bg-green-100',
        },
        {
            title: t('Active Contacts'),
            value: summary.active_contacts.toLocaleString(),
            icon: <UserCheck className="h-6 w-6 text-purple-600" />,
            iconColor: 'bg-purple-100',
        },
        {
            title: t('Contact Lifetime Value'),
            value: (
                <span className="font-mono">
                    {window.appSettings?.formatCurrency(summary.contact_lifetime_value) || `$${summary.contact_lifetime_value.toLocaleString()}`}
                </span>
            ),
            icon: <DollarSign className="h-6 w-6 text-orange-600" />,
            iconColor: 'bg-orange-100',
        },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#E91E63', '#9C27B0'];

    return (
        <PageTemplate
            title={t('Contact Reports')}
            description={t('View and analyze customer reports to track performance and engagement.')}
            url="/reports/customers"
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <SummaryCards cards={summaryCards} />
            <ReportFilters filters={filters} />

            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="col-span-full">
                    <Card className="border-border flex h-full flex-col overflow-hidden border shadow-sm dark:bg-slate-900">
                        <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b px-5 pt-5 pb-3">
                            <CardTitle className="text-base font-semibold">{t('Contact Growth')}</CardTitle>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-2">
                                    <Tabs value={chartView} onValueChange={(v) => setChartView(v as 'daily' | 'monthly')}>
                                        <TabsList className="h-7">
                                            <TabsTrigger value="daily" className="cursor-pointer px-3 py-1 text-xs">
                                                {t('Daily')}
                                            </TabsTrigger>
                                            <TabsTrigger value="monthly" className="cursor-pointer px-3 py-1 text-xs">
                                                {t('Monthly')}
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
                                        name={t('Contacts')}
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
                            className="flex shrink-0 flex-row items-center justify-between border-b px-5 pt-5 pb-3"
                            style={{ minHeight: '72px' }}
                        >
                            <CardTitle className="text-base font-semibold">{t('Contacts by Industry')}</CardTitle>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 p-4 pt-5" dir="ltr">
                            <ResponsiveContainer width="100%" height={300}>
                                {contactsByIndustry && contactsByIndustry.length > 0 ? (
                                    <PieChart>
                                        <Pie
                                            data={contactsByIndustry}
                                            cx="50%"
                                            cy={isMobileOrTablet ? '45%' : '50%'}
                                            labelLine={!isMobileOrTablet}
                                            label={
                                                isMobileOrTablet
                                                    ? ({ percent }) => (percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : '')
                                                    : ({ industry, percent }) => `${industry || t('Unknown')} ${(percent * 100).toFixed(0)}%`
                                            }

                                            outerRadius={isMobileOrTablet ? 75 : 80}
                                            fill="#8884d8"
                                            dataKey="total"
                                        >
                                            {contactsByIndustry.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name, props) => [value, props.payload.industry || t('Unknown')]} />
                                        {isMobileOrTablet && (
                                            <Legend
                                                verticalAlign="bottom"
                                                iconType="circle"
                                                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                                                formatter={(value, entry: any) => entry.payload.industry || t('Unknown')}
                                            />
                                        )}
                                    </PieChart>
                                ) : (
                                    <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3">
                                        <p>{t('No industry data available')}</p>
                                    </div>
                                )}
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-full lg:col-span-1">
                    <Card className="border-border flex h-full flex-col overflow-hidden border shadow-sm dark:bg-slate-900">
                        <div className="flex shrink-0 items-center justify-between border-b px-5" style={{ minHeight: '72px' }}>
                            <div>
                                <h3 className="text-base font-semibold">{t('Recent Interactions')}</h3>
                                <p className="text-muted-foreground mt-0.5 text-xs">{t('Latest calls and meetings')}</p>
                            </div>
                        </div>
                        <div className="custom-scrollbar max-h-[340px] overflow-y-auto p-0">
                            {recentInteractions && recentInteractions.length > 0 ? (
                                <div className="p-5">
                                    <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-slate-200 md:before:mx-auto md:before:translate-x-0 rtl:before:mr-5 rtl:before:ml-auto dark:before:bg-slate-700">
                                        {recentInteractions.map((interaction: any, index: number) => (
                                            <div
                                                key={index}
                                                className="group is-active relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse"
                                            >
                                                <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white bg-blue-100 text-blue-500 shadow md:order-1 ltr:md:group-odd:-translate-x-1/2 ltr:md:group-even:translate-x-1/2 rtl:md:group-odd:translate-x-1/2 rtl:md:group-even:-translate-x-1/2 dark:border-slate-900 dark:bg-blue-900">
                                                    {interaction.type === 'call' ? <Phone className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                                </div>
                                                <div className="border-border w-[calc(100%-4rem)] rounded-xl border bg-white p-4 shadow-sm md:w-[calc(50%-2.5rem)] dark:bg-slate-800">
                                                    <div className="mb-1 flex items-center justify-between space-x-2">
                                                        <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
                                                            {interaction.title}
                                                        </div>
                                                        <time className="text-muted-foreground shrink-0 text-[11px] font-medium">
                                                            {interaction.date_formatted}
                                                        </time>
                                                    </div>
                                                    <div className="text-muted-foreground text-xs">
                                                        {t('With:')} <span className="text-foreground font-medium">{interaction.contact_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3">
                                    <MessageSquare className="text-muted-foreground/50 h-10 w-10" />
                                    <p className="text-muted-foreground text-sm">{t('No recent interactions')}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <Card className="border-border col-span-full overflow-hidden border shadow-sm dark:bg-slate-900">
                <div className="border-b px-5 py-5">
                    <h3 className="text-base font-semibold">{t('Top Contacts')}</h3>
                    <p className="text-muted-foreground mt-0.5 text-xs">{t('Contacts by order volume and spending')}</p>
                </div>
                <div className="p-0">
                    {topContacts && topContacts.length > 0 ? (
                        <div>
                            {topContacts.map((contact: any, index: number) => (
                                <div
                                    key={index}
                                    className="hover:bg-muted/50 group/row flex min-h-[72px] items-center gap-3 border-b px-5 py-3.5 transition-colors duration-150 last:border-0 dark:hover:bg-slate-800/60"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                                        <UserInitials name={contact.name} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm leading-tight font-semibold">{contact.name}</p>
                                        <p className="text-muted-foreground mt-0.5 truncate text-xs">{contact.email || t('No Email')}</p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-1">
                                        <span className={`text-foreground inline-flex items-center text-sm font-bold`}>
                                            {window.appSettings?.formatCurrency(contact.total_spent) || `$${contact.total_spent}`}
                                        </span>
                                        <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400">
                                            {contact.order_count} {t('Orders')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-40 flex-col items-center justify-center gap-3">
                            <p className="text-muted-foreground text-sm">{t('No contacts found')}</p>
                        </div>
                    )}
                </div>
            </Card>
        </PageTemplate>
    );
}
