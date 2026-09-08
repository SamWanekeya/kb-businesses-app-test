import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudTable } from '@/components/CrudTable';
import { ImportModal } from '@/components/ImportModal';
import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { router, usePage } from '@inertiajs/react';
import { Edit, Eye, FileDown, FileUp, Lock, Package, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

// import { ProductBarcode } from '@/components/Barcode';

export default function Products() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const {
        auth,
        products,
        categories,
        allCategories,
        brands,
        allBrands,
        taxes,
        users,
        allUsers,
        samplePath,
        filters: pageFilters = {},
        flash,
    } = usePage().props;

    useEffect(() => {
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
        else if (flash?.warning) toast.warning(t(flash.warning));
    }, [flash]);
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(pageFilters.category || 'all');
    const [selectedBrand, setSelectedBrand] = useState(pageFilters.brand || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    const [activeView, setActiveView] = useState<'list' | 'grid'>(pageFilters.view || 'list');

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedCategory !== 'all' || selectedBrand !== 'all' || selectedStatus !== 'all' || selectedAssignee !== 'all';
    };

    // Count active filters
    const activeFilterCount = () => {
        return (
            (selectedCategory !== 'all' ? 1 : 0) +
            (selectedBrand !== 'all' ? 1 : 0) +
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
            route('products.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                brand: selectedBrand !== 'all' ? selectedBrand : undefined,
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
            route('products.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                brand: selectedBrand !== 'all' ? selectedBrand : undefined,
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
                router.visit(route('products.show', item.id));
                break;
            case 'edit':
                router.visit(route('products.edit', item.id));
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
        router.visit(route('products.create'));
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting product...'));

        router.delete(route('products.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
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

    const handleToggleStatus = (product: any) => {
        router.put(
            route('products.toggle-status', product.id),
            {},
            {
                onSuccess: () => {},
                onError: (errors) => {
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
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
    }, [searchTerm, selectedCategory, selectedBrand, selectedStatus, selectedAssignee]);

    const handleResetFilters = () => {
        router.get(route('products.index'), { view: activeView });
    };

    // Define page actions
    const pageActions = [];

    // Add export button
    if (useHasPermission('export-products')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[500px]:mr-2" />,
            variant: 'outline',
            className: 'h-8 w-8 min-[500px]:h-9 min-[500px]:w-auto px-0 min-[500px]:px-4',
            labelClassName: 'hidden min-[500px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[500px]:hidden',
            onClick: () => {
                window.location.href = route('product.export');
            },
        });
    }

    // Add import button
    if (useHasPermission('import-products')) {
        pageActions.push({
            label: translate('Import'),
            icon: <FileUp className="mr-0 h-4 w-4 min-[500px]:mr-2" />,
            variant: 'outline',
            className: 'h-8 w-8 min-[500px]:h-9 min-[500px]:w-auto px-0 min-[500px]:px-4',
            labelClassName: 'hidden min-[500px]:inline',
            tooltip: translate('Import'),
            tooltipClassName: 'min-[500px]:hidden',
            onClick: () => setIsImportModalOpen(true),
        });
    }

    // Add the "Add Product" button if user has permission
    if (useHasPermission('create-products')) {
        pageActions.push({
            label: translate('Add Product'),
            icon: <Plus className="mr-0 h-4 w-4 min-[500px]:mr-2" />,
            variant: 'default',
            className: 'h-8 w-8 min-[500px]:h-9 min-[500px]:w-auto px-0 min-[500px]:px-4',
            labelClassName: 'hidden min-[500px]:inline',
            tooltip: translate('Add Product'),
            tooltipClassName: 'min-[500px]:hidden',
            onClick: () => router.visit(route('products.create')),
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Products') }];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: translate('Name'),
            sortable: true,
            render: (value: any, row: any) => {
                const mainImage = row.media?.find((m: any) => m.collection_name === 'main');
                const imageUrl = mainImage?.original_url || row.display_image_url || row.main_image_url || row.image;

                return (
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                            <img
                                src={imageUrl}
                                alt={row.name}
                                className="max-h-full max-w-full rounded-lg object-contain"
                                onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    if (!target.src.startsWith('data:image/svg+xml')) {
                                        target.src =
                                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBMMTQwIDgwVjE0MEwxMDAgMTYwTDYwIDE0MFY4MEwxMDAgNjBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSI4NSIgY3k9Ijk1IiByPSI4IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik03MCAxMzBMODUgMTE1TDEwMCAxMzBMMTMwIDEwMEwxMzAgMTMwSDcwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                                    } else {
                                        target.style.display = 'none';
                                        const icon = target.nextElementSibling as HTMLElement;
                                        if (icon) icon.style.display = 'flex';
                                    }
                                }}
                            />
                            <Package className="hidden h-6 w-6 text-gray-400" />
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{row.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">SKU: {row.sku}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'price',
            label: translate('Price'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value: any) => (
                <span className="font-mono font-semibold whitespace-nowrap text-green-600">
                    {window.appSettings?.formatCurrency(parseFloat(value || 0)) || `$${parseFloat(value || 0).toFixed(2)}`}
                </span>
            ),
        },
        {
            key: 'stock_quantity',
            label: translate('Stock'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value: any) => (
                <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ${
                        value > 10
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                            : value > 0
                              ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-600/20 ring-inset'
                              : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                    }`}
                >
                    {value} {value === 1 ? translate('unit') : translate('units')}
                </span>
            ),
        },
        // {
        //     key: 'assigned_user',
        //     label: translate('Assigned To'),
        //     className: 'whitespace-nowrap',
        //     render: (value: any) => value ? (
        //         <div className="flex items-center gap-2">
        //             <Avatar className="h-8 w-8 flex-shrink-0">
        //                 <AvatarImage src={value.avatar} alt={value.name} />
        //                 <AvatarFallback className="text-xs">{getInitials(value.name)}</AvatarFallback>
        //             </Avatar>
        //             <div>
        //                 <div className="font-medium whitespace-nowrap">{value.name}</div>
        //                 <div className="text-sm text-muted-foreground whitespace-nowrap">{value.email}</div>
        //             </div>
        //         </div>
        //     ) : <span className="whitespace-nowrap">{translate('Unassigned')}</span>
        // },
        {
            key: 'category',
            label: translate('Category'),
            className: 'whitespace-nowrap',
            render: (value: any) =>
                value?.name ? (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium whitespace-nowrap text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                        {value.name}
                    </span>
                ) : (
                    <span className="whitespace-nowrap">{translate('-')}</span>
                ),
        },
        {
            key: 'brand',
            label: translate('Brand'),
            className: 'whitespace-nowrap',
            render: (value: any) => <span className="whitespace-nowrap">{value?.name || translate('-')}</span>,
        },
        {
            key: 'status',
            label: translate('Status'),
            className: 'whitespace-nowrap',
            render: (value: string) => (
                <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ${
                        value === 'active'
                            ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                            : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                    }`}
                >
                    {value === 'active' ? translate('Active') : translate('Inactive')}
                </span>
            ),
        },
    ];

    // Define table actions
    const actions = [
        {
            label: translate('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-products',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-products',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-products',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-products',
        },
    ];

    // Prepare filter options
    const categoryOptions = [
        { value: 'all', label: translate('All Categories') },
        ...(allCategories || []).map((category: any) => ({
            value: category.id.toString(),
            label: category.name,
        })),
    ];

    const brandOptions = [
        { value: 'all', label: translate('All Brands') },
        ...(allBrands || []).map((brand: any) => ({
            value: brand.id.toString(),
            label: brand.name,
        })),
    ];

    const statusOptions = [
        { value: 'all', label: translate('All Statuses') },
        { value: 'active', label: translate('Active') },
        { value: 'inactive', label: translate('Inactive') },
    ];

    return (
        <PageTemplate
            title={translate('Products')}
            description={translate('Manage your products.')}
            url="/products"
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
                            name: 'category',
                            label: translate('Category'),
                            type: 'select',
                            searchable: true,
                            value: selectedCategory,
                            onChange: setSelectedCategory,
                            options: categoryOptions,
                        },
                        {
                            name: 'brand',
                            label: translate('Brand'),
                            type: 'select',
                            searchable: true,
                            value: selectedBrand,
                            onChange: setSelectedBrand,
                            options: brandOptions,
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
                            name: 'assigned_to',
                            label: translate('Assigned To'),
                            type: 'select',
                            searchable: true,
                            value: selectedAssignee,
                            onChange: setSelectedAssignee,
                            options: [
                                { value: 'all', label: translate('All Users') },
                                { value: 'unassigned', label: translate('Unassigned') },
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
                        router.get(route('products.index'), {
                            view,
                            page: pageFilters.page || undefined,
                            search: searchTerm || undefined,
                            category: selectedCategory !== 'all' ? selectedCategory : undefined,
                            brand: selectedBrand !== 'all' ? selectedBrand : undefined,
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
                            data={products?.data || []}
                            from={products?.from || 1}
                            onAction={handleAction}
                            sortField={pageFilters.sort_field}
                            sortDirection={pageFilters.sort_direction}
                            onSort={handleSort}
                            permissions={permissions}
                            entityPermissions={{
                                view: 'view-products',
                                create: 'create-products',
                                edit: 'edit-products',
                                delete: 'delete-products',
                            }}
                        />
                    </div>

                    {/* Pagination section */}
                    <Pagination
                        from={products?.from || 0}
                        to={products?.to || 0}
                        total={products?.total || 0}
                        links={products?.links}
                        entityName={translate('products')}
                        onPageChange={(url) => router.get(url)}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            router.get(
                                route('products.index'),
                                {
                                    view: activeView,
                                    page: 1,
                                    search: searchTerm || undefined,
                                    category: selectedCategory !== 'all' ? selectedCategory : undefined,
                                    brand: selectedBrand !== 'all' ? selectedBrand : undefined,
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
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {products?.data?.map((product: any) => {
                            const mainImage = product.media?.find((m: any) => m.collection_name === 'main');
                            const imageUrl = mainImage?.original_url || product.display_image_url || product.main_image_url || product.image;
                            const stockPct = Math.min(100, Math.max(0, (product.stock_quantity / 50) * 100));
                            const stockColor =
                                product.stock_quantity > 10 ? 'bg-emerald-500' : product.stock_quantity > 0 ? 'bg-amber-400' : 'bg-red-500';

                            return (
                                <div
                                    key={product.id}
                                    className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm transition-shadow duration-200 hover:shadow-lg dark:border-gray-600 dark:bg-gray-900"
                                    onClick={() => router.visit(route('products.show', product.id))}
                                >
                                    {/* Image Area */}
                                    <div
                                        className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700"
                                        style={{ height: '200px' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(imageUrl, '_blank');
                                        }}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            className="h-full w-full object-contain p-5"
                                            onError={(e) => {
                                                const target = e.currentTarget as HTMLImageElement;
                                                if (!target.src.startsWith('data:image/svg+xml')) {
                                                    target.src =
                                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjBMMTQwIDgwVjE0MEwxMDAgMTYwTDYwIDE0MFY4MEwxMDAgNjBaIiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI0U1RTdFQiIvPgo8Y2lyY2xlIGN4PSI4NSIgY3k9Ijk1IiByPSI4IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik03MCAxMzBMODUgMTE1TDEwMCAxMzBMMTMwIDEwMEwxMzAgMTMwSDcwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4=';
                                                }
                                            }}
                                        />
                                        {/* Status badge */}
                                        <div className="absolute top-3 left-3">
                                            <span
                                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                                    product.status === 'active'
                                                        ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset'
                                                        : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                                                }`}
                                            >
                                                {product.status === 'active' ? translate('Active') : translate('Inactive')}
                                            </span>
                                        </div>
                                        {/* Out of stock badge */}
                                        {product.stock_quantity === 0 && (
                                            <div className="absolute bottom-3 left-3">
                                                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-600/20 ring-inset">
                                                    {translate('Out of Stock')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className="flex flex-1 flex-col gap-3 p-4">
                                        {/* Name + SKU */}
                                        <div>
                                            <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-gray-900 dark:text-white">
                                                {product.name}
                                            </h3>
                                            <div className="mt-0.5 flex items-center justify-between">
                                                <p className="font-mono text-[11px] tracking-wide text-gray-400 dark:text-gray-500">#{product.sku}</p>
                                                {product.tax && (
                                                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                                        {translate('Tax')}: {product.tax.rate != null ? `${product.tax.rate}%` : product.tax.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Category & Brand */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.category && (
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium whitespace-nowrap text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                                                    {product.category.name}
                                                </span>
                                            )}
                                            {product.brand && (
                                                <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium whitespace-nowrap text-purple-700 ring-1 ring-purple-600/20 ring-inset">
                                                    {product.brand.name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Stock */}
                                        <div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-700 dark:bg-green-900/20">
                                                    <p className="mb-0.5 text-[11px] text-gray-500 dark:text-gray-400">{translate('Price')}</p>
                                                    <p className="font-mono text-sm font-bold text-green-600">
                                                        {window.appSettings?.formatCurrency(parseFloat(product.price || 0)) ||
                                                            `$${parseFloat(product.price || 0).toFixed(2)}`}
                                                    </p>
                                                </div>
                                                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-700 dark:bg-red-900/20">
                                                    <p className="mb-0.5 text-[11px] text-gray-500 dark:text-gray-400">{translate('In Stock')}</p>
                                                    <p className="text-sm font-bold text-orange-500">
                                                        {product.stock_quantity} {translate('units')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="-mx-4 mt-auto flex items-center justify-around border-t border-gray-300 px-4 pt-2 dark:border-gray-600">
                                            <TooltipProvider delayDuration={200}>
                                                {useHasPermission('view-products') && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.visit(route('products.show', product.id));
                                                                }}
                                                                className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{translate('View')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                                {useHasPermission('edit-products') && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.visit(route('products.edit', product.id));
                                                                }}
                                                                className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{translate('Edit')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                                {useHasPermission('toggle-status-products') && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleToggleStatus(product);
                                                                }}
                                                                className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                                            >
                                                                <Lock className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{product.status === 'active' ? translate('Deactivate') : translate('Activate')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                                {useHasPermission('delete-products') && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAction('delete', product);
                                                                }}
                                                                className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{translate('Delete')}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination for grid view */}
                    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                        <Pagination
                            from={products?.from || 0}
                            to={products?.to || 0}
                            total={products?.total || 0}
                            links={products?.links}
                            entityName={translate('products')}
                            onPageChange={(url) => router.get(url)}
                            currentPerPage={pageFilters.per_page?.toString() || '10'}
                            onPerPageChange={(value) => {
                                router.get(
                                    route('products.index'),
                                    {
                                        view: activeView,
                                        page: 1,
                                        search: searchTerm || undefined,
                                        category: selectedCategory !== 'all' ? selectedCategory : undefined,
                                        brand: selectedBrand !== 'all' ? selectedBrand : undefined,
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
                </div>
            )}

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={translate('product')}
            />

            {/* Import Modal */}
            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title={translate('Import Products from CSV/Excel')}
                importRoute="product.import"
                parseRoute="product.parse"
                samplePath={samplePath}
                importNotes={translate('Ensure that the values entered for Category, Brand, Tax match the existing records in your system.')}
                databaseFields={[
                    { key: 'name', required: true },
                    { key: 'sku', required: true },
                    { key: 'description' },
                    { key: 'price', required: true },
                    { key: 'stock', required: true },
                    { key: 'category' },
                    { key: 'brand' },
                    { key: 'tax' },
                    { key: 'status' },
                ]}
            />
        </PageTemplate>
    );
}
