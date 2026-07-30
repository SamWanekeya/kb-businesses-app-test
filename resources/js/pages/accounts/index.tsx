import { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, MoreHorizontal, FileDown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';

export default function Accounts() {
    const { t } = useTranslation();
    const { auth, accounts, flash, allUsers = [], allAccountTypes = [], allAccountIndustries = [], planLimits, filters: pageFilters = {} } = usePage().props as any;
    useEffect(() => {
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
        else if (flash?.warning) toast.warning(t(flash.warning));
    }, [flash]);
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedType, setSelectedType] = useState(pageFilters.account_type_id || 'all');
    const [selectedIndustry, setSelectedIndustry] = useState(pageFilters.account_industry_id || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [activeView, setActiveView] = useState(
        ['list', 'grid'].includes(pageFilters.view) ? pageFilters.view : 'list'
    );

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedType !== 'all' || selectedIndustry !== 'all' || selectedStatus !== 'all' || selectedAssignee !== 'all';
    };

    // Count active filters
    const activeFilterCount = () => {
        return (selectedType !== 'all' ? 1 : 0) + (selectedIndustry !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(route('accounts.index'), {
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
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('accounts.index'), {
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
        }, { preserveState: true, preserveScroll: true });
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
        toast.loading(t('Deleting account...'));

        if (!currentItem?.id) {
            toast.dismiss();
            toast.error('Invalid account selected');
            return;
        }
        router.delete(route('accounts.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(t('Failed to delete account: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            }
        });
    };

    const handleToggleStatus = (account: any) => {
        const newStatus = account.status === 'active' ? 'inactive' : 'active';
        toast.loading(`${newStatus === 'active' ? t('Activating') : t('Deactivating')} account...`);

        router.put(route('accounts.toggle-status', account.id), {}, {
            onSuccess: () => toast.dismiss(),
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(t('Failed to update account status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            }
        });
    };



    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedType('all');
        setSelectedIndustry('all');
        setSelectedStatus('all');
        setSelectedAssignee('all');
        setShowFilters(false);
        router.get(route('accounts.index'), { view: activeView, page: 1 }, { preserveState: true, preserveScroll: true });
    };

    // Define page actions
    const pageActions = [];

    // Add export button
    if (hasPermission(permissions, 'export-accounts')) {
        pageActions.push({
            label: t('Export'),
            icon: <FileDown className="h-4 w-4 mr-2" />,
            variant: 'outline',
            onClick: () => window.location.href = route('account.export')
        });
    }

    // Add the "Add Account" button if user has permission
    if (hasPermission(permissions, 'create-accounts')) {
        const isDisabled = planLimits && !planLimits.can_create;
        pageActions.push({
            label: isDisabled ? t('Account Limit Reached ({{current}}/{{max}})', { current: planLimits?.current_accounts || 0, max: planLimits?.max_accounts || 0 }) : t('Add Account'),
            icon: <Plus className="h-4 w-4 mr-2" />,
            variant: isDisabled ? 'outline' : 'default',
            disabled: isDisabled,
            onClick: isDisabled
                ? () => toast.error(t('Account limit reached. Your plan allows maximum {{max}} accounts.', { max: planLimits.max_accounts }))
                : () => router.visit(route('accounts.create')),
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Account Management'), href: route('accounts.index') },
        { title: t('Accounts') }
    ];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: t('Name'),
            sortable: true
        },
        {
            key: 'email',
            label: t('Email'),
            sortable: true,
            render: (value: string) => value || '-'
        },
        {
            key: 'account_type',
            label: t('Type'),
            render: (value: any) => {
                if (!value) return '-';
                return (
                    <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        style={{
                            backgroundColor: `${value.color}20`,
                            color: value.color,
                            borderColor: `${value.color}40`
                        }}
                    >
                        {value.name}
                    </span>
                );
            }
        },
        {
            key: 'account_industry',
            label: t('Industry'),
            render: (value: any) => {
                if (!value) return '-';
                return (
                    <span
                        className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                        style={{
                            backgroundColor: `${value.color}20`,
                            color: value.color,
                            borderColor: `${value.color}40`
                        }}
                    >
                        {value.name}
                    </span>
                );
            }
        },
        {
            key: 'assigned_user',
            label: t('Assigned To'),
            render: (value: any) => value?.name || t('Unassigned')
        },
        {
            key: 'status',
            label: t('Status'),
            render: (value: string) => {
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${value === 'active'
                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                        : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                        }`}>
                        {value === 'active' ? t('Active') : t('Inactive')}
                    </span>
                );
            }
        },
        {
            key: 'created_at',
            label: t('Created At'),
            sortable: true,
            render: (value: string) => window.appSettings?.formatDateTime(value, false) || '-'
        }
    ];

    // Define table actions
    const actions = [
        {
            label: t('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-accounts'
        },
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-accounts'
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-accounts'
        },

        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-accounts'
        }
    ];

    return (
        <PageTemplate
            title={t("Accounts")}
            url="/accounts"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            {/* Search and filters section */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'account_type_id',
                            label: t('Type'),
                            type: 'select',
                            searchable: true,
                            value: selectedType,
                            onChange: setSelectedType,
                            options: [
                                { value: 'all', label: t('All Types') },
                                ...allAccountTypes.map((type: any) => ({
                                    value: type.id.toString(),
                                    label: type.name
                                }))
                            ]
                        },
                        {
                            name: 'account_industry_id',
                            label: t('Industry'),
                            type: 'select',
                            searchable: true,
                            value: selectedIndustry,
                            onChange: setSelectedIndustry,
                            options: [
                                { value: 'all', label: t('All Industries') },
                                ...allAccountIndustries.map((industry: any) => ({
                                    value: industry.id.toString(),
                                    label: industry.name
                                }))
                            ]
                        },
                        {
                            name: 'status',
                            label: t('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: [
                                { value: 'all', label: t('All Status') },
                                { value: 'active', label: t('Active') },
                                { value: 'inactive', label: t('Inactive') }
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
                                ...allUsers.map((user: any) => ({
                                    value: user.id.toString(),
                                    label: user.name
                                }))
                            ]
                        }
                    ]}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={applyFilters}
                    currentPerPage={pageFilters.per_page?.toString() || "10"}
                    onPerPageChange={(value) => {
                        router.get(route('accounts.index'), {
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
                        }, { preserveState: true, preserveScroll: true });
                    }}
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
                        }, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            {/* Content section */}
            {activeView === 'list' ? (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
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
                            delete: 'delete-accounts'
                        }}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={accounts?.from || 0}
                        to={accounts?.to || 0}
                        total={accounts?.total || 0}
                        links={accounts?.links}
                        entityName={t("accounts")}
                        onPageChange={(url) => router.get(url)}
                    />
                </div>
            ) : (
                <div>
                    {/* Grid View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {accounts?.data?.map((account: any) => (
                            <Card key={account.id} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow">
                                <div className="p-6 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start space-x-4">
                                            <div className="h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                                                {account.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{account.name}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{account.email || t('No email')}</p>
                                                <div className="flex items-center">
                                                    <div className={`h-2 w-2 rounded-full mr-2 ${account.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {account.status === 'active' ? t('Active') : t('Inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 flex-shrink-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 z-50" sideOffset={5}>
                                                {hasPermission(permissions, 'view-accounts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('view', account)}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        <span>{t("View Account")}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {hasPermission(permissions, 'toggle-status-accounts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('toggle-status', account)}>
                                                        <Lock className="h-4 w-4 mr-2" />
                                                        <span>{account.status === 'active' ? t("Deactivate") : t("Activate")}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {hasPermission(permissions, 'edit-accounts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('edit', account)} className="text-amber-600">
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        <span>{t("Edit")}</span>
                                                    </DropdownMenuItem>
                                                )}
                                                {hasPermission(permissions, 'delete-accounts') && (
                                                    <DropdownMenuItem onClick={() => handleAction('delete', account)} className="text-rose-600">
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        <span>{t("Delete")}</span>
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Account info */}
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 mb-4 flex-1">
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {t('Phone')}: {account.phone || t('-')}
                                            </span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {t('Website')}: {account.website || t('-')}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {account.account_type && (
                                                <span
                                                    className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                                    style={{
                                                        backgroundColor: `${account.account_type.color}20`,
                                                        color: account.account_type.color,
                                                        borderColor: `${account.account_type.color}40`
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
                                                        borderColor: `${account.account_industry.color}40`
                                                    }}
                                                >
                                                    {account.account_industry.name}
                                                </span>
                                            )}
                                            {account.assigned_user && (
                                                <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-purple-50 text-purple-700 ring-purple-600/20">
                                                    {account.assigned_user.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Created date */}
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        {t("Created:")} {window.appSettings?.formatDateTime(account.created_at, false) || new Date(account.created_at).toLocaleDateString()}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 mt-auto">
                                        {hasPermission(permissions, 'edit-accounts') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('edit', account)}
                                                className="flex-1 h-9 text-sm border-gray-300 dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                {t("Edit")}
                                            </Button>
                                        )}

                                        {hasPermission(permissions, 'view-accounts') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('view', account)}
                                                className="flex-1 h-9 text-sm border-gray-300 dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                {t("View")}
                                            </Button>
                                        )}

                                        {hasPermission(permissions, 'delete-accounts') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAction('delete', account)}
                                                className="flex-1 h-9 text-sm text-gray-700 border-gray-300 dark:border-gray-600 dark:text-gray-200"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                {t("Delete")}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination for grid view */}
                    <div className="mt-6 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                        <Pagination
                            from={accounts?.from || 0}
                            to={accounts?.to || 0}
                            total={accounts?.total || 0}
                            links={accounts?.links}
                            entityName={t("accounts")}
                            onPageChange={(url) => router.get(url)}
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
                entityName={t('account')}
            />
        </PageTemplate>
    );
}
