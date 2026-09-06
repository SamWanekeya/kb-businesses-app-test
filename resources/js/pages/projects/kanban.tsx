import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Edit, Eye, LayoutGrid, MoreHorizontal, Plus, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ProjectKanban() {
    const { t } = useTranslation();
    const { auth, project, kanbanData, statuses, users = [], filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const isOrganization = auth?.user?.type === 'organization';

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
    const [prefilledStatus, setPrefilledStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedPriority, setSelectedPriority] = useState(pageFilters.priority || 'all');
    const [showFilters, setShowFilters] = useState(!!(pageFilters.status || pageFilters.priority || pageFilters.search));
    const getInitials = useInitials();

    const pageInitialState = useState(true);
    useEffect(() => {
        if (pageInitialState[0]) {
            pageInitialState[1](false);
            return;
        }
        applyFilters();
    }, [searchTerm, selectedStatus, selectedPriority]);

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view':
                router.get(route('project-tasks.show', item.id));
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
        }
    };

    const handleAddTask = (status: string) => {
        setCurrentItem(null);
        setFormMode('create');
        setPrefilledStatus(status);
        setIsFormModalOpen(true);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('projects.kanban', project.id),
            {
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                priority: selectedPriority !== 'all' ? selectedPriority : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedPriority('all');
        setShowFilters(false);
        router.get(route('projects.kanban', project.id), {}, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedStatus !== 'all' || selectedPriority !== 'all';
    };

    const activeFilterCount = () => {
        return (searchTerm ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (selectedPriority !== 'all' ? 1 : 0);
    };

    const handleFormSubmit = (formData: any) => {
        if (formMode === 'create') {
            toast.loading(t('Creating task...'));

            const taskData = {
                ...formData,
                project_id: project.id,
                task_status_id: prefilledStatus ? parseInt(prefilledStatus) : formData.task_status_id ? parseInt(formData.task_status_id) : null,
            };

            router.post(route('project-tasks.store'), taskData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    }
                    router.reload();
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to create task: ${Object.values(errors).join(', ')}`);
                    }
                },
            });
        } else if (formMode === 'edit') {
            if (!useHasPermission('edit-project-tasks')) {
                toast.error(t('Permission denied.'));
                return;
            }

            toast.loading(t('Updating task...'));

            // Ensure task_status_id is properly formatted
            const updateData = {
                ...formData,
                task_status_id: formData.task_status_id ? parseInt(formData.task_status_id) : null,
            };

            router.put(route('project-tasks.update', currentItem.id), updateData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    }
                    router.reload();
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to update task: ${Object.values(errors).join(', ')}`);
                    }
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting task...'));

        router.delete(route('project-tasks.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                }
                router.reload();
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(`Failed to delete task: ${Object.values(errors).join(', ')}`);
                }
            },
        });
    };

    const pageActions = [
        {
            label: t('Back'),
            icon: <ArrowLeft className="mr-2 h-4 w-4" />,
            variant: 'outline',
            onClick: () => router.get(route('projects.show', project.id)),
        },
    ];

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Project Management') },
        { title: t('Projects'), href: route('projects.index') },
        { title: project.name, href: route('projects.show', project.id) },
        { title: t('Kanban View') },
    ];

    return (
        <PageTemplate
            title={`${project.name} - ${t('Kanban View')}`}
            description={t('Manage project tasks using a kanban board')}
            url={`/projects/${project.id}/kanban`}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
            className="overflow-hidden"
        >
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'status',
                            label: t('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            searchable: true,
                            options: [
                                { value: 'all', label: t('All Status') },
                                ...statuses.map((status: any) => ({ value: status.id, label: status.name })),
                            ],
                        },
                        {
                            name: 'priority',
                            label: t('Priority'),
                            type: 'select',
                            value: selectedPriority,
                            onChange: setSelectedPriority,
                            options: [
                                { value: 'all', label: t('All Priority') },
                                { value: 'low', label: t('Low') },
                                { value: 'medium', label: t('Medium') },
                                { value: 'high', label: t('High') },
                                { value: 'urgent', label: t('Urgent') },
                            ],
                        },
                    ]}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={applyFilters}
                    hidePerPage={true}
                    hideViewToggle={true}
                />
            </div>

            <style>{`
                .kanban-col-scroll::-webkit-scrollbar { width: 4px; }
                .kanban-col-scroll::-webkit-scrollbar-track { background: transparent; }
                .kanban-col-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .kanban-board-scroll::-webkit-scrollbar { height: 6px; }
                .kanban-board-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                .kanban-board-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
            `}</style>

            <div className="kanban-board-scroll flex gap-4 overflow-x-auto pb-2" style={{ height: 'calc(100vh - 240px)' }}>
                {!(statuses || []).length ? (
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex max-w-sm flex-col items-center gap-5 text-center">
                            <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-2xl">
                                <LayoutGrid className="text-primary h-10 w-10" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('No Task Status Yet')}</h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {t('Set up task statuses to start organizing your work in a Kanban board.')}
                                </p>
                            </div>
                            {useHasPermission('manage-task-statuses') && (
                                <button
                                    onClick={() => router.visit(route('task-statuses.index'))}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    {t('Add Task Status')}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    statuses.map((status: any) => {
                        const statusTasks = Object.values(kanbanData).find((column: any) => column.status?.id === status.id)?.tasks || [];
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
                                    if (!useHasPermission('edit-project-tasks')) {
                                        toast.error(t('Permission denied.'));
                                        return;
                                    }
                                    const currentTask = Object.values(kanbanData)
                                        .flatMap((column: any) => column.tasks)
                                        .find((task: any) => task.id.toString() === taskId);
                                    if (currentTask) {
                                        toast.loading(t('Updating task status...'));
                                        router.put(
                                            route('project-tasks.update-status', taskId),
                                            { task_status_id: status.id },
                                            {
                                                preserveState: true,
                                                preserveScroll: true,
                                                onSuccess: (page) => {
                                                    toast.dismiss();
                                                    if (page.props.flash?.success) toast.success(t(page.props.flash.success));
                                                    router.reload();
                                                },
                                                onError: () => {
                                                    toast.dismiss();
                                                    toast.error(t('Failed to update task status'));
                                                },
                                            },
                                        );
                                    }
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
                                            onClick={() => handleAddTask(status.id)}
                                            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-800"
                                            title={t('Add Task')}
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
                                            <p className="text-xs text-gray-400">{t('Drop tasks here')}</p>
                                        </div>
                                    ) : (
                                        statusTasks.map((task: any) => (
                                            <div
                                                key={task.id}
                                                draggable={useHasPermission('edit-project-tasks')}
                                                onDragStart={(e) => {
                                                    if (!useHasPermission('edit-project-tasks')) {
                                                        e.preventDefault();
                                                        return;
                                                    }
                                                    e.dataTransfer.setData('taskId', task.id.toString());
                                                    e.currentTarget.classList.add('opacity-50');
                                                }}
                                                onDragEnd={(e) => e.currentTarget.classList.remove('opacity-50')}
                                                className={
                                                    useHasPermission('edit-project-tasks') ? 'cursor-grab active:cursor-grabbing' : ''
                                                }
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
                                                            </div>
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
                                                                    <DropdownMenuItem onClick={() => handleAction('view', task)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        {t('View')}
                                                                    </DropdownMenuItem>
                                                                    {useHasPermission('edit-project-tasks') && (
                                                                        <DropdownMenuItem onClick={() => handleAction('edit', task)}>
                                                                            <Edit className="mr-2 h-4 w-4" />
                                                                            {t('Edit')}
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
                                                                                {t('Delete')}
                                                                            </DropdownMenuItem>
                                                                        </>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        {/* Description */}
                                                        {task.description && (
                                                            <p className="mb-2.5 line-clamp-2 text-xs text-gray-500">{task.description}</p>
                                                        )}

                                                        {/* Progress bar */}
                                                        <div className="mb-2.5">
                                                            <div className="mb-1 flex justify-between text-xs">
                                                                <span className="text-gray-500">{t('Progress')}</span>
                                                                <span className="font-medium text-gray-700">{task.progress}%</span>
                                                            </div>
                                                            <div className="h-1.5 w-full rounded-full bg-gray-200">
                                                                <div
                                                                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                                                    style={{ width: `${task.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Priority badge */}
                                                        <div className="mb-2.5 flex flex-wrap gap-1">
                                                            <span
                                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                                                    task.priority === 'urgent'
                                                                        ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                                                                        : task.priority === 'high'
                                                                          ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-600/20 ring-inset'
                                                                          : task.priority === 'medium'
                                                                            ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 ring-inset'
                                                                            : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20 ring-inset'
                                                                }`}
                                                            >
                                                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                                            </span>
                                                        </div>

                                                        {/* Footer: due date + assigned avatar */}
                                                        <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                <Calendar className="h-3 w-3" />
                                                                <span>
                                                                    {task.due_date
                                                                        ? `${t('Due')}: ${window.appSettings?.formatDateTime(task.due_date, false) || new Date(task.due_date).toLocaleDateString()}`
                                                                        : t('No due date')}
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
                    fields: [
                        { name: 'title', label: t('Task Title'), type: 'text', required: true },
                        { name: 'description', label: t('Description'), type: 'textarea' },
                        { name: 'start_date', label: t('Start Date'), type: 'date' },
                        { name: 'due_date', label: t('Due Date'), type: 'date' },
                        {
                            name: 'priority',
                            label: t('Priority'),
                            type: 'select',
                            options: [
                                { value: 'low', label: t('Low') },
                                { value: 'medium', label: t('Medium') },
                                { value: 'high', label: t('High') },
                                { value: 'urgent', label: t('Urgent') },
                            ],
                            defaultValue: 'medium',
                        },
                        {
                            name: 'task_status_id',
                            label: t('Status'),
                            type: 'select',
                            searchable: true,
                            options: statuses.map((status: any) => ({ value: status.id.toString(), label: status.name })),
                            defaultValue:
                                formMode === 'create' ? (prefilledStatus ? prefilledStatus.toString() : statuses[0]?.id?.toString()) : undefined,
                            hidden: formMode === 'create' && !!prefilledStatus,
                        },
                        { name: 'estimated_hours', label: t('Estimated Hours'), type: 'number', step: '0.5' },
                        { name: 'progress', label: t('Progress (%)'), type: 'number', min: '0', max: '100', defaultValue: '0' },
                        ...(isOrganization
                            ? [
                                  {
                                      name: 'assigned_to',
                                      label: t('Assign To'),
                                      type: 'select',
                                      searchable: true,
                                      options: [
                                          { value: null, label: t('Unassigned') },
                                          ...users.map((user: any) => ({ value: user.id, label: `${user.name} (${user.email})` })),
                                      ],
                                  },
                              ]
                            : []),
                    ],
                    modalSize: 'lg',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              assigned_to: currentItem.assigned_user?.id || null,
                              task_status_id: currentItem.task_status_id,
                          }
                        : null
                }
                title={formMode === 'create' ? t('Add Task') : formMode === 'edit' ? t('Edit Task') : t('View Task')}
                mode={formMode}
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.title || ''}
                entityName="task"
            />
        </PageTemplate>
    );
}
