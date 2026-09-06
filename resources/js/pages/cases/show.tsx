import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    FileText,
    Layers,
    Loader,
    MessageSquare,
    PauseCircle,
    Phone,
    ShieldAlert,
    Tag,
    User,
    UserCheck,
    XCircle,
    Zap,
} from 'lucide-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function CaseShow() {
    const { t: translate } = useTranslation();
    const { case: caseData, meetings } = usePage().props;
    const permissions = (usePage().props as any).auth?.permissions || [];
    const getInitials = useInitials();

    const filteredMeetings = useMemo(() => meetings?.filter((m: any) => m.type !== 'call') || [], [meetings]);
    const filteredCalls = useMemo(() => meetings?.filter((m: any) => m.type === 'call') || [], [meetings]);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Cases'), href: route('cases.index') },
        { title: translate('View Case') },
    ];

    const statusSteps = ['new', 'in_progress', 'pending', 'resolved', 'closed'];
    const currentStatusIndex = statusSteps.indexOf(caseData.status);

    const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; ring: string; dot: string }> = {
        new: {
            label: translate('New'),
            icon: Zap,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            ring: 'ring-blue-600/20',
            dot: 'bg-blue-500',
        },
        in_progress: {
            label: translate('In Progress'),
            icon: Loader,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            ring: 'ring-yellow-600/20',
            dot: 'bg-yellow-500',
        },
        pending: {
            label: translate('Pending'),
            icon: PauseCircle,
            color: 'text-orange-600',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            ring: 'ring-orange-600/20',
            dot: 'bg-orange-500',
        },
        resolved: {
            label: translate('Resolved'),
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20',
            ring: 'ring-green-600/20',
            dot: 'bg-green-500',
        },
        closed: {
            label: translate('Closed'),
            icon: XCircle,
            color: 'text-gray-500',
            bg: 'bg-gray-50 dark:bg-gray-800/40',
            ring: 'ring-gray-600/20',
            dot: 'bg-gray-400',
        },
    };

    const priorityConfig: Record<string, { label: string; color: string; bg: string; ring: string }> = {
        low: { label: translate('Low'), color: 'text-gray-600', bg: 'bg-gray-50', ring: 'ring-gray-600/20' },
        medium: { label: translate('Medium'), color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-600/20' },
        high: { label: translate('High'), color: 'text-orange-600', bg: 'bg-orange-50', ring: 'ring-orange-600/20' },
        urgent: { label: translate('Urgent'), color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-600/20' },
    };

    const caseTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
        support: { label: translate('Support'), icon: ShieldAlert, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        bug: { label: translate('Bug Report'), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
        feature_request: { label: translate('Feature Request'), icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        complaint: { label: translate('Complaint'), icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        inquiry: { label: translate('Inquiry'), icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    };

    const status = statusConfig[caseData.status] || statusConfig.new;
    const priority = priorityConfig[caseData.priority] || priorityConfig.low;
    const caseType = caseTypeConfig[caseData.case_type] || { label: caseData.case_type, icon: Tag, color: 'text-gray-600', bg: 'bg-gray-50' };
    const CaseTypeIcon = caseType.icon;

    const ActivityRow = ({
        item,
        icon: Icon,
        viewPermission,
        viewRoute,
    }: {
        item: any;
        icon: React.ElementType;
        viewPermission: string;
        viewRoute: string;
    }) => (
        <div className="border-border hover:bg-muted/30 flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors">
            <div className="flex min-w-0 items-center gap-3">
                <div className="bg-primary/15 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">{item.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                        <Clock className="text-muted-foreground h-3 w-3 flex-shrink-0" />
                        <span className="text-muted-foreground truncate text-xs">
                            {window.appSettings?.formatDateTime(item.start_date, false) || new Date(item.start_date).toLocaleDateString()}
                        </span>
                        {item.assigned_user?.name && (
                            <span className="flex flex-shrink-0 items-center gap-1">
                                <span className="text-muted-foreground/40">·</span>
                                <Avatar className="h-4 w-4">
                                    <AvatarImage src={item.assigned_user?.avatar} alt={item.assigned_user?.name} />
                                    <AvatarFallback className="bg-primary/15 text-primary text-[8px] font-bold">
                                        {getInitials(item.assigned_user?.name || 'U')}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-muted-foreground truncate text-xs">{item.assigned_user.name}</span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {useHasPermission(viewPermission) && (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link href={route(viewRoute, item.id)} className="flex-shrink-0">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <Eye className="text-muted-foreground h-3.5 w-3.5" />
                                </Button>
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{translate('View')}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );

    return (
        <PageTemplate
            title={caseData.subject}
            description={translate('Case details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('cases.index')),
                },
            ]}
            noPadding
        >
            <div className="mx-auto space-y-6">
                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {(
                        [
                            {
                                label: translate('Priority'),
                                value: priority.label,
                                icon: AlertTriangle,
                                iconCls: 'text-orange-600',
                                blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                            },
                            {
                                label: translate('Case Type'),
                                value: caseType.label,
                                icon: Tag,
                                iconCls: 'text-purple-600',
                                blobCls: 'bg-purple-50 dark:bg-purple-900/30',
                            },
                            {
                                label: translate('Created'),
                                value:
                                    window.appSettings?.formatDateTime(caseData.created_at, false) ||
                                    new Date(caseData.created_at).toLocaleDateString(),
                                icon: Clock,
                                iconCls: 'text-blue-600',
                                blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                            },
                        ] as const
                    ).map(({ label, value, icon: Icon, iconCls, blobCls }) => (
                        <Card key={label} className="relative overflow-hidden">
                            <div className={`absolute top-0 right-0 h-20 w-20 ${blobCls} rounded-bl-full`} />
                            <CardContent className="relative p-4">
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 pr-2">
                                        <p className="text-muted-foreground mb-1 text-sm font-medium">{label}</p>
                                        <p className="text-foreground truncate text-lg leading-snug font-bold">{value}</p>
                                    </div>
                                    <div className={`relative z-10 p-2.5 ${blobCls} mt-0.5 flex-shrink-0 rounded-xl`}>
                                        <Icon className={`h-5 w-5 ${iconCls}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Status Pipeline */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b px-5 py-3.5">
                        <CardTitle className="flex items-center text-lg font-semibold">
                            <Loader className="text-muted-foreground mr-3 h-5 w-5" />
                            {translate('Case Progress')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto px-6 py-5">
                        <div className="flex min-w-[480px] items-center justify-between pb-2 sm:min-w-0">
                            {statusSteps.map((step, i) => {
                                const s = statusConfig[step];
                                const StepIcon = s.icon;
                                const isActive = step === caseData.status;
                                const isDone = i < currentStatusIndex;
                                const isLast = i === statusSteps.length - 1;
                                return (
                                    <React.Fragment key={step}>
                                        <div className="flex flex-shrink-0 flex-col items-center gap-1">
                                            <div
                                                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                                                    isActive
                                                        ? `${s.bg} border-current ${s.color}`
                                                        : isDone
                                                          ? 'bg-primary/10 border-primary text-primary'
                                                          : 'bg-muted border-border text-muted-foreground'
                                                }`}
                                            >
                                                <StepIcon className="h-4 w-4" />
                                            </div>
                                            <span
                                                className={`text-[10px] font-medium whitespace-nowrap ${isActive ? s.color : isDone ? 'text-primary' : 'text-muted-foreground'}`}
                                            >
                                                {s.label}
                                            </span>
                                        </div>
                                        {!isLast && (
                                            <div className={`mx-1 mb-4 h-0.5 flex-1 ${i < currentStatusIndex ? 'bg-primary' : 'bg-border'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Case Summary + Description */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Case Summary */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <UserCheck className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Assignment')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-5" style={{ minHeight: '100px' }}>
                            <div className="w-full">
                                <p className="text-muted-foreground mb-1.5 text-xs font-medium">{translate('Assigned To')}</p>
                                {caseData.assigned_user ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={caseData.assigned_user.avatar} alt={caseData.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(caseData.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{caseData.assigned_user.name}</p>
                                            {caseData.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{caseData.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">{translate('Unassigned')}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Description */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Description')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[150px] overflow-y-auto">
                                <div className="px-5 py-4">
                                    {caseData.description ? (
                                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{caseData.description}</p>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <FileText className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                            <p className="text-muted-foreground text-sm">{translate('No description provided')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Related Account + Related Contact */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Related Account */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Building className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Related Account')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {caseData.account ? (
                                <div className="p-2">
                                    <div className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <UserInitials name={caseData.account.name} />
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-semibold">{caseData.account.name}</p>
                                                {caseData.account.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{caseData.account.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        {useHasPermission('view-accounts') && (
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link href={route('accounts.show', caseData.account.id)} className="ml-3 flex-shrink-0">
                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p>{translate('View')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Building className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                    <p className="text-muted-foreground text-sm">{translate('No account linked')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Related Contact */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <User className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Related Contact')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {caseData.contact ? (
                                <div className="p-2">
                                    <div className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <UserInitials name={caseData.contact.name} />
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-semibold">{caseData.contact.name}</p>
                                                {caseData.contact.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{caseData.contact.email}</p>
                                                )}
                                            </div>
                                        </div>
                                        {useHasPermission('view-contacts') && (
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link href={route('contacts.show', caseData.contact.id)} className="ml-3 flex-shrink-0">
                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                        </Link>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p>{translate('View')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <User className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                    <p className="text-muted-foreground text-sm">{translate('No contact linked')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Meetings & Calls */}
                {meetings?.length > 0 && (
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Calendar className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Meetings & Calls')}
                                <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
                                    {meetings.length}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Card className="border shadow-none">
                                    <CardHeader className="border-b px-4 py-3">
                                        <CardTitle className="text-muted-foreground flex items-center justify-between text-sm font-semibold">
                                            <div className="flex items-center gap-2">
                                                <UserCheck className="h-3.5 w-3.5" />
                                                {translate('Meetings')}
                                            </div>
                                            <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                                                {filteredMeetings.length}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {filteredMeetings.length === 0 ? (
                                            <p className="text-muted-foreground py-6 text-center text-sm">{translate('No meetings found')}</p>
                                        ) : (
                                            <div
                                                className="space-y-2 overflow-y-auto p-3"
                                                style={{ height: '412px', overflowY: filteredMeetings.length > 5 ? 'auto' : 'hidden' }}
                                            >
                                                {filteredMeetings.map((meeting: any) => (
                                                    <ActivityRow
                                                        key={meeting.id}
                                                        item={meeting}
                                                        icon={UserCheck}
                                                        viewPermission="view-meetings"
                                                        viewRoute="meetings.show"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="border shadow-none">
                                    <CardHeader className="border-b px-4 py-3">
                                        <CardTitle className="text-muted-foreground flex items-center justify-between text-sm font-semibold">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5" />
                                                {translate('Calls')}
                                            </div>
                                            <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                                                {filteredCalls.length}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {filteredCalls.length === 0 ? (
                                            <p className="text-muted-foreground py-6 text-center text-sm">{translate('No calls found')}</p>
                                        ) : (
                                            <div
                                                className="space-y-2 overflow-y-auto p-3"
                                                style={{ height: '412px', overflowY: filteredCalls.length > 5 ? 'auto' : 'hidden' }}
                                            >
                                                {filteredCalls.map((call: any) => (
                                                    <ActivityRow
                                                        key={call.id}
                                                        item={call}
                                                        icon={Phone}
                                                        viewPermission="view-calls"
                                                        viewRoute="calls.show"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageTemplate>
    );
}
