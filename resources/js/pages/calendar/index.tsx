import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { hasPermission } from '@/utils/authorization';
import { capitalize } from '@/utils/helper';
import allLocales from '@fullcalendar/core/locales-all';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { router, usePage } from '@inertiajs/react';
import { Calendar, CheckSquare, Clock, ExternalLink, Phone, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CalendarIndex() {
    const { t, i18n } = useTranslation();
    const { events, auth, settings = {}, globalSettings = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const isDemo = globalSettings?.is_demo === '1' || globalSettings?.is_demo === true;
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activeCalendar, setActiveCalendar] = useState<'local' | 'google'>('local');
    const [isSyncing, setIsSyncing] = useState(false);
    const [googleEvents, setGoogleEvents] = useState<any[]>([]);
    const [viewMode, setViewMode] = useState<'dayGridMonth' | 'timeGridDay'>(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 769 ? 'timeGridDay' : 'dayGridMonth';
        }
        return 'dayGridMonth';
    });

    const [currentMonthStart, setCurrentMonthStart] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [currentMonthEnd, setCurrentMonthEnd] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999));
    const [summaryStats, setSummaryStats] = useState({ meetings: 0, calls: 0, tasks: 0, total: 0 });
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

    useEffect(() => {
        const handleResize = () => {
            setViewMode(window.innerWidth < 769 ? 'timeGridDay' : 'dayGridMonth');
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isGoogleCalendarSynced = settings?.is_googlecalendar_sync === '1' || settings?.is_googlecalendar_sync === true;
    const isGoogleEnabled = settings?.googleCalendarEnabled === '1' || settings?.googleCalendarEnabled === true;
    const Timezone = settings?.defaultTimezone && settings?.defaultTimezone !== '';

    const handleCalendarChange = async (value: 'local' | 'google') => {
        setActiveCalendar(value);
        if (value === 'google') {
            setIsSyncing(true);
            try {
                const response = await fetch(route('google-calendar.sync'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });
                const data = await response.json();
                if (data.success) {
                    setGoogleEvents(data.events || []);
                    // toast.success(t('Google Calendar synced successfully'));
                } else {
                    toast.error(data.message || t('Failed to sync Google Calendar'));
                    setActiveCalendar('local');
                }
            } catch (error) {
                toast.error(t('Failed to sync Google Calendar'));
                setActiveCalendar('local');
            } finally {
                setIsSyncing(false);
            }
        } else {
            setGoogleEvents([]);
        }
    };

    const displayEvents = activeCalendar === 'google' ? googleEvents : events;

    useEffect(() => {
        if (!currentMonthStart || !currentMonthEnd) return;

        let meetings = 0;
        let calls = 0;
        let tasks = 0;
        let total = 0;
        const upcoming: any[] = [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        displayEvents.forEach((event: any) => {
            const eventDate = new Date(event.start);
            // Check if event is in current viewed month
            if (eventDate >= currentMonthStart && eventDate <= currentMonthEnd) {
                total++;
                if (event.type === 'meeting') meetings++;
                else if (event.type === 'call') calls++;
                else if (event.type === 'task') tasks++;

                // Check if upcoming (today or future)
                if (eventDate >= now) {
                    upcoming.push(event);
                }
            }
        });

        // Sort upcoming by date
        upcoming.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        setSummaryStats({ meetings, calls, tasks, total });
        setUpcomingEvents(upcoming); // show all upcoming events
    }, [displayEvents, currentMonthStart, currentMonthEnd]);

    const handleEventClick = (info: any) => {
        info.jsEvent.preventDefault();
        const event = info.event;

        setSelectedEvent({
            title: event.title,
            start: event.extendedProps.start || event.startStr,
            end: event.extendedProps.end || event.endStr,
            type: event.extendedProps.type,
            ...event.extendedProps,
        });
        setShowModal(true);
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'meeting':
                return <Calendar className="h-4 w-4" />;
            case 'call':
                return <Phone className="h-4 w-4" />;
            case 'task':
                return <CheckSquare className="h-4 w-4" />;
            default:
                return <Calendar className="h-4 w-4" />;
        }
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'meeting':
                return 'bg-blue-50 text-blue-700 ring-blue-600/20';
            case 'call':
                return 'bg-green-50 text-green-700 ring-green-600/20';
            case 'task':
                return 'bg-amber-50 text-amber-700 ring-amber-600/20';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-600/20';
        }
    };

    const getStatusClasses = (status: string, eventType: string) => {
        if (eventType === 'meeting') {
            // Meeting status colors
            switch (status?.toLowerCase()) {
                case 'planned':
                    return 'bg-blue-50 text-blue-700 ring-blue-600/20';
                case 'held':
                    return 'bg-green-50 text-green-700 ring-green-600/20';
                case 'not_held':
                    return 'bg-red-50 text-red-700 ring-red-600/20';
                default:
                    return 'bg-gray-50 text-gray-700 ring-gray-600/20';
            }
        } else if (eventType === 'call') {
            // Call status colors
            switch (status?.toLowerCase()) {
                case 'planned':
                    return 'bg-blue-50 text-blue-700 ring-blue-600/20';
                case 'held':
                    return 'bg-green-50 text-green-700 ring-green-600/20';
                case 'not_held':
                    return 'bg-red-50 text-red-700 ring-red-600/20';
                default:
                    return 'bg-gray-50 text-gray-700 ring-gray-600/20';
            }
        } else if (eventType === 'task') {
            // Task status colors
            switch (status?.toLowerCase()) {
                case 'to_do':
                    return 'bg-gray-50 text-gray-700 ring-gray-600/20';
                case 'in_progress':
                    return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
                case 'review':
                    return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
                case 'done':
                    return 'bg-green-50 text-green-700 ring-green-600/20';
                default:
                    return 'bg-gray-50 text-gray-700 ring-gray-600/20';
            }
        }
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    };

    const breadcrumbs = [{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Calendar') }];

    const pageActions = [];
    if (isGoogleCalendarSynced && isGoogleEnabled) {
        pageActions.push({
            label: '',
            icon: (
                <Select value={activeCalendar} onValueChange={handleCalendarChange} disabled={isSyncing}>
                    <SelectTrigger className="w-40">
                        <SelectValue>
                            <div className="flex items-center gap-2">
                                {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <></>}
                                <span>{activeCalendar === 'local' ? t('Local Calendar') : t('Google Calendar')}</span>
                            </div>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="local">
                            <div className="flex items-center gap-2">
                                <span>{t('Local Calendar')}</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="google">
                            <div className="flex items-center gap-2">
                                <span>{t('Google Calendar')}</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            ),
            variant: 'ghost' as const,
            onClick: () => {},
            className: 'hover:bg-transparent',
        });
    }

    const calendarLocale = (() => {
        const lang = i18n.language || 'en';
        const normalized = lang.toLowerCase().replace('_', '-');
        return normalized === 'zh' ? 'zh-cn' : normalized;
    })();

    return (
        <PageTemplate title={t('Calendar')} description={t('Manage your calendar and events.')} breadcrumbs={breadcrumbs} actions={pageActions}>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                <div className="lg:col-span-3">
                    <Card className="p-4">
                        <style>{`
                    @media (max-width: 480px) {
                        .fc .fc-toolbar {
                            flex-direction: column !important;
                            gap: 12px;
                            align-items: center;
                        }
                        .fc .fc-toolbar-title {
                            font-size: 1.2rem !important;
                            text-align: center;
                        }
                        .fc .fc-toolbar-chunk {
                            display: flex;
                            justify-content: center;
                            width: 100%;
                        }
                    }

                    /* Keep toolbar on one row */
                    .fc .fc-toolbar {
                        flex-wrap: nowrap !important;
                        gap: 6px;
                    }
                    .fc .fc-toolbar-title {
                        font-size: 1rem !important;
                        white-space: nowrap;
                    }

                    /* Strip FullCalendar default event styles so inline styles take over */
                    .fc-event { border: none !important; background: transparent !important; box-shadow: none !important; }
                    .fc-event .fc-event-main { padding: 0 !important; }

                    /* No horizontal scrollbar in week/day */
                    .fc-timegrid .fc-scroller-harness {
                        overflow-x: hidden !important;
                    }
                    .fc-timegrid .fc-scroller {
                        overflow-x: hidden !important;
                        overflow-y: auto !important;
                        max-height: 500px !important;
                    }

                    /* Match global scrollbar style */
                    .fc-timegrid .fc-scroller::-webkit-scrollbar {
                        width: 4px;
                    }
                    .fc-timegrid .fc-scroller::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .fc-timegrid .fc-scroller::-webkit-scrollbar-thumb {
                        background: #9ca3af;
                        border-radius: 3px;
                    }
                    .fc-timegrid .fc-scroller::-webkit-scrollbar-thumb:hover {
                        background: #6b7280;
                    }
                `}</style>
                        <div className="mb-4 flex flex-wrap justify-end gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded" style={{ backgroundColor: '#A12582' }}></div>
                                    <span className="text-foreground text-xs font-medium">{t('Meetings')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                                    <span className="text-foreground text-xs font-medium">{t('Calls')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                                    <span className="text-foreground text-xs font-medium">{t('Tasks')}</span>
                                </div>
                            </div>
                        </div>
                        <FullCalendar
                            key={`${viewMode}-${calendarLocale}`}
                            locales={allLocales}
                            locale={calendarLocale}
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                            initialView={viewMode}
                            datesSet={(arg) => {
                                const currentCalendarDate = arg.view.calendar.getDate();
                                const year = currentCalendarDate.getFullYear();
                                const month = currentCalendarDate.getMonth();
                                setCurrentMonthStart(new Date(year, month, 1));
                                setCurrentMonthEnd(new Date(year, month + 1, 0, 23, 59, 59, 999));
                            }}
                            titleFormat={(info) => {
                                const date = info.date || {};
                                const year = date.year || new Date().getFullYear();
                                const month = typeof date.month === 'number' ? date.month : new Date().getMonth();
                                const tempDate = new Date(year, month, 1);
                                const monthName = tempDate.toLocaleString(calendarLocale, { month: 'long' });
                                return `${monthName} ${year}`;
                            }}
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay',
                            }}
                            events={displayEvents}
                            eventClick={handleEventClick}
                            timeZone={Timezone ? Timezone : 'local'}
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: 'short',
                            }}
                            height="auto"
                            aspectRatio={1.8}
                            eventDisplay="block"
                            dayMaxEvents={1}
                            moreLinkClick="popover"
                            eventContent={(eventInfo) => {
                                const isNotHeld = eventInfo.event.extendedProps.status === 'not_held';
                                const type = eventInfo.event.extendedProps.type;
                                const colorMap: Record<string, { bg: string; text: string; border: string }> = {
                                    meeting: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
                                    call: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
                                    task: { bg: '#fefce8', text: '#a16207', border: '#fde047' },
                                };
                                const colors = colorMap[type] || { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
                                return (
                                    <div
                                        style={{
                                            backgroundColor: colors.bg,
                                            color: colors.text,
                                            border: `1px solid ${colors.border}`,
                                            borderRadius: '3px',
                                        }}
                                        className="w-full cursor-pointer overflow-hidden px-1.5 py-0.5 hover:opacity-80"
                                    >
                                        <div className={`truncate text-xs font-medium ${isNotHeld ? 'line-through' : ''}`}>
                                            {eventInfo.event.title}
                                        </div>
                                        {eventInfo.view.type !== 'dayGridMonth' && eventInfo.event.extendedProps.parent_name && (
                                            <div className={`truncate text-xs ${isNotHeld ? 'line-through' : ''}`}>
                                                {eventInfo.event.extendedProps.parent_name}
                                            </div>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </Card>
                </div>

                <div className="space-y-6 lg:col-span-1">
                    <Card className="border-border flex flex-col overflow-hidden border p-0 shadow-sm dark:bg-slate-900">
                        <div className="bg-muted/30 shrink-0 border-b px-5 py-4">
                            <h3 className="text-base font-semibold">{t('Upcoming Events')}</h3>
                        </div>

                        <div className="custom-scrollbar h-[360px] overflow-y-auto">
                            {upcomingEvents.length > 0 ? (
                                <div>
                                    {upcomingEvents.map((event, i) => (
                                        <div
                                            key={i}
                                            className="hover:bg-muted/50 flex h-[72px] cursor-pointer items-start gap-3 border-b p-4 transition-colors last:border-0"
                                            onClick={() =>
                                                handleEventClick({
                                                    jsEvent: {
                                                        preventDefault: () => {},
                                                    },
                                                    event: {
                                                        ...event,
                                                        extendedProps: event,
                                                    },
                                                })
                                            }
                                        >
                                            <div
                                                className={`mt-0.5 shrink-0 rounded-md p-2 ${
                                                    event.type === 'meeting'
                                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                                                        : event.type === 'call'
                                                          ? 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400'
                                                          : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                                                }`}
                                            >
                                                {getEventIcon(event.type)}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-foreground truncate text-sm font-semibold">{event.title}</p>

                                                <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                                    <Calendar className="h-3 w-3 shrink-0" />

                                                    <span className="truncate">
                                                        {window.appSettings?.formatDateTime(event.start, false) ||
                                                            new Date(event.start).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                                    <Calendar className="text-muted-foreground/30 h-10 w-10" />
                                    <p className="text-muted-foreground text-sm">{t('No upcoming events this month')}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card className="border-border overflow-hidden border p-0 shadow-sm dark:bg-slate-900">
                        {/* Header */}
                        <div className="border-border border-b px-4 py-4">
                            <h3 className="text-foreground text-sm font-semibold">{t('This Month')}</h3>
                        </div>

                        {/* Stats */}
                        <div className="space-y-2 px-4 py-3">
                            {/* Meetings */}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">{t('Meetings')}</span>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{summaryStats.meetings}</span>
                            </div>

                            {/* Calls */}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">{t('Calls')}</span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">{summaryStats.calls}</span>
                            </div>

                            {/* Leaves */}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground text-sm">{t('Tasks')}</span>
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{summaryStats.tasks}</span>
                            </div>
                            {/* Total */}
                            <div className="border-border -mx-4 border-t px-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-sm">{t('Total Events')}</span>
                                    <span className="text-foreground text-sm font-semibold">{summaryStats.total}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Event Details Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedEvent && getEventIcon(selectedEvent.type)}
                            {selectedEvent?.title}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedEvent && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span
                                    className={
                                        'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ' +
                                        getEventColor(selectedEvent.type || 'event')
                                    }
                                >
                                    {selectedEvent.type ? t(capitalize(selectedEvent.type)) : t('Event')}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm">
                                    <div className="flex items-start gap-2">
                                        <Clock className="mt-0.5 h-4 w-4 text-gray-500" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <strong className="text-gray-700">{t('Start')}:</strong>
                                                <span className="text-gray-600">
                                                    {selectedEvent.start ? <>{window.appSettings?.formatDateTime(selectedEvent.start)}</> : '-'}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex items-center gap-2">
                                                <strong className="text-gray-700">{t('End')}:</strong>
                                                <span className="text-gray-600">
                                                    {selectedEvent.end ? <>{window.appSettings?.formatDateTime(selectedEvent.end)}</> : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedEvent.status && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <strong>{t('Status')}:</strong>
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClasses(selectedEvent.status, selectedEvent.type)}`}
                                        >
                                            {selectedEvent.type === 'meeting' || selectedEvent.type === 'call'
                                                ? selectedEvent.status === 'planned'
                                                    ? t('Planned')
                                                    : selectedEvent.status === 'held'
                                                      ? t('Held')
                                                      : selectedEvent.status === 'not_held'
                                                        ? t('Not Held')
                                                        : selectedEvent.status
                                                : selectedEvent.type === 'task'
                                                  ? selectedEvent.status === 'to_do'
                                                      ? t('To Do')
                                                      : selectedEvent.status === 'in_progress'
                                                        ? t('In Progress')
                                                        : selectedEvent.status === 'review'
                                                          ? t('Review')
                                                          : selectedEvent.status === 'done'
                                                            ? t('Done')
                                                            : selectedEvent.status
                                                  : t(capitalize(selectedEvent.status))}
                                        </span>
                                    </div>
                                )}

                                {selectedEvent.description && (
                                    <div className="text-sm">
                                        <strong className="text-gray-700">{t('Description')}:</strong>
                                        <p className="mt-1 text-gray-600">{selectedEvent.description}</p>
                                    </div>
                                )}

                                {selectedEvent.location && (
                                    <div className="text-sm">
                                        <strong className="text-gray-700">{t('Location')}:</strong>
                                        <span className="ml-2 text-gray-600">{selectedEvent.location}</span>
                                    </div>
                                )}

                                {selectedEvent.parent_name && (
                                    <div className="text-sm">
                                        <strong className="text-gray-700">{t('Related to')}:</strong>
                                        <span className="ml-2 text-gray-600">{selectedEvent.parent_name}</span>
                                    </div>
                                )}
                            </div>

                            {(() => {
                                const eventType = selectedEvent.type;
                                const hasViewPermission =
                                    (eventType === 'meeting' && hasPermission(permissions, 'view-meetings')) ||
                                    (eventType === 'call' && hasPermission(permissions, 'view-calls')) ||
                                    (eventType === 'task' && hasPermission(permissions, 'view-project-tasks'));

                                return hasViewPermission && !isDemo ? (
                                    <div className="flex justify-end border-t pt-4">
                                        <Button
                                            onClick={() => {
                                                if (eventType === 'meeting') {
                                                    router.get(route('meetings.show', selectedEvent.meeting_id));
                                                } else if (eventType === 'call') {
                                                    router.get(route('calls.show', selectedEvent.call_id));
                                                } else if (eventType === 'task') {
                                                    router.get(route('project-tasks.show', selectedEvent.task_id));
                                                }
                                                setShowModal(false);
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            {t('View Details')}
                                        </Button>
                                    </div>
                                ) : null;
                            })()}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
