import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { formatRelativeTime } from '@/utils/Helpers/StringFormatters';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building,
    Calendar,
    Clock,
    DollarSign,
    Edit,
    Eye,
    FileText,
    MapPin,
    MessageCircle,
    Phone,
    Send,
    Tag,
    Target,
    Trash2,
    TrendingUp,
    User,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function LeadShow() {
    const { t: translate } = useTranslation();
    const { lead, streamItems, auth, relatedAccounts, relatedContacts, meetings } = usePage().props;
    const comments = lead.comments || [];
    const isOrganization = auth?.user?.type === 'organization';
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<any>(null);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const permissions = auth?.permissions;
    const getInitials = useInitials();

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Lead Management') },
        { title: translate('Leads'), href: route('leads.index') },
        { title: translate('View Lead') },
    ];

    const getStatusBadge = (status: string) => {
        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                    status === 'active'
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                        : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                }`}
            >
                {status === 'active' ? translate('Active') : translate('Inactive')}
            </span>
        );
    };

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    return (
        <PageTemplate
            title={lead.name}
            description={translate('Lead details and related information')}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('leads.index')),
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
                                label: translate('Lead Value'),
                                value: formatCurrency(lead.value),
                                icon: DollarSign,
                                iconCls: 'text-emerald-600',
                                blobCls: 'bg-emerald-50 dark:bg-emerald-900/30',
                            },
                            {
                                label: translate('Pipeline Stage'),
                                value: lead.lead_status?.name || '—',
                                icon: TrendingUp,
                                iconCls: 'text-blue-600',
                                blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                            },
                            {
                                label: translate('Source'),
                                value: lead.lead_source?.name || '—',
                                icon: Tag,
                                iconCls: 'text-orange-600',
                                blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                            },
                            {
                                label: translate('Created'),
                                value: window.appSettings?.formatDateTime(lead.created_at, false) || new Date(lead.created_at).toLocaleDateString(),
                                icon: Clock,
                                iconCls: 'text-purple-600',
                                blobCls: 'bg-purple-50 dark:bg-purple-900/30',
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

                {/* Lead Summary + Contact & Address */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Lead Summary */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Lead Summary')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Status')}</p>
                                    <div>{getStatusBadge(lead.status)}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Pipeline Stage')}</p>
                                    <p className="text-foreground text-sm font-medium">{lead.lead_status?.name || '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Source')}</p>
                                    <p className="text-foreground text-sm font-medium">{lead.lead_source?.name || '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Conversion')}</p>
                                    <div>
                                        {lead.is_converted ? (
                                            <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                                                <TrendingUp className="h-3 w-3" />
                                                {translate('Converted')}
                                            </span>
                                        ) : (
                                            <span className="bg-muted text-muted-foreground ring-border inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                                                {translate('Not Converted')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Account Name')}</p>
                                    <p className="text-foreground text-sm font-medium">{lead.account_name || '—'}</p>
                                </div>
                            </div>
                            {/* Assigned To + Created By — footer */}
                            <div className="border-border mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                                <div>
                                    <p className="text-muted-foreground mb-1.5 text-xs font-medium">{translate('Assigned To')}</p>
                                    {lead.assigned_user ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-7 w-7 flex-shrink-0">
                                                <AvatarImage src={lead.assigned_user.avatar} alt={lead.assigned_user.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(lead.assigned_user.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-medium">{lead.assigned_user.name}</p>
                                                {lead.assigned_user.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{lead.assigned_user.email}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{translate('Unassigned')}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-muted-foreground mb-1.5 text-xs font-medium">{translate('Created By')}</p>
                                    {lead.creator ? (
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-7 w-7 flex-shrink-0">
                                                <AvatarImage src={lead.creator.avatar} alt={lead.creator.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(lead.creator.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-medium">{lead.creator.name}</p>
                                                {lead.creator.email && <p className="text-muted-foreground truncate text-xs">{lead.creator.email}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{translate('Unknown')}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact & Address */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <User className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Contact & Address')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Email')}</p>
                                    <p className="text-foreground truncate text-sm font-medium">{lead.email || '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Phone')}</p>
                                    <p className="text-foreground text-sm font-medium">{lead.phone || '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Organization')}</p>
                                    <p className="text-foreground text-sm font-medium">{lead.organization || '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Position')}</p>
                                    <p className="text-foreground text-sm font-medium">{lead.position || '—'}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Website')}</p>
                                    {lead.website ? (
                                        <a
                                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block truncate text-sm font-medium text-blue-600 hover:!text-blue-600 hover:underline"
                                        >
                                            {lead.website}
                                        </a>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">—</p>
                                    )}
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Industry')}</p>
                                    <p className="text-foreground text-sm font-medium">{lead.account_industry?.name || '—'}</p>
                                </div>
                                {lead.address && <div className="space-y-0.5 sm:col-span-2"></div>}
                            </div>
                            {lead.address && (
                                // <div className="pt-4 border-t border-border">
                                <div className="border-border mt-4 border-t pt-4">
                                    <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                                        <MapPin className="h-3 w-3" />
                                        {translate('Address')}
                                    </p>
                                    <p className="text-foreground text-sm font-medium whitespace-pre-line">{lead.address}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Notes + Related Campaign — Additional Information card removed (duplicated Lead Value, Industry, Campaign, Conversion) */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Notes')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[150px] overflow-y-auto scroll-smooth px-5 py-4" style={{ scrollbarGutter: 'stable' }}>
                                {lead.notes ? (
                                    <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{lead.notes}</p>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <FileText className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                        <p className="text-muted-foreground text-sm">{translate('No notes available')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Target className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Related Campaign')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="flex h-[120px] items-center">
                                {lead.campaign ? (
                                    <div className="border-border bg-muted/20 hover:bg-muted/40 flex w-full items-center justify-between rounded-xl border p-4 transition-colors">
                                        <div>
                                            <p className="text-foreground text-sm font-semibold">{lead.campaign.name}</p>
                                            <p className="text-muted-foreground mt-0.5 text-xs">
                                                {lead.campaign.campaign_type?.name || translate('Campaign')}
                                            </p>
                                            <p className="text-muted-foreground mt-0.5 text-xs">
                                                {translate('Budget')}:{' '}
                                                <span className="font-mono">
                                                    {window.appSettings?.formatCurrency(Number(lead.campaign.budget || 0)) ||
                                                        `$${Number(lead.campaign.budget || 0).toFixed(2)}`}
                                                </span>
                                            </p>
                                        </div>
                                        {useHasPermission('view-campaigns') && (
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Link href={route('campaigns.show', lead.campaign.id)}>
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
                                ) : (
                                    <div className="flex w-full flex-col items-center justify-center text-center">
                                        <Target className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                        <p className="text-muted-foreground text-sm">{translate('No campaign linked')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Related Accounts & Contacts */}
                {(relatedAccounts?.length > 0 || relatedContacts?.length > 0) && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Related Accounts */}
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <Building className="text-muted-foreground mr-3 h-5 w-5" />
                                    {translate('Related Accounts')}
                                    {relatedAccounts?.length > 0 && (
                                        <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
                                            {relatedAccounts.length}
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {relatedAccounts?.length > 0 ? (
                                    <div className="space-y-2 overflow-y-auto p-3" style={{ maxHeight: '280px' }}>
                                        {relatedAccounts.map((account: any) => (
                                            <div
                                                key={account.id}
                                                className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors"
                                            >
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    {account.name && <UserInitials name={account.name} />}
                                                    <div className="min-w-0">
                                                        <p className="text-muted-foreground text-xs font-medium">
                                                            {account.account_type?.name || translate('Account')}
                                                        </p>
                                                        <p className="text-foreground truncate text-sm font-semibold">{account.name}</p>
                                                        {account.email && <p className="text-muted-foreground truncate text-xs">{account.email}</p>}
                                                    </div>
                                                </div>
                                                {useHasPermission('view-accounts') && (
                                                    <TooltipProvider delayDuration={200}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Link href={route('accounts.show', account.id)} className="ml-3 flex-shrink-0">
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
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Building className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                        <p className="text-muted-foreground text-sm">{translate('No accounts linked')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Related Contacts */}
                        <Card className="shadow-sm">
                            <CardHeader className="border-b px-5 py-3.5">
                                <CardTitle className="flex items-center text-lg font-semibold">
                                    <Users className="text-muted-foreground mr-3 h-5 w-5" />
                                    {translate('Related Contacts')}
                                    {relatedContacts?.length > 0 && (
                                        <span className="bg-muted text-muted-foreground ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold">
                                            {relatedContacts.length}
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {relatedContacts?.length > 0 ? (
                                    <div className="space-y-2 overflow-y-auto p-3" style={{ maxHeight: '280px' }}>
                                        {relatedContacts.map((contact: any) => (
                                            <div
                                                key={contact.id}
                                                className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors"
                                            >
                                                <div className="flex min-w-0 items-center gap-2.5">
                                                    {contact.name && <UserInitials name={contact.name} />}
                                                    <div className="min-w-0">
                                                        <p className="text-muted-foreground text-xs font-medium">
                                                            {contact.account?.name || translate('No account')}
                                                        </p>
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
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <User className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                        <p className="text-muted-foreground text-sm">{translate('No contacts linked')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Activities */}
                {meetings?.length > 0 &&
                    (() => {
                        const meetingItems = meetings.filter((m: any) => m.type !== 'call');
                        const callItems = meetings.filter((m: any) => m.type === 'call');
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
                                        {/* Meetings sub-card */}
                                        <Card className="border shadow-none">
                                            <CardHeader className="border-b px-4 py-3">
                                                <CardTitle className="text-muted-foreground flex items-center justify-between text-sm font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <UserCheck className="h-3.5 w-3.5" />
                                                        {translate('Meetings')}
                                                    </div>
                                                    <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                                                        {meetingItems.length}
                                                    </span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                {meetingItems.length === 0 ? (
                                                    <p className="text-muted-foreground py-6 text-center text-sm">{translate('No meetings found')}</p>
                                                ) : (
                                                    <div
                                                        className="space-y-2 overflow-y-auto p-3"
                                                        style={{ height: '412px', overflowY: meetingItems.length > 5 ? 'auto' : 'hidden' }}
                                                    >
                                                        {meetingItems.map((meeting: any) => (
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

                                        {/* Calls sub-card */}
                                        <Card className="border shadow-none">
                                            <CardHeader className="border-b px-4 py-3">
                                                <CardTitle className="text-muted-foreground flex items-center justify-between text-sm font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3.5 w-3.5" />
                                                        {translate('Calls')}
                                                    </div>
                                                    <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
                                                        {callItems.length}
                                                    </span>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                {callItems.length === 0 ? (
                                                    <p className="text-muted-foreground py-6 text-center text-sm">{translate('No calls found')}</p>
                                                ) : (
                                                    <div
                                                        className="space-y-2 overflow-y-auto p-3"
                                                        style={{ height: '412px', overflowY: callItems.length > 5 ? 'auto' : 'hidden' }}
                                                    >
                                                        {callItems.map((call: any) => (
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

                {/* Activity Stream - Full Width */}
                {useHasPermission('view-stream') && (
                    <Card className="shadow-sm">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <MessageCircle className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Activity Stream')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {/* Add Comment Form */}
                            {useHasPermission('create-leads') && (
                                <div className="border-b px-5 pt-4 pb-4">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (newComment.trim()) {
                                                router.post(
                                                    route('leads.comments.store', lead.id),
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
                            {/* Stream List */}
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
                                                    case 'converted':
                                                        return 'bg-orange-50 text-orange-700 ring-orange-600/20';
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
                                                    {/* Avatar + connector line */}
                                                    <div className="flex w-9 flex-shrink-0 flex-col items-center">
                                                        <Avatar className="relative z-10 h-9 w-9 flex-shrink-0">
                                                            <TooltipProvider delayDuration={200}>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="h-full w-full">
                                                                            <AvatarImage
                                                                                src={activity.user?.avatar}
                                                                                alt={activity.user?.name || 'U'}
                                                                            />
                                                                            <AvatarFallback className="bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold">
                                                                                {getInitials(activity.user?.name || 'U')}
                                                                            </AvatarFallback>
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top">
                                                                        <p>{activity.user?.name || translate('System')}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </Avatar>
                                                        {index < streamItems.length - 1 && (
                                                            <div className="absolute top-9 bottom-0 left-[18px] w-px bg-gray-300 dark:bg-gray-600" />
                                                        )}
                                                    </div>
                                                    {/* Card */}
                                                    <div
                                                        className={`bg-card min-w-0 flex-1 overflow-hidden rounded-xl border shadow-sm ${isEditing ? 'border-emerald-400 ring-1 ring-emerald-300' : ''}`}
                                                    >
                                                        {/* Card Header */}
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
                                                                        useHasPermission('edit-leads') && (
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
                                                        {/* Card Body */}
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
                                                                                        route('leads.comments.update-activity', {
                                                                                            lead: lead.id,
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
                                                            ) : activity.field_changed === 'lead_status_id' ||
                                                              activity.field_changed === 'name' ||
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

            {/* Delete Activity Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('leads.delete-activity', { lead: lead.id, activity: currentActivity.id }), {
                        preserveScroll: true,
                    });
                    setIsDeleteModalOpen(false);
                }}
                itemName={translate('this activity')}
                entityName={translate('activity')}
            />

            {/* Delete All Activities Modal */}
            <CrudDeleteModal
                isOpen={isDeleteAllModalOpen}
                onClose={() => setIsDeleteAllModalOpen(false)}
                onConfirm={() => {
                    router.delete(route('leads.delete-activities', lead.id), {
                        preserveScroll: true,
                    });
                    setIsDeleteAllModalOpen(false);
                }}
                itemName={translate('all activities for {{name}}', { name: lead.name })}
                entityName={translate('activities')}
            />
        </PageTemplate>
    );
}
