import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { router, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, BanknoteIcon, BarChart3, Building2, Calendar, Clock, DollarSign, LayoutGrid } from 'lucide-react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function ProjectShow() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const {
        auth,
        project,
        taskStats = {},
        totalTasks = 0,
        completedTasks = 0,
        progressPercentage = 0,
        meetings,
        taskStatuses = [],
    } = usePage().props;
    const permissions = auth?.permissions || [];

    const pageActions = [];
    pageActions.push({
        label: translate('Back'),
        icon: <ArrowLeft className="mr-0 h-4 w-4 min-[450px]:mr-2" />,
        variant: 'outline',
        className: 'h-8 w-8 min-[450px]:h-9 min-[450px]:w-auto px-0 min-[450px]:px-4',
        labelClassName: 'hidden min-[450px]:inline',
        tooltip: translate('Back'),
        tooltipClassName: 'min-[450px]:hidden',
        onClick: () => window.history.back(),
    });

    if (useHasPermission('view-project-tasks')) {
        pageActions.push({
            label: translate('Kanban View'),
            icon: <LayoutGrid className="mr-0 h-4 w-4 min-[1100px]:mr-2" />,
            variant: 'default',
            className: 'h-8 w-8 min-[1100px]:h-9 min-[1100px]:w-auto px-0 min-[1100px]:px-4',
            labelClassName: 'hidden min-[1100px]:inline',
            tooltip: translate('Kanban View'),
            tooltipClassName: 'min-[1100px]:hidden',
            onClick: () => router.get(route('projects.kanban', project.id)),
        });

        pageActions.push({
            label: translate('Gantt View'),
            icon: <BarChart3 className="mr-0 h-4 w-4 min-[1100px]:mr-2" />,
            variant: 'default',
            className: 'h-8 w-8 min-[1100px]:h-9 min-[1100px]:w-auto px-0 min-[1100px]:px-4',
            labelClassName: 'hidden min-[1100px]:inline',
            tooltip: translate('Gantt View'),
            tooltipClassName: 'min-[1100px]:hidden',
            onClick: () => router.get(route('projects.gantt', project.id)),
        });
    }

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Project Management') },
        { title: translate('Projects'), href: route('projects.index') },
        { title: translate('View Project') },
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'on_hold':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'inactive':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <PageTemplate
            title={project.name}
            description={translate('Project details and related information')}
            url={`/projects/${project.id}`}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="space-y-6">
                {/* Project Header */}
                <Card>
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4">
                        <div>
                            <h1 className="max-w-[280px] truncate text-lg font-bold sm:max-w-none">{project.name}</h1>
                            {project.code && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {translate('Code')}: {project.code}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                    project.priority === 'urgent'
                                        ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                                        : project.priority === 'high'
                                          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 ring-inset'
                                          : project.priority === 'medium'
                                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 ring-inset'
                                            : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20 ring-inset'
                                }`}
                            >
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                {translate(project.priority.charAt(0).toUpperCase() + project.priority.slice(1))}
                            </span>
                            <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                    project.status === 'active'
                                        ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                                        : project.status === 'completed'
                                          ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 ring-inset'
                                          : project.status === 'on_hold'
                                            ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20 ring-inset'
                                            : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20 ring-inset'
                                }`}
                            >
                                <Clock className="mr-1 h-3 w-3" />
                                {translate(project.status.replace('_', ' ').charAt(0).toUpperCase() + project.status.replace('_', ' ').slice(1))}
                            </span>
                        </div>
                    </div>
                    {project.description && (
                        <div className="px-6 py-4">
                            <p className="max-w-3xl text-gray-700 dark:text-gray-300">{project.description}</p>
                        </div>
                    )}
                </Card>

                {/* Task Progress Chart */}
                {totalTasks > 0 && (
                    <Card>
                        <div className="border-b px-6 py-4">
                            <h3 className="text-lg font-semibold">{translate('Task Progress')}</h3>
                        </div>
                        <div className="space-y-4 p-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{translate('Overall Progress')}</span>
                                <span className="text-primary text-lg font-bold">{progressPercentage}%</span>
                            </div>
                            <div className="h-3 w-full rounded-full bg-gray-200">
                                <div
                                    className="bg-primary h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                ></div>
                            </div>
                            <div
                                className={`mt-4 grid gap-4 ${taskStatuses.length <= 2 ? 'grid-cols-2' : taskStatuses.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}
                            >
                                {taskStatuses.map((status: any) => (
                                    <div
                                        key={status.id}
                                        className="rounded-lg p-3 text-center"
                                        style={{ backgroundColor: `${status.color}20`, border: `1px solid ${status.color}40` }}
                                    >
                                        <div className="text-lg font-bold" style={{ color: status.color }}>
                                            {taskStats[status.name] || 0}
                                        </div>
                                        <div className="text-xs text-gray-500">{status.name}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                                {completedTasks} {translate('of')} {totalTasks} {translate('tasks completed')}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Account Information */}
                    <Card>
                        <div className="flex items-center gap-2 border-b px-6 py-4">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold">{translate('Account Information')}</h3>
                        </div>
                        <div className="space-y-3 p-6">
                            {project.account ? (
                                <div className="flex items-center gap-3">
                                    <UserInitials name={project.account.name} />
                                    <div>
                                        <p className="text-sm font-medium">{project.account.name}</p>
                                        <p className="text-muted-foreground text-xs">{project.account.email || '-'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm">-</p>
                            )}
                            {project.account?.phone && (
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Phone')}</p>
                                    <p className="mt-1 text-sm">{project.account.phone}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Project Timeline */}
                    <Card>
                        <div className="flex items-center gap-2 border-b px-6 py-4">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold">{translate('Timeline')}</h3>
                        </div>
                        <div className="space-y-3 p-6">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Start Date')}</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                                    <p className="text-sm">
                                        {project.start_date
                                            ? window.appSettings?.formatDateTime(project.start_date, false) ||
                                              new Date(project.start_date).toLocaleDateString()
                                            : 'Not set'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('End Date')}</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                                    <p className="text-sm">
                                        {project.end_date
                                            ? window.appSettings?.formatDateTime(project.end_date, false) ||
                                              new Date(project.end_date).toLocaleDateString()
                                            : 'Not set'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Created')}</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                    <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                                    <p className="text-sm">
                                        {window.appSettings?.formatDateTime(project.created_at, false) ||
                                            new Date(project.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Budget & Assignment */}
                    <Card>
                        <div className="flex items-center gap-2 border-b px-6 py-4">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold">{translate('Budget & Assignment')}</h3>
                        </div>
                        <div className="space-y-3 p-6">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Budget')}</p>
                                <div className="mt-1 flex items-center">
                                    <BanknoteIcon className="text-muted-foreground mr-2 h-4 w-4" />
                                    <p className="mt-1 font-mono text-sm">
                                        {project.budget
                                            ? window.appSettings?.formatCurrency(project.budget) || `$${project.budget.toLocaleString()}`
                                            : 'Not set'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Assigned To')}</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    {project.assigned_user ? (
                                        <>
                                            <Avatar className="h-7 w-7 flex-shrink-0">
                                                <AvatarImage src={project.assigned_user.avatar} alt={project.assigned_user.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(project.assigned_user.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-medium">{project.assigned_user.name}</p>
                                                {project.assigned_user.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{project.assigned_user.email}</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{translate('Unassigned')}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Created By')}</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                    {project.creator ? (
                                        <>
                                            <Avatar className="h-7 w-7 flex-shrink-0">
                                                <AvatarImage src={project.creator.avatar} alt={project.creator.name} />
                                                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                                                    {getInitials(project.creator.name || '')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-foreground truncate text-sm font-medium">{project.creator.name}</p>
                                                {project.creator.email && (
                                                    <p className="text-muted-foreground truncate text-xs">{project.creator.email}</p>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{translate('Unknown')}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Activities */}
                {meetings && meetings.length > 0 && (
                    <Card>
                        <div className="border-b px-6 py-4">
                            <h3 className="text-lg font-semibold">{translate('Activities')}</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2">
                            {/* Meetings Section */}
                            <div>
                                <div className="mb-4 flex items-center">
                                    <svg className="mr-2 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                    <h4 className="text-muted-foreground text-sm font-medium">
                                        {translate('Meetings')} ({meetings.filter((m: any) => m.type !== 'call').length})
                                    </h4>
                                </div>
                                <div className="space-y-3">
                                    {meetings
                                        .filter((m: any) => m.type !== 'call')
                                        .slice(0, 5)
                                        .map((meeting: any) => (
                                            <div
                                                key={meeting.id}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm"
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="mt-1 flex-shrink-0">
                                                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-gray-900">{meeting.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {window.appSettings?.formatDateTime(meeting.start_date, false) ||
                                                                new Date(meeting.start_date).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{meeting.assigned_user?.name || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                                {useHasPermission('view-meetings') && (
                                                    <a href={route('meetings.show', meeting.id)}>
                                                        <Button variant="outline" size="sm">
                                                            {translate('View')}
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    {meetings.filter((m: any) => m.type !== 'call').length > 5 && (
                                        <p className="text-center text-sm text-gray-500">
                                            +{meetings.filter((m: any) => m.type !== 'call').length - 5} more meetings
                                        </p>
                                    )}
                                    {meetings.filter((m: any) => m.type !== 'call').length === 0 && (
                                        <p className="py-4 text-center text-sm text-gray-500">No meetings found</p>
                                    )}
                                </div>
                            </div>

                            {/* Calls Section */}
                            <div>
                                <div className="mb-4 flex items-center">
                                    <svg className="mr-2 h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                    </svg>
                                    <h4 className="text-muted-foreground text-sm font-medium">
                                        {translate('Calls')} ({meetings.filter((m: any) => m.type === 'call').length})
                                    </h4>
                                </div>
                                <div className="space-y-3">
                                    {meetings
                                        .filter((m: any) => m.type === 'call')
                                        .slice(0, 5)
                                        .map((call: any) => (
                                            <div
                                                key={call.id}
                                                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm"
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="mt-1 flex-shrink-0">
                                                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-medium text-gray-900">{call.title}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {window.appSettings?.formatDateTime(call.start_date, false) ||
                                                                new Date(call.start_date).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{call.assigned_user?.name || 'Unassigned'}</p>
                                                    </div>
                                                </div>
                                                {useHasPermission('view-calls') && (
                                                    <a href={route('meetings.show', call.id)}>
                                                        <Button variant="outline" size="sm">
                                                            {translate('View')}
                                                        </Button>
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    {meetings.filter((m: any) => m.type === 'call').length > 5 && (
                                        <p className="text-center text-sm text-gray-500">
                                            +{meetings.filter((m: any) => m.type === 'call').length - 5} more calls
                                        </p>
                                    )}
                                    {meetings.filter((m: any) => m.type === 'call').length === 0 && (
                                        <p className="py-4 text-center text-sm text-gray-500">No calls found</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Additional Information */}
                {project.description && (
                    <Card>
                        <div className="border-b px-6 py-4">
                            <h3 className="text-lg font-semibold">{translate('Description')}</h3>
                        </div>
                        <div className="prose dark:prose-invert max-w-none p-6">
                            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{project.description}</p>
                        </div>
                    </Card>
                )}
            </div>
        </PageTemplate>
    );
}
