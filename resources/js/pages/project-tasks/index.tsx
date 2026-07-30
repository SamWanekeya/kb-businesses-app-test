import { useState, useEffect, useRef, useCallback } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, MoreHorizontal, FileDown, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { hasPermission } from '@/utils/authorization';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

function ParentTaskSelect({ tasksRef, value, onChange }: { tasksRef: React.MutableRefObject<any[]>, value: string, onChange: (v: string) => void }) {
    const { t } = useTranslation();
    const [tasks, setTasks] = useState<any[]>(() => [...tasksRef.current]);

    useEffect(() => {
        tasksRef.current.__notify = () => setTasks([...tasksRef.current]);
        // Sync on mount in case data was loaded before this mounted
        setTasks([...tasksRef.current]);
        return () => { delete tasksRef.current.__notify; };
    }, [tasksRef]);
    return (
        <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder={t('Select Parent Task')} />
            </SelectTrigger>
            <SelectContent className="z-[60000]">
                {tasks.map((task: any) => (
                    <SelectItem key={task.id} value={String(task.id)}>{task.title}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default function ProjectTasks() {
    const { t } = useTranslation();
    const { auth, kanbanData: initialKanbanData, statuses = [], projects = [], allProjects = [], users = [], allUsers = [], parentTasks = [], taskStatuses = [], allTaskStatuses = [], filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedPriority, setSelectedPriority] = useState(pageFilters.priority || 'all');
    const [selectedProject, setSelectedProject] = useState(pageFilters.project_id || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [showFilters, setShowFilters] = useState(false);
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

    const hasActiveFilters = () => searchTerm !== '' || selectedStatus !== 'all' || selectedPriority !== 'all' || selectedProject !== 'all' || selectedAssignee !== 'all';
    const activeFilterCount = () => (selectedStatus !== 'all' ? 1 : 0) + (selectedPriority !== 'all' ? 1 : 0) + (selectedProject !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0);

    const loadKanbanData = () => {
        const allTasks = Object.values(initialKanbanData || {}).flatMap((col: any) => col.tasks || []);
        const structured: any = {};

        statuses.forEach((status: any) => {
            structured[status.id] = {
                status,
                items: allTasks.filter((task: any) => {
                    const matchesStatus = task.task_status_id === status.id;
                    const matchesSearch = !searchTerm ||
                        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        task.description?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
                    const matchesProject = selectedProject === 'all' || task.project?.id?.toString() === selectedProject;
                    const matchesAssignee = selectedAssignee === 'all' || task.assigned_user?.id?.toString() === selectedAssignee;
                    return matchesStatus && matchesSearch && matchesPriority && matchesProject && matchesAssignee;
                })
            };
        });

        setKanbanData(structured);
    };

    useEffect(() => {
        loadKanbanData();
    }, [initialKanbanData, searchTerm, selectedPriority, selectedProject, selectedAssignee, statuses]);

    const applyFilters = () => {
        router.get(route('project-tasks.index'), {
            search: searchTerm || undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            priority: selectedPriority !== 'all' ? selectedPriority : undefined,
            project_id: selectedProject !== 'all' ? selectedProject : undefined,
            assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedPriority('all');
        setSelectedProject('all');
        setSelectedAssignee('all');
        setShowFilters(false);
        router.get(route('project-tasks.index'), {}, { preserveState: true, preserveScroll: true });
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
                        .then(res => res.json())
                        .then(data => setParentTasks(data.parent_tasks || []))
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
            toast.loading(t('Creating task...'));
            router.post(route('project-tasks.store'), {
                ...formData,
                task_status_id: prefilledStatus ? parseInt(prefilledStatus) : formData.task_status_id,
            }, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) toast.success(t(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(t(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(typeof errors === 'string' ? errors : t('Failed to create: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            });
        } else if (formMode === 'edit') {
            toast.loading(t('Updating task...'));
            router.put(route('project-tasks.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) toast.success(t(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(t(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(typeof errors === 'string' ? errors : t('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting task...'));
        router.delete(route('project-tasks.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) toast.success(t(page.props.flash.success));
                else if (page.props.flash.error) toast.error(t(page.props.flash.error));
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(typeof errors === 'string' ? errors : t('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
            }
        });
    };

    const pageActions: any[] = [];

    if (hasPermission(permissions, 'export-project-tasks')) {
        pageActions.push({
            label: t('Export'),
            icon: <FileDown className="h-4 w-4 mr-2" />,
            variant: 'outline',
            onClick: () => window.location.href = route('project-task.export')
        });
    }

    if (hasPermission(permissions, 'create-project-tasks')) {
        pageActions.push({
            label: t('Add Task'),
            icon: <Plus className="h-4 w-4 mr-2" />,
            variant: 'default',
            onClick: () => handleAddTask('')
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Project Management'), href: route('project-tasks.index') },
        { title: t('Project Tasks') }
    ];

    const priorityColors: any = {
        urgent: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
        high: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20',
        medium: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
        low: 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20',
    };

    return (
        <PageTemplate
            title={t('Project Tasks')}
            url="/project-tasks"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
            className={`overflow-hidden`}
        >
            <style>{`
              .kanban-scroll {
                overflow-x: auto;
                overflow-y: hidden;
              }
              .kanban-scroll::-webkit-scrollbar {
                height: 8px;
              }
              .kanban-scroll::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }
              .kanban-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              .kanban-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
              main {
                max-width: 100vw;
                overflow-x: hidden;
              }
              body {
                overflow-x: hidden !important;
              }
            `}</style>

            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow mb-4 p-4">
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
                            options: [
                                { value: 'all', label: t('All Status') },
                                ...allTaskStatuses.map((s: any) => ({ value: s.id.toString(), label: s.name }))
                            ]
                        },
                        {
                            name: 'priority',
                            label: t('Priority'),
                            type: 'select',
                            value: selectedPriority,
                            onChange: setSelectedPriority,
                            options: [
                                { value: 'all', label: t('All Priorities') },
                                { value: 'low', label: t('Low') },
                                { value: 'medium', label: t('Medium') },
                                { value: 'high', label: t('High') },
                                { value: 'urgent', label: t('Urgent') }
                            ]
                        },
                        {
                            name: 'project_id',
                            label: t('Project'),
                            type: 'select',
                            searchable: true,
                            value: selectedProject,
                            onChange: setSelectedProject,
                            options: [
                                { value: 'all', label: t('All Projects') },
                                ...allProjects.map((p: any) => ({ value: p.id.toString(), label: p.name }))
                            ]
                        },
                        {
                            name: 'assigned_to',
                            label: t('Assigned To'),
                            type: 'select',
                            searchable: true,
                            value: selectedAssignee,
                            onChange: setSelectedAssignee,
                            options: [
                                { value: 'all', label: t('All Users') },
                                ...allUsers.map((u: any) => ({ value: u.id.toString(), label: u.name }))
                            ]
                        }
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

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
                    <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: 'calc(100vh - 280px)', width: '100%' }}>
                        {statuses.map((status: any) => {
                            const statusTasks = kanbanData?.[status.id]?.items || [];
                            return (
                                <div
                                    key={status.id}
                                    className="flex-shrink-0"
                                    style={{ minWidth: 'calc(20% - 16px)', width: 'calc(20% - 16px)' }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove('bg-blue-50');
                                        const taskId = e.dataTransfer.getData('taskId');
                                        if (taskId) {
                                            if (!hasPermission(permissions, 'move-project-task')) {
                                                toast.error(t('Permission denied.'));
                                                return;
                                            }
                                            toast.loading(t('Updating task status...'));
                                            router.put(route('project-tasks.update-status', taskId), {
                                                task_status_id: status.id
                                            }, {
                                                preserveState: true,
                                                preserveScroll: true,
                                                onSuccess: (page) => {
                                                    toast.dismiss();
                                                    if (page.props.flash?.success) toast.success(t(page.props.flash.success));
                                                    else if (page.props.flash?.error) toast.error(t(page.props.flash.error));
                                                    router.reload();
                                                },
                                                onError: () => {
                                                    toast.dismiss();
                                                    toast.error(t('Failed to update task status'));
                                                }
                                            });
                                        }
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.add('bg-blue-50');
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.classList.remove('bg-blue-50');
                                    }}
                                >
                                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-full flex flex-col">
                                        <div className="p-3 border-b border-gray-200">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                                                    <h3 className="font-semibold text-sm text-gray-700">{status.name}</h3>
                                                </div>
                                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                                    {statusTasks.length}
                                                </span>
                                            </div>
                                            {hasPermission(permissions, 'create-project-tasks') && (
                                                <button
                                                    onClick={() => handleAddTask(status.id.toString())}
                                                    className="w-full text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 py-2 px-3 rounded-md border border-dashed border-gray-300 hover:border-blue-300 transition-all duration-200 flex items-center justify-center gap-1 cursor-pointer"
                                                >
                                                    <Plus className="h-3 w-3" />
                                                    {t('Add Task')}
                                                </button>
                                            )}
                                        </div>

                                        <div className="p-2 space-y-2 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                                            {statusTasks.map((task: any) => (
                                                <div
                                                    key={task.id}
                                                    draggable={hasPermission(permissions, 'move-project-task')}
                                                    onDragStart={(e) => {
                                                        if (!hasPermission(permissions, 'move-project-task')) {
                                                            e.preventDefault();
                                                            return;
                                                        }
                                                        e.dataTransfer.setData('taskId', task.id.toString());
                                                        e.currentTarget.classList.add('opacity-50', 'scale-95');
                                                    }}
                                                    onDragEnd={(e) => {
                                                        e.currentTarget.classList.remove('opacity-50', 'scale-95');
                                                    }}
                                                    className={`transition-all duration-200 ${hasPermission(permissions, 'move-project-task') ? 'cursor-move' : 'cursor-default'}`}
                                                >
                                                    <Card className="hover:shadow-md transition-all duration-200 border-l-4 hover:scale-105" style={{ borderLeftColor: status.color }}>
                                                        <div className="p-3">
                                                            <div className="space-y-2">
                                                                <div className="flex items-start justify-between">
                                                                    <h4
                                                                        className="font-medium text-sm line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer flex-1"
                                                                        onClick={() => handleAction('view', task)}
                                                                    >
                                                                        {task.title}
                                                                    </h4>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                                                                                <MoreHorizontal className="h-4 w-4" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end" className="w-28">
                                                                            {hasPermission(permissions, 'view-project-tasks') && (
                                                                                <DropdownMenuItem onClick={() => handleAction('view', task)}>
                                                                                    <Eye className="h-4 w-4 mr-2" />
                                                                                    {t('View')}
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {hasPermission(permissions, 'edit-project-tasks') && (
                                                                                <DropdownMenuItem onClick={() => handleAction('edit', task)}>
                                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                                    {t('Edit')}
                                                                                </DropdownMenuItem>
                                                                            )}
                                                                            {hasPermission(permissions, 'delete-project-tasks') && (
                                                                                <>
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem onClick={() => handleAction('delete', task)} className="text-red-600">
                                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                                        {t('Delete')}
                                                                                    </DropdownMenuItem>
                                                                                </>
                                                                            )}
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>

                                                                {task.project?.name && (
                                                                    <div className="text-xs text-gray-500 truncate">
                                                                        {task.project.name}
                                                                    </div>
                                                                )}

                                                                <div className="mb-2">
                                                                    <div className="flex justify-between text-xs mb-1">
                                                                        <span className="text-gray-600">{t('Progress')}</span>
                                                                        <span className="font-medium">{task.progress}%</span>
                                                                    </div>
                                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                        <div
                                                                            className="h-1.5 rounded-full transition-all duration-300 bg-primary"
                                                                            style={{ width: `${task.progress}%` }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${priorityColors[task.priority] || priorityColors.medium}`}>
                                                                        {t(task.priority.charAt(0).toUpperCase() + task.priority.slice(1))}
                                                                    </span>
                                                                    {task.assigned_user && (
                                                                        <Avatar className="h-6 w-6 rounded-full" title={task.assigned_user.name}>
                                                                            <AvatarImage src={task.assigned_user.avatar} />
                                                                            <AvatarFallback className="text-xs">{getInitials(task.assigned_user.name)}</AvatarFallback>
                                                                        </Avatar>
                                                                    )}
                                                                </div>

                                                                {task.due_date && (
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                        <Calendar className="h-3 w-3" />
                                                                        <span>{t('Due')}: {window.appSettings?.formatDateTime(task.due_date, false) || new Date(task.due_date).toLocaleDateString()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            ))}

                                            {statusTasks.length === 0 && (
                                                <div className="text-center py-8 text-gray-400">
                                                    <User className="h-8 w-8 mx-auto mb-2" />
                                                    <p className="text-sm">{t('No tasks')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    ...(hasPermission(permissions, 'export-project-tasks') && { exportRoute: 'project-task.export' }),
                    fields: [
                        { name: 'title', label: t('Task Title'), type: 'text', required: true, placeholder: t('e.g. Design homepage mockup, Fix login bug') },
                        { name: 'description', label: t('Description'), type: 'textarea', placeholder: t('Enter task description...') },
                        {
                            name: formMode === 'view' ? 'project_name' : 'project_id',
                            label: t('Project'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            readOnly: formMode === 'view',
                            emptyNote: { link: route('projects.index'), linkText: t('Projects') },
                            options: formMode === 'view' ? [] : projects.map((p: any) => ({ value: String(p.id), label: p.name })),
                            onChange: (value: string) => {
                                setParentTasks([]);
                                if (formMode === 'create' && value) {
                                    fetch(route('api.projects.details', value))
                                        .then(res => res.json())
                                        .then(data => setParentTasks(data.parent_tasks || []))
                                        .catch(() => {});
                                }
                            }
                        },
                        {
                            name: 'parent_id',
                            label: t('Parent Task'),
                            type: 'custom',
                            render: (_field: any, formData: any, handleChange: any, _errors: any, mode: any) => {
                                if (mode === 'view') {
                                    return <div className="p-2 border rounded-md bg-gray-50">{formData.parent_name || '-'}</div>;
                                }
                                return (
                                    <ParentTaskSelect
                                        tasksRef={dynamicParentTasksRef}
                                        value={formData.parent_id || ''}
                                        onChange={(value) => handleChange('parent_id', value)}
                                    />
                                );
                            }
                        },
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
                                { value: 'urgent', label: t('Urgent') }
                            ],
                            defaultValue: 'medium'
                        },
                        {
                            name: 'task_status_id',
                            label: t('Status'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('task-statuses.index'), linkText: t('Task Statuses') },
                            options: taskStatuses.map((s: any) => ({ value: String(s.id), label: s.name })),
                            defaultValue: prefilledStatus ? String(prefilledStatus) : String(taskStatuses.find((s: any) => s.name === 'To Do')?.id || taskStatuses[0]?.id || ''),
                            hidden: formMode === 'create' && !!prefilledStatus
                        },
                        { name: 'estimated_hours', label: t('Estimated Hours'), type: 'number', step: '0.5', placeholder: t('e.g. 8') },
                        { name: 'actual_hours', label: t('Actual Hours'), type: 'number', step: '0.5', placeholder: t('e.g. 6.5') },
                        { name: 'progress', label: t('Progress (%)'), type: 'number', min: '0', max: '100', placeholder: t('e.g. 50') },
                        {
                            name: formMode === 'view' ? 'assigned_user_name' : 'assigned_to',
                            label: t('Assign To'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('users.index'), linkText: t('Users') },
                            options: formMode === 'view' ? [] : users.map((u: any) => ({ value: String(u.id), label: `${u.name} (${u.email})` })),
                            readOnly: formMode === 'view'
                        }
                    ],
                    modalSize: 'xl'
                }}
                initialData={currentItem ? {
                    ...currentItem,
                    project_id: currentItem.project?.id ? String(currentItem.project.id) : '',
                    assigned_to: currentItem.assigned_user?.id ? String(currentItem.assigned_user.id) : '',
                    task_status_id: currentItem.task_status_id ? String(currentItem.task_status_id) : '',
                    parent_id: currentItem.parent_id ? String(currentItem.parent_id) : '',
                    assigned_user_name: currentItem.assigned_user?.name || t('Unassigned'),
                    project_name: currentItem.project?.name || t('No Project'),
                    parent_name: currentItem.parent?.title || t('No Parent Task')
                } : null}
                title={formMode === 'create' ? t('Add Task') : formMode === 'edit' ? t('Edit Task') : t('View Task')}
                mode={formMode}
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.title || ''}
                entityName={t('task')}
            />
        </PageTemplate>
    );
}
