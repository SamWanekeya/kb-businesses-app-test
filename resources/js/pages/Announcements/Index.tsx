import CrudDeleteModal from '@components/CrudDeleteModal';
import { CrudFormModal } from '@components/CrudFormModal';
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { router, usePage } from '@inertiajs/react';
import { formatTitleCase } from '@utils/Helpers/StringFormatters';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { AlertCircle, CheckCircle, Clock, LayoutGrid, PanelsTopLeft, Plus, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Announcements() {
    const { t: translate } = useTranslation();
    const { auth, announcements, categories = [], allCategories = [], stats = {}, filters: pageFilters = {} } = usePage().props;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(pageFilters.category || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');

    const handleTabChange = (status: string) => {
        setSelectedStatus(status);
        router.get(
            route('announcements.index'),
            {
                search: searchTerm || undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                status: status !== 'all' ? status : undefined,
                page: 1,
                sort_field: pageFilters.sort_field || undefined,
                sort_direction: pageFilters.sort_direction || undefined,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    const applyFilters = (e?: React.FormEvent) => {
        e?.preventDefault();
        router.get(
            route('announcements.index'),
            {
                search: searchTerm || undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                page: 1,
                sort_field: pageFilters.sort_field || undefined,
                sort_direction: pageFilters.sort_direction || undefined,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const hasActiveFilters = () => searchTerm !== '' || selectedCategory !== 'all';

    const activeFilterCount = () => (searchTerm ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0);

    const pageInitialState = useState(true);
    useEffect(() => {
        if (pageInitialState[0]) {
            pageInitialState[1](false);
            return;
        }
        applyFilters();
    }, [searchTerm, selectedCategory]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('all');
        router.get(route('announcements.index'), { status: selectedStatus !== 'all' ? selectedStatus : undefined });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        router.get(
            route('announcements.index'),
            {
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view':
                router.get(route('announcements.show', item.id));
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                setIsStatusModalOpen(true);
                break;
        }
    };

    const handleFormSubmit = (formData: any) => {
        const routeName = formMode === 'create' ? 'announcements.store' : 'announcements.update';
        const method = formMode === 'create' ? 'post' : 'put';

        router[method](route(routeName, formMode === 'edit' ? currentItem.id : undefined), formData, {
            onSuccess: () => {
                setIsFormModalOpen(false);
                toast.success(t(formMode === 'create' ? 'Announcement created successfully.' : 'Announcement updated successfully.'));
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(translate('Failed to save: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('announcements.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success(translate('Announcement deleted successfully.'));
            },
            onError: () => toast.error(translate('Failed to delete announcement.')),
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('announcements.toggle-status', currentItem.id), formData, {
            onSuccess: (page) => {
                setIsStatusModalOpen(false);
                toast.dismiss(toastId);
                if (page.props.flash.success) {
                    toast.success(translate(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(translate(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleToggleStatus = (item: any) => {
        const newStatus = item.is_active ? 'inactive' : 'active';
        toast.loading(
            translate('{{action}} announcement...', { action: newStatus === 'active' ? translate('Activating') : translate('Deactivating') }),
        );

        router.put(
            route('announcements.toggle-status', item.id),
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss(toastId);
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    }
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            },
        );
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            expired: 'bg-gray-50 text-gray-700 ring-gray-600/20',
            active: 'bg-green-50 text-green-700 ring-green-600/20',
            inactive: 'bg-red-50 text-red-700 ring-red-600/20',
        };

        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status as keyof typeof statusColors] || statusColors.active}`}
            >
                {formatTitleCase(status) || 'Inactive'}
            </span>
        );
    };

    const columns = [
        {
            key: 'title',
            label: translate('Title'),
            sortable: true,
            render: (value: string, row: any) => (
                <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-900 dark:text-white">{value}</span>
                    {row.category?.name && (
                        <span className="inline-flex w-fit items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700 ring-1 ring-gray-600/20 ring-inset">
                            <Tag className="h-2.5 w-2.5" />
                            {row.category.name}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'is_featured',
            label: translate('Featured'),
            render: (value: boolean) =>
                value ? (
                    <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-600/20 ring-inset">
                        {translate('Yes')}
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-600/20 ring-inset">
                        {translate('No')}
                    </span>
                ),
        },
        {
            key: 'status',
            label: translate('Status'),
            render: (value: string, row: any) => getStatusBadge(value),
        },
        {
            key: 'created_at',
            label: translate('Created At'),
            sortable: true,
            type: 'date',
            //  render: (value: string) => window.appSettings?.formatDateTime(value, false) || '-'
        },
    ];

    const actions = [
        {
            label: translate('Change Status'),
            icon: 'RefreshCw',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-announcements',
        },
        { label: translate('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-announcements' },
        { label: translate('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-announcements' },
        { label: translate('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-announcements' },
    ];

    return (
        <PageTemplate
            title={translate('Announcements')}
            description={translate('Manage announcements.')}
            actions={[
                ...(useHasPermission('manage-announcements')
                    ? [
                          {
                              label: translate('Dashboard View'),
                              icon: <PanelsTopLeft className="mr-0 h-4 w-4 min-[550px]:mr-2" />,
                              onClick: () => router.get(route('announcements.dashboard')),
                              className: 'h-8 w-8 min-[550px]:h-9 min-[550px]:w-auto px-0 min-[550px]:px-4',
                              labelClassName: 'hidden min-[550px]:inline',
                              tooltip: translate('Dashboard View'),
                              tooltipClassName: 'min-[550px]:hidden',
                          },
                      ]
                    : []),
                ...(useHasPermission('create-announcements')
                    ? [
                          {
                              label: translate('Add Announcement'),
                              variant: 'default',
                              icon: <Plus className="mr-0 h-4 w-4 min-[550px]:mr-2" />,
                              className: 'h-8 w-8 min-[550px]:h-9 min-[550px]:w-auto px-0 min-[550px]:px-4',
                              labelClassName: 'hidden min-[550px]:inline',
                              tooltip: translate('Add Announcement'),
                              tooltipClassName: 'min-[550px]:hidden',
                              onClick: () => {
                                  setCurrentItem(null);
                                  setFormMode('create');
                                  setIsFormModalOpen(true);
                              },
                          },
                      ]
                    : []),
            ]}
            breadcrumbs={[{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Announcements') }]}
            noPadding
        >
            <div className="rounded-t-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={applyFilters}
                    filters={[
                        {
                            name: 'category',
                            label: translate('Category'),
                            type: 'select' as const,
                            searchable: true,
                            value: selectedCategory,
                            onChange: setSelectedCategory,
                            options: [
                                { value: 'all', label: translate('All Categories') },
                                ...allCategories.map((cat: any) => ({ value: cat.id.toString(), label: cat.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                />
            </div>

            <div className="mb-4 overflow-hidden rounded-b-lg border border-t-0 border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
                {/* Status Tabs */}
                <div className="flex items-center gap-1 border-b border-gray-200 px-4 dark:border-gray-700">
                    {(
                        [
                            { value: 'all', label: translate('All'), count: stats.total ?? 0, icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                            { value: 'active', label: translate('Active'), count: stats.active ?? 0, icon: <CheckCircle className="h-3.5 w-3.5" /> },
                            {
                                value: 'inactive',
                                label: translate('Inactive'),
                                count: stats.inactive ?? 0,
                                icon: <AlertCircle className="h-3.5 w-3.5" />,
                            },
                            { value: 'expired', label: translate('Expired'), count: stats.expired ?? 0, icon: <Clock className="h-3.5 w-3.5" /> },
                        ] as const
                    ).map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => handleTabChange(tab.value)}
                            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                selectedStatus === tab.value
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            <span
                                className={`ml-0.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                                    selectedStatus === tab.value
                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                <CrudTable
                    data={announcements.data}
                    columns={columns}
                    actions={actions}
                    from={announcements?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    pagination={announcements}
                    permissions={permissions}
                />
            </div>

            <div className="mt-0 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <Pagination
                    from={announcements?.from || 0}
                    to={announcements?.to || 0}
                    total={announcements?.total || 0}
                    links={announcements?.links}
                    entityName={translate('announcements')}
                    onPageChange={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('announcements.index'),
                            {
                                page: 1,
                                search: searchTerm || undefined,
                                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
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
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        {
                            name: 'title',
                            label: translate('Title'),
                            type: 'text',
                            required: true,
                            placeholder: translate('eg. New Feature Release, System Maintenance'),
                        },
                        {
                            name: 'content',
                            label: translate('Content'),
                            type: 'rich-textbox',
                            required: true,
                            colSpan: 12,
                            placeholder: translate('Enter announcement details...'),
                        },
                        {
                            name: 'announcement_category_id',
                            label: translate('Announcement Category'),
                            type: 'select',
                            options: categories.map((cat: any) => ({ value: cat.id, label: cat.name })),
                            required: true,
                            searchable: true,
                            emptyNote:
                                categories.length === 0
                                    ? {
                                          link: route('announcement-categories.index'),
                                          linkText: translate('Announcement Category'),
                                      }
                                    : undefined,
                        },
                        {
                            name: 'start_date',
                            label: translate('Start Date'),
                            type: 'date',
                            required: true,
                            placeholder: translate('Select start date'),
                        },
                        { name: 'end_date', label: translate('End Date'), type: 'date', placeholder: translate('Select end date') },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            options: [
                                { value: 'active', label: translate('Active') },
                                { value: 'inactive', label: translate('Inactive') },
                                { value: 'expired', label: translate('Expired') },
                            ],
                            defaultValue: 'active',
                        },
                        { name: 'is_featured', label: translate('Featured'), type: 'checkbox' },
                    ],
                    modalSize: '2xl',
                }}
                initialData={currentItem}
                title={
                    formMode === 'create'
                        ? translate('Add Announcement')
                        : formMode === 'edit'
                          ? translate('Edit Announcement')
                          : translate('View Announcement')
                }
                mode={formMode}
            />

            {/* Status Modal */}
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
                                { value: 'active', label: translate('Active') },
                                { value: 'inactive', label: translate('Inactive') },
                                { value: 'expired', label: translate('Expired') },
                            ],
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={translate('Change Announcement Status')}
                mode="edit"
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.title || ''}
                entityName={translate('announcement')}
            />
        </PageTemplate>
    );
}
