import { useState, useEffect } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router, Link } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2, Download, FileDown } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Button } from '@/components/ui/button';

export default function DeliveryOrders() {
    const { t } = useTranslation();
    const { auth, deliveryOrders, allAccounts, salesOrders, allUsers = [], filters: pageFilters = {}, flash = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];

    useEffect(() => {
        if (flash?.error) toast.error(flash.error);
        else if (flash?.success) toast.success(flash.success);
    }, [flash]);

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id || 'all');
    const [selectedSalesOrder, setSelectedSalesOrder] = useState(pageFilters.sales_order_id || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);


    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedStatus !== 'all' || selectedAccount !== 'all' || selectedSalesOrder !== 'all' || selectedAssignee !== 'all';
    };

    const activeFilterCount = () => {
        return (searchTerm ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (selectedAccount !== 'all' ? 1 : 0) + (selectedSalesOrder !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(route('delivery-orders.index'), {
            page: 1,
            search: searchTerm || undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
            sales_order_id: selectedSalesOrder !== 'all' ? selectedSalesOrder : undefined,
            assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
            sort_field: pageFilters.sort_field || undefined,
            sort_direction: pageFilters.sort_direction || undefined,
            ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(route('delivery-orders.index'), {
            page: 1,
            search: searchTerm || undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
            sales_order_id: selectedSalesOrder !== 'all' ? selectedSalesOrder : undefined,
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
                router.get(route('delivery-orders.show', item.id));
                break;
            case 'edit':
                router.get(route('delivery-orders.edit', item.id));
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
        router.get(route('delivery-orders.create'));
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting delivery order...'));

        router.delete(route('delivery-orders.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(t('Failed to delete delivery order: {{errors}}', { errors: Object.values(errors).join(', ') }));
            }
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('delivery-orders.toggle-status', currentItem.id), formData, {
            onSuccess: () => {
                setIsStatusModalOpen(false);
            },
            onError: (errors) => {
                toast.error(t('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            }
        });
    };

    const handleToggleStatus = (deliveryOrder: any) => {
        const statusMap = {
            'pending': 'in_transit',
            'in_transit': 'delivered',
            'delivered': 'pending',
            'cancelled': 'pending'
        };
        const newStatus = statusMap[deliveryOrder.status as keyof typeof statusMap] || 'pending';
        toast.loading(t('Setting delivery order to {{status}}...', { status: newStatus }));

        router.put(route('delivery-orders.toggle-status', deliveryOrder.id), {}, {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(t('Failed to update delivery order status: {{errors}}', { errors: Object.values(errors).join(', ') }));
            }
        });
    };



    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedAccount('all');
        setSelectedSalesOrder('all');
        setSelectedAssignee('all');
        setShowFilters(false);
        router.get(route('delivery-orders.index'), { page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const pageActions = [];

    if (hasPermission(permissions, 'export-delivery-orders')) {
        pageActions.push({
            label: t('Export'),
            icon: <FileDown className="h-4 w-4 mr-2" />,
            variant: 'outline',
            onClick: () => window.location.href = route('delivery-order.export')
        });
    }

    if (hasPermission(permissions, 'create-delivery-orders')) {
        pageActions.push({
            label: t('Add Delivery Order'),
            icon: <Plus className="h-4 w-4 mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew()
        });
    }

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Delivery Orders') }
    ];

    const columns = [
        {
            key: 'delivery_number',
            label: t('Delivery Number'),
            sortable: true,
            render: (value: string, item: any) => (
                <Link
                    href={route('delivery-orders.show', item.id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200 border border-blue-200 cursor-pointer" style={{ color: '#1d4ed8' }} onMouseEnter={e => (e.currentTarget.style.color = '#1d4ed8')} onMouseLeave={e => (e.currentTarget.style.color = '#1d4ed8')}
                >
                    {value}
                </Link>
            )
        },
        {
            key: 'name',
            label: t('Name'),
            sortable: true
        },
        {
            key: 'sales_order',
            label: t('Sales Order'),
            render: (value: any) => value ? `${value.order_number} - ${value.name}` : '-'
        },
        {
            key: 'delivery_date',
            label: t('Delivery Date'),
            sortable: true,
            render: (value: string) => window.appSettings?.formatDateTime(value, false) || '-'
        },
        {
            key: 'status',
            label: t('Status'),
            render: (value: string) => {
                const statusColors = {
                    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                    in_transit: 'bg-blue-50 text-blue-700 ring-blue-600/20',
                    delivered: 'bg-green-50 text-green-700 ring-green-600/20',
                    cancelled: 'bg-red-50 text-red-700 ring-red-600/20'
                };
                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[value as keyof typeof statusColors] || statusColors.pending}`}>
                        {t(value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()))}
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
            key: 'created_at',
            label: t('Created At'),
            sortable: true,
            render: (value: string) => window.appSettings?.formatDateTime(value, false) || '-'
        }
    ];

    const actions = [
        {
            label: t('Change Status'),
            icon: 'RefreshCw',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-delivery-orders'
        },
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-delivery-orders'
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-delivery-orders'
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-delivery-orders'
        }
    ];

    const statusOptions = [
        { value: 'all', label: t('All Statuses') },
        { value: 'pending', label: t('Pending') },
        { value: 'in_transit', label: t('In Transit') },
        { value: 'delivered', label: t('Delivered') },
        { value: 'cancelled', label: t('Cancelled') }
    ];

    const accountOptions = [
        { value: 'all', label: t('All Accounts') },
        ...allAccounts.map((account: any) => ({ value: account.id.toString(), label: account.name }))
    ];

    return (
        <PageTemplate
            title={t("Delivery Orders")}
            url="/delivery-orders"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
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
                            options: statusOptions
                        },
                        {
                            name: 'account_id',
                            label: t('Account'),
                            type: 'select',
                            searchable: true,
                            value: selectedAccount,
                            onChange: setSelectedAccount,
                            options: accountOptions
                        },
                        {
                            name: 'sales_order_id',
                            label: t('Sales Order'),
                            type: 'select',
                            searchable: true,
                            value: selectedSalesOrder,
                            onChange: setSelectedSalesOrder,
                            options: [
                                { value: 'all', label: t('All Sales Orders') },
                                ...salesOrders?.map((so: any) => ({ value: so.id.toString(), label: `${so.order_number} - ${so.name}` })) || []
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
                                ...allUsers.map((user: any) => ({ value: user.id.toString(), label: user.name }))
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
                        router.get(route('delivery-orders.index'), {
                            page: 1,
                            search: searchTerm || undefined,
                            status: selectedStatus !== 'all' ? selectedStatus : undefined,
                            account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                            sales_order_id: selectedSalesOrder !== 'all' ? selectedSalesOrder : undefined,
                            assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                            sort_field: pageFilters.sort_field || undefined,
                            sort_direction: pageFilters.sort_direction || undefined,
                            ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                        }, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={deliveryOrders?.data || []}
                    from={deliveryOrders?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={{
                        view: 'view-delivery-orders',
                        create: 'create-delivery-orders',
                        edit: 'edit-delivery-orders',
                        delete: 'delete-delivery-orders'
                    }}
                />

                <Pagination
                    from={deliveryOrders?.from || 0}
                    to={deliveryOrders?.to || 0}
                    total={deliveryOrders?.total || 0}
                    links={deliveryOrders?.links}
                    entityName={t("delivery orders")}
                    onPageChange={(url) => router.get(url)}
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
                            label: t('Status'),
                            type: 'select',
                            required: true,
                            options: [
                                { value: 'pending', label: t('Pending') },
                                { value: 'in_transit', label: t('In Transit') },
                                { value: 'delivered', label: t('Delivered') },
                                { value: 'cancelled', label: t('Cancelled') }
                            ]
                        }
                    ],
                    modalSize: 'sm'
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={t('Change Delivery Order Status')}
                mode='edit'
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={t('delivery order')}
            />


        </PageTemplate>
    );
}
