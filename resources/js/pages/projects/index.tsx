import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { useHasPermission } from '@/utils/Permissions';
import { router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlignJustify,
    Calendar,
    CheckCircle,
    CheckCircle2,
    Edit,
    Eye,
    FileDown,
    LayoutGrid,
    MoreHorizontal,
    PauseCircle,
    Play,
    Plus,
    RefreshCw,
    Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const statusConfig: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' },
    inactive: { label: 'Inactive', className: 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20' },
    completed: { label: 'Completed', className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
    on_hold: { label: 'On Hold', className: 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20' },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20' },
    medium: { label: 'Medium', className: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' },
    high: { label: 'High', className: 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20' },
    urgent: { label: 'Urgent', className: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' },
};

const progressBarColor = (pct: number) => {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 40) return 'bg-blue-500';
    return 'bg-orange-400';
};

function Avatar({ name, src }: { name: string; src?: string }) {
    const [imgError, setImgError] = useState(false);
    if (src && !imgError) {
        return <img src={src} alt={name} onError={() => setImgError(true)} className="h-7 w-7 rounded-full border-2 border-white object-cover" />;
    }
    return (
        <div className="bg-primary/20 text-primary flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-xs font-semibold uppercase">
            {name.charAt(0)}
        </div>
    );
}

export default function Projects() {
    const { t: translate } = useTranslation();
    const {
        auth,
        projects,
        accounts = [],
        allAccounts = [],
        users = [],
        allUsers = [],
        planLimits,
        stats = {},
        filters: pageFilters = {},
    } = usePage().props;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedPriority, setSelectedPriority] = useState(pageFilters.priority || 'all');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    const hasActiveFilters = () => searchTerm !== '' || selectedPriority !== 'all' || selectedAccount !== 'all' || selectedAssignee !== 'all';

    const activeFilterCount = () => (selectedPriority !== 'all' ? 1 : 0) + (selectedAccount !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0);

    const baseParams = () => ({
        page: 1,
        search: searchTerm || undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
        account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
        assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
        sort_field: pageFilters.sort_field || undefined,
        sort_direction: pageFilters.sort_direction || undefined,
        per_page: pageFilters.per_page ? parseInt(pageFilters.per_page) : undefined,
    });

    const applyFilters = () => {
        router.get(route('projects.index'), baseParams(), { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);
        switch (action) {
            case 'view':
                router.get(route('projects.show', item.id));
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
        if (formMode === 'create') {
            toast.loading(translate('Creating project...'));
            router.post(route('projects.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    page.props.flash.success
                        ? toast.success(t(page.props.flash.success))
                        : page.props.flash.error && toast.error(t(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(typeof errors === 'string' ? errors : `Failed to create project: ${Object.values(errors).join(', ')}`);
                },
            });
        } else if (formMode === 'edit') {
            toast.loading(translate('Updating project...'));
            router.put(route('projects.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    page.props.flash.success
                        ? toast.success(t(page.props.flash.success))
                        : page.props.flash.error && toast.error(t(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(typeof errors === 'string' ? errors : `Failed to update project: ${Object.values(errors).join(', ')}`);
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting project...'));
        router.delete(route('projects.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                page.props.flash.success
                    ? toast.success(t(page.props.flash.success))
                    : page.props.flash.error && toast.error(t(page.props.flash.error));
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(typeof errors === 'string' ? errors : `Failed to delete project: ${Object.values(errors).join(', ')}`);
            },
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('projects.toggle-status', currentItem.id), formData, {
            onSuccess: (page) => {
                setIsStatusModalOpen(false);
                toast.dismiss();
                page.props.flash.success
                    ? toast.success(t(page.props.flash.success))
                    : page.props.flash.error && toast.error(t(page.props.flash.error));
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(typeof errors === 'string' ? errors : translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const [pageInitialState, setPageInitialState] = useState(true);
    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedPriority, selectedAccount, selectedAssignee]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedPriority('all');
        setSelectedAccountranslate('all');
        setSelectedAssignee('all');
        router.get(route('projects.index'), { status: selectedStatus !== 'all' ? selectedStatus : undefined });
    };

    const handleTabChange = (status: string) => {
        setSelectedStatus(status);
        router.get(
            route('projects.index'),
            {
                ...baseParams(),
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const pageActions: any[] = [];

    if (useHasPermission('export-projects')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[450px]:mr-2" />,
            variant: 'outline',
            className: 'h-8 w-8 min-[450px]:h-9 min-[450px]:w-auto px-0 min-[450px]:px-4',
            labelClassName: 'hidden min-[450px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[450px]:hidden',
            onClick: () => (CrudFormModal as any).handleExport?.(),
        });
    }

    if (useHasPermission('create-projects')) {
        const canCreate = !planLimits || planLimits.can_create;
        pageActions.push({
            label:
                planLimits && !canCreate
                    ? translate('Project Limit Reached ({{current}}/{{max}})', { current: planLimits.current_projects, max: planLimits.maximum_projects })
                    : translate('Add Project'),
            icon: <Plus className="mr-0 h-4 w-4 min-[450px]:mr-2" />,
            variant: canCreate ? 'default' : 'outline',
            className: 'h-8 w-8 min-[450px]:h-9 min-[450px]:w-auto px-0 min-[450px]:px-4',
            labelClassName: 'hidden min-[450px]:inline',
            tooltip: translate('Add Project'),
            tooltipClassName: 'min-[450px]:hidden',
            onClick: canCreate
                ? handleAddNew
                : () =>
                      toast.error(
                          translate('Project limit exceeded. Your plan allows maximum {{max}} projects. Please upgrade your plan.', {
                              max: planLimits.maximum_projects,
                          }),
                      ),
            disabled: !canCreate,
        });
    }

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Project Management'), href: route('projects.index') },
        { title: translate('Projects') },
    ];

    const statCards = [
        {
            label: translate('Total Projects'),
            value: stats.total ?? 0,
            sub: translate('All time'),
            icon: <LayoutGrid className="h-6 w-6" />,
            color: 'text-blue-700',
            cardBg: 'bg-blue-50 dark:bg-blue-900/30',
            borderColor: '#bfdbfe',
        },
        {
            label: translate('Active'),
            value: stats.ongoing ?? 0,
            sub: stats.total ? `${Math.round(((stats.ongoing ?? 0) / stats.total) * 100)}% ${translate('of total')}` : '—',
            icon: <Play className="h-6 w-6" />,
            color: 'text-green-700',
            cardBg: 'bg-green-50 dark:bg-green-900/30',
            borderColor: '#bbf7d0',
        },
        {
            label: translate('On Hold'),
            value: stats.on_hold ?? 0,
            sub: stats.total ? `${Math.round(((stats.on_hold ?? 0) / stats.total) * 100)}% ${translate('of total')}` : '—',
            icon: <PauseCircle className="h-6 w-6" />,
            color: 'text-yellow-600',
            cardBg: 'bg-yellow-50 dark:bg-yellow-900/30',
            borderColor: '#fde68a',
        },
        {
            label: translate('Completed'),
            value: stats.completed ?? 0,
            sub: stats.total ? `${Math.round(((stats.completed ?? 0) / stats.total) * 100)}% ${translate('of total')}` : '—',
            icon: <CheckCircle2 className="h-6 w-6" />,
            color: 'text-violet-700',
            cardBg: 'bg-violet-50 dark:bg-violet-900/30',
            borderColor: '#ddd6fe',
        },
        {
            label: translate('Overdue'),
            value: stats.overdue ?? 0,
            sub: stats.total ? `${Math.round(((stats.overdue ?? 0) / stats.total) * 100)}% ${translate('of total')}` : '—',
            icon: <AlertCircle className="h-6 w-6" />,
            color: 'text-red-600',
            cardBg: 'bg-red-50 dark:bg-red-900/30',
            borderColor: '#fecaca',
        },
    ];

    return (
        <PageTemplate
            title={translate('Manage Projects')}
            description={translate('Manage your projects.')}
            url="/projects"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            {/* Stats Cards */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
                {statCards.map((s) => (
                    <Card
                        key={s.label}
                        className={`flex flex-col gap-2 rounded-xl p-6 shadow-sm ${s.cardBg}`}
                        style={{ border: `1.5px solid ${s.borderColor}` }}
                    >
                        <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${s.color}`}>{s.label}</p>
                            <span className={s.color}>{React.cloneElement(s.icon, { className: 'h-5 w-5' })}</span>
                        </div>
                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                        <p className={`text-xs ${s.color} opacity-70`}>{s.sub}</p>
                    </Card>
                ))}
            </div>

            {/* Search & Filter Card */}
            <div className="rounded-t-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
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
                            name: 'account_id',
                            label: translate('Account'),
                            type: 'select',
                            searchable: true,
                            value: selectedAccount,
                            onChange: setSelectedAccount,
                            options: [
                                { value: 'all', label: translate('All Accounts') },
                                ...allAccounts.map((a: any) => ({ value: a.id.toString(), label: a.name })),
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
                                { value: 'unassigned', label: translate('Unassigned') },
                                ...allUsers.map((u: any) => ({ value: u.id.toString(), label: u.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    hidePerPage={true}
                />
            </div>

            {/* Status Tabs + Content Card */}
            <div className="mb-4 rounded-b-lg border border-t-0 border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 px-4 dark:border-gray-700">
                    {(
                        [
                            { value: 'all', label: translate('All'), count: stats.total ?? 0, icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                            { value: 'active', label: translate('Active'), count: stats.ongoing ?? 0, icon: <Play className="h-3.5 w-3.5" /> },
                            { value: 'inactive', label: translate('Inactive'), count: stats.inactive ?? 0, icon: <AlertCircle className="h-3.5 w-3.5" /> },
                            { value: 'on_hold', label: translate('On Hold'), count: stats.on_hold ?? 0, icon: <PauseCircle className="h-3.5 w-3.5" /> },
                            { value: 'completed', label: translate('Finished'), count: stats.completed ?? 0, icon: <CheckCircle className="h-3.5 w-3.5" /> },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedStatus === tab.value
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span
                                className={`ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                                    selectedStatus === tab.value
                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Row 4: Projects Grid */}
                {(projects?.data?.length ?? 0) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
                        <p className="text-lg font-medium">{translate('No projects found')}</p>
                        <p className="mt-1 text-sm">{translate('Try adjusting your filters or create a new project.')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {projects.data.map((project: any) => {
                            const sCfg = statusConfig[project.status] ?? statusConfig.inactive;
                            const pCfg = priorityConfig[project.priority] ?? priorityConfig.medium;
                            const pct = project.task_progress ?? 0;
                            const total = project.task_total ?? 0;

                            return (
                                <Card
                                    key={project.id}
                                    className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <div className="flex flex-1 flex-col gap-3 p-5">
                                        {/* Top row: name + menu */}
                                        <div className="flex items-start justify-between gap-2">
                                            <h3
                                                className="cursor-pointer truncate text-sm leading-snug font-semibold text-gray-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
                                                onClick={() => router.get(route('projects.show', project.id))}
                                            >
                                                {project.name}
                                            </h3>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 shrink-0 rounded-none p-0 text-gray-400 hover:bg-transparent hover:text-gray-600"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="z-50 w-48" sideOffset={5}>
                                                    {useHasPermission('view-projects') && (
                                                        <DropdownMenuItem onClick={() => handleAction('view', project)}>
                                                            <Eye className="mr-2 h-4 w-4" /> {translate('View Project')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('toggle-status-projects') && (
                                                        <DropdownMenuItem onClick={() => handleAction('toggle-status', project)}>
                                                            <RefreshCw className="mr-2 h-4 w-4" /> {translate('Change Status')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('edit-projects') && (
                                                        <DropdownMenuItem onClick={() => handleAction('edit', project)}>
                                                            <Edit className="mr-2 h-4 w-4" /> {translate('Edit')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    {useHasPermission('delete-projects') && (
                                                        <DropdownMenuItem onClick={() => handleAction('delete', project)} className="text-rose-600">
                                                            <Trash2 className="mr-2 h-4 w-4" /> {translate('Delete')}
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Separator */}
                                        <hr className="border-gray-200 dark:border-gray-600" />

                                        {/* Task Progress */}
                                        <div>
                                            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                                    <AlignJustify className="h-3 w-3 text-gray-400" />
                                                    {project.task_done ?? 0}/{total}
                                                </span>
                                                <span>
                                                    ({pct}% {translate('completed')})
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                                <div
                                                    className={`h-full rounded-full transition-all ${progressBarColor(pct)}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Assigned to + Deadline */}
                                        <div className="flex items-end justify-between gap-2">
                                            <div>
                                                <p className="mb-1 text-xs text-gray-400">{translate('Assigned to')}</p>
                                                {project.assigned_user ? (
                                                    <Avatar name={project.assigned_user.name} src={project.assigned_user.avatar} />
                                                ) : (
                                                    <span className="text-xs text-gray-400">{translate('Unassigned')}</span>
                                                )}
                                            </div>
                                            {project.end_date && (
                                                <div className="text-right">
                                                    <p className="mb-1 text-xs text-gray-400">{translate('Deadline')}</p>
                                                    <p
                                                        className={`flex items-center justify-end gap-1 text-xs font-medium ${new Date(project.end_date) < new Date() && project.status !== 'completed' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
                                                    >
                                                        <Calendar className="h-3 w-3" />
                                                        <span className="text-xs">
                                                            {window.appSettings?.formatDateTime(project.end_date, false) || project.end_date}
                                                        </span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer: status badge + priority + budget */}
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${sCfg.className}`}>
                                                {t(sCfg.label)}
                                            </span>
                                            {project.priority && (
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${pCfg.className}`}
                                                >
                                                    {t(pCfg.label)}
                                                </span>
                                            )}
                                            {project.budget && (
                                                <span className="ml-auto font-mono text-xs font-medium text-gray-600 dark:text-gray-300">
                                                    {window.appSettings?.formatCurrency(project.budget) ||
                                                        `$${Number(project.budget).toLocaleString()}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
                <Pagination
                    from={projects?.from || 0}
                    to={projects?.to || 0}
                    total={projects?.total || 0}
                    links={projects?.links}
                    entityName={translate('projects')}
                    onPageChange={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
                    perPageOptions={[12, 24, 48, 96]}
                    currentPerPage={pageFilters.per_page?.toString() || '12'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('projects.index'),
                            {
                                ...baseParams(),
                                page: 1,
                                per_page: parseInt(value) !== 12 ? parseInt(value) : undefined,
                            },
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                />
            </div>

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    ...(useHasPermission('export-projects') && { exportRoute: 'project.export' }),
                    fields: [
                        {
                            name: 'name',
                            label: translate('Project Name'),
                            type: 'text',
                            required: true,
                            placeholder: translate('e.g. Website Redesign, Mobile App v2, CRM Integration'),
                        },
                        { name: 'description', label: translate('Description'), type: 'textarea', placeholder: translate('Enter project description...') },
                        {
                            name: formMode === 'view' ? 'account_name' : 'account_id',
                            label: translate('Account'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            readOnly: formMode === 'view',
                            emptyNote: { link: route('accounts.index'), linkText: translate('Accounts') },
                            options: formMode === 'view' ? [] : accounts.map((a: any) => ({ value: a.id, label: a.name })),
                        },
                        { name: 'start_date', label: translate('Start Date'), type: 'date' },
                        { name: 'end_date', label: translate('End Date'), type: 'date' },
                        { name: 'budget', label: translate('Budget'), type: 'number', step: '0.01', placeholder: translate('e.g. 10000.00') },
                        {
                            name: 'priority',
                            label: translate('Priority'),
                            type: 'select',
                            defaultValue: 'medium',
                            options: [
                                { value: 'low', label: translate('Low') },
                                { value: 'medium', label: translate('Medium') },
                                { value: 'high', label: translate('High') },
                                { value: 'urgent', label: translate('Urgent') },
                            ],
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            defaultValue: 'active',
                            options: [
                                { value: 'active', label: translate('Active') },
                                { value: 'inactive', label: translate('Inactive') },
                                { value: 'completed', label: translate('Completed') },
                                { value: 'on_hold', label: translate('On Hold') },
                            ],
                        },
                        {
                            name: formMode === 'view' ? 'assigned_user_name' : 'assigned_to',
                            label: translate('Assign To'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            readOnly: formMode === 'view',
                            emptyNote: { link: route('users.index'), linkText: translate('Users') },
                            options: formMode === 'view' ? [] : users.map((u: any) => ({ value: u.id, label: `${u.name} (${u.email})` })),
                        },
                    ],
                    modalSize: 'xl',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              assigned_user_name: currentItem.assigned_user?.name || 'Unassigned',
                              account_name: currentItem.account?.name || 'No Account',
                          }
                        : null
                }
                title={formMode === 'create' ? translate('Add Project') : formMode === 'edit' ? translate('Edit Project') : translate('View Project')}
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
                                { value: 'active', label: translate('Active') },
                                { value: 'inactive', label: translate('Inactive') },
                                { value: 'completed', label: translate('Completed') },
                                { value: 'on_hold', label: translate('On Hold') },
                            ],
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={translate('Change Project Status')}
                mode="edit"
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName="project"
            />
        </PageTemplate>
    );
}
