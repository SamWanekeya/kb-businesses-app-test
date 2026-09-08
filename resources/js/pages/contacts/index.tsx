import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import UserInitials from '@/components/user-initials';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { router, usePage } from '@inertiajs/react';
import { Briefcase, Building2, Calendar, Edit, Eye, FileDown, Lock, Mail, MoreHorizontal, Phone, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function Contacts() {
    const { t: translate } = useTranslation();
    const { auth, contacts, accounts = [], allAccounts = [], users = [], allUsers = [], planLimits, filters: pageFilters = {} } = usePage().props;
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
    const [activeView, setActiveView] = useState(['list', 'grid'].includes(pageFilters.view) ? pageFilters.view : 'list');
    const [pageInitialState, setPageInitialState] = useState(true);
    const getInitials = useInitials();

    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedAccount, selectedStatus, selectedAssignee]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedAccount !== 'all' || selectedStatus !== 'all' || selectedAssignee !== 'all';
    };

    // Count active filters
    const activeFilterCount = () => {
        return (selectedAccount !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('contacts.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
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
            route('contacts.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
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
                router.get(route('contacts.show', item.id));
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
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
        if (planLimits && !planLimits.can_create) {
            toast.error(translate('Contact limit reached. Your plan allows maximum {{max}} contacts.', { max: planLimits.maximum_contacts }));
            return;
        }

        setCurrentItem(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (formMode === 'create') {
            toast.loading(translate('Creating contact...'));

            router.post(route('contacts.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
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
                        toast.error(translate('Failed to create contact: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        } else if (formMode === 'edit') {
            toast.loading(translate('Updating contact...'));

            router.put(route('contacts.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
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
                        toast.error(translate('Failed to update contact: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting contact...'));

        router.delete(route('contacts.destroy', currentItem.id), {
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
                    toast.error(translate('Failed to delete contact: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleToggleStatus = (contact: any) => {
        const newStatus = contact.status === 'active' ? 'inactive' : 'active';
        toast.loading(`${newStatus === 'active' ? translate('Activating') : translate('Deactivating')} contact...`);

        router.put(
            route('contacts.toggle-status', contact.id),
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
                        toast.error(translate('Failed to update contact status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const handleResetFilters = () => {
        router.get(route('contacts.index'), { view: activeView });
    };

    // Define page actions
    const pageActions = [];

    // Add export button
    if (useHasPermission('export-contacts')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[400px]:mr-2" />,
            variant: 'outline',
            onClick: () => (window.location.href = route('contact.export')),
            className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
            labelClassName: 'hidden min-[400px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[400px]:hidden',
        });
    }

    // Add the "Add Contact" button if user has permission and within limits
    if (useHasPermission('create-contacts')) {
        const isDisabled = planLimits && !planLimits.can_create;
        pageActions.push({
            label: isDisabled
                ? translate('Contact Limit Reached ({{current}}/{{max}})', {
                      current: planLimits?.current_contacts || 0,
                      max: planLimits?.maximum_contacts || 0,
                  })
                : translate('Add Contact'),
            icon: <Plus className="mr-0 h-4 w-4 min-[400px]:mr-2" />,
            variant: isDisabled ? 'outline' : 'default',
            disabled: isDisabled,
            onClick: () => handleAddNew(),
            className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
            labelClassName: 'hidden min-[400px]:inline',
            tooltip: isDisabled
                ? translate('Contact Limit Reached ({{current}}/{{max}})', {
                      current: planLimits?.current_contacts || 0,
                      max: planLimits?.maximum_contacts || 0,
                  })
                : translate('Add Contact'),
            tooltipClassName: 'min-[400px]:hidden',
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Contacts') }];

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
            key: 'phone',
            label: translate('Phone'),
            render: (value: string) => value || '-',
        },
        {
            key: 'position',
            label: translate('Position'),
            render: (value: string) => value || '-',
        },
        {
            key: 'account',
            label: translate('Account'),
            render: (value: any) =>
                value?.name ? (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                        {value.name}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                ),
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
            // render: (value: string) => window.appSettings?.formatDateTime(value, false) || '-'
        },
    ];

    // Define table actions
    const actions = [
        {
            label: translate('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-contacts',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-contacts',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-contacts',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-contacts',
        },
    ];

    return (
        <PageTemplate
            title={translate('Contacts')}
            description={translate('Manage your contacts.')}
            url="/contacts"
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
                        router.get(route('contacts.index'), {
                            view,
                            page: pageFilters.page || undefined,
                            search: searchTerm || undefined,
                            account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
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
                        data={contacts?.data || []}
                        from={contacts?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-contacts',
                            create: 'create-contacts',
                            edit: 'edit-contacts',
                            delete: 'delete-contacts',
                        }}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={contacts?.from || 0}
                        to={contacts?.to || 0}
                        total={contacts?.total || 0}
                        links={contacts?.links}
                        entityName={translate('contacts')}
                        onPageChange={(url) => router.get(url)}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            router.get(
                                route('contacts.index'),
                                {
                                    view: activeView,
                                    page: 1,
                                    search: searchTerm || undefined,
                                    account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
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
                        {contacts?.data?.map((contact: any) => (
                            <Card
                                key={contact.id}
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
                                                {useHasPermission('view-contacts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('view', contact)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        <span>{translate('View Contact')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('toggle-status-contacts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('toggle-status', contact)}>
                                                        <Lock className="mr-2 h-4 w-4" />
                                                        <span>{contact.status === 'active' ? translate('Deactivate') : translate('Activate')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {useHasPermission('edit-contacts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('edit', contact)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>{translate('Edit')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {useHasPermission('delete-contacts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('delete', contact)} className="text-rose-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>{translate('Delete')}</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Status badge — top right below trigger */}
                                    <div className="mb-4 flex items-start gap-3 pr-8">
                                        <UserInitials name={contact.name} />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{contact.name}</h3>
                                            <div className="mt-0.5 mb-1.5 flex items-center gap-1.5">
                                                <Mail className="h-3 w-3 shrink-0 text-gray-500" />
                                                <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                                                    {contact.email || translate('No email')}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                    contact.status === 'active'
                                                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                        : 'bg-red-50 text-red-700 ring-red-600/20'
                                                }`}
                                            >
                                                {contact.status === 'active' ? translate('Active') : translate('Inactive')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Info rows */}
                                    <div className="mb-3 space-y-1.5">
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <Phone className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            <span className="truncate">{contact.phone || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                            <Briefcase className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            <span className="truncate">{contact.position || '-'}</span>
                                        </div>
                                        {contact.account && (
                                            <div className="flex min-w-0 items-center gap-2">
                                                <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                                <span className="inline-flex max-w-full items-center overflow-hidden rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                                                    <span className="truncate">{contact.account.name}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer: date left, assigned avatar right */}
                                    <div className="border-border mt-auto flex items-center justify-between border-t pt-3">
                                        <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                            <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                            <span>
                                                {window.appSettings?.formatDateTime(contact.created_at, false) ||
                                                    new Date(contact.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {contact.assigned_user && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{translate('Assigned to')}</span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="h-7 w-7 shrink-0 cursor-pointer">
                                                                <AvatarImage src={contact.assigned_user.avatar} alt={contact.assigned_user.name} />
                                                                <AvatarFallback className="bg-purple-100 text-xs font-medium text-purple-700">
                                                                    {getInitials(contact.assigned_user.name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top">
                                                            <p>{contact.assigned_user.name}</p>
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
                            from={contacts?.from || 0}
                            to={contacts?.to || 0}
                            total={contacts?.total || 0}
                            links={contacts?.links}
                            entityName={translate('contacts')}
                            onPageChange={(url) => router.get(url)}
                            perPageOptions={[12, 24, 48, 96]}
                            currentPerPage={pageFilters.per_page?.toString() || '12'}
                            onPerPageChange={(value) => {
                                router.get(
                                    route('contacts.index'),
                                    {
                                        view: activeView,
                                        page: 1,
                                        search: searchTerm || undefined,
                                        account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
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

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        { name: 'name', label: translate('Contact Name'), type: 'text', required: true, placeholder: translate('eg. John Smith') },
                        { name: 'email', label: translate('Email'), type: 'email', required: true, placeholder: translate('eg. john@kakbima.dev') },
                        { name: 'phone', label: translate('Phone'), type: 'text', placeholder: translate('eg. +1 234 567 8900') },
                        { name: 'position', label: translate('Position'), type: 'text', placeholder: translate('eg. CEO, Manager, Developer') },
                        {
                            name: formMode === 'view' ? 'account_name' : 'account_id',
                            label: translate('Account'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            readOnly: formMode === 'view',
                            options:
                                formMode === 'view'
                                    ? []
                                    : accounts.map((account: any) => ({
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
                            name: 'address',
                            label: translate('Address'),
                            type: 'textarea',
                            required: true,
                            placeholder: translate('eg. 123 Main St, City, Country'),
                        },
                        {
                            name: formMode === 'view' ? 'assigned_user_name' : 'assigned_to',
                            label: translate('Assign To'),
                            type: formMode === 'view' ? 'text' : 'select',
                            required: true,
                            searchable: true,
                            options:
                                formMode === 'view' ? [] : [...users.map((user: any) => ({ value: user.id, label: `${user.name} (${user.email})` }))],
                            readOnly: formMode === 'view',
                            emptyNote:
                                users.length === 0
                                    ? {
                                          link: route('users.index'),
                                          linkText: translate('Users'),
                                      }
                                    : undefined,
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            options: [
                                { value: 'active', label: translate('Active') },
                                { value: 'inactive', label: translate('Inactive') },
                            ],
                            defaultValue: 'active',
                        },
                    ],
                    modalSize: 'xl',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              assigned_user_name: currentItem.assigned_user?.name || translate('Unassigned'),
                              account_name: currentItem.account?.name || translate('No Account'),
                          }
                        : null
                }
                title={formMode === 'create' ? translate('Add Contact') : formMode === 'edit' ? translate('Edit Contact') : translate('View Contact')}
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={translate('contact')}
            />
        </PageTemplate>
    );
}
