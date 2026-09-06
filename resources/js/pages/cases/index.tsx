import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import { Building2, Calendar, Edit, Eye, FileDown, MoreHorizontal, Plus, RefreshCw, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Cases() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const { auth, cases, accounts, allAccounts = [], contacts, users, allUsers = [], filters: pageFilters = {} } = usePage().props;
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id || 'all');
    const [selectedPriority, setSelectedPriority] = useState(pageFilters.priority || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedCaseType, setSelectedCaseType] = useState(pageFilters.case_type || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
    const [activeView, setActiveView] = useState(['list', 'grid'].includes(pageFilters.view) ? pageFilters.view : 'list');
    const [pageInitialState, setPageInitialState] = useState(true);

    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedAccount, selectedPriority, selectedStatus, selectedCaseType, selectedAssignee]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            searchTerm !== '' ||
            selectedAccount !== 'all' ||
            selectedPriority !== 'all' ||
            selectedStatus !== 'all' ||
            selectedCaseType !== 'all' ||
            selectedAssignee !== 'all'
        );
    };

    // Count active filters
    const activeFilterCount = () => {
        return (
            (selectedAccount !== 'all' ? 1 : 0) +
            (selectedPriority !== 'all' ? 1 : 0) +
            (selectedStatus !== 'all' ? 1 : 0) +
            (selectedCaseType !== 'all' ? 1 : 0) +
            (selectedAssignee !== 'all' ? 1 : 0)
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('cases.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                priority: selectedPriority !== 'all' ? selectedPriority : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                case_type: selectedCaseType !== 'all' ? selectedCaseType : undefined,
                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                sort_field: pageFilters.sort_field || undefined,
                sort_direction: pageFilters.sort_direction || undefined,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        router.get(
            route('cases.index'),
            {
                view: activeView,
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                priority: selectedPriority !== 'all' ? selectedPriority : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                case_type: selectedCaseType !== 'all' ? selectedCaseType : undefined,
                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view':
                router.get(route('cases.show', item.id));
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
            toast.loading(translate('Creating case...'));

            router.post(route('cases.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    } else if (page.props.flash.warning) {
                        toast.warning(t(page.props.flash.warning));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(translate('Failed to create case: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        } else if (formMode === 'edit') {
            toast.loading(translate('Updating case...'));

            router.put(route('cases.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    } else if (page.props.flash.warning) {
                        toast.warning(t(page.props.flash.warning));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(translate('Failed to update case: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting case...'));

        router.delete(route('cases.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(t(page.props.flash.error));
                } else if (page.props.flash.warning) {
                    toast.warning(t(page.props.flash.warning));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(translate('Failed to delete case: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('cases.toggle-status', currentItem.id), formData, {
            onSuccess: (page) => {
                setIsStatusModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleToggleStatus = (caseItem: any) => {
        const newStatus = caseItem.status === 'new' ? 'closed' : 'new';
        toast.loading(`${newStatus === 'new' ? translate('Opening') : translate('Closing')} case...`);

        router.put(
            route('cases.toggle-status', caseItem.id),
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(translate('Failed to update case status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const handleResetFilters = () => {
        router.get(route('cases.index'), { view: activeView });
    };

    // Define page actions
    const pageActions = [];

    if (useHasPermission('export-cases')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[360px]:mr-2" />,
            variant: 'outline',
            onClick: () => (window.location.href = route('case.export')),
            className: 'h-8 w-8 min-[360px]:h-9 min-[360px]:w-auto px-0 min-[360px]:px-4',
            labelClassName: 'hidden min-[360px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[360px]:hidden',
        });
    }

    // Add the "Add Case" button if user has permission
    if (useHasPermission('create-cases')) {
        pageActions.push({
            label: translate('Add Case'),
            icon: <Plus className="mr-0 h-4 w-4 min-[360px]:mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew(),
            className: 'h-8 w-8 min-[360px]:h-9 min-[360px]:w-auto px-0 min-[360px]:px-4',
            labelClassName: 'hidden min-[360px]:inline',
            tooltip: translate('Add Case'),
            tooltipClassName: 'min-[360px]:hidden',
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Cases') }];

    // Define table columns
    const columns = [
        {
            key: 'subject',
            label: translate('Subject'),
            sortable: true,
            render: (value: any, row: any) => {
                return (
                    <div>
                        <div className="font-medium">{row.subject}</div>
                        <div className="text-muted-foreground text-sm whitespace-nowrap">
                            {row.case_type
                                ? row.case_type.replace(/_/g, ' ').charAt(0).toUpperCase() + row.case_type.replace(/_/g, ' ').slice(1)
                                : ''}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'assigned_user',
            label: translate('Assigned To'),
            className: 'whitespace-nowrap',
            render: (value: any) =>
                value ? (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={value.avatar} />
                            <AvatarFallback className="text-xs">{getInitials(value.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium whitespace-nowrap">{value.name}</div>
                            <div className="text-muted-foreground text-sm whitespace-nowrap">{value.email}</div>
                        </div>
                    </div>
                ) : (
                    <span className="text-muted-foreground whitespace-nowrap">{translate('Unassigned')}</span>
                ),
        },
        {
            key: 'account',
            label: translate('Account'),
            className: 'whitespace-nowrap',
            render: (value: any) => <span className="whitespace-nowrap">{value?.name || '-'}</span>,
        },
        {
            key: 'priority',
            label: translate('Priority'),
            render: (value: string) => {
                const colors = {
                    low: 'bg-gray-50 text-gray-700 ring-gray-600/20',
                    medium: 'bg-blue-50 text-blue-700 ring-blue-600/20',
                    high: 'bg-orange-50 text-orange-700 ring-orange-600/20',
                    urgent: 'bg-red-50 text-red-700 ring-red-600/20',
                };
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${colors[value as keyof typeof colors]}`}
                    >
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                );
            },
        },
        {
            key: 'status',
            label: translate('Status'),
            className: 'whitespace-nowrap',
            render: (value: string) => {
                const colors = {
                    new: 'bg-blue-50 text-blue-700 ring-blue-600/20',
                    in_progress: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                    pending: 'bg-orange-50 text-orange-700 ring-orange-600/20',
                    resolved: 'bg-green-50 text-green-700 ring-green-600/20',
                    closed: 'bg-gray-50 text-gray-700 ring-gray-600/20',
                };
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${colors[value as keyof typeof colors]}`}
                    >
                        {value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1)}
                    </span>
                );
            },
        },
        // {
        //     key: 'case_type',
        //     label: translate('Type'),
        //     className: 'whitespace-nowrap',
        //     render: (value: string) => <span className="whitespace-nowrap">{value.replace('_', ' ').charAt(0).toUpperCase() + value.replace('_', ' ').slice(1)}</span>
        // },
        {
            key: 'created_at',
            label: translate('Created At'),
            sortable: true,
            className: 'whitespace-nowrap',
            type: 'date',
        },
    ];

    // Define table actions
    const actions = [
        {
            label: translate('Change Status'),
            icon: 'RefreshCw',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-cases',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-cases',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-cases',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-cases',
        },
    ];

    // Prepare filter options
    const accountOptions = [
        { value: 'all', label: translate('All Accounts') },
        ...allAccounts.map((account: any) => ({
            value: account.id.toString(),
            label: account.name,
        })),
    ];

    const priorityOptions = [
        { value: 'all', label: translate('All Priorities') },
        { value: 'low', label: translate('Low') },
        { value: 'medium', label: translate('Medium') },
        { value: 'high', label: translate('High') },
        { value: 'urgent', label: translate('Urgent') },
    ];

    const statusOptions = [
        { value: 'all', label: translate('All Statuses') },
        { value: 'new', label: translate('New') },
        { value: 'in_progress', label: translate('In Progress') },
        { value: 'pending', label: translate('Pending') },
        { value: 'resolved', label: translate('Resolved') },
        { value: 'closed', label: translate('Closed') },
    ];

    const caseTypeOptions = [
        { value: 'all', label: translate('All Types') },
        { value: 'support', label: translate('Support') },
        { value: 'bug', label: translate('Bug') },
        { value: 'feature_request', label: translate('Feature Request') },
        { value: 'complaint', label: translate('Complaint') },
        { value: 'inquiry', label: translate('Inquiry') },
    ];

    return (
        <PageTemplate title={translate('Cases')} description={translate('Manage your cases.')} url="/cases" actions={pageActions} breadcrumbs={breadcrumbs} noPadding>
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'account_id',
                            label: translate('Account'),
                            type: 'select',
                            searchable: true,
                            value: selectedAccount,
                            onChange: setSelectedAccount,
                            options: accountOptions,
                        },
                        {
                            name: 'priority',
                            label: translate('Priority'),
                            type: 'select',
                            value: selectedPriority,
                            onChange: setSelectedPriority,
                            options: priorityOptions,
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: statusOptions,
                        },
                        {
                            name: 'case_type',
                            label: translate('Type'),
                            type: 'select',
                            value: selectedCaseType,
                            onChange: setSelectedCaseType,
                            options: caseTypeOptions,
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
                                ...allUsers.map((user: any) => ({ value: user.id.toString(), label: user.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={(view) => {
                        setActiveView(view);
                        router.get(route('cases.index'), {
                            view,
                            page: pageFilters.page || undefined,
                            search: searchTerm || undefined,
                            account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                            priority: selectedPriority !== 'all' ? selectedPriority : undefined,
                            status: selectedStatus !== 'all' ? selectedStatus : undefined,
                            case_type: selectedCaseType !== 'all' ? selectedCaseType : undefined,
                            assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                            sort_field: pageFilters.sort_field || undefined,
                            sort_direction: pageFilters.sort_direction || undefined,
                            ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
                        });
                    }}
                />
            </div>

            {/* Content section */}
            {activeView === 'list' ? (
                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <div className="overflow-x-auto">
                        <CrudTable
                            columns={columns}
                            actions={actions}
                            data={cases?.data || []}
                            from={cases?.from || 1}
                            onAction={handleAction}
                            sortField={pageFilters.sort_field}
                            sortDirection={pageFilters.sort_direction}
                            onSort={handleSort}
                            permissions={permissions}
                            entityPermissions={{
                                view: 'view-cases',
                                create: 'create-cases',
                                edit: 'edit-cases',
                                delete: 'delete-cases',
                            }}
                        />
                    </div>

                    {/* Pagination section */}
                    <Pagination
                        from={cases?.from || 0}
                        to={cases?.to || 0}
                        total={cases?.total || 0}
                        links={cases?.links}
                        entityName={translate('cases')}
                        onPageChange={(url) => router.get(url)}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            router.get(
                                route('cases.index'),
                                {
                                    view: activeView,
                                    page: 1,
                                    search: searchTerm || undefined,
                                    account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                                    priority: selectedPriority !== 'all' ? selectedPriority : undefined,
                                    status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                    case_type: selectedCaseType !== 'all' ? selectedCaseType : undefined,
                                    assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                                    sort_field: pageFilters.sort_field || undefined,
                                    sort_direction: pageFilters.sort_direction || undefined,
                                    ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                                },
                                { preserveState: true, preserveScroll: true },
                            );
                        }}
                    />
                </div>
            ) : (
                <div>
                    {/* Grid View */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {cases?.data?.map((caseItem: any) => {
                            const priorityColors: Record<string, string> = {
                                low: 'bg-gray-50 text-gray-700 ring-gray-600/20',
                                medium: 'bg-blue-50 text-blue-700 ring-blue-600/20',
                                high: 'bg-orange-50 text-orange-700 ring-orange-600/20',
                                urgent: 'bg-red-50 text-red-700 ring-red-600/20',
                            };

                            const typeColors: Record<string, string> = {
                                support: 'bg-purple-50 text-purple-700 ring-purple-600/20',
                                bug: 'bg-purple-50 text-purple-700 ring-purple-600/20',
                                feature_request: 'bg-purple-50 text-purple-700 ring-purple-600/20',
                                complaint: 'bg-purple-50 text-purple-700 ring-purple-600/20',
                                inquiry: 'bg-purple-50 text-purple-700 ring-purple-600/20',
                            };
                            const fmt = (s: string) => s.replace(/_/g, ' ').charAt(0).toUpperCase() + s.replace(/_/g, ' ').slice(1);
                            const statusConfig: Record<string, { cls: string }> = {
                                new: { cls: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
                                in_progress: { cls: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
                                pending: { cls: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
                                resolved: { cls: 'bg-green-50 text-green-700 ring-green-600/20' },
                                closed: { cls: 'bg-gray-50 text-gray-700 ring-gray-600/20' },
                            };
                            const sc = statusConfig[caseItem.status] ?? statusConfig.new;
                            return (
                                <Card
                                    key={caseItem.id}
                                    className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                                >
                                    <div className="relative flex flex-1 flex-col p-4">
                                        {/* Dropdown — top right */}
                                        <div className="absolute top-3 right-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="z-50 w-40" sideOffset={5}>
                                                    {useHasPermission('view-cases') && (
                                                        <DropdownMenuItem onClick={() => handleAction('view', caseItem)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            <span>{translate('View Case')}</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('toggle-status-cases') && (
                                                        <DropdownMenuItem onClick={() => handleAction('toggle-status', caseItem)}>
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            <span>{translate('Change Status')}</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('edit-cases') && (
                                                        <DropdownMenuItem onClick={() => handleAction('edit', caseItem)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>{translate('Edit')}</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    {useHasPermission('delete-cases') && (
                                                        <DropdownMenuItem onClick={() => handleAction('delete', caseItem)} className="text-rose-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>{translate('Delete')}</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Header: subject + status pill */}
                                        <div className="mb-3">
                                            <Link href={route('cases.show', caseItem.id)}>
                                                <h3 className="hover:text-primary cursor-pointer truncate pr-8 text-sm leading-tight font-semibold text-gray-900 transition-colors dark:text-white">
                                                    {caseItem.subject}
                                                </h3>
                                            </Link>

                                            {/* Row 1: Status only */}
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="w-12 shrink-0 text-xs text-gray-500 dark:text-gray-400">{translate('Status')}:</span>
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${sc.cls}`}
                                                >
                                                    {fmt(caseItem.status)}
                                                </span>
                                            </div>
                                            {/* Row 2: Priority left | Type right */}
                                            <div className="mt-1.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-12 shrink-0 text-xs text-gray-500 dark:text-gray-400">{translate('Priority')}:</span>
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${priorityColors[caseItem.priority] ?? priorityColors.medium}`}
                                                    >
                                                        {fmt(caseItem.priority)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{translate('Type')}:</span>
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${typeColors[caseItem.case_type] ?? 'bg-purple-50 text-purple-700 ring-purple-600/20'}`}
                                                    >
                                                        {fmt(caseItem.case_type)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info rows */}
                                        <div className="mb-3 space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                <span className="shrink-0">{translate('Account')}:</span>
                                                <span className="truncate">{caseItem.account?.name || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                <span className="shrink-0">{translate('Contact')}:</span>
                                                <span className="truncate">{caseItem.contact?.name || '-'}</span>
                                            </div>
                                        </div>

                                        {/* Footer: created date + assigned user */}
                                        <div className="border-border mt-auto flex items-center justify-between gap-2 border-t pt-3">
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                <span>
                                                    {window.appSettings?.formatDateTime(caseItem.created_at, false) ||
                                                        new Date(caseItem.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {caseItem.assigned_user && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{translate('Assigned to')}</span>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Avatar className="h-7 w-7 shrink-0 cursor-pointer">
                                                                    <AvatarImage
                                                                        src={caseItem.assigned_user.avatar}
                                                                        alt={caseItem.assigned_user.name}
                                                                    />
                                                                    <AvatarFallback className="bg-purple-100 text-xs font-medium text-purple-700">
                                                                        {getInitials(caseItem.assigned_user.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p>{caseItem.assigned_user.name}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Pagination for grid view */}
                    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                        <Pagination
                            from={cases?.from || 0}
                            to={cases?.to || 0}
                            total={cases?.total || 0}
                            links={cases?.links}
                            entityName={translate('cases')}
                            onPageChange={(url) => router.get(url)}
                            perPageOptions={[12, 24, 48, 96]}
                            currentPerPage={pageFilters.per_page?.toString() || '12'}
                            onPerPageChange={(value) => {
                                router.get(
                                    route('cases.index'),
                                    {
                                        view: activeView,
                                        page: 1,
                                        search: searchTerm || undefined,
                                        account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                                        priority: selectedPriority !== 'all' ? selectedPriority : undefined,
                                        status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                        case_type: selectedCaseType !== 'all' ? selectedCaseType : undefined,
                                        assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                                        sort_field: pageFilters.sort_field || undefined,
                                        sort_direction: pageFilters.sort_direction || undefined,
                                        ...(parseInt(value) !== 12 && { per_page: parseInt(value) }),
                                    },
                                    { preserveState: true, preserveScroll: true },
                                );
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        {
                            name: 'subject',
                            label: translate('Subject'),
                            type: 'text',
                            required: true,
                            placeholder: translate('e.g. Sign in page not loading, Billing issue'),
                        },
                        { name: 'description', label: translate('Description'), type: 'textarea', placeholder: translate('Describe the issue in detail...') },
                        {
                            name: 'account_id',
                            label: translate('Account'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('accounts.index'), linkText: translate('Accounts') },
                            options: (accounts || []).map((account: any) => ({
                                value: account.id.toString(),
                                label: account.name,
                            })),
                        },
                        {
                            name: 'contact_id',
                            label: translate('Contact'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('contacts.index'), linkText: translate('Contacts') },
                            options: (contacts || []).map((contact: any) => ({
                                value: contact.id.toString(),
                                label: `${contact.name} (${contact.account?.name || 'No Account'})`,
                            })),
                        },
                        {
                            name: 'priority',
                            label: translate('Priority'),
                            type: 'select',
                            required: true,
                            options: [
                                { value: 'low', label: translate('Low') },
                                { value: 'medium', label: translate('Medium') },
                                { value: 'high', label: translate('High') },
                                { value: 'urgent', label: translate('Urgent') },
                            ],
                            defaultValue: 'medium',
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            options: [
                                { value: 'new', label: translate('New') },
                                { value: 'in_progress', label: translate('In Progress') },
                                { value: 'pending', label: translate('Pending') },
                                { value: 'resolved', label: translate('Resolved') },
                                { value: 'closed', label: translate('Closed') },
                            ],
                            defaultValue: 'new',
                        },
                        {
                            name: 'case_type',
                            label: translate('Case Type'),
                            type: 'select',
                            required: true,
                            options: [
                                { value: 'support', label: translate('Support') },
                                { value: 'bug', label: translate('Bug') },
                                { value: 'feature_request', label: translate('Feature Request') },
                                { value: 'complaint', label: translate('Complaint') },
                                { value: 'inquiry', label: translate('Inquiry') },
                            ],
                            defaultValue: 'support',
                        },
                        {
                            name: formMode === 'view' ? 'assigned_user_name' : 'assigned_to',
                            label: translate('Assign To'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('users.index'), linkText: translate('Users') },
                            options:
                                formMode === 'view'
                                    ? []
                                    : (users || []).map((user: any) => ({ value: user.id, label: `${user.name} (${user.email})` })),
                            readOnly: formMode === 'view',
                        },
                    ],
                    modalSize: 'xl',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              assigned_user_name: currentItem.assigned_user?.name || translate('Unassigned'),
                          }
                        : null
                }
                title={formMode === 'create' ? translate('Add Case') : formMode === 'edit' ? translate('Edit Case') : translate('View Case')}
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
                                { value: 'new', label: translate('New') },
                                { value: 'in_progress', label: translate('In Progress') },
                                { value: 'pending', label: translate('Pending') },
                                { value: 'resolved', label: translate('Resolved') },
                                { value: 'closed', label: translate('Closed') },
                            ],
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={translate('Change Case Status')}
                mode="edit"
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.subject || ''}
                entityName={translate('case')}
            />
        </PageTemplate>
    );
}
