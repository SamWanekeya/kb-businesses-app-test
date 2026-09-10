import CrudDeleteModal from '@components/CrudDeleteModal';
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import UserInitials from '@components/UserInitials';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Button } from '@components/UserInterface/Button';
import { Card } from '@components/UserInterface/Card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/UserInterface/DropdownMenu';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import useInitials from '@hooks/useInitials';
import { router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { Calendar, Edit, Eye, FileDown, Globe, Lock, Mail, MoreHorizontal, Phone, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Accounts() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const {
        auth,
        accounts,
        flash,
        allUsers = [],
        allAccountTypes = [],
        allAccountIndustries = [],
        planLimits,
        filters: pageFilters = {},
    } = usePage().props;
    useEffect(() => {
        if (flash?.success) toast.success(translate(flash.success));
        else if (flash?.error) toast.error(translate(flash.error));
        else if (flash?.warning) toast.warning(translate(flash.warning));
    }, [flash]);
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedType, setSelectedType] = useState(pageFilters.account_type_id || 'all');
    const [selectedIndustry, setSelectedIndustry] = useState(pageFilters.account_industry_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [activeView, setActiveView] = useState(['list', 'grid'].includes(pageFilters.view) ? pageFilters.view : 'list');
    const [pageInitialState, setPageInitialState] = useState(true);

    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedType, selectedIndustry, selectedStatus, selectedAssignee]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedType !== 'all' || selectedIndustry !== 'all' || selectedStatus !== 'all' || selectedAssignee !== 'all';
    };

    // Count active filters
    const activeFilterCount = () => {
        return (
            (selectedType !== 'all' ? 1 : 0) +
            (selectedIndustry !== 'all' ? 1 : 0) +
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
            route('accounts.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                account_type_id: selectedType !== 'all' ? selectedType : undefined,
                account_industry_id: selectedIndustry !== 'all' ? selectedIndustry : undefined,
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
            route('accounts.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                account_type_id: selectedType !== 'all' ? selectedType : undefined,
                account_industry_id: selectedIndustry !== 'all' ? selectedIndustry : undefined,
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
                router.get(route('accounts.show', item.id));
                break;
            case 'edit':
                router.visit(route('accounts.edit', item.id));
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(item);
                break;
        }
    };

    const handleDeleteConfirm = () => {
        const toastId = toast.loading(translate('Deleting account...'));

        if (!currentItem?.id) {
            toast.dismiss(toastId);
            toast.error('Invalid account selected');
            return;
        }
        router.delete(route('accounts.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(translate('Failed to delete account: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleToggleStatus = (account: any) => {
        const newStatus = account.status === 'active' ? 'inactive' : 'active';
        toast.loading(`${newStatus === 'active' ? translate('Activating') : translate('Deactivating')} account...`);

        router.put(
            route('accounts.toggle-status', account.id),
            {},
            {
                onSuccess: () => toast.dismiss(),
                onError: (errors) => {
                    toast.dismiss(toastId);
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(translate('Failed to update account status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const handleResetFilters = () => {
        router.get(route('accounts.index'), { view: activeView });
    };

    // Define page actions
    const pageActions = [];

    // Add export button
    if (useHasPermission('export-accounts')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[400px]:mr-2" />,
            variant: 'outline',
            onClick: () => (window.location.href = route('account.export')),
            className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
            labelClassName: 'hidden min-[400px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[400px]:hidden',
        });
    }

    // Add the "Add Account" button if user has permission
    if (useHasPermission('create-accounts')) {
        const isDisabled = planLimits && !planLimits.can_create;
        pageActions.push({
            label: isDisabled
                ? translate('Account Limit Reached ({{current}}/{{max}})', {
                      current: planLimits?.current_accounts || 0,
                      max: planLimits?.maximum_accounts || 0,
                  })
                : translate('Add Account'),
            icon: <Plus className="mr-0 h-4 w-4 min-[400px]:mr-2" />,
            variant: isDisabled ? 'outline' : 'default',
            disabled: isDisabled,
            onClick: isDisabled
                ? () =>
                      toast.error(
                          translate('Account limit reached. Your plan allows maximum {{max}} accounts.', { max: planLimits.maximum_accounts }),
                      )
                : () => router.visit(route('accounts.create')),
            className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
            labelClassName: 'hidden min-[400px]:inline',
            tooltip: translate('Add Account'),
            tooltipClassName: 'min-[400px]:hidden',
        });
    }

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Account Management'), href: route('accounts.index') },
        { title: translate('Accounts') },
    ];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: translate('Name'),
            sortable: true,
            render: (value: any, row: any) => (
                <div className="flex items-center gap-3">
                    <UserInitials name={row.name} />
                    <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-muted-foreground text-sm">{row.email || translate('No email')}</div>
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
            key: 'account_type',
            label: translate('Type'),
            render: (value: any) => {
                if (!value) return '-';
                return (
                    <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        style={{
                            backgroundColor: `${value.color}20`,
                            color: value.color,
                            borderColor: `${value.color}40`,
                        }}
                    >
                        {value.name}
                    </span>
                );
            },
        },
        {
            key: 'account_industry',
            label: translate('Industry'),
            render: (value: any) => {
                if (!value) return '-';
                return (
                    <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        style={{
                            backgroundColor: `${value.color}20`,
                            color: value.color,
                            borderColor: `${value.color}40`,
                        }}
                    >
                        {value.name}
                    </span>
                );
            },
        },
        {
            key: 'status',
            label: translate('Status'),
            render: (value: string) => {
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            value === 'active'
                                ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                                : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                        }`}
                    >
                        {value === 'active' ? translate('Active') : translate('Inactive')}
                    </span>
                );
            },
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
            label: translate('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-accounts',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-accounts',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-accounts',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-accounts',
        },
    ];

    return (
        <PageTemplate
            title={translate('Accounts')}
            description={translate('Manage your accounts')}
            url="/accounts"
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
                            name: 'account_type_id',
                            label: translate('Type'),
                            type: 'select',
                            searchable: true,
                            value: selectedType,
                            onChange: setSelectedType,
                            options: [
                                { value: 'all', label: translate('All Types') },
                                ...allAccountTypes.map((type: any) => ({
                                    value: type.id.toString(),
                                    label: type.name,
                                })),
                            ],
                        },
                        {
                            name: 'account_industry_id',
                            label: translate('Industry'),
                            type: 'select',
                            searchable: true,
                            value: selectedIndustry,
                            onChange: setSelectedIndustry,
                            options: [
                                { value: 'all', label: translate('All Industries') },
                                ...allAccountIndustries.map((industry: any) => ({
                                    value: industry.id.toString(),
                                    label: industry.name,
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
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={(view) => {
                        setActiveView(view);
                        router.get(route('accounts.index'), {
                            view,
                            page: pageFilters.page || 1,
                            search: searchTerm || undefined,
                            account_type_id: selectedType !== 'all' ? selectedType : undefined,
                            account_industry_id: selectedIndustry !== 'all' ? selectedIndustry : undefined,
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
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={accounts?.data || []}
                        from={accounts?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-accounts',
                            create: 'create-accounts',
                            edit: 'edit-accounts',
                            delete: 'delete-accounts',
                        }}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={accounts?.from || 0}
                        to={accounts?.to || 0}
                        total={accounts?.total || 0}
                        links={accounts?.links}
                        entityName={translate('accounts')}
                        onPageChange={(url) => router.get(url)}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            router.get(
                                route('accounts.index'),
                                {
                                    view: activeView,
                                    page: 1,
                                    search: searchTerm || undefined,
                                    account_type_id: selectedType !== 'all' ? selectedType : undefined,
                                    account_industry_id: selectedIndustry !== 'all' ? selectedIndustry : undefined,
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
                        {accounts?.data?.map((account: any) => (
                            <Card
                                key={account.id}
                                className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div className="relative flex flex-1 flex-col p-4">
                                    {/* Three-dots dropdown — top right */}
                                    <div className="absolute top-2 right-2">
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
                                                {useHasPermission('view-accounts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('view', account)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        <span>{translate('View Account')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('toggle-status-accounts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('toggle-status', account)}>
                                                        <Lock className="mr-2 h-4 w-4" />
                                                        <span>{account.status === 'active' ? translate('Deactivate') : translate('Activate')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('edit-accounts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('edit', account)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>{translate('Edit')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {useHasPermission('delete-accounts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('delete', account)} className="text-rose-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>{translate('Delete')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Avatar + name + email + status */}
                                    <div className="mb-4 flex items-start gap-3 pr-8">
                                        <UserInitials name={account.name} />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                                            <div className="mt-0.5 mb-1.5 flex items-center gap-1.5">
                                                <Mail className="h-3 w-3 shrink-0 text-gray-500" />
                                                <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                                                    {account.email || translate('No email')}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                    account.status === 'active'
                                                        ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20'
                                                        : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20'
                                                }`}
                                            >
                                                {account.status === 'active' ? translate('Active') : translate('Inactive')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info rows */}
                                    <div className="mb-3 space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            <span className="truncate">{account.phone || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <Globe className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            {account.website ? (
                                                <a
                                                    href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="truncate text-blue-600 hover:!text-blue-600 hover:underline"
                                                >
                                                    {account.website}
                                                </a>
                                            ) : (
                                                <span className="truncate">-</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {account.account_type && (
                                                <span
                                                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                                    style={{
                                                        backgroundColor: `${account.account_type.color}20`,
                                                        color: account.account_type.color,
                                                        borderColor: `${account.account_type.color}40`,
                                                    }}
                                                >
                                                    {account.account_type.name}
                                                </span>
                                            )}
                                            {account.account_industry && (
                                                <span
                                                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                                    style={{
                                                        backgroundColor: `${account.account_industry.color}20`,
                                                        color: account.account_industry.color,
                                                        borderColor: `${account.account_industry.color}40`,
                                                    }}
                                                >
                                                    {account.account_industry.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Footer: date left, assigned avatar right */}
                                    <div className="border-border mt-auto flex items-center justify-between border-t pt-3">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            <span>
                                                {window.appSettings?.formatDateTime(account.created_at, false) ||
                                                    new Date(account.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {account.assigned_user && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{translate('Assigned to')}</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="h-7 w-7 shrink-0 cursor-pointer">
                                                                <AvatarImage src={account.assigned_user.avatar} alt={account.assigned_user.name} />
                                                                <AvatarFallback className="bg-purple-100 text-xs font-medium text-purple-700">
                                                                    {getInitials(account.assigned_user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{account.assigned_user.name}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination for grid view */}
                    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                        <Pagination
                            from={accounts?.from || 0}
                            to={accounts?.to || 0}
                            total={accounts?.total || 0}
                            links={accounts?.links}
                            entityName={translate('accounts')}
                            onPageChange={(url) => router.get(url)}
                            perPageOptions={[12, 24, 48, 96]}
                            currentPerPage={pageFilters.per_page?.toString() || '12'}
                            onPerPageChange={(value) => {
                                router.get(
                                    route('accounts.index'),
                                    {
                                        view: activeView,
                                        page: 1,
                                        search: searchTerm || undefined,
                                        account_type_id: selectedType !== 'all' ? selectedType : undefined,
                                        account_industry_id: selectedIndustry !== 'all' ? selectedIndustry : undefined,
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
                entityName={translate('account')}
            />
        </PageTemplate>
    );
}
