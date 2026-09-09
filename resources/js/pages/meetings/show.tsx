import PageTemplate from '@components/PageTemplate';
import UserInitials from '@components/UserInitials';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Card } from '@components/UserInterface/Card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import useInitials from '@hooks/useInitials';
import { Link, usePage } from '@inertiajs/react';
import { resolveImageUrl } from '@utils/Helpers/Url';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { ArrowLeft, Building2, Calendar, Eye, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MeetingShow() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const { meeting } = usePage().props;
    const permissions = (usePage().props as any).auth?.permissions;

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Meetings'), href: route('meetings.index') },
        { title: translate('View Meeting') },
    ];

    return (
        <PageTemplate
            title={meeting.title}
            description={translate('Meeting details and related information')}
            url={`/meetings/${meeting.id}`}
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
                    {/* Meeting Details */}
                    <Card>
                        <div className="border-b px-6 py-4">
                            <h2 className="text-lg font-semibold">{translate('Meeting Details')}</h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-5 w-5 text-gray-500" />
                                    <div>
                                        <p className="font-medium">{translate('Date & Time')}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {window.appSettings?.formatDateTime(meeting.start_date, false) ||
                                                new Date(meeting.start_date).toLocaleDateString()}{' '}
                                            {window.appSettings?.formatTime(meeting.start_time) || meeting.start_time} -{' '}
                                            {window.appSettings?.formatDateTime(meeting.end_date, false) ||
                                                new Date(meeting.end_date).toLocaleDateString()}{' '}
                                            {window.appSettings?.formatTime(meeting.end_time) || meeting.end_time}
                                        </p>
                                    </div>
                                </div>

                                {meeting.location && (
                                    <div className="flex items-start gap-3">
                                        <MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
                                        <div>
                                            <p className="font-medium">{translate('Location')}</p>
                                            <p className="text-muted-foreground text-sm">{meeting.location}</p>
                                        </div>
                                    </div>
                                )}

                                {meeting.description && (
                                    <div>
                                        <p className="mb-2 font-medium">{translate('Description')}</p>
                                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{meeting.description}</p>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{translate('Status')}:</span>
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                            meeting.status === 'planned'
                                                ? 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                                : meeting.status === 'held'
                                                  ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                  : meeting.status === 'not_held'
                                                    ? 'bg-red-50 text-red-700 ring-red-600/20'
                                                    : 'bg-gray-50 text-gray-700 ring-gray-600/20'
                                        }`}
                                    >
                                        {meeting.status === 'planned'
                                            ? translate('Planned')
                                            : meeting.status === 'held'
                                              ? translate('Held')
                                              : meeting.status === 'not_held'
                                                ? translate('Not Held')
                                                : meeting.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Attendees */}
                    {meeting.attendees && meeting.attendees.length > 0 && (
                        <Card>
                            <div className="flex items-center gap-2 border-b px-6 py-4">
                                <Users className="h-5 w-5" />
                                <h2 className="text-lg font-semibold">{translate('Attendees')}</h2>
                            </div>
                            <div className="space-y-3 p-6">
                                {meeting.attendees.map((attendee: any, index: number) => (
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
                                                {attendee.attendee_type} {attendee.attendee?.email && `• ${attendee.attendee.email}`}
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
                    {/* Meeting Info */}
                    <Card>
                        <div className="border-b px-6 py-4">
                            <h3 className="font-semibold">{translate('Meeting Information')}</h3>
                        </div>
                        <div className="space-y-3 p-6">
                            {meeting.assigned_user && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Assigned To')}</p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <Avatar className="h-7 w-7 flex-shrink-0">
                                            <AvatarImage src={meeting.assigned_user.avatar} alt={meeting.assigned_user.name} />
                                            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                {getInitials(meeting.assigned_user.name || '')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-foreground truncate text-sm font-medium">{meeting.assigned_user.name}</p>
                                            {meeting.assigned_user.email && (
                                                <p className="text-muted-foreground truncate text-xs">{meeting.assigned_user.email}</p>
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
                                        {window.appSettings?.formatDateTime(meeting.created_at, false) ||
                                            new Date(meeting.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {meeting.updated_at !== meeting.created_at && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Last Updated')}</p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                                        <p className="text-sm">
                                            {window.appSettings?.formatDateTime(meeting.updated_at, false) ||
                                                new Date(meeting.updated_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Related Record */}
                    {meeting.parent_module &&
                        meeting.parent_record &&
                        (() => {
                            const isPerson = ['lead', 'contact', 'account'].includes(meeting.parent_module);
                            const recordName = meeting.parent_record.name || meeting.parent_record.subject;
                            const viewRoute = `view-${meeting.parent_module === 'opportunity' ? 'opportunities' : meeting.parent_module + 's'}`;
                            const recordRoute = `${meeting.parent_module === 'opportunity' ? 'opportunities' : meeting.parent_module + 's'}.show`;
                            const inner = (
                                <div className="flex min-w-0 items-center gap-2">
                                    {isPerson && <UserInitials name={recordName} />}
                                    <div className="min-w-0">
                                        <p className="text-muted-foreground text-xs capitalize">{translate(meeting.parent_module)}</p>
                                        <p className="text-foreground truncate text-sm font-medium">{recordName}</p>
                                        {isPerson && meeting.parent_record.email && (
                                            <p className="text-muted-foreground truncate text-xs">{meeting.parent_record.email}</p>
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
                                                href={route(recordRoute, meeting.parent_id)}
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
