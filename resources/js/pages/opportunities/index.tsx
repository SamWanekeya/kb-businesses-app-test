import { CrudDeleteModal } from '@components/CrudDeleteModal';
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import { PageTemplate } from '@components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/avatar';
import { Button } from '@components/UserInterface/button';
import { Card } from '@components/UserInterface/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/UserInterface/dropdown-menu';
import { Pagination } from '@components/UserInterface/pagination';
import { SearchAndFilterBar } from '@components/UserInterface/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/tooltip';
import { useInitials } from '@hooks/use-initials';
import { router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import * as LucidIcons from 'lucide-react';
import { Banknote, Building2, Calendar, Edit, Eye, FileDown, Lock, MoreHorizontal, Plus, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Opportunities() {
    const { t: translate } = useTranslation();
    const {
        auth,
        opportunities,
        allAccounts = [],
        opportunityStages = [],
        allOpportunityStages = [],
        allOpportunitySources = [],
        allUsers = [],
        filters: pageFilters = {},
        flash = {},
        globalSettings = {},
    } = usePage().props;

    useEffect(() => {
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
        else if (flash?.warning) toast.warning(t(flash.warning));
    }, [flash]);
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id || 'all');
    const [selectedStage, setSelectedStage] = useState(pageFilters.opportunity_stage_id || 'all');
    const [selectedSource, setSelectedSource] = useState(pageFilters.opportunity_source_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [activeView, setActiveView] = useState(['list', 'grid', 'kanban'].includes(pageFilters.view) ? pageFilters.view : 'kanban');
    const [kanbanData, setKanbanData] = useState<any>(null);
    const [kanbanDataRef, setKanbanDataRef] = useState<any>(null);
    const [isLoadingKanban, setIsLoadingKanban] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<any>(null);
    const [pageInitialState, setPageInitialState] = useState(true);

    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedStatus, selectedAccount, selectedStage, selectedSource, selectedAssignee]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            searchTerm !== '' ||
            selectedAccount !== 'all' ||
            selectedStage !== 'all' ||
            selectedSource !== 'all' ||
            selectedStatus !== 'all' ||
            selectedAssignee !== 'all'
        );
    };

    // Count active filters
    const activeFilterCount = () => {
        return (
            (searchTerm ? 1 : 0) +
            (selectedAccount !== 'all' ? 1 : 0) +
            (selectedStage !== 'all' ? 1 : 0) +
            (selectedSource !== 'all' ? 1 : 0) +
            (selectedStatus !== 'all' ? 1 : 0) +
            (selectedAssignee !== 'all' ? 1 : 0)
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('opportunities.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                opportunity_stage_id: selectedStage !== 'all' ? selectedStage : undefined,
                opportunity_source_id: selectedSource !== 'all' ? selectedSource : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
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
            route('opportunities.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                opportunity_stage_id: selectedStage !== 'all' ? selectedStage : undefined,
                opportunity_source_id: selectedSource !== 'all' ? selectedSource : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                sort_field: field,
                sort_direction: direction,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view':
                router.get(route('opportunities.show', item.id));
                break;
            case 'edit':
                router.get(route('opportunities.edit', item.id));
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(item);
                break;
        }
    };

    const handleAddNew = () => {
        router.get(route('opportunities.create'));
    };

    const handleAddOpportunity = (stageId: string) => {
        router.get(route('opportunities.create'), { opportunity_stage_id: stageId });
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting opportunity...'));

        router.delete(route('opportunities.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (activeView === 'kanban') {
                    loadKanbanData();
                }
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleToggleStatus = (opportunity: any) => {
        if (!useHasPermission('toggle-status-opportunities')) {
            toast.error(translate('Permission denied.'));
            return;
        }

        const newStatus = opportunity.status === 'active' ? 'inactive' : 'active';
        toast.loading(
            translate('{{action}} opportunity...', { action: newStatus === 'active' ? translate('Activating') : translate('Deactivating') }),
        );

        router.put(
            route('opportunities.toggle-status', opportunity.id),
            {},
            {
                onSuccess: () => {
                    toast.dismiss();
                    if (activeView === 'kanban') {
                        loadKanbanData();
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
            },
        );
    };

    const handleResetFilters = () => {
        router.get(route('opportunities.index'), {
            view: activeView,
        });
    };

    const loadKanbanData = () => {
        if (activeView !== 'kanban') return;

        setIsLoadingKanban(true);

        // Use existing opportunities data to structure kanban
        const opportunitiesData = opportunities?.data || [];
        const structuredData = {};

        allOpportunityStages.forEach((stage) => {
            structuredData[stage.id] = {
                status: stage,
                items: opportunitiesData.filter((opportunity) => {
                    const matchesStage = opportunity.opportunity_stage?.id === stage.id;
                    const matchesSearch =
                        !searchTerm ||
                        opportunity.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        opportunity.description?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesAccount = selectedAccount === 'all' || opportunity.account_id?.toString() === selectedAccount;
                    const matchesSource = selectedSource === 'all' || opportunity.opportunity_source_id?.toString() === selectedSource;
                    const matchesStatus = selectedStatus === 'all' || opportunity.status === selectedStatus;

                    return matchesStage && matchesSearch && matchesAccount && matchesSource && matchesStatus;
                }),
            };
        });

        setKanbanData(structuredData);
        setKanbanDataRef(structuredData);
        setIsLoadingKanban(false);
    };

    useEffect(() => {
        if (activeView === 'kanban') {
            loadKanbanData();
        }
    }, [activeView, opportunities, searchTerm, selectedAccount, selectedSource, selectedStatus]);

    // Define page actions
    const pageActions = [];

    // Add export button
    if (useHasPermission('export-opportunities')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[450px]:mr-2" />,
            variant: 'outline',
            onClick: () => (window.location.href = route('opportunity.export')),
            className: 'h-8 w-8 min-[450px]:h-9 min-[450px]:w-auto px-0 min-[450px]:px-4',
            labelClassName: 'hidden min-[450px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[450px]:hidden',
        });
    }

    // Add the "Add Opportunity" button if user has permission
    if (useHasPermission('create-opportunities')) {
        pageActions.push({
            label: translate('Add Opportunity'),
            icon: <Plus className="mr-0 h-4 w-4 min-[450px]:mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew(),
            className: 'h-8 w-8 min-[450px]:h-9 min-[450px]:w-auto px-0 min-[450px]:px-4',
            labelClassName: 'hidden min-[450px]:inline',
            tooltip: translate('Add Opportunity'),
            tooltipClassName: 'min-[450px]:hidden',
        });
    }

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Opportunity Management') },
        { title: translate('Opportunities') },
    ];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: translate('Name'),
            sortable: true,
            render: (value: any, row: any) => (
                <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                        <div className="font-medium">{row.name}</div>
                        <div className="text-muted-foreground text-sm">{row.account?.name || translate('No account')}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'assigned_user',
            label: translate('Assigned To'),
            render: (value: any) =>
                value ? (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={value.avatar} />
                            <AvatarFallback>{getInitials(value.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{value.name}</div>
                            <div className="text-muted-foreground text-sm">{value.email}</div>
                        </div>
                    </div>
                ) : (
                    <span className="text-muted-foreground">{translate('Unassigned')}</span>
                ),
        },
        {
            key: 'opportunity_stage',
            label: translate('Stage'),
            render: (value: any) =>
                value ? (
                    <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        style={{
                            backgroundColor: value.color ? `${value.color}18` : undefined,
                            color: value.color,
                            borderColor: value.color ? `${value.color}40` : undefined,
                        }}
                    >
                        {value.name}
                    </span>
                ) : (
                    translate('-')
                ),
        },
        {
            key: 'opportunity_source',
            label: translate('Source'),
            render: (value: any) => <span>{value?.name || translate('-')}</span>,
        },
        {
            key: 'status',
            label: translate('Status'),
            render: (value: string) => (
                <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        value === 'active'
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                    }`}
                >
                    {value === 'active' ? translate('Active') : translate('Inactive')}
                </span>
            ),
        },
        {
            key: 'close_date',
            label: translate('Close Date'),
            sortable: true,
            type: 'date',
            // render: (value: string) => <span className="whitespace-nowrap">{value ? (window.appSettings?.formatDateTime(value, false) || '-') : translate('-')}</span>
        },
        // {
        //     key: 'created_at',
        //     label: translate('Created At'),
        //     sortable: true,
        //     type: 'date',
        // }
    ];

    // Define table actions
    const actions = [
        {
            label: translate('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-opportunities',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-opportunities',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-opportunities',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-opportunities',
        },
    ];

    return (
        <PageTemplate
            title={translate('Opportunities')}
            description={translate('Manage your opportunities')}
            url="/opportunities"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
            className={activeView === 'kanban' ? 'overflow-hidden' : ''}
        >
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
                            options: [
                                { value: 'all', label: translate('All Accounts') },
                                ...allAccounts.map((account: any) => ({
                                    value: account.id.toString(),
                                    label: account.name,
                                })),
                            ],
                        },
                        {
                            name: 'opportunity_stage_id',
                            label: translate('Stage'),
                            type: 'select',
                            searchable: true,
                            value: selectedStage,
                            onChange: setSelectedStage,
                            options: [
                                { value: 'all', label: translate('All Stages') },
                                ...allOpportunityStages.map((stage: any) => ({
                                    value: stage.id.toString(),
                                    label: stage.name,
                                })),
                            ],
                        },
                        {
                            name: 'opportunity_source_id',
                            label: translate('Source'),
                            type: 'select',
                            searchable: true,
                            value: selectedSource,
                            onChange: setSelectedSource,
                            options: [
                                { value: 'all', label: translate('All Sources') },
                                ...allOpportunitySources.map((source: any) => ({
                                    value: source.id.toString(),
                                    label: source.name,
                                })),
                            ],
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: [
                                { value: 'all', label: translate('All Status') },
                                { value: 'active', label: translate('Active') },
                                { value: 'inactive', label: translate('Inactive') },
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
                                ...allUsers.map((user: any) => ({
                                    value: user.id.toString(),
                                    label: user.name,
                                })),
                            ],
                        },
                    ]}
                    // showFilters={showFilters}
                    // setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    // onApplyFilters={applyFilters}
                    // {...(activeView !== 'kanban' && {
                    //     currentPerPage: pageFilters.per_page?.toString() || "10",
                    //     onPerPageChange: (value) => {
                    //         router.get(route('opportunities.index'), {
                    //             view: activeView,
                    //             page: 1,
                    //             search: searchTerm || undefined,
                    //             account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                    //             opportunity_stage_id: selectedStage !== 'all' ? selectedStage : undefined,
                    //             opportunity_source_id: selectedSource !== 'all' ? selectedSource : undefined,
                    //             status: selectedStatus !== 'all' ? selectedStatus : undefined,
                    //             assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                    //             sort_field: pageFilters.sort_field || undefined,
                    //             sort_direction: pageFilters.sort_direction || undefined,
                    //             ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                    //         }, { preserveState: true, preserveScroll: true });
                    //     }
                    // })}
                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={(view) => {
                        setActiveView(view);
                        router.get(
                            route('opportunities.index'),
                            {
                                view,
                                page: pageFilters.page || undefined,
                                search: searchTerm || undefined,
                                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                                opportunity_stage_id: selectedStage !== 'all' ? selectedStage : undefined,
                                opportunity_source_id: selectedSource !== 'all' ? selectedSource : undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                                sort_field: pageFilters.sort_field || undefined,
                                sort_direction: pageFilters.sort_direction || undefined,
                                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
                            },
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                    viewOptions={[
                        { value: 'list', label: translate('List View'), icon: 'List' },
                        { value: 'kanban', label: translate('Kanban View'), icon: 'Columns' },
                        // { value: 'grid', label: translate('Grid View'), icon: 'Grid3X3' }
                    ]}
                />
            </div>

            {/* Content section */}
            {activeView === 'list' ? (
                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={opportunities?.data || []}
                        from={opportunities?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-opportunities',
                            create: 'create-opportunities',
                            edit: 'edit-opportunities',
                            delete: 'delete-opportunities',
                        }}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={opportunities?.from || 1}
                        to={opportunities?.to || opportunities?.data?.length || 0}
                        total={opportunities?.total || opportunities?.data?.length || 0}
                        links={opportunities?.links}
                        entityName={translate('opportunities')}
                        onPageChange={(url) => router.get(url)}
                        {...(activeView !== 'kanban' && {
                            currentPerPage: pageFilters.per_page?.toString() || '10',
                            onPerPageChange: (value) => {
                                router.get(
                                    route('opportunities.index'),
                                    {
                                        view: activeView,
                                        page: 1,
                                        search: searchTerm || undefined,
                                        account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                                        opportunity_stage_id: selectedStage !== 'all' ? selectedStage : undefined,
                                        opportunity_source_id: selectedSource !== 'all' ? selectedSource : undefined,
                                        status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                        assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                                        sort_field: pageFilters.sort_field || undefined,
                                        sort_direction: pageFilters.sort_direction || undefined,
                                        ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                                    },
                                    { preserveState: true, preserveScroll: true },
                                );
                            },
                        })}
                    />
                </div>
            ) : activeView === 'kanban' ? (
                <>
                    <style>{`
                        .kanban-col-scroll::-webkit-scrollbar { width: 4px; }
                        .kanban-col-scroll::-webkit-scrollbar-track { background: transparent; }
                        .kanban-col-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                        .kanban-board-scroll::-webkit-scrollbar { height: 6px; }
                        .kanban-board-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
                        .kanban-board-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                    `}</style>
                    <div className="kanban-board-scroll flex gap-4 overflow-x-auto pb-2" style={{ height: 'calc(100vh - 240px)' }}>
                        {isLoadingKanban ? (
                            <div className="flex w-full items-center justify-center">
                                <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
                            </div>
                        ) : !(opportunityStages || []).length ? (
                            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                                <div className="flex max-w-sm flex-col items-center gap-5 text-center">
                                    <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-2xl">
                                        <LucidIcons.LayoutGrid className="text-primary h-10 w-10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                            {translate('No Opportunity Stage Yet')}
                                        </h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {translate('Set up opportunity stages to start organizing your work in a Kanban board.')}
                                        </p>
                                    </div>
                                    {useHasPermission('manage-opportunity-stages') && (
                                        <button
                                            onClick={() => router.visit(route('opportunity-stages.index'))}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {translate('Add Opportunity Stage')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            opportunityStages.map((stage: any) => {
                                const stageOpportunities =
                                    Object.values(kanbanData || {}).find((column: any) => column.status?.id === stage.id)?.items || [];
                                const colBg = stage.color ? `${stage.color}12` : '#f8fafc';
                                const colBorder = stage.color ? `${stage.color}30` : '#e2e8f0';
                                return (
                                    <div
                                        key={stage.id}
                                        className="flex flex-shrink-0 flex-col rounded-xl border"
                                        style={{
                                            width: '300px',
                                            minWidth: '300px',
                                            backgroundColor: dragOverStage === stage.id ? (stage.color ? `${stage.color}22` : '#e2e8f0') : colBg,
                                            borderColor: dragOverStage === stage.id ? stage.color || '#94a3b8' : colBorder,
                                            height: '100%',
                                            transition: 'background-color 0.15s, border-color 0.15s',
                                        }}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            setDragOverStage(stage.id);
                                        }}
                                        onDragLeave={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setDragOverStage(null);
                                            setDraggingId(null);
                                            const opportunityId = e.dataTransfer.getData('opportunityId');
                                            if (!opportunityId) return;
                                            if (!useHasPermission('edit-opportunities')) {
                                                toast.error(translate('Permission denied.'));
                                                return;
                                            }
                                            const allItems = Object.values(kanbanData).flatMap((c: any) => c.items);
                                            const currentOpportunity = allItems.find((o: any) => o.id.toString() === opportunityId);
                                            if (!currentOpportunity) return;
                                            if (currentOpportunity.opportunity_stage?.id === stage.id) return;
                                            // Optimistic update
                                            const updated = { ...kanbanData };
                                            Object.keys(updated).forEach((key) => {
                                                updated[key] = {
                                                    ...updated[key],
                                                    items: updated[key].items.filter((o: any) => o.id.toString() !== opportunityId),
                                                };
                                            });
                                            updated[stage.id] = {
                                                ...updated[stage.id],
                                                items: [...updated[stage.id].items, { ...currentOpportunity, opportunity_stage: stage }],
                                            };
                                            setKanbanData(updated);
                                            router.put(
                                                route('opportunities.update-status', opportunityId),
                                                { opportunity_stage_id: stage.id },
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        toast.dismiss();
                                                    },
                                                    onError: () => {
                                                        toast.dismiss();
                                                        toast.error(translate('Failed to update opportunity stage'));
                                                        setKanbanData(kanbanDataRef);
                                                    },
                                                },
                                            );
                                        }}
                                    >
                                        {/* Column header */}
                                        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: colBorder }}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                                    style={{ backgroundColor: stage.color }}
                                                ></span>
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{stage.name}</span>
                                                <span
                                                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                                    style={{ backgroundColor: stage.color + '22', color: stage.color }}
                                                >
                                                    {stageOpportunities.length}
                                                </span>
                                            </div>
                                            {useHasPermission('create-opportunities') && (
                                                <button
                                                    onClick={() => handleAddOpportunity(stage.id.toString())}
                                                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-800"
                                                    title={translate('Add Opportunity')}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Cards */}
                                        <div className="kanban-col-scroll flex-1 space-y-3 overflow-y-auto p-3">
                                            {stageOpportunities.length === 0 ? (
                                                <div className="flex h-40 flex-col items-center justify-center text-gray-300">
                                                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-gray-200">
                                                        <Building2 className="h-6 w-6 text-gray-300" />
                                                    </div>
                                                    <p className="text-xs text-gray-400">{translate('Drop opportunities here')}</p>
                                                </div>
                                            ) : (
                                                stageOpportunities.map((opportunity: any) => (
                                                    <div
                                                        key={opportunity.id}
                                                        draggable={useHasPermission('edit-opportunities')}
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('opportunityId', opportunity.id.toString());
                                                            setDraggingId(opportunity.id.toString());
                                                        }}
                                                        onDragEnd={() => {
                                                            setDraggingId(null);
                                                            setDragOverStage(null);
                                                        }}
                                                        className={useHasPermission('edit-opportunities') ? 'cursor-grab active:cursor-grabbing' : ''}
                                                        style={{
                                                            opacity: draggingId === opportunity.id.toString() ? 0.4 : 1,
                                                            transition: 'opacity 0.15s',
                                                        }}
                                                    >
                                                        <div className="rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                                            <div className="p-3">
                                                                {/* Top row: avatar + name/account + menu */}
                                                                <div className="mb-2.5 flex items-start gap-2.5">
                                                                    {/* <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-primary bg-primary/15 ring-1 ring-primary text-xs font-bold">
                                                                {getInitials(opportunity.name)}
                                                            </div> */}
                                                                    <div className="min-w-0 flex-1">
                                                                        <h4
                                                                            className="hover:text-primary cursor-pointer truncate text-sm leading-tight font-semibold text-gray-900 transition-colors dark:text-gray-100"
                                                                            onClick={() => handleAction('view', opportunity)}
                                                                        >
                                                                            {opportunity.name}
                                                                        </h4>
                                                                    </div>
                                                                    {(useHasPermission('view-opportunities') ||
                                                                        useHasPermission('edit-opportunities') ||
                                                                        useHasPermission('delete-opportunities')) && (
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
                                                                            <DropdownMenuContent align="end" className="w-40">
                                                                                {useHasPermission('view-opportunities') && (
                                                                                    <DropdownMenuItem
                                                                                        onClick={() => handleAction('view', opportunity)}
                                                                                    >
                                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                                        {translate('View')}
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                                {useHasPermission('edit-opportunities') && (
                                                                                    <DropdownMenuItem
                                                                                        onClick={() => handleAction('edit', opportunity)}
                                                                                    >
                                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                                        {translate('Edit')}
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                                {useHasPermission('delete-opportunities') && (
                                                                                    <>
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuItem
                                                                                            onClick={() => handleAction('delete', opportunity)}
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

                                                                {/* Account */}
                                                                {opportunity.account?.name && (
                                                                    <div className="mb-2 flex items-center gap-1.5">
                                                                        <Building2 className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                                                        <span className="truncate text-xs text-gray-500">
                                                                            {opportunity.account.name}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Contact */}
                                                                {opportunity.contact?.name && (
                                                                    <div className="mb-2 flex items-center gap-1.5">
                                                                        <User className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                                                        <span className="truncate text-xs text-gray-500">
                                                                            {opportunity.contact.name}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Amount + Source in one line */}
                                                                {(opportunity.amount || opportunity.opportunity_source) && (
                                                                    <div className="mb-3 flex items-center gap-2">
                                                                        {opportunity.amount && (
                                                                            <div className="flex items-center gap-1">
                                                                                <Banknote className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                                                                <span className="font-mono text-xs text-gray-500">
                                                                                    {window.appSettings?.formatCurrency(
                                                                                        parseFloat(opportunity.amount),
                                                                                    ) || `$${parseFloat(opportunity.amount).toFixed(2)}`}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {opportunity.opportunity_source && (
                                                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-gray-600/20 ring-inset">
                                                                                {opportunity.opportunity_source.name}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Footer: date + assigned avatar */}
                                                                <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                        <Calendar className="h-3 w-3" />
                                                                        <span>
                                                                            {window.appSettings?.formatDateTime(
                                                                                opportunity.close_date || opportunity.created_at,
                                                                                false,
                                                                            ) ||
                                                                                new Date(
                                                                                    opportunity.close_date || opportunity.created_at,
                                                                                ).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                    {opportunity.assigned_user ? (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Avatar className="h-7 w-7 cursor-pointer">
                                                                                        <AvatarImage src={opportunity.assigned_user.avatar} />
                                                                                        <AvatarFallback
                                                                                            className="text-xs"
                                                                                            style={{
                                                                                                backgroundColor: stage.color + '33',
                                                                                                color: stage.color,
                                                                                            }}
                                                                                        >
                                                                                            {getInitials(opportunity.assigned_user.name)}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>{opportunity.assigned_user.name}</TooltipContent>
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
                </>
            ) : (
                <div>
                    {/* Grid View */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {opportunities?.data?.map((opportunity: any) => (
                            <Card
                                key={opportunity.id}
                                className="rounded-lg border border-gray-300 bg-white shadow dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div className="flex h-full flex-col p-6">
                                    <div className="mb-4 flex items-start justify-between">
                                        <div className="flex items-start space-x-4">
                                            <div className="bg-primary/15 text-primary ring-primary flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ring-1">
                                                {getInitials(opportunity.name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{opportunity.name}</h3>
                                                <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {opportunity.account?.name || translate('No account')}
                                                </p>
                                                <div className="flex items-center">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${opportunity.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}
                                                    >
                                                        {opportunity.status === 'active' ? translate('Active') : translate('Inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 flex-shrink-0 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="z-50 w-48" sideOffset={5}>
                                                {useHasPermission('view-opportunities') && (
                                                    <DropdownMenuItem onClick={() => handleAction('view', opportunity)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        <span>{translate('View Opportunity')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('toggle-status-opportunities') && (
                                                    <DropdownMenuItem onClick={() => handleAction('toggle-status', opportunity)}>
                                                        <Lock className="mr-2 h-4 w-4" />
                                                        <span>
                                                            {opportunity.status === 'active' ? translate('Deactivate') : translate('Activate')}
                                                        </span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {useHasPermission('edit-opportunities') && (
                                                    <DropdownMenuItem onClick={() => handleAction('edit', opportunity)} className="text-amber-600">
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>{translate('Edit')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('delete-opportunities') && (
                                                    <DropdownMenuItem onClick={() => handleAction('delete', opportunity)} className="text-rose-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>{translate('Delete')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Opportunity info */}
                                    <div className="mb-4 flex-1 rounded-md border border-gray-200 p-3 dark:border-gray-700">
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {translate('Amount')}:{' '}
                                                <span className="font-mono">
                                                    {opportunity.amount
                                                        ? window.appSettings?.formatCurrency(parseFloat(opportunity.amount)) ||
                                                          `$${parseFloat(opportunity.amount).toFixed(2)}`
                                                        : translate('-')}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="h-4 w-4 text-gray-500" />

                                                <span>
                                                    {translate('Close Date')}:{' '}
                                                    {opportunity.close_date || opportunity.created_at
                                                        ? window.appSettings?.formatDateTime(
                                                              opportunity.close_date || opportunity.created_at,
                                                              false,
                                                          ) || new Date(opportunity.close_date || opportunity.created_at).toLocaleDateString()
                                                        : translate('-')}
                                                </span>
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {opportunity.opportunity_stage && (
                                                <span
                                                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                                    style={{
                                                        backgroundColor: `${opportunity.opportunity_stage.color}20`,
                                                        color: opportunity.opportunity_stage.color,
                                                        borderColor: `${opportunity.opportunity_stage.color}40`,
                                                    }}
                                                >
                                                    {opportunity.opportunity_stage.name}
                                                </span>
                                            )}
                                            {opportunity.opportunity_source && (
                                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-green-600/20 ring-inset">
                                                    {opportunity.opportunity_source.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Created date */}
                                    <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-4 w-4 text-gray-500" />

                                        <span>
                                            {translate('Created:')}{' '}
                                            {window.appSettings?.formatDateTime(opportunity.created_at, false) ||
                                                new Date(opportunity.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-auto flex gap-2">
                                        {useHasPermission('edit-opportunities') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('edit', opportunity)}
                                                className="h-9 flex-1 border-gray-300 text-sm dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Edit className="mr-2 h-4 w-4 text-gray-500" />
                                                {translate('Edit')}
                                            </Button>
                                        )}

                                        {useHasPermission('view-opportunities') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('view', opportunity)}
                                                className="h-9 flex-1 border-gray-300 text-sm dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Eye className="mr-2 h-4 w-4 text-gray-500" />
                                                {translate('View')}
                                            </Button>
                                        )}

                                        {useHasPermission('delete-opportunities') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('delete', opportunity)}
                                                className="h-9 flex-1 border-gray-300 text-sm dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4 text-gray-500" />
                                                {translate('Delete')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination for grid view */}
                    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                        <Pagination
                            from={opportunities?.from || 1}
                            to={opportunities?.to || opportunities?.data?.length || 0}
                            total={opportunities?.total || opportunities?.data?.length || 0}
                            links={opportunities?.links}
                            entityName={translate('opportunities')}
                            onPageChange={(url) => router.get(url)}
                            perPageOptions={[12, 24, 48, 96]}
                            currentPerPage={pageFilters.per_page?.toString() || '12'}
                            onPerPageChange={(value) => {
                                router.get(
                                    route('opportunities.index'),
                                    {
                                        view: activeView,
                                        page: 1,
                                        search: searchTerm || undefined,
                                        account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                                        opportunity_stage_id: selectedStage !== 'all' ? selectedStage : undefined,
                                        opportunity_source_id: selectedSource !== 'all' ? selectedSource : undefined,
                                        status: selectedStatus !== 'all' ? selectedStatus : undefined,
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

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={translate('opportunity')}
            />
        </PageTemplate>
    );
}
