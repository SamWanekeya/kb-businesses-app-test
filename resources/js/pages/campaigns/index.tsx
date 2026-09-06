import { CrudDeleteModal } from '@/components/CrudDeleteModal';
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
import { router, usePage } from '@inertiajs/react';
import { ArrowRight, Calendar, Edit, Eye, ListChecks, Lock, MoreHorizontal, Plus, Trash2, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Campaigns() {
    const { t } = useTranslation();
    const getInitials = useInitials();
    const {
        auth,
        campaigns,
        campaignTypes,
        allCampaignTypes,
        targetLists,
        allTargetLists,
        users,
        allUsers,
        filters: pageFilters = {},
        flash,
    } = usePage().props as any;
    const permissions = auth?.permissions || [];

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, []);

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedCampaignType, setSelectedCampaignType] = useState(pageFilters.campaign_type_id || 'all');
    const [selectedTargetList, setSelectedTargetList] = useState(pageFilters.target_list_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [activeView, setActiveView] = useState(['list', 'grid'].includes(pageFilters.view) ? pageFilters.view : 'list');

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            searchTerm !== '' ||
            selectedCampaignType !== 'all' ||
            selectedTargetList !== 'all' ||
            selectedStatus !== 'all' ||
            selectedAssignee !== 'all'
        );
    };

    // Count active filters
    const activeFilterCount = () => {
        return (
            (selectedCampaignType !== 'all' ? 1 : 0) +
            (selectedTargetList !== 'all' ? 1 : 0) +
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
            route('campaigns.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                campaign_type_id: selectedCampaignType !== 'all' ? selectedCampaignType : undefined,
                target_list_id: selectedTargetList !== 'all' ? selectedTargetList : undefined,
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
            route('campaigns.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                campaign_type_id: selectedCampaignType !== 'all' ? selectedCampaignType : undefined,
                target_list_id: selectedTargetList !== 'all' ? selectedTargetList : undefined,
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
                router.visit(route('campaigns.show', item.id));
                break;
            case 'edit':
                router.visit(route('campaigns.edit', item.id));
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
        router.visit(route('campaigns.create'));
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting campaign...'));

        router.delete(route('campaigns.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
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
                    toast.error(t('Failed to delete campaign: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleToggleStatus = (campaign: any) => {
        const newStatus = campaign.status === 'active' ? 'inactive' : 'active';
        toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} campaign...`);

        router.put(
            route('campaigns.toggle-status', campaign.id),
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
                        toast.error(t('Failed to update campaign status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const pageInitialState = useState(true);
    useEffect(() => {
        if (pageInitialState[0]) {
            pageInitialState[1](false);
            return;
        }
        applyFilters();
    }, [searchTerm, selectedCampaignType, selectedTargetList, selectedStatus, selectedAssignee]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedCampaignType('all');
        setSelectedTargetList('all');
        setSelectedStatus('all');
        setSelectedAssignee('all');
        router.get(route('campaigns.index'), { view: activeView });
    };

    // Define page actions
    const pageActions = [];

    // Add the "Add Campaign" button if user has permission
    if (useHasPermission('create-campaigns')) {
        pageActions.push({
            label: t('Add Campaign'),
            icon: <Plus className="mr-0 h-4 w-4 min-[400px]:mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew(),
            className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
            labelClassName: 'hidden min-[400px]:inline',
            tooltip: t('Add Campaign'),
            tooltipClassName: 'min-[400px]:hidden',
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Campaign Management'), href: route('campaigns.index') },
        { title: t('Campaigns') },
    ];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: t('Name'),
            sortable: true,
            render: (value: any, row: any) => (
                <div>
                    <div className="font-medium whitespace-nowrap">{row.name}</div>
                    <div className="text-muted-foreground text-sm whitespace-nowrap">{row.campaign_type?.name}</div>
                </div>
            ),
        },
        {
            key: 'assigned_user',
            label: t('Assigned To'),
            className: 'whitespace-nowrap',
            render: (value: any) =>
                value ? (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={value.avatar} alt={value.name} />
                            <AvatarFallback className="text-xs">{getInitials(value.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium whitespace-nowrap">{value.name}</div>
                            <div className="text-muted-foreground text-sm whitespace-nowrap">{value.email}</div>
                        </div>
                    </div>
                ) : (
                    <span className="whitespace-nowrap">{t('Unassigned')}</span>
                ),
        },
        {
            key: 'start_date',
            label: t('Date'),
            sortable: true,
            render: (value: any, row: any) => (
                <div className="flex flex-col text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="whitespace-nowrap">{window.appSettings?.formatDateTime(row.start_date, false) || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 py-0.5 pl-[7px]">
                        <div className="h-3 w-px bg-gray-300" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="whitespace-nowrap">{window.appSettings?.formatDateTime(row.end_date, false) || '-'}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'budget',
            label: t('Budget'),
            sortable: true,
            render: (value: any) => (
                <span className="font-mono whitespace-nowrap">
                    {value ? window.appSettings?.formatCurrency(parseFloat(value)) || `$${parseFloat(value).toFixed(2)}` : '-'}
                </span>
            ),
        },
        {
            key: 'actual_cost',
            label: t('Actual Cost'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value: any) => (
                <span className="font-mono whitespace-nowrap">
                    {window.appSettings?.formatCurrency(parseFloat(value || 0)) || `$${parseFloat(value || 0).toFixed(2)}`}
                </span>
            ),
        },
        {
            key: 'target_list',
            label: t('Target List'),
            render: (value: any) => <span className="whitespace-nowrap">{value?.name || '-'}</span>,
        },
        {
            key: 'status',
            label: t('Status'),
            className: 'whitespace-nowrap',
            render: (value: string) => (
                <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ${
                        value === 'active'
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                    }`}
                >
                    {value === 'active' ? t('Active') : t('Inactive')}
                </span>
            ),
        },
        // {
        //     key: 'created_at',
        //     label: t('Created At'),
        //     sortable: true,
        //     className: 'whitespace-nowrap',
        //     type: 'date'
        // }
    ];

    // Define table actions
    const actions = [
        {
            label: t('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-campaigns',
        },
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-campaigns',
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-campaigns',
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-campaigns',
        },
    ];

    // Prepare filter options
    const campaignTypeOptions = [
        { value: 'all', label: t('All Campaign Types') },
        ...(allCampaignTypes || []).map((type: any) => ({
            value: type.id.toString(),
            label: type.name,
        })),
    ];

    const targetListOptions = [
        { value: 'all', label: t('All Target Lists') },
        ...(allTargetLists || []).map((list: any) => ({
            value: list.id.toString(),
            label: list.name,
        })),
    ];

    const statusOptions = [
        { value: 'all', label: t('All Statuses') },
        { value: 'active', label: t('Active') },
        { value: 'inactive', label: t('Inactive') },
    ];

    return (
        <PageTemplate
            title={t('Campaigns')}
            description={t('Manage your campaigns.')}
            url="/campaigns"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'campaign_type_id',
                            label: t('Campaign Type'),
                            type: 'select',
                            searchable: true,
                            value: selectedCampaignType,
                            onChange: setSelectedCampaignType,
                            options: campaignTypeOptions,
                        },
                        {
                            name: 'target_list_id',
                            label: t('Target List'),
                            type: 'select',
                            searchable: true,
                            value: selectedTargetList,
                            onChange: setSelectedTargetList,
                            options: targetListOptions,
                        },
                        {
                            name: 'status',
                            label: t('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: statusOptions,
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
                                { value: 'unassigned', label: t('Unassigned') },
                                ...(allUsers || []).map((user: any) => ({ value: user.id.toString(), label: user.name })),
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
                        router.get(route('campaigns.index'), {
                            view,
                            page: pageFilters.page || undefined,
                            search: searchTerm || undefined,
                            campaign_type_id: selectedCampaignType !== 'all' ? selectedCampaignType : undefined,
                            target_list_id: selectedTargetList !== 'all' ? selectedTargetList : undefined,
                            status: selectedStatus !== 'all' ? selectedStatus : undefined,
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
                            data={campaigns?.data || []}
                            from={campaigns?.from || 1}
                            onAction={handleAction}
                            sortField={pageFilters.sort_field}
                            sortDirection={pageFilters.sort_direction}
                            onSort={handleSort}
                            permissions={permissions}
                            entityPermissions={{
                                view: 'view-campaigns',
                                create: 'create-campaigns',
                                edit: 'edit-campaigns',
                                delete: 'delete-campaigns',
                            }}
                        />
                    </div>

                    {/* Pagination section */}
                    <Pagination
                        from={campaigns?.from || 0}
                        to={campaigns?.to || 0}
                        total={campaigns?.total || 0}
                        links={campaigns?.links}
                        entityName={t('campaigns')}
                        onPageChange={(url) => router.get(url)}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            router.get(
                                route('campaigns.index'),
                                {
                                    view: activeView,
                                    page: 1,
                                    search: searchTerm || undefined,
                                    campaign_type_id: selectedCampaignType !== 'all' ? selectedCampaignType : undefined,
                                    target_list_id: selectedTargetList !== 'all' ? selectedTargetList : undefined,
                                    status: selectedStatus !== 'all' ? selectedStatus : undefined,
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
                        {campaigns?.data?.map((campaign: any) => {
                            const typeColors = [
                                'bg-blue-50 text-blue-700 ring-blue-600/20',
                                'bg-purple-50 text-purple-700 ring-purple-600/20',
                                'bg-amber-50 text-amber-700 ring-amber-600/20',
                                'bg-rose-50 text-rose-700 ring-rose-600/20',
                                'bg-teal-50 text-teal-700 ring-teal-600/20',
                                'bg-orange-50 text-orange-700 ring-orange-600/20',
                                'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
                                'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
                            ];
                            const typeColor = campaign.campaign_type
                                ? typeColors[
                                      campaign.campaign_type.name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) %
                                          typeColors.length
                                  ]
                                : typeColors[0];
                            const budget = parseFloat(campaign.budget || 0);
                            const actualCost = parseFloat(campaign.actual_cost || 0);
                            const spendPct = budget > 0 ? Math.min(Math.round((actualCost / budget) * 100), 100) : 0;
                            const fmtCur = (v: number) => window.appSettings?.formatCurrency(v) || `$${v.toFixed(2)}`;
                            const fmtDate = (d: string) =>
                                d ? window.appSettings?.formatDateTime(d, false) || new Date(d).toLocaleDateString() : '-';
                            const fmtDuration = (start: string, end: string) => {
                                if (!start || !end) return null;
                                return (
                                    <span className="flex items-center gap-1">
                                        <span>{fmtDate(start)}</span>
                                        <ArrowRight className="h-3 w-3 shrink-0 text-gray-500" />
                                        <span>{fmtDate(end)}</span>
                                    </span>
                                );
                            };

                            return (
                                <Card
                                    key={campaign.id}
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
                                                <DropdownMenuContent align="end" className="z-50 w-45" sideOffset={5}>
                                                    {useHasPermission('view-campaigns') && (
                                                        <DropdownMenuItem onClick={() => router.visit(route('campaigns.show', campaign.id))}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            <span>{t('View Campaign')}</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('toggle-status-campaigns') && (
                                                        <DropdownMenuItem onClick={() => handleAction('toggle-status', campaign)}>
                                                            <Lock className="mr-2 h-4 w-4" />
                                                            <span>{campaign.status === 'active' ? t('Deactivate') : t('Activate')}</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('edit-campaigns') && (
                                                        <DropdownMenuItem onClick={() => router.visit(route('campaigns.edit', campaign.id))}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>{t('Edit')}</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    {useHasPermission('delete-campaigns') && (
                                                        <DropdownMenuItem onClick={() => handleAction('delete', campaign)} className="text-rose-600">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>{t('Delete')}</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Header: name + badges */}
                                        <div className="mb-3 pr-8">
                                            <h3 className="truncate text-sm leading-tight font-semibold text-gray-900 dark:text-white">
                                                {campaign.name}
                                            </h3>
                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                        campaign.status === 'active'
                                                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                            : 'bg-red-50 text-red-700 ring-red-600/20'
                                                    }`}
                                                >
                                                    {campaign.status === 'active' ? t('Active') : t('Inactive')}
                                                </span>
                                                {campaign.campaign_type && (
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${typeColor}`}
                                                    >
                                                        {campaign.campaign_type.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info rows */}
                                        <div className="mb-3 space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                                <span className="shrink-0 text-gray-500">{t('Duration')}:</span>
                                                <span className="truncate text-gray-500">
                                                    {fmtDuration(campaign.start_date, campaign.end_date) ?? '-'}
                                                </span>
                                            </div>
                                            {campaign.target_list && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <ListChecks className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                    <span className="truncate">{campaign.target_list.name}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Wallet className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                <span className="truncate">
                                                    {t('Budget')}: <span className="font-mono">{budget > 0 ? fmtCur(budget) : '—'}</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                <span className="truncate">
                                                    {t('Spent')}: <span className="font-mono">{fmtCur(actualCost)}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Budget spend progress bar */}
                                        {budget > 0 && (
                                            <div className="mb-3">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-[10px] text-gray-500">{t('Budget Used')}</span>
                                                    <span
                                                        className={`text-[10px] font-semibold ${
                                                            spendPct >= 90 ? 'text-red-600' : spendPct >= 70 ? 'text-amber-600' : 'text-emerald-600'
                                                        }`}
                                                    >
                                                        {spendPct}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${'bg-primary'}`}
                                                        style={{ width: `${spendPct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer: duration + assigned user */}
                                        <div className="border-border mt-auto flex items-center justify-between gap-2 border-t pt-3">
                                            {campaign.start_date &&
                                                campaign.end_date &&
                                                (() => {
                                                    const ms = new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime();
                                                    if (ms <= 0) return null;
                                                    const days = Math.floor(ms / 86400000);
                                                    const yrs = Math.floor(days / 365);
                                                    const mos = Math.floor(days / 30);
                                                    const label =
                                                        days >= 365
                                                            ? `${yrs} ${t(yrs === 1 ? 'Year' : 'Years')}`
                                                            : days >= 31
                                                              ? `${mos} ${t(mos === 1 ? 'Month' : 'Months')}`
                                                              : `${days} ${t(days === 1 ? 'Day' : 'Days')}`;
                                                    return (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                            <span>{label}</span>
                                                        </div>
                                                    );
                                                })()}
                                            {campaign.assigned_user && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">{t('Assigned to')}</span>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Avatar className="h-7 w-7 shrink-0 cursor-pointer">
                                                                    <AvatarImage
                                                                        src={campaign.assigned_user.avatar}
                                                                        alt={campaign.assigned_user.name}
                                                                    />
                                                                    <AvatarFallback className="bg-purple-100 text-xs font-medium text-purple-700">
                                                                        {getInitials(campaign.assigned_user.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <p>{campaign.assigned_user.name}</p>
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
                            from={campaigns?.from || 0}
                            to={campaigns?.to || 0}
                            total={campaigns?.total || 0}
                            links={campaigns?.links}
                            entityName={t('campaigns')}
                            onPageChange={(url) => router.get(url)}
                            perPageOptions={[12, 24, 48, 96]}
                            currentPerPage={pageFilters.per_page?.toString() || '12'}
                            onPerPageChange={(value) => {
                                router.get(
                                    route('campaigns.index'),
                                    {
                                        view: activeView,
                                        page: 1,
                                        search: searchTerm || undefined,
                                        campaign_type_id: selectedCampaignType !== 'all' ? selectedCampaignType : undefined,
                                        target_list_id: selectedTargetList !== 'all' ? selectedTargetList : undefined,
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
                entityName={t('campaign')}
            />
        </PageTemplate>
    );
}
