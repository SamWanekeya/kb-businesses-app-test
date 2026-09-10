import CrudDeleteModal from '@components/CrudDeleteModal';
import { CrudFormModal } from '@components/CrudFormModal';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Button } from '@components/UserInterface/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/UserInterface/DropdownMenu';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import useInitials from '@hooks/useInitials';
import { router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { Calendar, Edit, Eye, FileDown, LayoutGrid, MoreHorizontal, Plus, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

function ParentTaskSelect({ tasksRef, value, onChange }: { tasksRef: React.MutableRefObject<any[]>; value: string; onChange: (v: string) => void }) {
    const { t: translate } = useTranslation();
    const [tasks, setTasks] = useState<any[]>(() => [...tasksRef.current]);

    useEffect(() => {
        tasksRef.current.__notify = () => setTasks([...tasksRef.current]);
        // Sync on mount in case data was loaded before this mounted
        setTasks([...tasksRef.current]);
        return () => {
            delete tasksRef.current.__notify;
        };
    }, [tasksRef]);
    return (
        <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder={translate('Select Parent Task')} />
            </SelectTrigger>
            <SelectContent className="z-[60000]">
                {tasks.map((task: any) => (
                    <SelectItem key={task.id} value={String(task.id)}>
                        {task.title}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default function ProjectTasks() {
    const { t: translate } = useTranslation();
    const {
        auth,
        kanbanData: initialKanbanData,
        statuses = [],
        projects = [],
        allProjects = [],
        users = [],
        allUsers = [],
        parentTasks = [],
        taskStatuses = [],
        allTaskStatuses = [],
        filters: pageFilters = {},
    } = usePage().props;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedPriority, setSelectedPriority] = useState(pageFilters.priority || 'all');
    const [selectedProject, setSelectedProject] = useState(pageFilters.project_id || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
    const [prefilledStatus, setPrefilledStatus] = useState<string>('');
    const [kanbanData, setKanbanData] = useState<any>(null);
    const dynamicParentTasksRef = useRef<any[]>([]);

    const setParentTasks = useCallback((tasks: any[]) => {
        dynamicParentTasksRef.current.splice(0, dynamicParentTasksRef.current.length, ...tasks);
        dynamicParentTasksRef.current.__notify?.();
    }, []);

    const pageInitialState = useState(true);
    useEffect(() => {
        if (pageInitialState[0]) {
            pageInitialState[1](false);
            return;
        }
        applyFilters();
    }, [searchTerm, selectedStatus, selectedPriority, selectedProject, selectedAssignee]);

    const hasActiveFilters = () =>
        searchTerm !== '' || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedProject !== 'all' || selectedAssignee !== 'all';
    const activeFilterCount = () =>
        (selectedStatus !== 'all' ? 1 : 0) +
        (selectedPriority !== 'all' ? 1 : 0) +
        (selectedProject !== 'all' ? 1 : 0) +
        (selectedAssignee !== 'all' ? 1 : 0);

    const loadKanbanData = () => {
        const allTasks = Object.values(initialKanbanData || {}).flatMap((col: any) => col.tasks || []);
        const structured: any = {};

        statuses.forEach((status: any) => {
            structured[status.id] = {
                status,
                items: allTasks.filter((task: any) => {
                    const matchesStatus = task.task_status_id === status.id;
                    const matchesSearch =
                        !searchTerm ||
                        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
                    const matchesProject = selectedProject === 'all' || task.project?.id?.toString() === selectedProject;
                    const matchesAssignee = selectedAssignee === 'all' || task.assigned_user?.id?.toString() === selectedAssignee;
                    return matchesStatus && matchesSearch && matchesPriority && matchesProject && matchesAssignee;
                }),
            };
        });

        setKanbanData(structured);
    };

    useEffect(() => {
        loadKanbanData();
    }, [initialKanbanData, searchTerm, selectedPriority, selectedProject, selectedAssignee, statuses]);

    const applyFilters = () => {
        router.get(
            route('project-tasks.index'),
            {
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                priority: selectedPriority !== 'all' ? selectedPriority : undefined,
                project_id: selectedProject !== 'all' ? selectedProject : undefined,
                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleResetFilters = () => {
        router.get(route('project-tasks.index'));
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);
        switch (action) {
            case 'view':
                router.get(route('project-tasks.show', item.id));
                break;
            case 'edit':
                setFormMode('edit');
                if (item.project?.id) {
                    fetch(route('api.projects.details', item.project.id) + '?exclude_id=' + item.id)
                        .then((res) => res.json())
                        .then((data) => setParentTasks(data.parent_tasks || []))
                        .catch(() => setParentTasks([]))
                        .finally(() => setIsFormModalOpen(true));
                } else {
                    setParentTasks([]);
                    setIsFormModalOpen(true);
                }
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
        }
    };

    const handleAddTask = (statusId: string) => {
        setCurrentItem(null);
        setFormMode('create');
        setPrefilledStatus(statusId);
        setParentTasks([]);
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (formMode === 'create') {
            const toastId = toast.loading(translate('Creating task...'));
            router.post(
                route('project-tasks.store'),
                {
                    ...formData,
                    task_status_id: prefilledStatus ? parseInt(prefilledStatus) : formData.task_status_id,
                },
                {
                    onSuccess: (page) => {
                        setIsFormModalOpen(false);
                        toast.dismiss(toastId);
                        if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                        else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                    },
                    onError: (errors) => {
                        toast.dismiss(toastId);
                        toast.error(
                            typeof errors === 'string'
                                ? errors
                                : translate('Failed to create: {{errors}}', { errors: Object.values(errors).join(', ') }),
                        );
                    },
                },
            );
        } else if (formMode === 'edit') {
            const toastId = toast.loading(translate('Updating task...'));
            router.put(route('project-tasks.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss(toastId);
                    if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    toast.error(
                        typeof errors === 'string' ? errors : translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }),
                    );
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        const toastId = toast.loading(translate('Deleting task...'));
        router.delete(route('project-tasks.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss(toastId);
                if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                toast.error(
                    typeof errors === 'string' ? errors : translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }),
                );
            },
        });
    };

    const pageActions: any[] = [];

    if (useHasPermission('export-project-tasks')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="min-[390px]: mr-0 mr-2 h-4 w-4" />,
            variant: 'outline',
            onClick: () => (window.location.href = route('project-task.export')),
            className: 'h-8 w-8 min-[390px]:h-9 min-[390px]:w-auto px-0 min-[390px]:px-4',
            labelClassName: 'hidden min-[390px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[390px]:hidden',
        });
    }

    if (useHasPermission('create-project-tasks')) {
        pageActions.push({
            label: translate('Add Task'),
            icon: <Plus className="mr-0 h-4 w-4 min-[390px]:mr-2" />,
            variant: 'default',
            className: 'h-8 w-8 min-[390px]:h-9 min-[390px]:w-auto px-0 min-[390px]:px-4',
            labelClassName: 'hidden min-[390px]:inline',
            tooltip: translate('Add Task'),
            tooltipClassName: 'min-[390px]:hidden',
            onClick: () => handleAddTask(''),
        });
    }

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Project Management'), href: route('project-tasks.index') },
        { title: translate('Project Tasks') },
    ];

    const priorityColors: any = {
        urgent: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
        high: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
        medium: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
        low: 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20',
    };

    return (
        <PageTemplate
            title={translate('Project Tasks')}
            description={translate('Manage your project tasks.')}
            url="/project-tasks"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
            className={`overflow-hidden`}
        >
            <style>{`
              .kanban-col-scroll::-webkit-scrollbar { width: 4px; }
              .kanban-col-scroll::-webkit-scrollbar-track { background: transparent; }
              .kanban-col-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
              .kanban-board-scroll::-webkit-scrollbar { height: 6px; }
              .kanban-board-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
              .kanban-board-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            `}</style>

            <div className="mb-4 rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: [
                                { value: 'all', label: translate('All Status') },
                                ...allTaskStatuses.map((s: any) => ({ value: s.id.toString(), label: s.name })),
                            ],
                        },
                        {
                            name: 'priority',
                            label: translate('Priority'),
                            type: 'select',
                            value: selectedPriority,
                            onChange: setSelectedPriority,
                            options: [
                                { value: 'all', label: translate('All Priorities') },
                                { value: 'low', label: translate('Low') },
                                { value: 'medium', label: translate('Medium') },
                                { value: 'high', label: translate('High') },
                                { value: 'urgent', label: translate('Urgent') },
                            ],
                        },
                        {
                            name: 'project_id',
                            label: translate('Project'),
                            type: 'select',
                            searchable: true,
                            value: selectedProject,
                            onChange: setSelectedProject,
                            options: [
                                { value: 'all', label: translate('All Projects') },
                                ...allProjects.map((p: any) => ({ value: p.id.toString(), label: p.name })),
                            ],
                        },
                        {
                            name: 'assigned_to',
                            label: translate('Assigned To'),
                            type: 'select',
                            searchable: true,
                            value: selectedAssignee,
                            onChange: setSelectedAssignee,
                            options: [
                                { value: 'all', label: translate('All Users') },
                                ...allUsers.map((u: any) => ({ value: u.id.toString(), label: u.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    hideViewToggle={true}
                />
            </div>

            <div className="kanban-board-scroll flex gap-4 overflow-x-auto pb-2" style={{ height: 'calc(100vh - 240px)' }}>
                {!(statuses || []).length ? (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex max-w-sm flex-col items-center gap-5 text-center">
                            <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-2xl">
                                <LayoutGrid className="text-primary h-10 w-10" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{translate('No Task Status Yet')}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {translate('Set up task statuses to start organizing your work in a Kanban board.')}
                                </p>
                            </div>
                            {useHasPermission('manage-task-statuses') && (
                                <button
                                    onClick={() => router.visit(route('task-statuses.index'))}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    {translate('Add Task Status')}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    statuses.map((status: any) => {
                        const statusTasks = kanbanData?.[status.id]?.items || [];
                        const colBg = status.color ? `${status.color}12` : '#f8fafc';
                        const colBorder = status.color ? `${status.color}30` : '#e2e8f0';
                        return (
                            <div
                                key={status.id}
                                className="flex flex-shrink-0 flex-col rounded-xl border"
                                style={{ width: '300px', minWidth: '300px', backgroundColor: colBg, borderColor: colBorder, height: '100%' }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const taskId = e.dataTransfer.getData('taskId');
                                    if (!taskId) return;
                                    if (!useHasPermission('move-project-task')) {
                                        toast.error(translate('Permission denied.'));
                                        return;
                                    }
                                    const toastId = toast.loading(translate('Updating task status...'));
                                    router.put(
                                        route('project-tasks.update-status', taskId),
                                        { task_status_id: status.id },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                            onSuccess: (page) => {
                                                toast.dismiss(toastId);
                                                if (page.props.flash?.success) toast.success(translate(page.props.flash.success));
                                                else if (page.props.flash?.error) toast.error(translate(page.props.flash.error));
                                                router.reload();
                                            },
                                            onError: () => {
                                                toast.dismiss(toastId);
                                                toast.error(translate('Failed to update task status'));
                                            },
                                        },
                                    );
                                }}
                            >
                                {/* Column header */}
                                <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: colBorder }}>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: status.color }}></span>
                                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{status.name}</span>
                                        <span
                                            className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                            style={{ backgroundColor: status.color + '22', color: status.color }}
                                        >
                                            {statusTasks.length}
                                        </span>
                                    </div>
                                    {useHasPermission('create-project-tasks') && (
                                        <button
                                            onClick={() => handleAddTask(status.id.toString())}
                                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-800"
                                            title={translate('Add Task')}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Cards */}
                                <div className="kanban-col-scroll flex-1 space-y-3 overflow-y-auto p-3">
                                    {statusTasks.length === 0 ? (
                                        <div className="flex h-40 flex-col items-center justify-center text-gray-300">
                                            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-gray-200">
                                                <User className="h-6 w-6 text-gray-300" />
                                            </div>
                                            <p className="text-xs text-gray-400">{translate('Drop tasks here')}</p>
                                        </div>
                                    ) : (
                                        statusTasks.map((task: any) => (
                                            <div
                                                key={task.id}
                                                draggable={useHasPermission('move-project-task')}
                                                onDragStart={(e) => {
                                                    if (!useHasPermission('move-project-task')) {
                                                        e.preventDefault();
                                                        return;
                                                    }
                                                    e.dataTransfer.setData('taskId', task.id.toString());
                                                    e.currentTarget.classList.add('opacity-50');
                                                }}
                                                onDragEnd={(e) => e.currentTarget.classList.remove('opacity-50')}
                                                className={useHasPermission('move-project-task') ? 'cursor-grab active:cursor-grabbing' : ''}
                                            >
                                                <div className="rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                                    <div className="p-3">
                                                        {/* Top row: title + menu */}
                                                        <div className="mb-2.5 flex items-start gap-2.5">
                                                            <div className="min-w-0 flex-1">
                                                                <h4
                                                                    className="hover:text-primary cursor-pointer truncate text-sm leading-tight font-semibold text-gray-900 transition-colors dark:text-gray-100"
                                                                    onClick={() => handleAction('view', task)}
                                                                >
                                                                    {task.title}
                                                                </h4>
                                                                {task.project?.name && (
                                                                    <p className="mt-0.5 truncate text-xs text-gray-500">{task.project.name}</p>
                                                                )}
                                                            </div>
                                                            {(useHasPermission('view-project-tasks') ||
                                                                useHasPermission('edit-project-tasks') ||
                                                                useHasPermission('delete-project-tasks')) && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 flex-shrink-0 p-0 text-gray-400 hover:text-gray-600"
                                                                        >
                                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-32">
                                                                        {useHasPermission('view-project-tasks') && (
                                                                            <DropdownMenuItem onClick={() => handleAction('view', task)}>
                                                                                <Eye className="mr-2 h-4 w-4" />
                                                                                {translate('View')}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {useHasPermission('edit-project-tasks') && (
                                                                            <DropdownMenuItem onClick={() => handleAction('edit', task)}>
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                {translate('Edit')}
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        {useHasPermission('delete-project-tasks') && (
                                                                            <>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem
                                                                                    onClick={() => handleAction('delete', task)}
                                                                                    className="text-red-600"
                                                                                >
                                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                                    {translate('Delete')}
                                                                                </DropdownMenuItem>
                                                                            </>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}
                                                        </div>

                                                        {/* Priority badge */}
                                                        <div className="mb-2.5 flex flex-wrap gap-1">
                                                            <span
                                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${priorityColors[task.priority] || priorityColors.medium}`}
                                                            >
                                                                {translate(task.priority.charAt(0).toUpperCase() + task.priority.slice(1))}
                                                            </span>
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div className="mb-2.5">
                                                            <div className="mb-1 flex justify-between text-xs">
                                                                <span className="text-gray-500">{translate('Progress')}</span>
                                                                <span className="font-medium text-gray-700">{task.progress}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full rounded-full bg-gray-200">
                                                                <div
                                                                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: `${task.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Footer: due date + assigned avatar */}
                                                        <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>
                                                                    {translate('Due')}:{' '}
                                                                    {task.due_date
                                                                        ? window.appSettings?.formatDateTime(task.due_date, false) ||
                                                                          new Date(task.due_date).toLocaleDateString()
                                                                        : translate('No due date')}
                                                                </span>
                                                            </div>
                                                            {task.assigned_user ? (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Avatar className="h-7 w-7 cursor-pointer">
                                                                                <AvatarImage src={task.assigned_user.avatar} />
                                                                                <AvatarFallback
                                                                                    className="text-xs"
                                                                                    style={{
                                                                                        backgroundColor: status.color + '33',
                                                                                        color: status.color,
                                                                                    }}
                                                                                >
                                                                                    {getInitials(task.assigned_user.name)}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{task.assigned_user.name}</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            ) : (
                                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100">
                                                                    <User className="h-3 w-3 text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    ...(useHasPermission('export-project-tasks') && { exportRoute: 'project-task.export' }),
                    fields: [
                        {
                            name: 'title',
                            label: translate('Task Title'),
                            type: 'text',
                            required: true,
                            placeholder: translate('e.g. Design homepage mockup, Fix sign in bug'),
                        },
                        {
                            name: 'description',
                            label: translate('Description'),
                            type: 'textarea',
                            placeholder: translate('Enter task description...'),
                        },
                        {
                            name: formMode === 'view' ? 'project_name' : 'project_id',
                            label: translate('Project'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            readOnly: formMode === 'view',
                            emptyNote: { link: route('projects.index'), linkText: translate('Projects') },
                            options: formMode === 'view' ? [] : projects.map((p: any) => ({ value: String(p.id), label: p.name })),
                            onChange: (value: string) => {
                                setParentTasks([]);
                                if (formMode === 'create' && value) {
                                    fetch(route('api.projects.details', value))
                                        .then((res) => res.json())
                                        .then((data) => setParentTasks(data.parent_tasks || []))
                                        .catch(() => {});
                                }
                            },
                        },
                        {
                            name: 'parent_id',
                            label: translate('Parent Task'),
                            type: 'custom',
                            render: (_field: any, formData: any, handleChange: any, _errors: any, mode: any) => {
                                if (mode === 'view') {
                                    return <div className="rounded-md border bg-gray-50 p-2">{formData.parent_name || '-'}</div>;
                                }
                                return (
                                    <ParentTaskSelect
                                        tasksRef={dynamicParentTasksRef}
                                        value={formData.parent_id || ''}
                                        onChange={(value) => handleChange('parent_id', value)}
                                    />
                                );
                            },
                        },
                        { name: 'start_date', label: translate('Start Date'), type: 'date' },
                        { name: 'due_date', label: translate('Due Date'), type: 'date' },
                        {
                            name: 'priority',
                            label: translate('Priority'),
                            type: 'select',
                            options: [
                                { value: 'low', label: translate('Low') },
                                { value: 'medium', label: translate('Medium') },
                                { value: 'high', label: translate('High') },
                                { value: 'urgent', label: translate('Urgent') },
                            ],
                            defaultValue: 'medium',
                        },
                        {
                            name: 'task_status_id',
                            label: translate('Status'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('task-statuses.index'), linkText: translate('Task Statuses') },
                            options: taskStatuses.map((s: any) => ({ value: String(s.id), label: s.name })),
                            defaultValue: prefilledStatus
                                ? String(prefilledStatus)
                                : String(taskStatuses.find((s: any) => s.name === 'To Do')?.id || taskStatuses[0]?.id || ''),
                            hidden: formMode === 'create' && !!prefilledStatus,
                        },
                        {
                            name: 'estimated_hours',
                            label: translate('Estimated Hours'),
                            type: 'number',
                            step: '0.5',
                            placeholder: translate('e.g. 8'),
                        },
                        { name: 'actual_hours', label: translate('Actual Hours'), type: 'number', step: '0.5', placeholder: translate('e.g. 6.5') },
                        {
                            name: 'progress',
                            label: translate('Progress (%)'),
                            type: 'number',
                            min: '0',
                            max: '100',
                            placeholder: translate('e.g. 50'),
                        },
                        {
                            name: formMode === 'view' ? 'assigned_user_name' : 'assigned_to',
                            label: translate('Assign To'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('users.index'), linkText: translate('Users') },
                            options: formMode === 'view' ? [] : users.map((u: any) => ({ value: String(u.id), label: `${u.name} (${u.email})` })),
                            readOnly: formMode === 'view',
                        },
                    ],
                    modalSize: 'xl',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              project_id: currentItem.project?.id ? String(currentItem.project.id) : '',
                              assigned_to: currentItem.assigned_user?.id ? String(currentItem.assigned_user.id) : '',
                              task_status_id: currentItem.task_status_id ? String(currentItem.task_status_id) : '',
                              parent_id: currentItem.parent_id ? String(currentItem.parent_id) : '',
                              assigned_user_name: currentItem.assigned_user?.name || translate('Unassigned'),
                              project_name: currentItem.project?.name || translate('No Project'),
                              parent_name: currentItem.parent?.title || translate('No Parent Task'),
                          }
                        : null
                }
                title={formMode === 'create' ? translate('Add Task') : formMode === 'edit' ? translate('Edit Task') : translate('View Task')}
                mode={formMode}
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.title || ''}
                entityName={translate('task')}
            />
        </PageTemplate>
    );
}
