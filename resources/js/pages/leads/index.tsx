import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { ImportModal } from '@/components/ImportModal';
import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { router, usePage } from '@inertiajs/react';
import * as LucidIcons from 'lucide-react';
import { Banknote, Building2, Edit, Eye, FileDown, FileUp, MoreHorizontal, Plus, Trash2, User, Users } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function Leads() {
    const { t: translate } = useTranslation();
    const {
        auth,
        leads,
        leadStatuses = [],
        allLeadStatuses = [],
        leadSources = [],
        allLeadSources = [],
        accounts = [],
        campaigns = [],
        accountIndustries = [],
        accountTypes = [],
        users = [],
        allUsers = [],
        samplePath,
        filters: pageFilters = {},
        kanbanData: initialKanbanData,
        flash = {},
    } = usePage().props;

    useEffect(() => {
        if (importingRef.current) {
            importingRef.current = false;
            return;
        }
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
        else if (flash?.warning) toast.warning(t(flash.warning));
    }, [flash]);
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedLeadStatus, setSelectedLeadStatus] = useState(pageFilters.lead_status_id || 'all');
    const [selectedLeadSource, setSelectedLeadSource] = useState(pageFilters.lead_source_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedConverted, setSelectedConverted] = useState(pageFilters.is_converted || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const importingRef = useRef(false);
    const [convertType, setConvertType] = useState<'account' | 'contact'>('account');
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [activeView, setActiveView] = useState(['list', 'grid', 'kanban'].includes(pageFilters.view) ? pageFilters.view : 'kanban');
    const [kanbanData, setKanbanData] = useState<any>(null);
    const [kanbanDataRef, setKanbanDataRef] = useState<any>(null);
    const [isLoadingKanban, setIsLoadingKanban] = useState(false);
    const [pageInitialState, setPageInitialState] = useState(true);
    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedStatus, selectedConverted, selectedAssignee, selectedLeadStatus, selectedLeadSource]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            searchTerm !== '' ||
            selectedLeadStatus !== 'all' ||
            selectedLeadSource !== 'all' ||
            selectedStatus !== 'all' ||
            selectedConverted !== 'all' ||
            selectedAssignee !== 'all'
        );
    };

    const hasEmptyDropdowns =
        leadStatuses.length === 0 || leadSources.length === 0 || accountIndustries.length === 0 || campaigns.length === 0 || users.length === 0;

    // Count active filters
    const activeFilterCount = () => {
        return (
            (searchTerm ? 1 : 0) +
            (selectedLeadStatus !== 'all' ? 1 : 0) +
            (selectedLeadSource !== 'all' ? 1 : 0) +
            (selectedStatus !== 'all' ? 1 : 0) +
            (selectedConverted !== 'all' ? 1 : 0) +
            (selectedAssignee !== 'all' ? 1 : 0)
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('leads.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                lead_status_id: selectedLeadStatus !== 'all' ? selectedLeadStatus : undefined,
                lead_source_id: selectedLeadSource !== 'all' ? selectedLeadSource : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                is_converted: selectedConverted !== 'all' ? selectedConverted : undefined,
                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                sort_field: pageFilters.sort_field || undefined,
                sort_direction: pageFilters.sort_direction || undefined,
                ...(parseInt(pageFilters.per_page) !== (activeView === 'grid' ? 12 : 10) &&
                    pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleExport = () => {
        (CrudFormModal as any).handleExport?.();
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(
            route('leads.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                lead_status_id: selectedLeadStatus !== 'all' ? selectedLeadStatus : undefined,
                lead_source_id: selectedLeadSource !== 'all' ? selectedLeadSource : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                is_converted: selectedConverted !== 'all' ? selectedConverted : undefined,
                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                sort_field: field,
                sort_direction: direction,
                ...(parseInt(pageFilters.per_page) !== (activeView === 'grid' ? 12 : 10) &&
                    pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view':
                router.get(route('leads.show', item.id));
                break;
            case 'edit':
                router.get(route('leads.edit', item.id));
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(item);
                break;
            case 'convert-to-account':
                setConvertType('account');
                setIsConvertModalOpen(true);
                break;
            case 'convert-to-contact':
                setConvertType('contact');
                setIsConvertModalOpen(true);
                break;
        }
    };

    const handleAddNew = () => {
        router.get(route('leads.create'));
    };

    const handleAddLead = (statusId: string) => {
        router.get(route('leads.create'), { lead_status_id: statusId });
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting lead...'));

        router.delete(route('leads.destroy', currentItem.id), {
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

    const handleToggleStatus = (lead: any) => {
        if (!useHasPermission('toggle-status-leads')) {
            toast.error(translate('Permission denied.'));
            return;
        }

        const newStatus = lead.status === 'active' ? 'inactive' : 'active';
        toast.loading(`${newStatus === 'active' ? translate('Activating') : translate('Deactivating')} lead...`);

        router.put(
            route('leads.toggle-status', lead.id),
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
                        toast.error(translate('Failed to update status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const handleConvertSubmit = (formData: any) => {
        const route_name = convertType === 'account' ? 'leads.convert-to-account' : 'leads.convert-to-contact';
        toast.loading(t(`Converting lead to ${convertType}...`));

        router.put(route(route_name, currentItem.id), formData, {
            // router.post(route(route_name, currentItem.id), formData, {
            onSuccess: (page) => {
                setIsConvertModalOpen(false);
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
                    toast.error(translate('Failed to convert: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleResetFilters = () => {
        router.get(route('leads.index'), {
            view: activeView,
        });
    };

    const loadKanbanData = () => {
        if (activeView !== 'kanban' || leadStatuses.length === 0) return;

        setIsLoadingKanban(true);

        // Use existing leads data to structure kanban
        const leadsData = leads?.data || [];
        const structuredData = {};

        leadStatuses.forEach((status) => {
            structuredData[status.id] = {
                status: status,
                items: leadsData.filter((lead) => {
                    const matchesStatus = lead.lead_status?.id === status.id;
                    const matchesSearch =
                        !searchTerm ||
                        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.organization?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesSource = selectedLeadSource === 'all' || lead.lead_source_id?.toString() === selectedLeadSource;
                    const matchesActiveStatus = selectedStatus === 'all' || lead.status === selectedStatus;
                    const matchesConverted =
                        selectedConverted === 'all' ||
                        (selectedConverted === '1' && lead.is_converted) ||
                        (selectedConverted === '0' && !lead.is_converted);

                    return matchesStatus && matchesSearch && matchesSource && matchesActiveStatus && matchesConverted;
                }),
            };
        });

        setKanbanData(structuredData);
        setKanbanDataRef(structuredData);
        setIsLoadingKanban(false);
    };

    useEffect(() => {
        if (activeView === 'kanban' && leadStatuses.length > 0) {
            loadKanbanData();
        }
    }, [activeView, leads, searchTerm, selectedLeadSource, selectedStatus, selectedConverted, leadStatuses]);

    // Define page actions
    const pageActions = [];

    // Add export button
    if (useHasPermission('export-leads')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[450px]:mr-2" />,
            variant: 'outline',
            onClick: () => handleExport(),
            className: 'h-8 w-8 min-[450px]:h-9 min-[450px]:w-auto px-0 min-[450px]:px-4',
            labelClassName: 'hidden min-[450px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[450px]:hidden',
        });
    }

    // Add import button
    if (useHasPermission('import-leads')) {
        pageActions.push({
            label: translate('Import'),
            icon: <FileUp className="mr-0 h-4 w-4 min-[450px]:mr-2" />,
            variant: 'outline',
            onClick: () => setIsImportModalOpen(true),
            className: 'h-8 w-8 min-[450px]:h-9 min-[450px]:w-auto px-0 min-[450px]:px-4',
            labelClassName: 'hidden min-[450px]:inline',
            tooltip: translate('Import'),
            tooltipClassName: 'min-[450px]:hidden',
        });
    }

    // Add the "Add Lead" button if user has permission
    if (useHasPermission('create-leads')) {
        pageActions.push({
            label: translate('Add Lead'),
            icon: <Plus className="mr-0 h-4 w-4 min-[450px]:mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew(),
            disabled: hasEmptyDropdowns,
            className: 'h-8 w-8 min-[450px]:h-9 min-[450px]:w-auto px-0 min-[450px]:px-4',
            labelClassName: 'hidden min-[450px]:inline',
            tooltip: translate('Add Lead'),
            tooltipClassName: 'min-[450px]:hidden',
        });
    }
    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Lead Management') },
        { title: translate('Leads') },
    ];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: translate('Name'),
            sortable: true,
            render: (value: any, row: any) => {
                return (
                    <div className="flex items-center gap-3">
                        <UserInitials name={row.name} />
                        <div>
                            <div className="font-medium">{row.name}</div>
                            <div className="text-muted-foreground text-sm">{row.email || translate('No email')}</div>
                        </div>
                    </div>
                );
            },
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
            key: 'value',
            label: translate('Value'),
            sortable: true,
            render: (value: any) =>
                value ? (
                    <span className="font-mono">{window.appSettings?.formatCurrency(parseFloat(value)) || `$${parseFloat(value).toFixed(2)}`}</span>
                ) : (
                    translate('-')
                ),
        },
        {
            key: 'lead_status',
            label: translate('Progress'),
            render: (value: any) =>
                value ? (
                    <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        style={{ backgroundColor: value.color + '20', color: value.color, borderColor: value.color + '40' }}
                    >
                        {value.name}
                    </span>
                ) : (
                    translate('-')
                ),
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
            key: 'is_converted',
            label: translate('Converted'),
            render: (value: boolean) => (
                <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        value
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                            : 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20 ring-inset'
                    }`}
                >
                    {value ? translate('Yes') : translate('No')}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: translate('Created At'),
            sortable: true,
            type: 'date',
        },
    ];

    // Define table actions
    const actions = [
        {
            label: translate('Convert to Account'),
            icon: 'Building2',
            action: 'convert-to-account',
            className: 'text-green-500',
            requiredPermission: 'convert-leads',
            condition: (item: any) => !item.is_converted,
        },
        {
            label: translate('Convert to Contact'),
            icon: 'Users',
            action: 'convert-to-contact',
            className: 'text-blue-500',
            requiredPermission: 'convert-leads',
            condition: (item: any) => !item.is_converted,
        },
        {
            label: translate('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-leads',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-leads',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-leads',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-leads',
        },
    ];

    return (
        <PageTemplate
            title={translate('Leads')}
            description={translate('Manage your leads')}
            url="/leads"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
            className={activeView === 'kanban' ? 'overflow-hidden' : ''}
        >
            {/* Search and filters section */}
            {/* <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4"> */}
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'lead_status_id',
                            label: translate('Lead Status'),
                            type: 'select' as const,
                            searchable: true,
                            value: selectedLeadStatus,
                            onChange: setSelectedLeadStatus,
                            options: [
                                { value: 'all', label: translate('All Statuses') },
                                ...allLeadStatuses.map((status: any) => ({
                                    value: status.id.toString(),
                                    label: status.name,
                                })),
                            ],
                        },
                        {
                            name: 'lead_source_id',
                            label: translate('Lead Source'),
                            type: 'select' as const,
                            searchable: true,
                            value: selectedLeadSource,
                            onChange: setSelectedLeadSource,
                            options: [
                                { value: 'all', label: translate('All Sources') },
                                ...allLeadSources.map((source: any) => ({
                                    value: source.id.toString(),
                                    label: source.name,
                                })),
                            ],
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select' as const,
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: [
                                { value: 'all', label: translate('All Status') },
                                { value: 'active', label: translate('Active') },
                                { value: 'inactive', label: translate('Inactive') },
                            ],
                        },
                        {
                            name: 'is_converted',
                            label: translate('Conversion Status'),
                            type: 'select' as const,
                            value: selectedConverted,
                            onChange: setSelectedConverted,
                            options: [
                                { value: 'all', label: translate('All Leads') },
                                { value: '1', label: translate('Converted') },
                                { value: '0', label: translate('Not Converted') },
                            ],
                        },
                        {
                            name: 'assigned_to',
                            label: translate('Assigned To'),
                            type: 'select' as const,
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
                    {...(activeView !== 'kanban' && {})}
                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={(view) => {
                        setActiveView(view);
                        router.get(
                            route('leads.index'),
                            {
                                view,
                                page: pageFilters.page || undefined,
                                search: searchTerm || undefined,
                                lead_status_id: selectedLeadStatus !== 'all' ? selectedLeadStatus : undefined,
                                lead_source_id: selectedLeadSource !== 'all' ? selectedLeadSource : undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                is_converted: selectedConverted !== 'all' ? selectedConverted : undefined,
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
                        data={leads?.data || []}
                        from={leads?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-leads',
                            create: 'create-leads',
                            edit: 'edit-leads',
                            delete: 'delete-leads',
                        }}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={leads?.from || 1}
                        to={leads?.to || leads?.data?.length || 0}
                        total={leads?.total || leads?.data?.length || 0}
                        links={leads?.links}
                        entityName={translate('leads')}
                        onPageChange={(url) => router.get(url)}
                        //  {...(activeView !== 'kanban' && {
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            router.get(
                                route('leads.index'),
                                {
                                    page: 1,
                                    view: activeView,
                                    search: searchTerm || undefined,
                                    lead_status_id: selectedLeadStatus !== 'all' ? selectedLeadStatus : undefined,
                                    lead_source_id: selectedLeadSource !== 'all' ? selectedLeadSource : undefined,
                                    status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                    is_converted: selectedConverted !== 'all' ? selectedConverted : undefined,
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
                        ) : !(leadStatuses || []).length ? (
                            <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                                <div className="flex max-w-sm flex-col items-center gap-5 text-center">
                                    <div className="bg-primary/10 flex h-20 w-20 items-center justify-center rounded-2xl">
                                        <LucidIcons.LayoutGrid className="text-primary h-10 w-10" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{translate('No Lead Status Yet')}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">
                                            {translate('Set up lead statuses to start organizing your work in a Kanban board.')}
                                        </p>
                                    </div>
                                    {useHasPermission('manage-lead-statuses') && (
                                        <button
                                            onClick={() => router.visit(route('lead-statuses.index'))}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {translate('Add Lead Status')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            leadStatuses.map((status: any) => {
                                const statusLeads = kanbanData?.[status.id]?.items || [];
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
                                            const leadId = e.dataTransfer.getData('leadId');
                                            if (!leadId) return;
                                            if (!useHasPermission('edit-leads')) {
                                                toast.error(translate('Permission denied.'));
                                                return;
                                            }
                                            const currentLead = Object.values(kanbanData)
                                                .flatMap((c: any) => c.items)
                                                .find((l: any) => l.id.toString() === leadId);
                                            if (currentLead) {
                                                toast.loading(translate('Updating...'));
                                                router.put(
                                                    route('leads.update', leadId),
                                                    { ...(currentLead as any), lead_status_id: status.id },
                                                    {
                                                        onSuccess: () => {
                                                            toast.dismiss();
                                                            loadKanbanData();
                                                        },
                                                        onError: () => {
                                                            toast.dismiss();
                                                            toast.error(translate('Failed to update lead status'));
                                                        },
                                                    },
                                                );
                                            }
                                        }}
                                    >
                                        {/* Column header */}
                                        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: colBorder }}>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                                                    style={{ backgroundColor: status.color }}
                                                ></span>
                                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{status.name}</span>
                                                <span
                                                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                                    style={{ backgroundColor: status.color + '22', color: status.color }}
                                                >
                                                    {statusLeads.length}
                                                </span>
                                            </div>
                                            {useHasPermission('create-leads') && (
                                                <button
                                                    onClick={() => handleAddLead(status.id.toString())}
                                                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-800"
                                                    title={translate('Add Lead')}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Cards */}
                                        <div className="kanban-col-scroll flex-1 space-y-3 overflow-y-auto p-3">
                                            {statusLeads.length === 0 ? (
                                                <div className="flex h-40 flex-col items-center justify-center text-gray-300">
                                                    <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-gray-200">
                                                        <User className="h-6 w-6 text-gray-300" />
                                                    </div>
                                                    <p className="text-xs text-gray-400">{translate('Drop leads here')}</p>
                                                </div>
                                            ) : (
                                                statusLeads.map((lead: any) => (
                                                    <div
                                                        key={lead.id}
                                                        draggable={useHasPermission('edit-leads')}
                                                        onDragStart={(e) => {
                                                            if (!useHasPermission('edit-leads')) {
                                                                e.preventDefault();
                                                                return;
                                                            }
                                                            e.dataTransfer.setData('leadId', lead.id.toString());
                                                            e.currentTarget.classList.add('opacity-50');
                                                        }}
                                                        onDragEnd={(e) => e.currentTarget.classList.remove('opacity-50')}
                                                        className={useHasPermission('edit-leads') ? 'cursor-grab active:cursor-grabbing' : ''}
                                                    >
                                                        <div className="rounded-lg border border-gray-100 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                                                            <div className="p-3">
                                                                {/* Top row: avatar + name/email + menu */}
                                                                <div className="mb-2.5 flex items-start gap-2.5">
                                                                    <UserInitials name={lead.name} />
                                                                    <div className="min-w-0 flex-1">
                                                                        <h4
                                                                            className="hover:text-primary cursor-pointer truncate text-sm leading-tight font-semibold text-gray-900 transition-colors dark:text-gray-100"
                                                                            onClick={() => handleAction('view', lead)}
                                                                        >
                                                                            {lead.name}
                                                                        </h4>
                                                                        <p className="mt-0.5 truncate text-xs text-gray-500">
                                                                            {lead.email || translate('No email')}
                                                                        </p>
                                                                    </div>
                                                                    {(useHasPermission('view-leads') ||
                                                                        useHasPermission('edit-leads') ||
                                                                        useHasPermission('convert-leads') ||
                                                                        useHasPermission('delete-leads')) && (
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
                                                                                {useHasPermission('view-leads') && (
                                                                                    <DropdownMenuItem onClick={() => handleAction('view', lead)}>
                                                                                        <Eye className="tex mr-2 h-4 w-4" />
                                                                                        {translate('View')}
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                                {useHasPermission('edit-leads') && (
                                                                                    <DropdownMenuItem onClick={() => handleAction('edit', lead)}>
                                                                                        <Edit className="mr-2 h-4 w-4" />
                                                                                        {translate('Edit')}
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                                {useHasPermission('convert-leads') && !lead.is_converted && (
                                                                                    <>
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuItem
                                                                                            onClick={() => handleAction('convert-to-account', lead)}
                                                                                            className="text-green-600"
                                                                                        >
                                                                                            <Building2 className="mr-2 h-4 w-4" />
                                                                                            {translate('To Account')}
                                                                                        </DropdownMenuItem>
                                                                                        <DropdownMenuItem
                                                                                            onClick={() => handleAction('convert-to-contact', lead)}
                                                                                            className="text-blue-600"
                                                                                        >
                                                                                            <Users className="mr-2 h-4 w-4" />
                                                                                            {translate('To Contact')}
                                                                                        </DropdownMenuItem>
                                                                                    </>
                                                                                )}
                                                                                {useHasPermission('delete-leads') && (
                                                                                    <>
                                                                                        <DropdownMenuSeparator />
                                                                                        <DropdownMenuItem
                                                                                            onClick={() => handleAction('delete', lead)}
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

                                                                {/* Organization */}
                                                                {lead.organization && (
                                                                    <div className="mb-2 flex items-center gap-1.5">
                                                                        <Building2 className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                                                        <span className="truncate text-xs text-gray-500">{lead.organization}</span>
                                                                    </div>
                                                                )}

                                                                {/* Value */}
                                                                {lead.value && (
                                                                    <div className="mb-2 flex items-center gap-1.5">
                                                                        <Banknote className="h-3 w-3 flex-shrink-0 text-gray-400" />
                                                                        <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                                            {window.appSettings?.formatCurrency(parseFloat(lead.value)) ||
                                                                                `$${parseFloat(lead.value).toFixed(2)}`}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Source badge + converted badge */}
                                                                {(lead.lead_source || lead.is_converted) && (
                                                                    <div className="mb-2.5 flex flex-wrap gap-1">
                                                                        {lead.lead_source && (
                                                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-gray-600/20 ring-inset">
                                                                                {lead.lead_source.name}
                                                                            </span>
                                                                        )}
                                                                        {lead.is_converted && (
                                                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                                                                                {translate('Converted')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Footer: date + assigned avatar */}
                                                                <div className="flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                        <LucidIcons.Calendar className="h-3 w-3" />
                                                                        <span>
                                                                            {window.appSettings?.formatDateTime(lead.created_at, false) ||
                                                                                new Date(lead.created_at).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                    {lead.assigned_user ? (
                                                                        <TooltipProvider>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <Avatar className="h-7 w-7 cursor-pointer">
                                                                                        <AvatarImage src={lead.assigned_user.avatar} />
                                                                                        <AvatarFallback
                                                                                            className="text-xs"
                                                                                            style={{
                                                                                                backgroundColor: status.color + '33',
                                                                                                color: status.color,
                                                                                            }}
                                                                                        >
                                                                                            {getInitials(lead.assigned_user.name)}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>{lead.assigned_user.name}</TooltipContent>
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
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {leads?.data?.map((lead: any) => (
                            <Card key={lead.id} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start space-x-4">
                                            <div className="h-16 w-16 rounded-full bg-primary/15 text-primary ring-1 ring-primary flex items-center justify-center text-lg font-bold">
                                                {getInitials(lead.name)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{lead.name}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{lead.email || translate('No email')}</p>
                                                <div className="flex items-center">
                                                    <div className={`h-2 w-2 rounded-full mr-2 ${lead.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                                                        }`}></div>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {lead.status === 'active' ? translate('Active') : translate('Inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div> */}

                    {/* Actions dropdown */}
                    {/* {(useHasPermission('view-leads') || useHasPermission('edit-leads') || useHasPermission('convert-leads') || useHasPermission('delete-leads') || useHasPermission('toggle-status-leads') || useHasPermission('edit-leads')) && <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 z-50" sideOffset={5}>
                                                {useHasPermission('view-leads') && (
                                                    <DropdownMenuItem onClick={() => handleAction('view', lead)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        <span>{translate("View Lead")}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('toggle-status-leads') && (
                                                    <DropdownMenuItem onClick={() => handleAction('toggle-status', lead)}>
                                                        <Lock className="h-4 w-4 mr-2" />
                                                        <span>{lead.status === 'active' ? t("Deactivate") : t("Activate")}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('convert-leads') && !lead.is_converted && (
                                                    <>
                                                        <DropdownMenuItem onClick={() => handleAction('convert-to-account', lead)} className="text-green-600">
                                                            <Building2 className='mr-2 w-4 h-4' />
                                                            <span>{translate("Convert to Account")}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleAction('convert-to-contact', lead)} className="text-blue-600">
                                                            <Users className='mr-2 w-4 h-4' />
                                                            <span>{translate("Convert to Contact")}</span>
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                                <DropdownMenuSeparator />
                                                {useHasPermission('edit-leads') && (
                                                    <DropdownMenuItem onClick={() => handleAction('edit', lead)} className="text-amber-600">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        <span>{translate("Edit")}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('delete-leads') && (
                                                    <DropdownMenuItem onClick={() => handleAction('delete', lead)} className="text-rose-600">
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        <span>{translate("Delete")}</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                        }
                                    </div> */}

                    {/* Lead info */}
                    {/* <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-4">
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {translate('Organization')}: {lead.organization || translate('-')}
                                            </span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {translate('Value')}: {lead.value ? (window.appSettings?.formatCurrency(parseFloat(lead.value)) || `$${parseFloat(lead.value).toFixed(2)}`) : translate('-')}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {lead.lead_status && (
                                                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset " style={{
                                                    backgroundColor: `${lead.lead_status.color}20`,
                                                    color: lead.lead_status.color,
                                                    borderColor: `${lead.lead_status.color}40`
                                                }}>
                                                    {lead.lead_status.name}
                                                </span>
                                            )}
                                            {lead.is_converted && (
                                                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20">
                                                    {translate('Converted')}
                                                </span>
                                            )}
                                        </div>
                                    </div> */}

                    {/* Created date */}
                    {/* <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        {translate("Created:")} {window.appSettings?.formatDateTime(lead.created_at, false) || new Date(lead.created_at).toLocaleDateString()}
                                    </div> */}
                    {/* <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <span>{translate("Created:")}</span>

                                        {lead.created_at && <LucidIcons.Calendar className="h-4 w-4" />}

                                        <span>
                                            {window.appSettings?.formatDateTime(lead.created_at, false) ||
                                                new Date(lead.created_at).toLocaleDateString()}
                                        </span>
                                    </div> */}

                    {/* Action buttons */}
                    {/* <div className="flex gap-2">
                                        {useHasPermission('edit-leads') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('edit', lead)}
                                                className="flex-1 h-9 text-sm border-gray-300 dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                {translate("Edit")}
                                            </Button>
                                        )}

                                        {useHasPermission('view-leads') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('view', lead)}
                                                className="flex-1 h-9 text-sm border-gray-300 dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                {translate("View")}
                                            </Button>
                                        )}

                                        {useHasPermission('delete-leads') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('delete', lead)}
                                                className="flex-1 h-9 text-sm text-gray-700 border-gray-300 dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {translate("Delete")}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div> */}

                    {/* Pagination for grid view */}
                    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                        <Pagination
                            from={leads?.from || 1}
                            to={leads?.to || leads?.data?.length || 0}
                            total={leads?.total || leads?.data?.length || 0}
                            links={leads?.links}
                            entityName={translate('leads')}
                            onPageChange={(url) => router.get(url)}
                            perPageOptions={[12, 24, 48, 96]}
                            currentPerPage={pageFilters.per_page?.toString() || '12'}
                            onPerPageChange={(value) => {
                                router.get(
                                    route('leads.index'),
                                    {
                                        page: 1,
                                        view: activeView,
                                        search: searchTerm || undefined,
                                        lead_status_id: selectedLeadStatus !== 'all' ? selectedLeadStatus : undefined,
                                        lead_source_id: selectedLeadSource !== 'all' ? selectedLeadSource : undefined,
                                        status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                        is_converted: selectedConverted !== 'all' ? selectedConverted : undefined,
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

            {/* Export Modal - mounted for export functionality only */}
            {useHasPermission('export-leads') && (
                <CrudFormModal
                    isOpen={false}
                    onClose={() => {}}
                    onSubmit={() => {}}
                    formConfig={{
                        exportRoute: 'lead.export',
                        fields: [],
                    }}
                    initialData={null}
                    title=""
                    mode="create"
                />
            )}

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={translate('lead')}
            />

            {/* Convert Modal */}
            <CrudFormModal
                isOpen={isConvertModalOpen}
                onClose={() => setIsConvertModalOpen(false)}
                onSubmit={handleConvertSubmit}
                formConfig={{
                    fields:
                        convertType === 'account'
                            ? [
                                  {
                                      name: 'account_type_id',
                                      label: translate('Account Type'),
                                      type: 'select',
                                      required: true,
                                      searchable: true,
                                      options: accountTypes.map((type: any) => ({
                                          value: type.id,
                                          label: type.name,
                                      })),
                                      emptyNote:
                                          accountTypes.length === 0
                                              ? {
                                                    link: route('account-types.index'),
                                                    linkText: translate('Account Types'),
                                                }
                                              : undefined,
                                  },
                                  {
                                      name: 'account_industry_id',
                                      label: translate('Account Industry'),
                                      type: 'select',
                                      required: true,
                                      searchable: true,
                                      options: accountIndustries.map((industry: any) => ({
                                          value: industry.id,
                                          label: industry.name,
                                      })),
                                      emptyNote:
                                          accountIndustries.length === 0
                                              ? {
                                                    link: route('account-industries.index'),
                                                    linkText: translate('Account Industries'),
                                                }
                                              : undefined,
                                  },
                                  { name: 'website', label: translate('Website'), type: 'text', colSpan: 2, placeholder: 'eg. https://kakbima.dev' },
                                  {
                                      name: 'billing_address',
                                      label: translate('Billing Address'),
                                      type: 'textarea',
                                      required: true,
                                      colSpan: 2,
                                      placeholder: translate('eg. 123 Main St'),
                                  },
                                  {
                                      name: 'billing_city',
                                      label: translate('Billing City'),
                                      type: 'text',
                                      required: true,
                                      placeholder: translate('eg. New York'),
                                  },
                                  {
                                      name: 'billing_state',
                                      label: translate('Billing State'),
                                      type: 'text',
                                      required: true,
                                      placeholder: translate('eg. NY'),
                                  },
                                  {
                                      name: 'billing_postal_code',
                                      label: translate('Billing Postal Code'),
                                      type: 'text',
                                      required: true,
                                      placeholder: translate('eg. 10001'),
                                  },
                                  {
                                      name: 'billing_country',
                                      label: translate('Billing Country'),
                                      type: 'text',
                                      required: true,
                                      placeholder: translate('eg. United States'),
                                  },
                                  {
                                      name: 'billing_shipping_section',
                                      type: 'custom',
                                      render: (field: any, formData: any, handleChange: any) => (
                                          <div className="flex justify-center">
                                              <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                      setTimeout(() => {
                                                          const textareas = document.querySelectorAll('textarea');
                                                          const shippingTextarea = textareas[textareas.length - 1];
                                                          if (shippingTextarea && formData.billing_address) {
                                                              const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
                                                                  window.HTMLTextAreaElement.prototype,
                                                                  'value',
                                                              ).set;
                                                              nativeTextareaSetter.call(shippingTextarea, formData.billing_address);
                                                              shippingTextarea.dispatchEvent(new Eventranslate('input', { bubbles: true }));
                                                              shippingTextarea.dispatchEvent(new Eventranslate('change', { bubbles: true }));
                                                          }
                                                      }, 10);

                                                      setTimeout(() => {
                                                          const inputs = document.querySelectorAll('input[type="text"]');
                                                          const textInputs = Array.from(inputs).filter(
                                                              (input) => input.getAttribute('type') === 'text',
                                                          );
                                                          const shippingTextInputs = textInputs.slice(-4);
                                                          const billingValues = [
                                                              formData.billing_city,
                                                              formData.billing_state,
                                                              formData.billing_postal_code,
                                                              formData.billing_country,
                                                          ];

                                                          shippingTextInputs.forEach((input, index) => {
                                                              setTimeout(() => {
                                                                  if (billingValues[index]) {
                                                                      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                                                                          window.HTMLInputElement.prototype,
                                                                          'value',
                                                                      ).set;
                                                                      nativeInputValueSetter.call(input, billingValues[index]);
                                                                      input.dispatchEvent(new Eventranslate('input', { bubbles: true }));
                                                                      input.dispatchEvent(new Eventranslate('change', { bubbles: true }));
                                                                  }
                                                              }, index * 20);
                                                          });
                                                      }, 50);
                                                  }}
                                                  className="w-full"
                                              >
                                                  {translate('Copy Billing to Shipping Address')}
                                              </Button>
                                          </div>
                                      ),
                                  },
                                  {
                                      name: 'shipping_address',
                                      label: translate('Shipping Address'),
                                      type: 'textarea',
                                      colSpan: 2,
                                      placeholder: translate('eg. 456 Elm St'),
                                  },
                                  {
                                      name: 'shipping_city',
                                      label: translate('Shipping City'),
                                      type: 'text',
                                      placeholder: translate('eg. Los Angeles'),
                                  },
                                  { name: 'shipping_state', label: translate('Shipping State'), type: 'text', placeholder: translate('eg. CA') },
                                  {
                                      name: 'shipping_postal_code',
                                      label: translate('Shipping Postal Code'),
                                      type: 'text',
                                      placeholder: translate('eg. 90001'),
                                  },
                                  {
                                      name: 'shipping_country',
                                      label: translate('Shipping Country'),
                                      type: 'text',
                                      placeholder: translate('eg. United States'),
                                  },
                              ]
                            : [
                                  {
                                      name: 'account_id',
                                      label: translate('Account'),
                                      type: 'select',
                                      required: true,
                                      searchable: true,
                                      colSpan: 2,
                                      options: accounts.map((account: any) => ({
                                          value: account.id,
                                          label: account.name,
                                      })),
                                      emptyNote:
                                          accounts.length === 0
                                              ? {
                                                    link: route('accounts.index'),
                                                    linkText: translate('Accounts'),
                                                }
                                              : undefined,
                                  },
                                  {
                                      name: 'position',
                                      label: translate('Position'),
                                      type: 'text',
                                      colSpan: 2,
                                      placeholder: translate('eg. CEO, Manager, Developer'),
                                  },
                                  {
                                      name: 'address',
                                      label: translate('Address'),
                                      type: 'textarea',
                                      required: true,
                                      colSpan: 2,
                                      placeholder: translate('eg. 123 Main St, City, Country'),
                                  },
                              ],
                    modalSize: 'xl',
                }}
                initialData={
                    currentItem
                        ? {
                              account_industry_id: currentItem.account_industry_id,
                              billing_address: currentItem.address,
                              address: currentItem.address,
                              website: convertType === 'account' ? currentItem.website : undefined,
                          }
                        : null
                }
                title={translate(`Convert Lead to ${convertType === 'account' ? 'Account' : 'Contact'}`)}
                mode="create"
            />

            {/* Import Modal */}
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => {
                    importingRef.current = true;
                    setIsImportModalOpen(false);
                }}
                title={translate('Import Leads from CSV/Excel')}
                importRoute="lead.import"
                parseRoute="lead.parse"
                samplePath={samplePath}
                importNotes={translate(
                    'Ensure that the values entered for Lead Status, Lead Source, Account Industry, Campaign match the existing records in your system.',
                )}
                databaseFields={[
                    { key: 'name', required: true },
                    { key: 'email', required: true },
                    { key: 'phone' },
                    { key: 'organization' },
                    { key: 'account_name' },
                    { key: 'account_industry' },
                    { key: 'website' },
                    { key: 'position' },
                    { key: 'value' },
                    { key: 'lead_status', required: true },
                    { key: 'lead_source', required: true },
                    { key: 'address' },
                    { key: 'campaign' },
                    { key: 'notes' },
                    { key: 'status' },
                ]}
            />
        </PageTemplate>
    );
}
