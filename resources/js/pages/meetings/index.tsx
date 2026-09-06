import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { capitalize } from '@/utils/helper';
import { router, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Edit, Eye, MapPin, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Meetings() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const isRtl = document.documentElement.dir === 'rtl';
    const {
        auth,
        meetings,
        users = [],
        allUsers = [],
        allContacts = [],
        allLeads = [],
        settings = {},
        summary = { planned: 0, held: 0, not_held: 0 },
        meetingDates = [],
        selectedDate: backendDate,
        selectedMonth,
        selectedYear,
    } = usePage().props;
    const permissions = auth?.permissions || [];
    const isGoogleCalendarSynced = settings?.googleCalendarEnabled === '1';

    // Parse backend selectedDate string → Date object (local, no timezone shift)
    const parseDate = (str: string) => {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    };
    const selectedDateObj = parseDate(backendDate);

    // meetingDatesSet: Set of 'YYYY-MM-DD' strings from backend for calendar dots
    const meetingDatesSet = new Set<string>(meetingDates);

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    // Navigate to a specific date — triggers full backend reload
    const navigateToDate = (date: Date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        router.get(route('meetings.index'), { date: `${yyyy}-${mm}-${dd}`, month: date.getMonth() + 1, year: yyyy }, { preserveScroll: true });
    };

    // Navigate calendar month (only changes dots, keeps selected date)
    const navigateToMonth = (year: number, month: number) => {
        router.get(route('meetings.index'), { date: backendDate, month, year }, { preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);
        switch (action) {
            case 'view':
                router.get(route('meetings.show', item.id));
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                setIsStatusModalOpen(true);
                break;
        }
    };

    const handleAddNew = () => {
        setCurrentItem(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (formData.attendees && Array.isArray(formData.attendees)) {
            formData.attendees = formData.attendees.filter((a: any) => a.type && a.id && a.id !== '');
        }
        if (formData.parent_id) formData.parent_id = String(formData.parent_id);
        if (formData.assigned_to) formData.assigned_to = String(formData.assigned_to);

        if (formMode === 'create') {
            toast.loading(translate('Creating meeting...'));
            router.post(route('meetings.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) toast.success(t(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(t(page.props.flash.error));
                    else if (page.props.flash.warning) toast.warning(t(page.props.flash.warning));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(translate('Failed to create: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            });
        } else if (formMode === 'edit') {
            toast.loading(translate('Updating meeting...'));
            router.put(route('meetings.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) toast.success(t(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(t(page.props.flash.error));
                    else if (page.props.flash.warning) toast.warning(t(page.props.flash.warning));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting meeting...'));
        router.delete(route('meetings.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) toast.success(t(page.props.flash.success));
                else if (page.props.flash.error) toast.error(t(page.props.flash.error));
                else if (page.props.flash.warning) toast.warning(t(page.props.flash.warning));
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('meetings.toggle-status', currentItem.id), formData, {
            onSuccess: (page) => {
                setIsStatusModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) toast.success(t(page.props.flash.success));
                else if (page.props.flash.error) toast.error(t(page.props.flash.error));
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    // Attendee resolution using backend-provided allUsers/allContacts/allLeads
    const userMap: Record<number, any> = Object.fromEntries(allUsers.map((u: any) => [u.id, u]));
    const contactMap: Record<number, any> = Object.fromEntries(allContacts.map((c: any) => [c.id, c]));
    const leadMap: Record<number, any> = Object.fromEntries(allLeads.map((l: any) => [l.id, l]));

    const resolveAttendees = (meeting: any) =>
        (meeting.attendees || [])
            .map((a: any) => {
                if (a.attendee_type === 'user') {
                    const u = userMap[a.attendee_id];
                    return u ? { name: u.name, avatar: u.avatar, type: 'user' } : null;
                }
                if (a.attendee_type === 'contact') {
                    const c = contactMap[a.attendee_id];
                    return c ? { name: c.name, avatar: null, type: 'contact' } : null;
                }
                if (a.attendee_type === 'lead') {
                    const l = leadMap[a.attendee_id];
                    return l ? { name: l.name, avatar: null, type: 'lead' } : null;
                }
                return null;
            })
            .filter(Boolean);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Calendar grid for the backend-driven selectedMonth/selectedYear
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

    const pageActions = [];
    if (useHasPermission('create-meetings')) {
        pageActions.push({
            label: translate('Add Meeting'),
            icon: <Plus className="mr-0 h-4 w-4 min-[350px]:mr-2" />,
            variant: 'default',
            className: 'h-8 w-8 min-[350px]:h-9 min-[350px]:w-auto px-0 min-[350px]:px-4',
            labelClassName: 'hidden min-[350px]:inline',
            tooltip: translate('Add Meeting'),
            tooltipClassName: 'min-[350px]:hidden',
            onClick: () => handleAddNew(),
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Meetings') }];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'planned':
                return 'bg-blue-50 text-blue-700 ring-blue-600/20';
            case 'held':
                return 'bg-green-50 text-green-700 ring-green-600/20';
            case 'not_held':
                return 'bg-red-50 text-red-700 ring-red-600/20';
            default:
                return 'bg-gray-50 text-gray-700 ring-gray-600/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'planned':
                return translate('Planned');
            case 'held':
                return translate('Held');
            case 'not_held':
                return translate('Not Held');
            default:
                return status;
        }
    };

    const formatTime = (timeStr: string) => (timeStr ? window.appSettings.formatTime(timeStr) : '');

    const calcDuration = (start: string, end: string, fallback?: number) => {
        if (start && end) {
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const mins = eh * 60 + em - (sh * 60 + sm);
            if (mins > 0) return mins >= 60 ? `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}` : `${mins}m`;
        }
        return fallback ? `${fallback}m` : '—';
    };

    const formatSelectedDate = (d: Date) => {
        const dateFormat = settings?.dateFormat ?? 'Y-m-d';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const monthName = monthNames[d.getMonth()];
        return dateFormat.replace('Y', String(yyyy)).replace('m', mm).replace('d', dd).replace('M', monthName.slice(0, 3)).replace('F', monthName);
    };

    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();

    // Mini-calendar sidebar (shared between mobile + desktop)
    const renderCalendar = () => (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <button
                    onClick={() => {
                        const prev = selectedMonth === 1 ? { m: 12, y: selectedYear - 1 } : { m: selectedMonth - 1, y: selectedYear };
                        navigateToMonth(prev.y, prev.m);
                    }}
                    className="cursor-pointer rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </button>
                <span className="text-sm font-semibold">
                    {monthNames[selectedMonth - 1]} {selectedYear}
                </span>
                <button
                    onClick={() => {
                        const next = selectedMonth === 12 ? { m: 1, y: selectedYear + 1 } : { m: selectedMonth + 1, y: selectedYear };
                        navigateToMonth(next.y, next.m);
                    }}
                    className="cursor-pointer rounded p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
            </div>
            <div className="grid grid-cols-7 border-b border-gray-200 px-4 py-1 text-center dark:border-gray-700">
                {dayNames.map((d) => (
                    <div key={d} className="text-muted-foreground py-1 text-xs font-medium">
                        {d}
                    </div>
                ))}
            </div>
            <div className="p-4">
                <div className="grid grid-cols-7 gap-y-1 text-center">
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`e-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(selectedYear, selectedMonth - 1, day);
                        const yyyy = date.getFullYear();
                        const mm = String(date.getMonth() + 1).padStart(2, '0');
                        const dd = String(date.getDate()).padStart(2, '0');
                        const dateStr = `${yyyy}-${mm}-${dd}`;
                        const isSelected = dateStr === backendDate;
                        const isTodayDate = date.toDateString() === new Date().toDateString();
                        const hasMeeting = meetingDatesSet.has(dateStr);
                        return (
                            <button
                                key={day}
                                onClick={() => navigateToDate(date)}
                                className={`relative mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : isTodayDate ? 'text-primary font-bold' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            >
                                {day}
                                {hasMeeting && !isSelected && (
                                    <span className="bg-primary absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    // Meeting summary sidebar block
    const renderSummary = () => (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{translate('Meeting Summary')}</p>
                <span className="text-muted-foreground text-xs">({formatSelectedDate(selectedDateObj)})</span>
            </div>
            <div className="space-y-2.5 p-4">
                {[
                    { label: translate('Planned'), color: 'bg-blue-500', count: summary.planned },
                    { label: translate('Held'), color: 'bg-green-500', count: summary.held },
                    { label: translate('Not Held'), color: 'bg-red-500', count: summary.not_held },
                ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{item.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.count}</span>
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{translate('Total Meetings')}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {Array.isArray(meetings) ? meetings.length : (meetings?.total ?? 0)}
                </span>
            </div>
        </div>
    );

    // Quick filters sidebar block
    const renderQuickFilters = () => (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{translate('Quick Filters')}</p>
            </div>
            <div className="space-y-1 p-4">
                {(['yesterday', 'today', 'tomorrow'] as const).map((f) => {
                    const d = new Date();
                    if (f === 'tomorrow') d.setDate(d.getDate() + 1);
                    if (f === 'yesterday') d.setDate(d.getDate() - 1);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const isActive = backendDate === `${yyyy}-${mm}-${dd}`;
                    return (
                        <button
                            key={f}
                            onClick={() => navigateToDate(d)}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors ${
                                isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'hover:text-primary text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <CalendarDays className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span>{t(f.charAt(0).toUpperCase() + f.slice(1))}</span>
                            </div>
                            {isRtl ? (
                                <ChevronLeft className="text-muted-foreground h-4 w-4" />
                            ) : (
                                <ChevronRight className="text-muted-foreground h-4 w-4" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <PageTemplate
            title={translate('Meetings')}
            description={translate('Schedule and manage meetings .')}
            url="/meetings"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="flex flex-col gap-4 lg:flex-row">
                {/* Right: Sidebar — shown first on mobile */}
                <div className="flex w-full shrink-0 flex-col gap-4 lg:hidden">
                    {renderCalendar()}
                    {renderSummary()}
                    {renderQuickFilters()}
                </div>

                {/* Left: Timeline Panel */}
                <div className="min-w-0 flex-1">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        {/* Date Header */}
                        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                            <CalendarDays className="text-muted-foreground h-4 w-4" />
                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                {formatSelectedDate(selectedDateObj)}
                                {isToday(selectedDateObj) && <span className="ms-1 font-bold">({translate('Today')})</span>}
                            </span>
                            {!isToday(selectedDateObj) && (
                                <Button variant="outline" size="sm" onClick={() => navigateToDate(new Date())}>
                                    {translate('Today')}
                                </Button>
                            )}
                            <span className="bg-primary/10 text-primary ring-primary/20 ms-auto inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                                {Array.isArray(meetings) ? meetings.length : (meetings?.total ?? 0)} {translate('Meetings')}
                            </span>
                        </div>

                        {/* Meeting List */}
                        <div className="max-h-[60vh] divide-y divide-gray-200 overflow-y-auto lg:max-h-[calc(100vh-220px)] dark:divide-gray-700">
                            {(Array.isArray(meetings) ? meetings : (meetings?.data ?? [])).length === 0 ? (
                                <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-16">
                                    <CalendarDays className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("That's all for today!")}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {translate('You have no meetings scheduled for')}{' '}
                                        <span className="font-medium">{formatSelectedDate(selectedDateObj)}</span>
                                    </p>
                                </div>
                            ) : (
                                (Array.isArray(meetings) ? meetings : (meetings?.data ?? [])).map((meeting: any) => (
                                    <div key={meeting.id} className="flex items-stretch transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                                        {/* Time column */}
                                        <div className="relative me-4 flex w-16 shrink-0 flex-col items-end justify-start pe-4 pt-4 pb-4 sm:w-20">
                                            <div className="absolute end-0 top-3 bottom-3 w-px bg-gray-300 dark:bg-gray-600" />
                                            <span className="text-xs leading-tight font-semibold text-gray-700 dark:text-gray-200">
                                                {formatTime(meeting.start_time)}
                                            </span>
                                            <span className="my-0.5 text-xs leading-none text-gray-400 dark:text-gray-400">↓</span>
                                            <span className="text-xs leading-tight font-semibold text-gray-700 dark:text-gray-200">
                                                {formatTime(meeting.end_time)}
                                            </span>
                                        </div>

                                        {/* Avatar */}
                                        <div className="flex shrink-0 items-start pe-3 pt-4">
                                            {meeting.assigned_user ? (
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={meeting.assigned_user.avatar} alt={meeting.assigned_user.name} />
                                                    <AvatarFallback className="text-xs">{getInitials(meeting.assigned_user.name)}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1 py-3 pe-3 sm:py-4 sm:pe-4">
                                            {/* Row 1: title + badge + actions */}
                                            <div className="flex items-start justify-between gap-1 sm:gap-2">
                                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                                    <p className="truncate text-sm leading-tight font-semibold text-gray-900 dark:text-gray-100">
                                                        {meeting.title}
                                                    </p>
                                                    <span
                                                        className={`inline-flex w-fit items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-gray-600/20 ring-inset ${getStatusBadge(meeting.status)}`}
                                                    >
                                                        {getStatusLabel(meeting.status)}
                                                    </span>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-0 sm:gap-0.5">
                                                    {useHasPermission('view-meetings') && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => handleAction('view', meeting)}
                                                                        className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{translate('View')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {useHasPermission('edit-meetings') && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => handleAction('edit', meeting)}
                                                                        className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{translate('Edit')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {useHasPermission('toggle-status-meetings') && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => handleAction('toggle-status', meeting)}
                                                                        className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{translate('Change Status')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {useHasPermission('delete-meetings') && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <button
                                                                        onClick={() => handleAction('delete', meeting)}
                                                                        className="cursor-pointer rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{translate('Delete')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Row 2: assigned user */}
                                            {meeting.assigned_user && (
                                                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                    {meeting.assigned_user.name} • {meeting.assigned_user.email}
                                                </p>
                                            )}

                                            {/* Row 3: location/module left, attendees+duration right */}
                                            <div className="mt-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {meeting.location && (
                                                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                                            <MapPin className="h-3 w-3 shrink-0" />
                                                            {meeting.location}
                                                        </span>
                                                    )}
                                                    {meeting.parent_module && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-gray-600/20 ring-inset">
                                                            {capitalize(meeting.parent_module)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                                                    {(() => {
                                                        const att = resolveAttendees(meeting);
                                                        const visible = att.slice(0, 3);
                                                        const extra = att.length - 3;
                                                        return visible.length > 0 ? (
                                                            <div className="flex items-center -space-x-0">
                                                                {visible.map((a: any, i: number) => (
                                                                    <TooltipProvider key={i}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="cursor-pointer">
                                                                                    {a.type === 'user' ? (
                                                                                        <Avatar className="h-5 w-5 ring-2 ring-white dark:ring-gray-900">
                                                                                            <AvatarImage src={a.avatar} alt={a.name} />
                                                                                            <AvatarFallback className="text-[10px]">
                                                                                                {getInitials(a.name)}
                                                                                            </AvatarFallback>
                                                                                        </Avatar>
                                                                                    ) : (
                                                                                        <div className="[&_[data-slot=avatar-fallback]]:text-[9px] [&_[data-slot=avatar]]:h-5 [&_[data-slot=avatar]]:w-5">
                                                                                            <UserInitials name={a.name} />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>{a.name}</TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                ))}
                                                                {extra > 0 && (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-700 ring-2 ring-white dark:bg-gray-600 dark:text-gray-200 dark:ring-gray-900">
                                                                                    +{extra}
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <div className="flex flex-col gap-0.5">
                                                                                    {att.slice(3).map((a: any, i: number) => (
                                                                                        <span key={i}>{a.name}</span>
                                                                                    ))}
                                                                                </div>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {calcDuration(meeting.start_time, meeting.end_time, meeting.duration_minutes)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Sidebar — desktop only */}
                <div className="hidden w-full shrink-0 grid-cols-1 gap-4 lg:grid lg:w-72">
                    {renderCalendar()}
                    {renderSummary()}
                    {renderQuickFilters()}
                </div>
            </div>

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        {
                            name: 'title',
                            label: translate('Meeting Title'),
                            type: 'text' as const,
                            required: true,
                            placeholder: translate('e.g. Q1 Sales Review, Product Demo, Kickoff Meeting'),
                        },
                        {
                            name: 'description',
                            label: translate('Description'),
                            type: 'textarea' as const,
                            placeholder: translate('Enter meeting description or agenda...'),
                        },
                        {
                            name: 'location',
                            label: translate('Location'),
                            type: 'text' as const,
                            required: true,
                            placeholder: translate('e.g. Conference Room A, Zoom, Google Meet'),
                        },
                        { name: 'start_date', label: translate('Start Date'), type: 'date' as const, required: true },
                        { name: 'end_date', label: translate('End Date'), type: 'date' as const, required: true },
                        { name: 'start_time', label: translate('Start Time'), type: 'time' as const, required: true },
                        { name: 'end_time', label: translate('End Time'), type: 'time' as const, required: true },
                        {
                            name: 'parent_module',
                            label: translate('Related To'),
                            type: 'select' as const,
                            required: true,
                            options: [
                                { value: 'lead', label: translate('Lead') },
                                { value: 'account', label: translate('Account') },
                                { value: 'contact', label: translate('Contact') },
                                { value: 'opportunity', label: translate('Opportunity') },
                                { value: 'case', label: translate('Case') },
                                { value: 'project', label: translate('Project') },
                            ],
                        },
                        {
                            name: 'parent_id',
                            label: translate('Select Record'),
                            type: 'select' as const,
                            required: true,
                            searchable: true,
                            options: [],
                            placeholder: translate('Select Record'),
                            emptyNote: (formData: any) => {
                                const parentModule = formData.parent_module;
                                if (!parentModule || parentModule === 'none') return null;
                                const routes: Record<string, string> = {
                                    lead: route('leads.index'),
                                    account: route('accounts.index'),
                                    contact: route('contacts.index'),
                                    opportunity: route('opportunities.index'),
                                    case: route('cases.index'),
                                    project: route('projects.index'),
                                };
                                const labels: Record<string, string> = {
                                    lead: translate('Leads'),
                                    account: translate('Accounts'),
                                    contact: translate('Contacts'),
                                    opportunity: translate('Opportunities'),
                                    case: translate('Cases'),
                                    project: translate('Projects'),
                                };
                                return { link: routes[parentModule], linkText: labels[parentModule] };
                            },
                            conditional: (mode: string, formData: any) => {
                                const parentModule = formData.parent_module;
                                return parentModule && parentModule !== 'none';
                            },
                        },
                        {
                            name: 'attendees',
                            label: translate('Attendees'),
                            type: 'array' as const,
                            required: true,
                            fields: [
                                {
                                    name: 'type',
                                    label: translate('Type'),
                                    type: 'select' as const,
                                    required: true,
                                    options: [
                                        { value: 'user', label: translate('User') },
                                        { value: 'contact', label: translate('Contact') },
                                        { value: 'lead', label: translate('Lead') },
                                    ],
                                },
                                {
                                    name: 'id',
                                    label: translate('Select Person'),
                                    type: 'select' as const,
                                    required: true,
                                    searchable: true,
                                    options: [],
                                    emptyNote: (formData: any, arrayIndex?: number) => {
                                        if (arrayIndex === undefined) return null;
                                        const attendees = formData.attendees || [];
                                        const attendeeType = attendees[arrayIndex]?.type;
                                        if (!attendeeType) return null;
                                        const routes: Record<string, string> = {
                                            user: route('users.index'),
                                            contact: route('contacts.index'),
                                            lead: route('leads.index'),
                                        };
                                        const labels: Record<string, string> = {
                                            user: translate('Users'),
                                            contact: translate('Contacts'),
                                            lead: translate('Leads'),
                                        };
                                        return { link: routes[attendeeType], linkText: labels[attendeeType] };
                                    },
                                },
                            ],
                        },
                        {
                            name: 'assigned_to',
                            label: translate('Assign To'),
                            type: 'select' as const,
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('users.index'), linkText: translate('Users') },
                            options: [...users.map((user: any) => ({ value: user.id, label: `${user.name} (${user.email})` }))],
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select' as const,
                            options: [
                                { value: 'planned', label: translate('Planned') },
                                { value: 'held', label: translate('Held') },
                                { value: 'not_held', label: translate('Not Held') },
                            ],
                            defaultValue: 'planned',
                        },
                        ...(isGoogleCalendarSynced
                            ? [
                                  {
                                      name: 'sync_with_google_calendar',
                                      label: translate('Sync with Google Calendar'),
                                      type: 'switch' as const,
                                      defaultValue: false,
                                      conditional: (mode: string) => mode === 'create',
                                  },
                              ]
                            : []),
                    ],
                    modalSize: 'xl',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              attendees:
                                  currentItem.attendees?.map((attendee: any) => ({
                                      type: attendee.attendee_type,
                                      id: attendee.attendee_id,
                                  })) || [],
                          }
                        : {}
                }
                title={formMode === 'create' ? translate('Add Meeting') : formMode === 'edit' ? translate('Edit Meeting') : translate('View Meeting')}
                mode={formMode}
            />

            {/* Status Modal */}
            <CrudFormModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onSubmit={handleStatusChange}
                formConfig={{
                    fields: [
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            required: true,
                            options: [
                                { value: 'planned', label: translate('Planned') },
                                { value: 'held', label: translate('Held') },
                                { value: 'not_held', label: translate('Not Held') },
                            ],
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={translate('Change Meeting Status')}
                mode="edit"
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.title || ''}
                entityName={translate('meeting')}
            />
        </PageTemplate>
    );
}
