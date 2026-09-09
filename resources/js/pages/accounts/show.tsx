import { CrudDeleteModal } from '@components/CrudDeleteModal';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/avatar';
import { Button } from '@components/UserInterface/button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { Textarea } from '@components/UserInterface/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/tooltip';
import { PageTemplate } from '@components/page-template';
import UserInitials from '@components/user-initials';
import { useInitials } from '@hooks/use-initials';
import { Link, router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { formatRelativeTime } from '@utils/helper';
import {
    ArrowLeft,
    Building,
    Calendar,
    Clock,
    Edit,
    Eye,
    FileText,
    MapPin,
    MessageCircle,
    Phone,
    Send,
    Tag,
    Trash2,
    User,
    UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AccountShow() {
    const { t: translate } = useTranslation();
    const { account, streamItems, auth, meetings } = usePage().props;
    const permissions = auth?.permissions || [];
    const isOrganization = auth?.user?.type === 'organization';
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<any>(null);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const getInitials = useInitials();

    const filteredMeetings = useMemo(() => meetings?.filter((m: any) => m.type !== 'call') || [], [meetings]);
    const filteredCalls = useMemo(() => meetings?.filter((m: any) => m.type === 'call') || [], [meetings]);

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Account Management') },
        { title: translate('Accounts'), href: route('accounts.index') },
        { title: translate('View Account') },
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
                {formatTitleCase(status) || 'Active'}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return translate('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    return (
        <PageTemplate
            title={account.name}
            description={translate('Account details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('accounts.index')),
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
                                label: translate('Type'),
                                value: account.account_type?.name || '—',
                                icon: Building,
                                iconCls: 'text-blue-600',
                                blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                            },
                            {
                                label: translate('Industry'),
                                value: account.account_industry?.name || '—',
                                icon: Tag,
                                iconCls: 'text-orange-600',
                                blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                            },
                            {
                                label: translate('Contacts'),
                                value: `${account.contacts?.length || 0} ${translate('contacts')}`,
                                icon: User,
                                iconCls: 'text-purple-600',
                                blobCls: 'bg-purple-50 dark:bg-purple-900/30',
                            },
                            {
                                label: translate('Created'),
                                value: formatDate(account.created_at),
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

                {/* Account Summary + Contact Info */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Account Summary */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Account Summary')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Status')}</p>
                                    <div>{getStatusBadge(account.status)}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Website')}</p>
                                    {account.website ? (
                                        <a
                                            href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block truncate text-sm font-medium text-blue-600 hover:!text-blue-600 hover:underline"
                                        >
                                            {account.website}
                                        </a>
                                    ) : (
                                        <p className="text-foreground text-sm font-medium">—</p>
                                    )}
                                </div>
                            </div>
                            <div className="border-border mt-4 border-t pt-4">
                                <p className="text-muted-foreground mb-1.5 text-xs font-medium">{translate('Assigned To')}</p>
                                {account.assigned_user ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={account.assigned_user.avatar} alt={account.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(account.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{account.assigned_user.name}</p>
                                            {account.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{account.assigned_user.email}</p>
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
                                    <p className="text-foreground truncate text-sm font-medium">{account.email || '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Phone')}</p>
                                    <p className="text-foreground text-sm font-medium">{account.phone || '—'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Billing + Shipping Address */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <MapPin className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Billing Address')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="h-[100px] overflow-y-auto">
                                {account.billing_address || account.billing_city || account.billing_country ? (
                                    <div className="text-foreground space-y-1 text-sm">
                                        {account.billing_address && <p>{account.billing_address}</p>}
                                        <p>{[account.billing_city, account.billing_state, account.billing_postal_code].filter(Boolean).join(', ')}</p>
                                        {account.billing_country && <p>{account.billing_country}</p>}
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-center">
                                        <MapPin className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                        <p className="text-muted-foreground text-sm">{translate('No billing address')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <MapPin className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Shipping Address')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="h-[100px] overflow-y-auto">
                                {account.shipping_address || account.shipping_city || account.shipping_country ? (
                                    <div className="text-foreground space-y-1 text-sm">
                                        {account.shipping_address && <p>{account.shipping_address}</p>}
                                        <p>
                                            {[account.shipping_city, account.shipping_state, account.shipping_postal_code].filter(Boolean).join(', ')}
                                        </p>
                                        {account.shipping_country && <p>{account.shipping_country}</p>}
                                    </div>
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center text-center">
                                        <MapPin className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                        <p className="text-muted-foreground text-sm">{translate('No shipping address')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Contacts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <User className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Contacts')}
                                {account.contacts?.length > 0 && (
                                    <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
                                        {account.contacts.length}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {account.contacts?.length > 0 ? (
                                <div
                                    className="space-y-2 overflow-y-auto p-2"
                                    style={{ height: '244px', overflowY: account.contacts.length > 4 ? 'auto' : 'hidden' }}
                                >
                                    {account.contacts.map((contact: any) => (
                                        <div
                                            key={contact.id}
                                            className="border-border bg-muted/20 hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors"
                                        >
                                            <div className="flex min-w-0 items-center gap-2">
                                                <UserInitials name={contact.name} />
                                                <div className="min-w-0">
                                                    <p className="text-foreground truncate text-sm font-semibold">{contact.name}</p>
                                                    {contact.email && <p className="text-muted-foreground truncate text-xs">{contact.email}</p>}
                                                </div>
                                            </div>
                                            {useHasPermission('view-contacts') && (
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Link href={route('contacts.show', contact.id)} className="ml-3 flex-shrink-0">
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
                                    <User className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                    <p className="text-muted-foreground text-sm">{translate('No contacts linked')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quotes */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Quotes')}
                                {account.quotes?.length > 0 && (
                                    <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
                                        {account.quotes.length}
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {account.quotes?.length > 0 ? (
                                <div
                                    className="space-y-2 overflow-y-auto p-2"
                                    style={{ height: '244px', overflowY: account.quotes.length > 4 ? 'auto' : 'hidden' }}
                                >
                                    {account.quotes.map((quote: any) => (
                                        <div
                                            key={quote.id}
                                            className="border-border bg-muted/20 hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-semibold">{quote.quote_number}</p>
                                                {quote.name && <p className="text-muted-foreground truncate text-xs">{quote.name}</p>}
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

                {/* Activity Stream */}
                {useHasPermission('view-stream') && (
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <MessageCircle className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Activity Stream')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {useHasPermission('create-accounts') && (
                                <div className="border-b px-5 pt-4 pb-4">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (newComment.trim()) {
                                                router.post(
                                                    route('accounts.comments.store', account.id),
                                                    { comment: newComment },
                                                    { preserveScroll: true, onSuccess: () => setNewCommentranslate('') },
                                                );
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Avatar className="mt-1 h-8 w-8 flex-shrink-0">
                                                            <AvatarImage src={auth?.user?.avatar} alt={auth?.user?.name || 'User'} />
                                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                                {getInitials(auth?.user?.name || 'U')}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">
                                                        <p>{auth?.user?.name || translate('User')}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <div className="flex-1 overflow-hidden rounded-xl border shadow-sm">
                                                <Textarea
                                                    placeholder={translate('Write a comment...')}
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    className="resize-none border-0 bg-transparent focus-visible:ring-0"
                                                    rows={2}
                                                />
                                                <div className="bg-muted/30 flex items-center justify-end border-t px-3 py-2">
                                                    <TooltipProvider delayDuration={200}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button type="submit" size="sm" disabled={!newComment.trim()} className="h-7 px-3">
                                                                    <Send className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p>{translate('Send')}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}
                            <div className="max-h-[520px] overflow-y-auto border-t">
                                {streamItems && streamItems.length > 0 ? (
                                    <div className="px-5 py-5">
                                        {streamItems.map((activity: any, index: number) => {
                                            const getActivityBadgeColor = (type: string): string => {
                                                switch (type) {
                                                    case 'created':
                                                        return 'bg-green-50 text-green-700 ring-green-600/20';
                                                    case 'updated':
                                                        return 'bg-blue-50 text-blue-700 ring-blue-600/20';
                                                    case 'deleted':
                                                        return 'bg-red-50 text-red-700 ring-red-600/20';
                                                    case 'assigned':
                                                        return 'bg-purple-50 text-purple-700 ring-purple-600/20';
                                                    case 'comment':
                                                        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
                                                    default:
                                                        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
                                                }
                                            };
                                            const badgeCls = getActivityBadgeColor(activity.activity_type);
                                            const isEditing = editingComment === activity.id;
                                            return (
                                                <div key={activity.id || index} className="relative flex gap-3 pb-4">
                                                    <div className="flex w-9 flex-shrink-0 flex-col items-center">
                                                        <TooltipProvider delayDuration={200}>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Avatar className="relative z-10 h-9 w-9 flex-shrink-0">
                                                                        <AvatarImage src={activity.user?.avatar} alt={activity.user?.name || 'U'} />
                                                                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                                                                            {getInitials(activity.user?.name || 'U')}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top">
                                                                    <p>{activity.user?.name || translate('System')}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        {index < streamItems.length - 1 && (
                                                            <div className="absolute top-9 bottom-0 left-[18px] w-px bg-gray-300 dark:bg-gray-600" />
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`bg-card min-w-0 flex-1 overflow-hidden rounded-xl border shadow-sm ${isEditing ? 'border-emerald-400 ring-1 ring-emerald-300' : ''}`}
                                                    >
                                                        <div
                                                            className={`flex items-center justify-between gap-2 px-4 py-2.5 ${isEditing ? 'bg-emerald-50/60' : 'bg-muted/30'} border-b`}
                                                        >
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-foreground text-sm font-semibold">
                                                                    {activity.user?.name || translate('System')}
                                                                </span>
                                                                <span
                                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${badgeCls}`}
                                                                >
                                                                    {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                                                                </span>
                                                                <span className="text-muted-foreground text-xs">
                                                                    {formatRelativeTime(activity.created_at)}
                                                                </span>
                                                            </div>
                                                            {!isEditing && (
                                                                <div className="flex flex-shrink-0 items-center gap-1">
                                                                    {activity.activity_type === 'comment' &&
                                                                        activity.user_id === auth?.user?.id &&
                                                                        useHasPermission('edit-accounts') && (
                                                                            <TooltipProvider delayDuration={200}>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            className="text-muted-foreground h-6 w-6 p-0"
                                                                                            onClick={() => {
                                                                                                setEditingComment(activity.id);
                                                                                                setEditCommentText(activity.description);
                                                                                            }}
                                                                                        >
                                                                                            <Edit className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent side="top">
                                                                                        <p>{translate('Edit')}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                    {useHasPermission('delete-stream') && (
                                                                        <TooltipProvider delayDuration={200}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                        className="text-muted-foreground h-6 w-6 p-0"
                                                                                        onClick={() => {
                                                                                            setCurrentActivity(activity);
                                                                                            setIsDeleteModalOpen(true);
                                                                                        }}
                                                                                    >
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent side="top">
                                                                                    <p>{translate('Delete')}</p>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="px-4 py-3">
                                                            {activity.activity_type === 'comment' ? (
                                                                isEditing ? (
                                                                    <div className="space-y-3">
                                                                        <Textarea
                                                                            value={editCommentText}
                                                                            onChange={(e) => setEditCommentText(e.target.value)}
                                                                            className="w-full resize-none border-emerald-300 focus-visible:ring-emerald-400"
                                                                            rows={3}
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex items-center justify-end gap-2">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => setEditingComment(null)}
                                                                            >
                                                                                {translate('Cancel')}
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                className="bg-emerald-500 text-white hover:bg-emerald-600"
                                                                                onClick={() => {
                                                                                    router.put(
                                                                                        route('accounts.comments.update-activity', {
                                                                                            account: account.id,
                                                                                            activity: activity.id,
                                                                                        }),
                                                                                        { comment: editCommentText },
                                                                                        { preserveScroll: true },
                                                                                    );
                                                                                    setEditingComment(null);
                                                                                }}
                                                                            >
                                                                                {translate('Save')}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-foreground text-sm">{activity.description}</p>
                                                                )
                                                            ) : activity.field_changed === 'status' &&
                                                              (activity.description === 'Active' || activity.description === 'Inactive') ? (
                                                                <span
                                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                                                        activity.description === 'Active'
                                                                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                                                                            : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                                                                    }`}
                                                                >
                                                                    {activity.description}
                                                                </span>
                                                            ) : activity.field_changed === 'name' ||
                                                              activity.field_changed === 'assigned_to' ||
                                                              activity.description?.includes('into') ? (
                                                                <p
                                                                    className="text-muted-foreground text-sm"
                                                                    dangerouslySetInnerHTML={{ __html: activity.description }}
                                                                />
                                                            ) : activity.title ? (
                                                                <p className="text-muted-foreground text-sm">{activity.title}</p>
                                                            ) : (
                                                                <p className="text-muted-foreground text-sm">{activity.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground py-12 text-center">
                                        <Calendar className="text-muted-foreground/30 mx-auto mb-3 h-10 w-10" />
                                        <p className="text-sm">{translate('No activities found')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    if (currentActivity?.id) {
                        router.delete(route('accounts.delete-activity', { account: account.id, activity: currentActivity.id }), {
                            preserveScroll: true,
                        });
                    }
                    setIsDeleteModalOpen(false);
                }}
                itemName={translate('this activity')}
                entityName={translate('activity')}
            />
            <CrudDeleteModal
                isOpen={isDeleteAllModalOpen}
                onClose={() => setIsDeleteAllModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('accounts.delete-activities', account.id), { preserveScroll: true });
                    setIsDeleteAllModalOpen(false);
                }}
                itemName={translate('all activities for {{name}}', { name: account.name })}
                entityName={translate('activities')}
            />
        </PageTemplate>
    );
}
