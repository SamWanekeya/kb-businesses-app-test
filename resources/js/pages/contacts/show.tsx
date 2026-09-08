import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Briefcase, Building, Calendar, Clock, Eye, FileText, MapPin, Phone, Tag, User, UserCheck } from 'lucide-react';
import { useMemo } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function ContactShow() {
    const { t: translate } = useTranslation();
    const { contact, meetings, auth } = usePage().props;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    const filteredMeetings = useMemo(() => meetings?.filter((m: any) => m.type !== 'call') || [], [meetings]);
    const filteredCalls = useMemo(() => meetings?.filter((m: any) => m.type === 'call') || [], [meetings]);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Contact Management') },
        { title: translate('Contacts'), href: route('contacts.index') },
        { title: translate('View Contact') },
    ];

    const getStatusBadge = (status: string) => {
        const statusColors = {
            active: 'bg-green-50 text-green-700 ring-green-600/20',
            inactive: 'bg-red-50 text-red-700 ring-red-600/10',
        };
        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status as keyof typeof statusColors] || statusColors.active}`}
            >
                {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Active'}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return translate('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    return (
        <PageTemplate
            title={contact.name}
            description={translate('Contact details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('contacts.index')),
                },
            ]}
            noPadding
        >
            <div className="mx-auto space-y-6">
                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {(
                        [
                            {
                                label: translate('Position'),
                                value: contact.position || '—',
                                icon: Briefcase,
                                iconCls: 'text-blue-600',
                                blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                            },
                            {
                                label: translate('Account'),
                                value: contact.account?.name || '—',
                                icon: Building,
                                iconCls: 'text-orange-600',
                                blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                            },
                            {
                                label: translate('Quotes'),
                                value: `${contact.quotes?.length || 0} `,
                                icon: FileText,
                                iconCls: 'text-purple-600',
                                blobCls: 'bg-purple-50 dark:bg-purple-900/30',
                            },
                            {
                                label: translate('Created'),
                                value: formatDate(contact.created_at),
                                icon: Clock,
                                iconCls: 'text-emerald-600',
                                blobCls: 'bg-emerald-50 dark:bg-emerald-900/30',
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

                {/* Contact Summary + Contact Info */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Contact Summary */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Contact Summary')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Status')}</p>
                                    <div>{getStatusBadge(contact.status)}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Position')}</p>
                                    <p className="text-foreground text-sm font-medium">{contact.position || '—'}</p>
                                </div>
                            </div>
                            <div className="border-border mt-4 border-t pt-4">
                                <p className="text-muted-foreground mb-1.5 text-xs font-medium">{translate('Assigned To')}</p>
                                {contact.assigned_user ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={contact.assigned_user.avatar} alt={contact.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(contact.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{contact.assigned_user.name}</p>
                                            {contact.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{contact.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">{translate('Unassigned')}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <User className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Contact Info')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Email')}</p>
                                    <p className="text-foreground truncate text-sm font-medium">{contact.email || '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Phone')}</p>
                                    <p className="text-foreground text-sm font-medium">{contact.phone || '—'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Address + Related Account */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Address */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <MapPin className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Address')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="h-[100px] overflow-y-auto">
                                {contact.address ? (
                                    <p className="text-foreground text-sm">{contact.address}</p>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-center">
                                        <MapPin className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                        <p className="text-muted-foreground text-sm">{translate('No address')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Related Account */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Building className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Related Account')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center p-5" style={{ minHeight: '130px' }}>
                            {contact.account ? (
                                <div className="hover:bg-muted/40 flex w-full items-center justify-between rounded-xl border p-3.5 transition-colors">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <UserInitials name={contact.account.name} />
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Account')}</p>
                                            <p className="text-foreground truncate text-sm font-semibold">{contact.account.name}</p>
                                            {contact.account.email && (
                                                <p className="text-muted-foreground truncate text-xs">{contact.account.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    {useHasPermission('view-accounts') && (
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link href={route('accounts.show', contact.account.id)} className="ml-3 flex-shrink-0">
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
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Building className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                    <p className="text-muted-foreground text-sm">{translate('No account linked')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quotes + Cases */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Quotes */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Quotes')}
                                {contact.quotes?.length > 0 && (
                                    <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
                                        {contact.quotes.length}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {contact.quotes?.length > 0 ? (
                                <div
                                    className="space-y-2 overflow-y-auto p-2"
                                    style={{ height: '305px', overflowY: contact.quotes.length > 4 ? 'auto' : 'hidden' }}
                                >
                                    {contact.quotes.map((quote: any) => (
                                        <div
                                            key={quote.id}
                                            className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors"
                                        >
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <UserInitials name={quote.quote_number} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{quote.quote_number}</p>
                                                    {quote.name && <p className="text-muted-foreground truncate text-xs">{quote.name}</p>}
                                                </div>
                                            </div>
                                            {useHasPermission('view-quotes') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={route('quotes.show', quote.id)} className="ml-3 flex-shrink-0">
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
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <FileText className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                    <p className="text-muted-foreground text-sm">{translate('No quotes linked')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Cases */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Tag className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Cases')}
                                {contact.cases?.length > 0 && (
                                    <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
                                        {contact.cases.length}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {contact.cases?.length > 0 ? (
                                <div
                                    className="space-y-2 overflow-y-auto p-2"
                                    style={{ height: '305px', overflowY: contact.cases.length > 4 ? 'auto' : 'hidden' }}
                                >
                                    {contact.cases.map((caseItem: any) => (
                                        <div
                                            key={caseItem.id}
                                            className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors"
                                        >
                                            <div className="flex min-w-0 items-center gap-2.5">
                                                <UserInitials name={caseItem.subject} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{caseItem.subject}</p>
                                                    {caseItem.status && <p className="text-muted-foreground truncate text-xs">{caseItem.status}</p>}
                                                </div>
                                            </div>
                                            {useHasPermission('view-cases') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={route('cases.show', caseItem.id)} className="ml-3 flex-shrink-0">
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
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Tag className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                    <p className="text-muted-foreground text-sm">{translate('No cases linked')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Meetings & Calls */}
                {meetings?.length > 0 &&
                    (() => {
                        return (
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
                                    <div className="grid grid-cols-1 gap-4 min-[992px]:grid-cols-2">
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
                                                            <div
                                                                key={meeting.id}
                                                                className="border-border flex items-center justify-between gap-3 rounded-lg border p-3"
                                                            >
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <div className="bg-primary/15 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                                                                        <UserCheck className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-foreground truncate text-sm font-medium">
                                                                            {meeting.title}
                                                                        </p>
                                                                        <div className="mt-0.5 flex items-center gap-2">
                                                                            <Clock className="text-muted-foreground h-3 w-3 flex-shrink-0" />
                                                                            <span className="text-muted-foreground truncate text-xs">
                                                                                {window.appSettings?.formatDateTime(meeting.start_date, false) ||
                                                                                    new Date(meeting.start_date).toLocaleDateString()}
                                                                            </span>
                                                                            {meeting.assigned_user?.name && (
                                                                                <span className="flex flex-shrink-0 items-center gap-1">
                                                                                    <span className="text-muted-foreground/40">·</span>
                                                                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                                                                        <AvatarImage
                                                                                            src={meeting.assigned_user?.avatar}
                                                                                            alt={meeting.assigned_user?.name || 'User'}
                                                                                        />
                                                                                        <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-bold">
                                                                                            {getInitials(meeting.assigned_user?.name || 'U')}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                    <span className="text-muted-foreground truncate text-xs">
                                                                                        {meeting.assigned_user.name}
                                                                                    </span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {useHasPermission('view-meetings') && (
                                                                    <TooltipProvider delayDuration={200}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Link
                                                                                    href={route('meetings.show', meeting.id)}
                                                                                    className="flex-shrink-0"
                                                                                >
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
                                                            <div
                                                                key={call.id}
                                                                className="border-border flex items-center justify-between gap-3 rounded-lg border p-3"
                                                            >
                                                                <div className="flex min-w-0 items-center gap-3">
                                                                    <div className="bg-primary/15 text-primary flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                                                                        <Phone className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-foreground truncate text-sm font-medium">{call.title}</p>
                                                                        <div className="mt-0.5 flex items-center gap-2">
                                                                            <Clock className="text-muted-foreground h-3 w-3 flex-shrink-0" />
                                                                            <span className="text-muted-foreground truncate text-xs">
                                                                                {window.appSettings?.formatDateTime(call.start_date, false) ||
                                                                                    new Date(call.start_date).toLocaleDateString()}
                                                                            </span>
                                                                            {call.assigned_user?.name && (
                                                                                <span className="flex flex-shrink-0 items-center gap-1">
                                                                                    <span className="text-muted-foreground/40">·</span>
                                                                                    <Avatar className="h-6 w-6 flex-shrink-0">
                                                                                        <AvatarImage
                                                                                            src={call.assigned_user?.avatar}
                                                                                            alt={call.assigned_user?.name || 'User'}
                                                                                        />
                                                                                        <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-bold">
                                                                                            {getInitials(call.assigned_user?.name || 'U')}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                    <span className="text-muted-foreground truncate text-xs">
                                                                                        {call.assigned_user.name}
                                                                                    </span>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {useHasPermission('view-calls') && (
                                                                    <TooltipProvider delayDuration={200}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Link href={route('calls.show', call.id)} className="flex-shrink-0">
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
                                                        ))}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}
            </div>
        </PageTemplate>
    );
}
