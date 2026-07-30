import { useState } from 'react';
import { PageTemplate } from '@/components/page-template';
import { usePage, router } from '@inertiajs/react';
import { Plus, PanelsTopLeft } from 'lucide-react';
import { hasPermission } from '@/utils/authorization';
import { CrudTable } from '@/components/CrudTable';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { useTranslation } from 'react-i18next';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { capitalize } from '@/utils/helper';

export default function Announcements() {
    const { t } = useTranslation();
    const { auth, announcements, categories = [], allCategories = [], filters: pageFilters = {} } = usePage().props as any;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(pageFilters.category || 'all');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [showFilters, setShowFilters] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    const applyFilters = (e?: React.FormEvent) => {
        e?.preventDefault();
        router.get(route('announcements.index'), {
            search: searchTerm || undefined,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            page: 1,
            sort_field: pageFilters.sort_field || undefined,
            sort_direction: pageFilters.sort_direction || undefined,
            ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
        }, { preserveState: true, preserveScroll: true });
    };

    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedCategory !== 'all' || selectedStatus !== 'all';
    };

    const activeFilterCount = () => {
        return (searchTerm ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedCategory('all');
        setSelectedStatus('all');
        setShowFilters(false);
        router.get(route('announcements.index'), { page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        router.get(route('announcements.index'), {
            sort_field: field,
            sort_direction: direction,
            page: 1,
            search: searchTerm || undefined,
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            status: selectedStatus !== 'all' ? selectedStatus : undefined,
            ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
        }, { preserveState: true, preserveScroll: true });
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
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(t('Failed to save: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            }
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('announcements.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success(t('Announcement deleted successfully.'));
            },
            onError: () => toast.error(t('Failed to delete announcement.'))
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('announcements.toggle-status', currentItem.id), formData, {
            onSuccess: (page) => {
                setIsStatusModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(t('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            }
        });
    };

    const handleToggleStatus = (item: any) => {
        const newStatus = item.is_active ? 'inactive' : 'active';
        toast.loading(t('{{action}} announcement...', { action: newStatus === 'active' ? t('Activating') : t('Deactivating') }));

        router.put(route('announcements.toggle-status', item.id), {}, {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(t('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            expired: 'bg-gray-50 text-gray-700 ring-gray-600/20',
            active: 'bg-green-50 text-green-700 ring-green-600/20',
            inactive: 'bg-red-50 text-red-700 ring-red-600/20'
        };

        return (
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status as keyof typeof statusColors] || statusColors.active}`}>
                {capitalize(status) || 'Inactive'}
            </span>);
    };

    const columns = [
        { key: 'title', label: t('Title'), sortable: true },
        { key: 'category', label: t('Category'), render: (value: any) => value?.name || '-' },
        {
            key: 'is_featured',
            label: t('Featured'),
            render: (value: boolean) => value ?
            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-yellow-50 text-yellow-700 ring-yellow-600/20">{t('Yes')}</span> :
            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-gray-50 text-gray-700 ring-gray-600/20">{t('No')}</span>
        },
        {
            key: 'status',
            label: t('Status'),
            render: (value: string, row: any) => (getStatusBadge(value))
        },
        { key: 'created_at', label: t('Created At'), sortable: true, render: (value: string) => window.appSettings?.formatDateTime(value, false) || '-' }
    ];

    const actions = [
        { label: t('Change Status'), icon: 'RefreshCw', action: 'toggle-status', className: 'text-amber-500', requiredPermission: 'toggle-status-announcements' },
        { label: t('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-announcements' },
        { label: t('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-announcements' },
        { label: t('Delete'), icon: 'Trash2', action: 'delete', className: 'text-red-500', requiredPermission: 'delete-announcements' }
    ];

    return (
        <PageTemplate
            title={t("Announcements")}
            actions={[
                ...(hasPermission(permissions, 'manage-announcements') ? [{
                    label: t('Dashboard View'),
                    icon: <PanelsTopLeft className="h-4 w-4 mr-2" />,
                    onClick: () => router.get(route('announcements.dashboard'))
                }] : []),
                ...(hasPermission(permissions, 'create-announcements') ? [{
                    label: t('Add Announcement'),
                    variant: 'default',
                    icon: <Plus className="h-4 w-4 mr-2" />,
                    onClick: () => { setCurrentItem(null); setFormMode('create'); setIsFormModalOpen(true); }
                }] : [])
            ]}
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Announcements') }]}
        >
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow mb-4 p-4">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={applyFilters}
                    filters={[
                        {
                            name: 'category',
                            label: t('Category'),
                            type: 'select' as const,
                            searchable: true,
                            value: selectedCategory,
                            onChange: setSelectedCategory,
                            options: [
                                { value: 'all', label: t('All Categories') },
                                ...allCategories.map((cat: any) => ({ value: cat.id.toString(), label: cat.name }))
                            ]
                        },
                        {
                            name: 'status',
                            label: t('Status'),
                            type: 'select' as const,
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: [
                                { value: 'all', label: t('All Status') },
                                { value: 'active', label: t('Active') },
                                { value: 'inactive', label: t('Inactive') },
                                { value: 'expired', label: t('Expired') }
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
                        router.get(route('announcements.index'), {
                            page: 1,
                            search: searchTerm || undefined,
                            category: selectedCategory !== 'all' ? selectedCategory : undefined,
                            status: selectedStatus !== 'all' ? selectedStatus : undefined,
                            sort_field: pageFilters.sort_field || undefined,
                            sort_direction: pageFilters.sort_direction || undefined,
                            ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                        }, { preserveState: true, preserveScroll: true });
                    }}
                />
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

            <div className="mt-4 bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
                <Pagination
                    from={announcements?.from || 0}
                    to={announcements?.to || 0}
                    total={announcements?.total || 0}
                    links={announcements?.links}
                    entityName={t('announcements')}
                    onPageChange={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
                />
            </div>

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        { name: 'title', label: t('Title'), type: 'text', required: true, placeholder: t('eg. New Feature Release, System Maintenance') },
                        { name: 'content', label: t('Content'), type: 'rich-textbox', required: true, colSpan: 12, placeholder: t('Enter announcement details...') },
                        {
                            name: 'announcement_category_id',
                            label: t('Announcement Category'),
                            type: 'select',
                            options: categories.map((cat: any) => ({ value: cat.id, label: cat.name })),
                            required: true,
                            searchable: true,
                            emptyNote: categories.length === 0 ? {
                                link: route('announcement-categories.index'),
                                linkText: t('Announcement Category')
                            } : undefined
                        },
                        { name: 'start_date', label: t('Start Date'), type: 'date', required: true, placeholder: t('Select start date') },
                        { name: 'end_date', label: t('End Date'), type: 'date', placeholder: t('Select end date') },
                        { name: 'status', label: t('Status'), type: 'select', options: [{ value: 'active', label: t('Active') }, { value: 'inactive', label: t('Inactive') }, { value: 'expired', label: t('Expired') }], defaultValue: 'active' },
                        { name: 'is_featured', label: t('Featured'), type: 'checkbox' },
                    ],
                    modalSize: '2xl'
                }}
                initialData={currentItem}
                title={formMode === 'create' ? t('Add Announcement') : formMode === 'edit' ? t('Edit Announcement') : t('View Announcement')}
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
                            label: t('Status'),
                            type: 'select',
                            required: true,
                            options: [
                                { value: 'active', label: t('Active') },
                                { value: 'inactive', label: t('Inactive') },
                                { value: 'expired', label: t('Expired') }
                            ]
                        }
                    ],
                    modalSize: 'sm'
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={t('Change Announcement Status')}
                mode='edit'
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.title || ''}
                entityName={t('announcement')}
            />
        </PageTemplate>
    );
}
