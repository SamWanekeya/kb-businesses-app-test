import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { resolveImageUrl } from '@/utils/Helpers/Url';
import { useHasPermission } from '@/utils/Permissions';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Eye, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CallShow() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const { call } = usePage().props;
    const permissions = (usePage().props as any).auth?.permissions;

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Calls'), href: route('calls.index') },
        { title: translate('View Call') },
    ];

    const formatDateTime = (date: string, time: string) => {
        const dateObj = new Date(`${date}T${time}`);
        return dateObj.toLocaleString();
    };

    return (
        <PageTemplate
            title={call.title}
            description={translate('View call details and related information')}
            url={`/calls/${call.id}`}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => window.history.back(),
                },
            ]}
            noPadding
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Call Details */}
                    <Card>
                        <div className="border-b px-6 py-4">
                            <h2 className="text-lg font-semibold">{translate('Call Details')}</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="font-medium">{translate('Date & Time')}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {window.appSettings?.formatDateTime(call.start_date, false) ||
                                                new Date(call.start_date).toLocaleDateString()}{' '}
                                            {window.appSettings?.formatTime(call.start_time) || call.start_time} -{' '}
                                            {window.appSettings?.formatDateTime(call.end_date, false) || new Date(call.end_date).toLocaleDateString()}{' '}
                                            {window.appSettings?.formatTime(call.end_time) || call.end_time}
                                        </p>
                                    </div>
                                </div>

                                {call.description && (
                                    <div>
                                        <p className="mb-2 font-medium">{translate('Description')}</p>
                                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{call.description}</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{translate('Status')}:</span>
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                            call.status === 'planned'
                                                ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                                : call.status === 'held'
                                                  ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                  : call.status === 'not_held'
                                                    ? 'bg-red-50 text-red-700 ring-red-600/20'
                                                    : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                                        }`}
                                    >
                                        {call.status === 'planned'
                                            ? translate('Planned')
                                            : call.status === 'held'
                                              ? translate('Held')
                                              : call.status === 'not_held'
                                                ? translate('Not Held')
                                                : call.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Attendees */}
                    {call.attendees && call.attendees.length > 0 && (
                        <Card>
                            <div className="flex items-center gap-2 border-b px-6 py-4">
                                <Users className="h-5 w-5" />
                                <h2 className="text-lg font-semibold">{translate('Attendees')}</h2>
                            </div>
                            <div className="space-y-3 p-6">
                                {call.attendees.map((attendee: any, index: number) => (
                                    <div key={index} className="border-border flex items-center gap-3 rounded-lg border p-3">
                                        {attendee?.attendee?.avatar ? (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage
                                                    src={attendee?.attendee?.avatar}
                                                    alt={attendee?.attendee?.name || 'Avatar'}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = resolveImageUrl('avatars/avatar.png');
                                                    }}
                                                />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {attendee?.attendee?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <UserInitials name={attendee.attendee?.name} />
                                        )}
                                        <div>
                                            <p className="font-medium">{attendee.attendee?.name || translate('Unknown')}</p>
                                            <p className="text-muted-foreground text-sm capitalize">
                                                {translate(attendee.attendee_type)} {attendee.attendee?.email && `• ${attendee.attendee.email}`}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Call Info */}
                    <Card>
                        <div className="border-b px-6 py-4">
                            <h3 className="font-semibold">{translate('Call Information')}</h3>
                        </div>
                        <div className="space-y-3 p-6">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Created By')}</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    {call.creator ? (
                                        <>
                                            <Avatar className="h-7 w-7 flex-shrink-0">
                                                <AvatarImage src={call.creator.avatar} alt={call.creator.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(call.creator.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-medium">{call.creator.name}</p>
                                                {call.creator.email && <p className="text-muted-foreground truncate text-xs">{call.creator.email}</p>}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{translate('Unknown')}</p>
                                    )}
                                </div>
                            </div>

                            {call.assigned_user && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Assigned To')}</p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={call.assigned_user.avatar} alt={call.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(call.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{call.assigned_user.name}</p>
                                            {call.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{call.assigned_user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Created At')}</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                    <p className="text-sm">
                                        {window.appSettings?.formatDateTime(call.created_at, false) || new Date(call.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {call.updated_at !== call.created_at && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Last Updated')}</p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                        <p className="text-sm">
                                            {window.appSettings?.formatDateTime(call.created_at, false) ||
                                                new Date(call.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Related Record */}
                    {call.parent_module &&
                        call.parent_record &&
                        (() => {
                            const isPerson = ['lead', 'contact', 'account'].includes(call.parent_module);
                            const recordName = call.parent_record.name || call.parent_record.subject;
                            const viewRoute = `view-${call.parent_module === 'opportunity' ? 'opportunities' : call.parent_module + 's'}`;
                            const recordRoute = `${call.parent_module === 'opportunity' ? 'opportunities' : call.parent_module + 's'}.show`;
                            const inner = (
                                <div className="flex min-w-0 items-center gap-2">
                                    {isPerson && <UserInitials name={recordName} />}
                                    <div className="min-w-0">
                                        <p className="text-muted-foreground text-xs capitalize">{translate(call.parent_module)}</p>
                                        <p className="text-foreground truncate text-sm font-medium">{recordName}</p>
                                        {isPerson && call.parent_record.email && (
                                            <p className="text-muted-foreground truncate text-xs">{call.parent_record.email}</p>
                                        )}
                                    </div>
                                </div>
                            );
                            return (
                                <Card className="shadow-sm">
                                    <div className="flex items-center gap-2 border-b px-5 py-3.5">
                                        <Building2 className="text-muted-foreground h-4 w-4" />
                                        <h3 className="text-base font-semibold">{translate('Related To')}</h3>
                                    </div>
                                    <div className="p-4">
                                        {useHasPermission(viewRoute) ? (
                                            <Link
                                                href={route(recordRoute, call.parent_id)}
                                                className="hover:bg-muted/40 flex items-center justify-between rounded-lg border p-2.5 transition-colors"
                                            >
                                                {inner}
                                                <TooltipProvider delayDuration={200}>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Eye className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{translate('View')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center rounded-lg border p-2.5">{inner}</div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })()}
                </div>
            </div>
        </PageTemplate>
    );
}
