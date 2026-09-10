// pages/coupons/index.tsx
import CrudDeleteModal from '@components/CrudDeleteModal';
import { CrudFormModal } from '@components/CrudFormModal';
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { Switch } from '@components/UserInterface/Switch';
import { router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function CouponsPage() {
    const { t: translate } = useTranslation();
    const { auth, coupons, filters: pageFilters = {}, globalSettings } = usePage().props;
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedType, setSelectedType] = useState(pageFilters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [dateFrom, setDateFrom] = useState(pageFilters.date_from || '');
    const [dateTo, setDateTo] = useState(pageFilters.date_to || '');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const [pageInitialState, setPageInitialState] = useState(true);

    useEffect(() => {
        if (pageInitialState) {
            setPageInitialState(false);
            return;
        }
        applyFilters();
    }, [selectedType, selectedStatus, dateFrom, dateTo]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return selectedType !== 'all' || selectedStatus !== 'all' || dateFrom !== '' || dateTo !== '' || searchTerm !== '';
    };

    // Count active filters
    const activeFilterCount = () => {
        return (
            (selectedType !== 'all' ? 1 : 0) +
            (selectedStatus !== 'all' ? 1 : 0) +
            (dateFrom !== '' ? 1 : 0) +
            (dateTo !== '' ? 1 : 0) +
            (searchTerm !== '' ? 1 : 0)
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('coupons.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                type: selectedType !== 'all' ? selectedType : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
                ...(pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        router.get(
            route('coupons.index'),
            {
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                type: selectedType !== 'all' ? selectedType : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view-details':
                router.get(route('coupons.show', item.id));
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            default:
                break;
        }
    };

    const handleAddNew = () => {
        setCurrentItem(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const generateCouponCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 10; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleFormSubmit = (formData: any) => {
        // Set default values
        if (!formData.code_type) formData.code_type = 'manual';
        if (formData.status === undefined || formData.status === null) formData.status = true;

        // Ensure numeric fields are properly formatted
        if (formData.minimum_spend) formData.minimum_spend = parseFloat(formData.minimum_spend);
        if (formData.maximum_spend) formData.maximum_spend = parseFloat(formData.maximum_spend);
        if (formData.discount_amount) formData.discount_amount = parseFloat(formData.discount_amount);
        if (formData.use_limit_per_coupon) formData.use_limit_per_coupon = parseInt(formData.use_limit_per_coupon);
        if (formData.use_limit_per_user) formData.use_limit_per_user = parseInt(formData.use_limit_per_user);

        if (formMode === 'create') {
            if (!globalSettings?.is_demo) {
                const toastId = toast.loading(translate('Creating coupon...'));
            }

            router.post(route('coupons.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    if (!globalSettings?.is_demo) {
                        toast.dismiss(toastId);
                    }
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(translate(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss(toastId);
                    }
                    if (typeof errors === 'string') {
                        toast.error(translate(errors));
                    } else {
                        toast.error(translate('Failed to create coupon: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        } else if (formMode === 'edit') {
            if (!globalSettings?.is_demo) {
                const toastId = toast.loading(translate('Updating coupon...'));
            }

            router.put(route('coupons.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    if (!globalSettings?.is_demo) {
                        toast.dismiss(toastId);
                    }
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(translate(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss(toastId);
                    }
                    if (typeof errors === 'string') {
                        toast.error(translate(errors));
                    } else {
                        toast.error(translate('Failed to update coupon: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!globalSettings?.is_demo) {
            const toastId = toast.loading(translate('Deleting coupon...'));
        }

        router.delete(route('coupons.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                if (!globalSettings?.is_demo) {
                    toast.dismiss(toastId);
                }
                if (page.props.flash.success) {
                    toast.success(translate(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(translate(page.props.flash.error));
                }
            },
            onError: (errors) => {
                if (!globalSettings?.is_demo) {
                    toast.dismiss(toastId);
                }
                if (typeof errors === 'string') {
                    toast.error(translate(errors));
                } else {
                    toast.error(translate('Failed to delete coupon: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleResetFilters = () => {
        router.get(route('coupons.index'));
    };

    const handleToggleStatus = (coupon: any) => {
        if (!globalSettings?.is_demo) {
            toast.loading(t(coupon.status ? 'Deactivating' : 'Activating') + ' ' + translate('coupon...'));
        }

        router.put(
            route('coupons.toggle-status', coupon.id),
            {},
            {
                onSuccess: (page) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss(toastId);
                    }
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(translate(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss(toastId);
                    }
                    if (typeof errors === 'string') {
                        toast.error(translate(errors));
                    } else {
                        toast.error(translate('Failed to update coupon status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            setTimeout(() => {
                setCopiedCode(null);
            }, 2000);
        } catch (err) {}
    };

    // Define page actions
    const pageActions = [];

    if (useHasPermission('create-coupons')) {
        pageActions.push({
            label: translate('Add Coupon'),
            icon: <Plus className="mr-0 h-4 w-4 min-[380px]:mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew(),
            className: 'h-8 w-8 min-[380px]:h-9 min-[380px]:w-auto px-0 min-[380px]:px-4',
            labelClassName: 'hidden min-[380px]:inline',
            tooltip: translate('Add Coupon'),
            tooltipClassName: 'min-[380px]:hidden',
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Coupons') }];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: translate('Name'),
            sortable: true,
        },
        {
            key: 'code',
            label: translate('Code'),
            sortable: true,
            render: (value) => (
                <div className="flex flex-col items-start">
                    <button
                        onClick={() => handleCopyCode(value)}
                        className="cursor-pointer rounded-md bg-gray-100 px-3 py-1.5 font-mono text-sm transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        {value}
                    </button>
                    {copiedCode === value && (
                        <span className="mt-1 ml-3 text-xs font-medium text-red-600 dark:text-red-400">{translate('Copied!')}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'type',
            label: translate('Type'),
            sortable: true,
            render: (value) => (value === 'percentage' ? translate('Percentage') : translate('Flat Amount')),
        },
        {
            key: 'minimum_spend',
            label: translate('Min Spend'),
            render: (value) =>
                value ? <span className="font-mono">{window.appSettings?.formatCurrency(value) || `$${parseFloat(value).toFixed(2)}`}</span> : '-',
        },
        {
            key: 'maximum_spend',
            label: translate('Max Spend'),
            render: (value) =>
                value ? <span className="font-mono">{window.appSettings?.formatCurrency(value) || `$${parseFloat(value).toFixed(2)}`}</span> : '-',
        },
        {
            key: 'discount_amount',
            label: translate('Discount'),
            render: (_, row) => {
                const amount = parseFloat(row.discount_amount);
                return row.type === 'percentage' ? (
                    `${amount}%`
                ) : (
                    <span className="font-mono">{window.appSettings?.formatCurrency(amount) || `$${amount.toFixed(2)}`}</span>
                );
            },
        },
        {
            key: 'use_limit_per_coupon',
            label: translate('Coupon Limit'),
            render: (value) => value || translate('Unlimited'),
        },
        {
            key: 'use_limit_per_user',
            label: translate('User Limit'),
            render: (value) => value || translate('Unlimited'),
        },
        {
            key: 'expiry_date',
            label: translate('Expiry Date'),
            sortable: true,
            type: 'date',
            // render: (value) => window.appSettings?.formatDateTime(value, false) || '-'
        },
        {
            key: 'status',
            label: translate('Status'),
            render: (_, row) => (
                <div className="flex items-center">
                    <Switch checked={!!row.status} onCheckedChange={() => handleToggleStatus(row)} />
                </div>
            ),
        },
    ];

    // Define table actions
    const actions = [
        {
            label: translate('View Details'),
            icon: 'Eye',
            action: 'view-details',
            className: 'text-blue-500',
            requiredPermission: 'view-coupons',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'create-coupons',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-coupons',
        },
    ];

    // Prepare filter options
    const typeOptions = [
        { value: 'all', label: translate('All Types') },
        { value: 'percentage', label: translate('Percentage') },
        { value: 'flat', label: translate('Flat Amount') },
    ];

    const statusOptions = [
        { value: 'all', label: translate('All Status') },
        { value: '1', label: translate('Active') },
        { value: '0', label: translate('Inactive') },
    ];

    return (
        <PageTemplate
            title={translate('Coupons')}
            url="/coupons"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            description={translate('Manage your coupons and discounts.')}
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
                            name: 'type',
                            label: translate('Type'),
                            type: 'select',
                            value: selectedType,
                            onChange: setSelectedType,
                            options: typeOptions,
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
                            name: 'date_from',
                            label: translate('Date From'),
                            type: 'date',
                            value: dateFrom,
                            onChange: setDateFrom,
                        },
                        {
                            name: 'date_to',
                            label: translate('Date To'),
                            type: 'date',
                            value: dateTo,
                            onChange: setDateTo,
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                />
            </div>

            {/* Content section */}
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={coupons?.data || []}
                    from={coupons?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={{
                        view: 'view-coupons',
                        create: 'create-coupons',
                        edit: 'create-coupons',
                        delete: 'delete-coupons',
                    }}
                />

                {/* Pagination section */}
                <Pagination
                    from={coupons?.from || 0}
                    to={coupons?.to || 0}
                    total={coupons?.total || 0}
                    links={coupons?.links}
                    entityName={translate('coupons')}
                    onPageChange={(url) => router.get(url)}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('coupons.index'),
                            {
                                page: 1,
                                per_page: parseInt(value) !== 10 ? parseInt(value) : undefined,
                                search: searchTerm || undefined,
                                type: selectedType !== 'all' ? selectedType : undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                date_from: dateFrom || undefined,
                                date_to: dateTo || undefined,
                                ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
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
                    fields: [
                        {
                            name: 'name',
                            label: translate('Coupon Name'),
                            type: 'text',
                            required: true,
                            placeholder: translate('Enter coupon name'),
                            width: 'calc(50% - 0.5rem)',
                        },
                        {
                            name: 'type',
                            label: translate('Discount Type'),
                            type: 'select',
                            required: true,
                            options: [
                                { value: 'percentage', label: translate('Percentage (%)') },
                                { value: 'flat', label: translate('Fixed Amount ($)') },
                            ],
                            width: 'calc(50% - 0.5rem)',
                        },
                        {
                            name: 'discount_amount',
                            label: translate('Discount Value'),
                            type: 'number',
                            required: true,
                            min: 0,
                            step: 0.01,
                            placeholder: translate('Enter value'),
                            width: 'calc(50% - 0.5rem)',
                        },
                        {
                            name: 'use_limit_per_coupon',
                            label: translate('Total Usage Limit'),
                            type: 'number',
                            min: 1,
                            placeholder: translate('Leave empty for unlimited'),
                            width: 'calc(50% - 0.5rem)',
                        },
                        {
                            name: 'code_type',
                            label: translate('Code Generation'),
                            type: 'radio',
                            required: true,
                            options: [
                                { value: 'manual', label: translate('Manual Entry') },
                                { value: 'auto', label: translate('Auto Generate') },
                            ],
                            defaultValue: 'manual',
                            width: 'calc(50% - 0.5rem)',
                        },
                        {
                            name: 'code',
                            label: translate('Coupon Code'),
                            type: 'text',
                            required: true,
                            placeholder: translate('Enter coupon code'),
                            width: 'calc(50% - 0.5rem)',
                            render: (field, formData, handleChange) => {
                                const isAutoGenerate = formData.code_type === 'auto';
                                return (
                                    <div className="space-y-2">
                                        {isAutoGenerate ? (
                                            <div className="flex gap-2">
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="text"
                                                    placeholder={translate('Click generate to create code')}
                                                    value={formData[field.name] || ''}
                                                    readOnly
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => handleChange(field.name, generateCouponCode())}
                                                    variant="default"
                                                >
                                                    {translate('Generate')}
                                                </Button>
                                            </div>
                                        ) : (
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="text"
                                                placeholder={field.placeholder}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleChange(field.name, e.target.value)}
                                            />
                                        )}
                                    </div>
                                );
                            },
                        },
                        {
                            name: 'minimum_spend',
                            label: translate('Minimum Spend'),
                            type: 'number',
                            min: 0,
                            step: 0.01,
                            placeholder: translate('Optional'),
                            width: 'calc(50% - 0.5rem)',
                        },
                        {
                            name: 'maximum_spend',
                            label: translate('Maximum Spend'),
                            type: 'number',
                            min: 0,
                            step: 0.01,
                            placeholder: translate('Optional'),
                            width: 'calc(50% - 0.5rem)',
                        },
                        {
                            name: 'use_limit_per_user',
                            label: translate('Usage Limit Per User'),
                            type: 'number',
                            min: 1,
                            placeholder: translate('Leave empty for unlimited'),
                            width: 'calc(50% - 0.5rem)',
                        },
                        {
                            name: 'expiry_date',
                            label: translate('Expiry Date'),
                            type: 'date',
                            width: 'calc(50% - 0.5rem)',
                        },
                    ],
                    modalSize: '4xl',
                    layout: 'flex',
                }}
                initialData={currentItem}
                title={formMode === 'create' ? translate('Add Coupon') : formMode === 'edit' ? translate('Edit Coupon') : translate('View Coupon')}
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName="coupon"
            />
        </PageTemplate>
    );
}
