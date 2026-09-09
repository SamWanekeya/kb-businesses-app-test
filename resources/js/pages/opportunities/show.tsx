import CrudDeleteModal from '@components/CrudDeleteModal';
import PageTemplate from '@components/PageTemplate';
import UserInitials from '@components/UserInitials';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/UserInterface/Table';
import { Textarea } from '@components/UserInterface/Textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import useInitials from '@hooks/useInitials';
import { Link, router, usePage } from '@inertiajs/react';
import { formatRelativeTime } from '@utils/Helpers/StringFormatters';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import {
    ArrowLeft,
    Building,
    Calendar,
    Clock,
    DollarSign,
    Edit,
    Eye,
    FileText,
    MessageCircle,
    Package,
    Phone,
    Send,
    ShoppingCart,
    Trash2,
    TrendingUp,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function OpportunityShow() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const { opportunity, streamItems, auth, meetings } = usePage().props;
    const isOrganization = auth?.user?.type === 'organization';
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
    const [currentActivity, setCurrentActivity] = useState<any>(null);
    const [newComment, setNewComment] = useState('');
    const [editingComment, setEditingComment] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const permissions = auth?.permissions || [];
    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Opportunity Management') },
        { title: translate('Opportunities'), href: route('opportunities.index') },
        { title: translate('View Opportunity') },
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

    const formatCurrency = (amount: number) => window.appSettings?.formatCurrency(Number(amount || 0)) || `$${Number(amount || 0).toFixed(2)}`;

    const formatDate = (dateString: string) => {
        if (!dateString) return translate('-');
        return window.appSettings?.formatDateTime(dateString, false) || new Date(dateString).toLocaleDateString();
    };

    const calculateProductTotals = () => {
        let subtotal = 0;
        let totalTax = 0;

        opportunity.products?.forEach((product: any) => {
            const lineTotal = Number(product.pivot?.total_price || 0);
            subtotal += lineTotal;

            if (product.tax && lineTotal > 0) {
                totalTax += (lineTotal * Number(product.tax.rate || 0)) / 100;
            }
        });

        return { subtotal, totalTax, grandTotal: subtotal + totalTax };
    };

    const { subtotal, totalTax, grandTotal } = calculateProductTotals();

    return (
        <PageTemplate
            title={opportunity.name}
            breadcrumbs={breadcrumbs}
            description={translate('Opportunity details and related information')}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.visit(route('opportunities.index')),
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
                                label: translate('Amount'),
                                value: formatCurrency(opportunity.amount),
                                icon: DollarSign,
                                iconCls: 'text-emerald-600',
                                blobCls: 'bg-emerald-50 dark:bg-emerald-900/30',
                            },
                            {
                                label: translate('Stage'),
                                value: opportunity.opportunity_stage?.name || '—',
                                icon: TrendingUp,
                                iconCls: 'text-blue-600',
                                blobCls: 'bg-blue-50 dark:bg-blue-900/30',
                            },
                            {
                                label: translate('Products'),
                                value: `${opportunity.products?.length || 0} ${(opportunity.products?.length || 0) === 1 ? translate('item') : translate('items')}`,
                                icon: Package,
                                iconCls: 'text-orange-600',
                                blobCls: 'bg-orange-50 dark:bg-orange-900/30',
                            },
                            {
                                label: translate('Close Date'),
                                value: formatDate(opportunity.close_date),
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

                {/* Opportunity Summary + Related Records */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Opportunity Summary */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Opportunity Summary')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Status')}</p>
                                    <div>{getStatusBadge(opportunity.status)}</div>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-muted-foreground text-xs font-medium">{translate('Source')}</p>
                                    <p className="text-foreground text-sm font-medium">{opportunity.opportunity_source?.name || '—'}</p>
                                </div>
                            </div>
                            <div className="border-border mt-4 border-t pt-4">
                                <p className="text-muted-foreground mb-1.5 text-xs font-medium">{translate('Assigned To')}</p>
                                {opportunity.assigned_user ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={opportunity.assigned_user.avatar} alt={opportunity.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(opportunity.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{opportunity.assigned_user.name}</p>
                                            {opportunity.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{opportunity.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">{translate('Unassigned')}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Related Records */}
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <Building className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Related Records')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 p-5">
                            {opportunity.account ? (
                                <div className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <UserInitials name={opportunity.account.name} />
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Account')}</p>
                                            <p className="text-foreground truncate text-sm font-semibold">{opportunity.account.name}</p>
                                            {opportunity.account.email && (
                                                <p className="text-muted-foreground truncate text-xs">{opportunity.account.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    {useHasPermission('view-accounts') && (
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link href={route('accounts.show', opportunity.account.id)} className="ml-3 flex-shrink-0">
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
                                <div className="border-border bg-muted/20 flex items-center rounded-xl border p-3.5">
                                    <p className="text-muted-foreground text-xs">{translate('No account linked')}</p>
                                </div>
                            )}
                            {opportunity.contact ? (
                                <div className="hover:bg-muted/40 flex items-center justify-between rounded-xl border p-3.5 transition-colors">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <UserInitials name={opportunity.contact.name} />
                                        <div className="min-w-0">
                                            <p className="text-muted-foreground text-xs font-medium">{translate('Contact')}</p>
                                            <p className="text-foreground truncate text-sm font-semibold">{opportunity.contact.name}</p>
                                            {opportunity.contact.email && (
                                                <p className="text-muted-foreground truncate text-xs">{opportunity.contact.email}</p>
                                            )}
                                        </div>
                                    </div>
                                    {useHasPermission('view-contacts') && (
                                        <TooltipProvider delayDuration={200}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Link href={route('contacts.show', opportunity.contact.id)} className="ml-3 flex-shrink-0">
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
                                <div className="border-border bg-muted/20 flex items-center rounded-xl border p-3.5">
                                    <p className="text-muted-foreground text-xs">{translate('No contact linked')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Notes & Description */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Notes')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[150px] overflow-y-auto">
                                <div className="px-5 py-4">
                                    {opportunity.notes ? (
                                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{opportunity.notes}</p>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <FileText className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                            <p className="text-muted-foreground text-sm">{translate('No notes available')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

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
                                    {opportunity.description ? (
                                        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{opportunity.description}</p>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <FileText className="text-muted-foreground/20 mb-2 h-8 w-8" />
                                            <p className="text-muted-foreground text-sm">{translate('No description available')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Meetings & Calls */}
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
                                                                                <p>{translate('View ')}</p>
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

                {/* Products */}
                <Card className="overflow-hidden shadow-sm">
                    {/* Card Header */}
                    <CardHeader className="border-b px-5 py-3.5">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <ShoppingCart className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Products')}
                            </CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {opportunity.products && opportunity.products.length > 0 ? (
                            <>
                                {/* Table */}
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b bg-[#F0F0F1] hover:!bg-[#F0F0F1] dark:bg-gray-800 dark:hover:!bg-gray-800">
                                            <TableHead className="py-2.5 font-semibold">{translate('Product')}</TableHead>
                                            <TableHead className="py-2.5 text-center font-semibold">{translate('Quantity')}</TableHead>
                                            <TableHead className="py-2.5 text-center font-semibold">{translate('Unit Price')}</TableHead>
                                            <TableHead className="py-2.5 text-center font-semibold">{translate('Tax')}</TableHead>
                                            <TableHead className="py-2.5 text-right font-semibold">{translate('Total')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {opportunity.products.map((product: any, index: number) => {
                                            const lineTotal = Number(product.pivot?.total_price || 0);
                                            const taxAmount = product.tax ? (lineTotal * Number(product.tax.rate || 0)) / 100 : 0;
                                            return (
                                                <TableRow key={index} className="border-b hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-700">
                                                    <TableCell className="py-3">
                                                        <div className="flex min-w-0 items-center gap-3">
                                                            {product.main_image_url ? (
                                                                <a
                                                                    href={product.main_image_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-shrink-0"
                                                                >
                                                                    <img
                                                                        src={product.main_image_url}
                                                                        alt={product.name}
                                                                        className="border-border h-11 w-11 cursor-pointer rounded-lg border object-cover transition-opacity hover:opacity-80"
                                                                    />
                                                                </a>
                                                            ) : (
                                                                <div className="bg-muted border-border flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border">
                                                                    <Package className="text-muted-foreground/40 h-4 w-4" />
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="text-foreground truncate text-sm font-bold">{product.name}</p>
                                                                {product.sku && (
                                                                    <p className="text-muted-foreground mt-0.5 text-xs">SKU: {product.sku}</p>
                                                                )}
                                                                {product.category?.name && (
                                                                    <span className="mt-1 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                                        {product.category.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        <p className="text-foreground text-sm font-semibold">{product.pivot.quantity}</p>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        <p className="text-foreground font-mono text-sm font-semibold">
                                                            {formatCurrency(product.pivot.unit_price)}
                                                        </p>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-center">
                                                        {product.tax ? (
                                                            <>
                                                                <p className="text-foreground text-sm font-semibold">
                                                                    {product.tax.name} ({parseFloat(product.tax.rate).toFixed(2)}%)
                                                                </p>
                                                                <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                                                                    {formatCurrency(taxAmount)}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right">
                                                        <p className="font-mono text-sm font-bold text-emerald-600">
                                                            {formatCurrency(lineTotal + taxAmount)}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>

                                <div className="bg-muted/10 flex flex-col items-start justify-end gap-4 border-t px-6 py-5 md:flex-row md:items-end">
                                    <div className="w-full max-w-sm overflow-hidden rounded-xl border">
                                        <div className="flex items-center justify-between border-b px-4 py-3">
                                            <span className="text-muted-foreground text-sm font-medium">{translate('Subtotal')}</span>
                                            <span className="text-foreground font-mono text-sm font-semibold">{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-b px-4 py-3">
                                            <span className="text-muted-foreground text-sm font-medium">{translate('Total Tax')}</span>
                                            <span className="text-foreground font-mono text-sm font-semibold">{formatCurrency(totalTax)}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-foreground text-sm font-bold">{translate('Grand Total')}</span>
                                            <span className="font-mono text-lg font-bold text-emerald-600">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                                    <Package className="text-muted-foreground/40 h-8 w-8" />
                                </div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('No products added to this opportunity')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Related Quotes */}
                {opportunity.quotes?.length > 0 && (
                    <Card className="shadow-sm">
                        <CardHeader className="border-b px-5 py-3.5">
                            <CardTitle className="flex items-center text-lg font-semibold">
                                <FileText className="text-muted-foreground mr-3 h-5 w-5" />
                                {translate('Related Quotes')} ({opportunity.quotes.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="space-y-3">
                                {opportunity.quotes.map((quote: any) => (
                                    <div
                                        key={quote.id}
                                        className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 transition-colors hover:bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/20 dark:hover:bg-blue-900/30"
                                    >
                                        <div>
                                            <p className="text-foreground text-sm font-semibold">{quote.quote_number}</p>
                                            <p className="text-muted-foreground mt-0.5 text-xs">{quote.name}</p>
                                        </div>
                                        {useHasPermission('view-quotes') && (
                                            <Link href={route('quotes.show', quote.id)}>
                                                <Button variant="outline" size="sm" className="bg-white">
                                                    {translate('View')}
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

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
                            {useHasPermission('create-opportunities') && (
                                <div className="border-b px-5 pt-4 pb-4">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            if (newComment.trim()) {
                                                router.post(
                                                    route('opportunities.comments.store', opportunity.id),
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
                                                                        useHasPermission('edit-opportunities') && (
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
                                                                                        route('opportunities.comments.update-activity', {
                                                                                            opportunity: opportunity.id,
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
                                                            ) : activity.description?.includes('into') ? (
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
                    router.delete(route('opportunities.delete-activity', { opportunity: opportunity.id, activity: currentActivity.id }), {
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
                    router.delete(route('opportunities.delete-activities', opportunity.id), {
                        preserveScroll: true,
                    });
                    setIsDeleteAllModalOpen(false);
                }}
                itemName={translate('all activities for {{name}}', { name: opportunity.name })}
                entityName={translate('activities')}
            />
        </PageTemplate>
    );
}
