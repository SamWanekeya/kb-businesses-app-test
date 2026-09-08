import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Calendar, DollarSign, Eye, Tag, Target, TrendingUp, Users } from 'lucide-react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function CampaignShow() {
    const { t: translate } = useTranslation();
    const { campaign, campaignLeads } = usePage().props;
    const permissions = (usePage().props as any).auth?.permissions;
    const getInitials = useInitials();

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Campaigns'), href: route('campaigns.index') },
        { title: translate('View Campaign') },
    ];

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    const getResponseRate = () => {
        const expected = campaign.expected_response || 0;
        const actual = campaignLeads?.length || 0;
        if (expected === 0) return '-';
        return `${((actual / expected) * 100).toFixed(1)}%`;
    };

    const remaining = (campaign.budget || 0) - (campaign.actual_cost || 0);
    const budgetUsedPct = campaign.budget > 0 ? Math.min(((campaign.actual_cost || 0) / campaign.budget) * 100, 100) : 0;
    const responsePct = campaign.expected_response > 0 ? Math.min(((campaignLeads?.length || 0) / campaign.expected_response) * 100, 100) : 0;

    const calculateROI = () => {
        const actualCost = campaign.actual_cost || 0;
        const budget = campaign.budget || 0;
        if (budget === 0) return translate('-');
        const roi = ((budget - actualCost) / budget) * 100;
        return `${roi.toFixed(1)}%`;
    };

    return (
        <PageTemplate
            title={campaign.name}
            description={translate('Campaign details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline' as const,
                    onClick: () => router.visit(route('campaigns.index')),
                },
            ]}
            noPadding
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
                            {campaign.description && <p className="mt-1 max-w-2xl text-sm text-gray-500">{campaign.description}</p>}
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                {/* <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{campaign.campaign_type?.name || '-'}</span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1"><List className="h-3 w-3" />{campaign.target_list?.name || '-'}</span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1"><User className="h-3 w-3" />{campaign.assigned_user?.name || translate('Unassigned')}</span> */}
                            </div>
                        </div>
                        <span
                            className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                campaign.status === 'active'
                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                    : 'bg-red-50 text-red-700 ring-red-600/20'
                            }`}
                        >
                            {campaign.status === 'active' ? translate('Active') : translate('Inactive')}
                        </span>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    {(
                        [
                            {
                                label: translate('Budget'),
                                value: formatCurrency(campaign.budget),
                                icon: DollarSign,
                                iconCls: 'text-emerald-600',
                                blobCls: 'bg-emerald-50 dark:bg-emerald-900/30',
                            },
                            {
                                label: translate('Actual Cost'),
                                value: formatCurrency(campaign.actual_cost),
                                icon: BarChart3,
                                iconCls: 'text-blue-600',
                                blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                            },
                            {
                                label: translate('Response Rate'),
                                value: getResponseRate(),
                                icon: TrendingUp,
                                iconCls: 'text-orange-600',
                                blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                            },
                            {
                                label: translate('Total Leads'),
                                value: `${campaignLeads?.length || 0}`,
                                icon: Users,
                                iconCls: 'text-purple-600',
                                blobCls: 'bg-purple-50 dark:bg-purple-900/30',
                            },
                            {
                                label: translate('ROI'),
                                value: calculateROI(),
                                icon: Target,
                                iconCls: 'text-rose-600',
                                blobCls: 'bg-rose-50 dark:bg-rose-900/30',
                            },
                        ] as const
                    ).map(({ label, value, icon: Icon, iconCls, blobCls }) => (
                        <Card key={label} className="relative overflow-hidden">
                            <div className={`absolute top-0 right-0 h-20 w-20 ${blobCls} rounded-bl-full`} />
                            <CardContent className="relative p-4">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 pr-2">
                                        <p className="text-muted-foreground mb-1 text-sm font-medium">{label}</p>
                                        <p className="text-foreground truncate font-mono text-lg leading-snug font-bold">{value}</p>
                                    </div>
                                    <div className={`relative z-10 p-2.5 ${blobCls} mt-0.5 flex-shrink-0 rounded-xl`}>
                                        <Icon className={`h-5 w-5 ${iconCls}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Campaign Details + Budget Analysis */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Campaign Information */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Tag className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Campaign Information')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label className="text-muted-foreground text-xs font-medium">{translate('Campaign Type')}</label>
                                    <p className="mt-1 text-sm font-medium">{campaign.campaign_type?.name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs font-medium">{translate('Target List')}</label>
                                    <p className="mt-1 text-sm font-medium">{campaign.target_list?.name || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs font-medium">{translate('Start Date')}</label>
                                    <p className="mt-1 text-sm font-medium">{formatDate(campaign.start_date)}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs font-medium">{translate('End Date')}</label>
                                    <p className="mt-1 text-sm font-medium">{formatDate(campaign.end_date)}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs font-medium">{translate('Assigned To')}</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        {campaign.assigned_user ? (
                                            <>
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={campaign.assigned_user.avatar} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {getInitials(campaign.assigned_user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{campaign.assigned_user.name}</span>
                                            </>
                                        ) : (
                                            <span className="text-sm font-medium">{translate('Unassigned')}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs font-medium">{translate('Created By')}</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        {campaign.creator ? (
                                            <>
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={campaign.creator.avatar} />
                                                    <AvatarFallback className="text-[10px]">{getInitials(campaign.creator.name)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm font-medium">{campaign.creator.name}</span>
                                            </>
                                        ) : (
                                            <span className="text-sm font-medium">-</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs font-medium">{translate('Expected Response')}</label>
                                    <p className="mt-1 text-sm font-medium">{campaign.expected_response || 0}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-xs font-medium">{translate('Actual Response')}</label>
                                    <p className="mt-1 text-sm font-medium">
                                        {campaignLeads?.length || 0} {translate('leads')}
                                    </p>
                                </div>
                            </div>
                            <div className="text-muted-foreground grid grid-cols-2 gap-4 border-t pt-4 text-xs">
                                <div className="flex items-center gap-1">
                                    <span>{translate('Created')}: </span>
                                    <Calendar className="h-3 w-3" />
                                    <span className="font-medium text-gray-600">{formatDate(campaign.created_at)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span>{translate('Updated')}: </span>
                                    <Calendar className="h-3 w-3" />{' '}
                                    <span className="font-medium text-gray-600">{formatDate(campaign.updated_at)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Budget Analysis */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <DollarSign className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Budget Analysis')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 p-6">
                            <div className="grid grid-cols-3 gap-1.5 min-[450px]:gap-3">
                                <div className="rounded-lg border border-green-200 bg-green-50 p-1.5 text-center min-[400px]:p-3">
                                    <p className="text-muted-foreground mb-1 text-[10px] font-medium min-[400px]:text-xs">{translate('Budget')}</p>
                                    <p className="truncate font-mono text-xs font-bold text-green-600 min-[400px]:text-sm sm:text-base">
                                        {formatCurrency(campaign.budget)}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-1.5 text-center min-[400px]:p-3">
                                    <p className="text-muted-foreground mb-1 text-[10px] font-medium min-[400px]:text-xs">{translate('Spent')}</p>
                                    <p className="truncate font-mono text-xs font-bold text-blue-600 min-[400px]:text-sm sm:text-base">
                                        {formatCurrency(campaign.actual_cost)}
                                    </p>
                                </div>
                                <div
                                    className={`rounded-lg border p-1.5 text-center min-[400px]:p-3 ${remaining >= 0 ? 'border-purple-200 bg-purple-50' : 'border-red-200 bg-red-50'}`}
                                >
                                    <p className="text-muted-foreground mb-1 text-[10px] font-medium min-[400px]:text-xs">{translate('Remaining')}</p>
                                    <p
                                        className={`truncate font-mono text-xs font-bold min-[400px]:text-sm sm:text-base ${remaining >= 0 ? 'text-purple-600' : 'text-red-600'}`}
                                    >
                                        {formatCurrency(remaining)}
                                    </p>
                                </div>
                            </div>

                            {campaign.budget > 0 && (
                                <div>
                                    <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
                                        <span>{translate('Budget Used')}</span>
                                        <span className="font-medium">{budgetUsedPct.toFixed(1)}%</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-100">
                                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${budgetUsedPct}%` }} />
                                    </div>
                                </div>
                            )}

                            {campaign.expected_response > 0 && (
                                <div>
                                    <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
                                        <span>{translate('Response Progress')}</span>
                                        <span className="font-medium">
                                            {campaignLeads?.length || 0} / {campaign.expected_response}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-gray-100">
                                        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${responsePct}%` }} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Campaign Leads */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b px-5 py-3.5">
                        <CardTitle className="flex items-center text-lg font-semibold">
                            <Users className="text-muted-foreground mr-3 h-5 w-5" />
                            {translate('Campaign Leads')}
                            <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
                                {campaignLeads?.length || 0}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {campaignLeads?.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-muted-foreground border-b bg-[#F0F0F1] text-xs dark:bg-gray-800">
                                                <th className="px-6 py-3 text-left font-medium">{translate('Name')}</th>
                                                <th className="px-6 py-3 text-left font-medium">{translate('Assigned To')}</th>
                                                <th className="px-6 py-3 text-left font-medium">{translate('Status')}</th>
                                                {useHasPermission('view-leads') && (
                                                    <th className="px-6 py-3 text-right font-medium">{translate('Action')}</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {campaignLeads.slice(0, 10).map((lead: any) => (
                                                <tr key={lead.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <UserInitials name={lead.name} />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.name}</p>
                                                                <p className="text-xs text-gray-500">{lead.email || '-'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {lead.assigned_user ? (
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-8 w-8 shrink-0">
                                                                    <AvatarImage src={lead.assigned_user.avatar} alt={lead.assigned_user.name} />
                                                                    <AvatarFallback className="text-[10px]">
                                                                        {getInitials(lead.assigned_user.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                        {lead.assigned_user.name}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{lead.assigned_user.email || '-'}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">{translate('Unassigned')}</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        {lead.lead_status ? (
                                                            <span
                                                                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                                                style={{
                                                                    backgroundColor: `${lead.lead_status.color}20`,
                                                                    color: lead.lead_status.color,
                                                                    borderColor: `${lead.lead_status.color}40`,
                                                                }}
                                                            >
                                                                {lead.lead_status.name}
                                                            </span>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                    {useHasPermission('view-leads') && (
                                                        <td className="px-6 py-3 text-right">
                                                            <TooltipProvider delayDuration={200}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link href={route('leads.show', lead.id)}>
                                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                <Eye className="h-4 w-4 text-gray-500" />
                                                                            </Button>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">
                                                                        <p>{translate('View')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {campaignLeads.length > 10 && (
                                    <div className="text-muted-foreground border-t bg-gray-50 px-6 py-3 text-center text-sm">
                                        +{campaignLeads.length - 10} {translate('more leads')}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-12 text-center">
                                <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                                <p className="text-sm text-gray-500">{translate('No leads created from this campaign yet.')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
