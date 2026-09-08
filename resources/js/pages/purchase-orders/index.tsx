import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import { FileDown, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function PurchaseOrders() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const {
        auth,
        purchaseOrders,
        accounts,
        allAccounts,
        contacts,
        salesOrders,
        products,
        users = [],
        allUsers = [],
        filters: pageFilters = {},
        flash = {},
    } = usePage().props;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id || 'all');
    const [selectedSalesOrder, setSelectedSalesOrder] = useState(pageFilters.sales_order_id || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    useEffect(() => {
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
        else if (flash?.warning) toast.warning(t(flash.warning));
    }, [flash]);

    const hasActiveFilters = () => {
        return (
            searchTerm !== '' || selectedStatus !== 'all' || selectedAccount !== 'all' || selectedSalesOrder !== 'all' || selectedAssignee !== 'all'
        );
    };

    const activeFilterCount = () => {
        return (
            (searchTerm ? 1 : 0) +
            (selectedStatus !== 'all' ? 1 : 0) +
            (selectedAccount !== 'all' ? 1 : 0) +
            (selectedSalesOrder !== 'all' ? 1 : 0) +
            (selectedAssignee !== 'all' ? 1 : 0)
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('purchase-orders.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                sales_order_id: selectedSalesOrder !== 'all' ? selectedSalesOrder : undefined,
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
            route('purchase-orders.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                sales_order_id: selectedSalesOrder !== 'all' ? selectedSalesOrder : undefined,
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
                router.get(route('purchase-orders.show', item.id));
                break;
            case 'edit':
                router.visit(route('purchase-orders.edit', item.id));
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
        router.visit(route('purchase-orders.create'));
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting purchase order...'));

        router.delete(route('purchase-orders.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('purchase-orders.toggle-status', currentItem.id), formData, {
            onSuccess: () => {
                setIsStatusModalOpen(false);
            },
            onError: (errors) => {
                toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleToggleStatus = (purchaseOrder: any) => {
        toast.loading(translate('Updating purchase order status...'));

        router.put(
            route('purchase-orders.toggle-status', purchaseOrder.id),
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
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
    }, [searchTerm, selectedStatus, selectedAccount, selectedSalesOrder, selectedAssignee]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedAccountranslate('all');
        setSelectedSalesOrder('all');
        setSelectedAssignee('all');
        router.get(route('purchase-orders.index'));
    };

    const pageActions = [];

    if (useHasPermission('export-purchase-orders')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[500px]:mr-2" />,
            variant: 'outline',
            onClick: () => (window.location.href = route('purchase-order.export')),
            className: 'h-8 w-8 min-[500px]:h-9 min-[500px]:w-auto px-0 min-[500px]:px-4',
            labelClassName: 'hidden min-[500px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[500px]:hidden',
        });
    }

    if (useHasPermission('create-purchase-orders')) {
        pageActions.push({
            label: translate('Add Purchase Order'),
            icon: <Plus className="mr-0 h-4 w-4 min-[500px]:mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew(),
            className: 'h-8 w-8 min-[500px]:h-9 min-[500px]:w-auto px-0 min-[500px]:px-4',
            labelClassName: 'hidden min-[500px]:inline',
            tooltip: translate('Add Purchase Order'),
            tooltipClassName: 'min-[500px]:hidden',
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Purchase Orders') }];

    const columns = [
        {
            key: 'order_number',
            label: translate('Order Number'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value: string, item: any) => (
                <Link
                    href={route('purchase-orders.show', item.id)}
                    className="inline-flex cursor-pointer items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-blue-700 transition-colors duration-200 hover:border-blue-400 hover:bg-blue-100"
                    style={{ color: '#1d4ed8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                >
                    {value}
                </Link>
            ),
        },
        {
            key: 'name',
            label: translate('Name'),
            sortable: true,
            render: (value: string) => <span className="font-medium whitespace-nowrap">{value || '-'}</span>,
        },
        {
            key: 'assigned_user',
            label: translate('Assigned To'),
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
                    <span className="whitespace-nowrap">{translate('Unassigned')}</span>
                ),
        },
        {
            key: 'sales_order',
            label: translate('Sales Order'),
            className: 'whitespace-nowrap',
            render: (value: any) => <span className="whitespace-nowrap">{value?.name || translate('-')}</span>,
        },
        {
            key: 'order_date',
            label: translate('Order Date'),
            sortable: true,
            className: 'whitespace-nowrap',
            type: 'date',
        },
        {
            key: 'status',
            label: translate('Status'),
            className: 'whitespace-nowrap',
            render: (value: string) => {
                const statusColors = {
                    draft: 'bg-gray-50 text-gray-700 ring-gray-600/20',
                    sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
                    confirmed: 'bg-green-50 text-green-700 ring-green-600/20',
                    received: 'bg-purple-50 text-purple-700 ring-purple-600/20',
                    cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
                };
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${statusColors[value as keyof typeof statusColors] || statusColors.draft}`}
                    >
                        {translate(value.charAt(0).toUpperCase() + value.slice(1))}
                    </span>
                );
            },
        },
        // {
        //     key: 'created_at',
        //     label: translate('Created At'),
        //     sortable: true,
        //     className: 'whitespace-nowrap',
        //     type: 'date'
        // }
    ];

    const actions = [
        {
            label: translate('Change Status'),
            icon: 'RefreshCw',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-purchase-orders',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-purchase-orders',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-purchase-orders',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-purchase-orders',
        },
    ];

    const statusOptions = [
        { value: 'all', label: translate('All Statuses') },
        { value: 'draft', label: translate('Draft') },
        { value: 'sent', label: translate('Sent') },
        { value: 'confirmed', label: translate('Confirmed') },
        { value: 'received', label: translate('Received') },
        { value: 'cancelled', label: translate('Cancelled') },
    ];

    return (
        <PageTemplate
            title={translate('Purchase Orders')}
            description={translate('Manage your purchase orders.')}
            url="/purchase-orders"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: statusOptions,
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
                                ...(allAccounts?.map((acc: any) => ({ value: acc.id.toString(), label: acc.name })) || []),
                            ],
                        },
                        {
                            name: 'sales_order_id',
                            label: translate('Sales Order'),
                            type: 'select',
                            searchable: true,
                            value: selectedSalesOrder,
                            onChange: setSelectedSalesOrder,
                            options: [
                                { value: 'all', label: translate('All Sales Orders') },
                                ...(salesOrders?.map((so: any) => ({ value: so.id.toString(), label: so.name })) || []),
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
                                ...allUsers.map((user: any) => ({ value: user.id.toString(), label: user.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={purchaseOrders?.data || []}
                        from={purchaseOrders?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-purchase-orders',
                            create: 'create-purchase-orders',
                            edit: 'edit-purchase-orders',
                            delete: 'delete-purchase-orders',
                        }}
                    />
                </div>

                <Pagination
                    from={purchaseOrders?.from || 0}
                    to={purchaseOrders?.to || 0}
                    total={purchaseOrders?.total || 0}
                    links={purchaseOrders?.links}
                    entityName={translate('purchase orders')}
                    onPageChange={(url) => router.get(url)}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('purchase-orders.index'),
                            {
                                page: 1,
                                search: searchTerm || undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                                sales_order_id: selectedSalesOrder !== 'all' ? selectedSalesOrder : undefined,
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
                                { value: 'draft', label: translate('Draft') },
                                { value: 'sent', label: translate('Sent') },
                                { value: 'confirmed', label: translate('Confirmed') },
                                { value: 'received', label: translate('Received') },
                                { value: 'cancelled', label: translate('Cancelled') },
                            ],
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={translate('Change Purchase Order Status')}
                mode="edit"
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={translate('purchase order')}
            />
        </PageTemplate>
    );
}
