// pages/currencies/index.tsx
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Dialog } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { useHasPermission } from '@/utils/Permissions';
import { router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ViewPopup from '@pages/currencies/view';

export default function Currencies() {
    const { t: translate } = useTranslation();
    const { auth, currencies, filters: pageFilters = {}, globalSettings } = usePage().props;
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    const [pageInitialState, setPageInitialState] = useState(true);

    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [searchTerm]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm !== '';
    };

    // Count active filters
    const activeFilterCount = () => {
        return searchTerm ? 1 : 0;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('currencies.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
                ...(pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';
        router.get(
            route('currencies.index'),
            {
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                ...(pageFilters.per_page && pageFilters.per_page !== 10 && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view':
                setIsViewModalOpen(true);
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
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
            if (!globalSettings?.is_demo) {
                toast.loading(translate('Creating currency...'));
            }

            router.post(route('currencies.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else {
                        toast.error(translate('Failed to create currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        } else if (formMode === 'edit') {
            if (!globalSettings?.is_demo) {
                toast.loading(translate('Updating currency...'));
            }

            router.put(route('currencies.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    if (!globalSettings?.is_demo) {
                        toast.dismiss();
                    }
                    if (typeof errors === 'string') {
                        toast.error(t(errors));
                    } else {
                        toast.error(translate('Failed to update currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!globalSettings?.is_demo) {
            toast.loading(translate('Deleting currency...'));
        }

        router.delete(route('currencies.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                if (!globalSettings?.is_demo) {
                    toast.dismiss();
                }
                if (typeof errors === 'string') {
                    toast.error(t(errors));
                } else {
                    toast.error(translate('Failed to delete currency: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleResetFilters = () => {
        router.get(route('currencies.index'));
    };

    // Define page actions
    const pageActions = [];

    // Add the "Add New Currency" button if user has permission
    if (useHasPermission('manage-currencies')) {
        pageActions.push({
            label: translate('Add Currency'),
            icon: <Plus className="mr-0 h-4 w-4 min-[340px]:mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew(),
            className: 'h-8 w-8 min-[340px]:h-9 min-[340px]:w-auto px-0 min-[340px]:px-4',
            labelClassName: 'hidden min-[340px]:inline',
            tooltip: translate('Add Currency'),
            tooltipClassName: 'min-[340px]:hidden',
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Currency') }];

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
        },
        {
            key: 'symbol',
            label: translate('Symbol'),
            sortable: true,
        },
        {
            key: 'is_default',
            label: translate('Default'),
            render: (value: boolean) => (
                <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        value
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                    }`}
                >
                    {value ? translate('Yes') : translate('No')}
                </span>
            ),
        },
    ];

    // Define table actions
    const actions = [
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'manage-currencies',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'manage-currencies',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'manage-currencies',
            condition: (row: any) => !row.is_default,
        },
    ];

    return (
        <PageTemplate
            title={translate('Currency')}
            description={translate('Manage your currencies.')}
            url="/currencies"
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
                    filters={[]}

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
                    data={currencies?.data || []}
                    from={currencies?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={{
                        view: 'manage-currencies',
                        create: 'manage-currencies',
                        edit: 'manage-currencies',
                        delete: 'manage-currencies',
                    }}
                />

                {/* Pagination section */}
                <Pagination
                    from={currencies?.from || 0}
                    to={currencies?.to || 0}
                    total={currencies?.total || 0}
                    links={currencies?.links}
                    entityName={translate('currencies')}
                    onPageChange={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        const params: any = {
                            page: 1,
                            search: searchTerm || undefined,
                            sort_field: pageFilters.sort_field || undefined,
                            sort_direction: pageFilters.sort_direction || undefined,
                        };
                        if (parseInt(value) !== 10) {
                            params.per_page = parseInt(value);
                        }
                        router.get(route('currencies.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                {currentItem && <ViewPopup record={currentItem} />}
            </Dialog>

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        {
                            name: 'name',
                            label: translate('Currency Name'),
                            type: 'text',
                            required: true,
                            placeholder: translate('e.g. US Dollar, Euro, British Pound'),
                        },
                        {
                            name: 'code',
                            label: translate('Currency Code'),
                            type: 'text',
                            required: true,
                            placeholder: translate('e.g. USD, EUR, GBP'),
                        },
                        {
                            name: 'symbol',
                            label: translate('Currency Symbol'),
                            type: 'text',
                            required: true,
                            placeholder: translate('e.g. $, €, £'),
                        },
                        {
                            name: 'description',
                            label: translate('Description'),
                            type: 'textarea',
                            placeholder: translate('Enter currency description...'),
                        },
                        {
                            name: 'is_default',
                            label: translate('Set as Default Currency'),
                            type: 'checkbox',
                        },
                    ],
                    modalSize: 'lg',
                }}
                initialData={currentItem}
                title={formMode === 'create' ? translate('Add New Currency') : formMode === 'edit' ? translate('Edit Currency') : translate('View Currency')}
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName="currency"
            />
        </PageTemplate>
    );
}
