import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function LoginHistory() {
    const { t: translate } = useTranslation();
    const { auth, loginHistory, filters: pageFilters = {}, globalSettings } = usePage().props;
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

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
        return searchTerm !== '' ? 1 : 0;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('sign-in-history.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        router.get(
            route('sign-in-history.index'),
            {
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                per_page: pageFilters.per_page,
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
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
        }
    };

    const handleDeleteConfirm = () => {
        if (!globalSettings?.is_demo) {
            toast.loading(translate('Deleting sign in history...'));
        }

        router.delete(route('sign-in-history.destroy', currentItem.id), {
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
                    toast.error(translate('Failed to delete sign in history: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const handleResetFilters = () => {
        router.get(route('sign-in-history.index'));
    };
    const isSuperAdmin = auth?.user?.type === 'super_admin';

    let breadcrumbs = [];
    if (isSuperAdmin) {
        breadcrumbs = [
            { title: translate('Dashboard'), href: route('dashboard') },
            { title: translate('Organizations'), href: route('organizations.index') },
            { title: translate('Sign in History') },
        ];
    } else {
        breadcrumbs = [
            { title: translate('Dashboard'), href: route('dashboard') },
            { title: translate('Staff'), href: route('users.index') },
            { title: translate('Sign in History') },
        ];
    }

    // Define table columns
    const columns = [
        {
            key: 'user.name',
            label: translate('User'),
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row.user?.name || '-'}</div>
                    <div className="text-xs text-gray-500">{row.user?.email || ''}</div>
                </div>
            ),
        },
        {
            key: 'user.type',
            label: translate('User Type'),
            render: (_, row) => {
                const userType = row.user?.type || '-';
                return userType.charAt(0).toUpperCase() + userType.slice(1);
            },
        },
        {
            key: 'ip_address',
            label: translate('IP Address'),
            sortable: true,
            render: (value) => value || '-',
        },
        {
            key: 'date',
            label: translate('Sign in Date'),
            sortable: true,
            type: 'date',
            // render: (value) => window.appSettings?.formatDateTime(value, false) || '-'
        },
        {
            key: 'details',
            label: translate('Details'),
            render: (value) => {
                try {
                    return (
                        <div className="text-xs">
                            <div>{value.browser_name || '-'}</div>
                            <div className="text-gray-500">{value.os_name || '-'}</div>
                        </div>
                    );
                } catch {
                    return '-';
                }
            },
        },
    ];

    // Define table actions
    const actions = [
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'show-sign-in-history',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-sign-in-history',
        },
    ];

    return (
        <PageTemplate
            title={translate('Sign in History')}
            description={translate('Manage your sign in history records.')}
            url="/sign-in-history"
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
                    data={loginHistory?.data || []}
                    from={loginHistory?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                    entityPermissions={{
                        delete: 'delete-sign-in-history',
                    }}
                />

                {/* Pagination section */}
                <Pagination
                    from={loginHistory?.from || 0}
                    to={loginHistory?.to || 0}
                    total={loginHistory?.total || 0}
                    links={loginHistory?.links}
                    entityName={translate('sign in records')}
                    onPageChange={(url) => router.get(url)}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('sign-in-history.index'),
                            {
                                page: 1,
                                per_page: parseInt(value),
                                search: searchTerm || undefined,
                            },
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                />
            </div>

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={`${currentItem?.user?.name || ''} `}
                itemType={translate('Sign in history')}
            />

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-h-[80vh] max-w-xl scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{translate('Sign in Details')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="text-gray-600">{translate('User')}</span>
                            <span className="font-medium">{currentItem?.user?.name || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="text-gray-600">{translate('Email')}</span>
                            <span className="font-medium">{currentItem?.user?.email || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="text-gray-600">{translate('User Type')}</span>
                            <span className="font-medium">
                                {currentItem?.user?.type ? currentItem.user.type.charAt(0).toUpperCase() + currentItem.user.type.slice(1) : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="text-gray-600">{translate('IP Address')}</span>
                            <span className="font-medium">{currentItem?.ip || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 py-2">
                            <span className="text-gray-600">{translate('Sign in Date')}</span>
                            <span className="font-medium">{window.appSettings?.formatDateTime(currentItem?.date, false) || '-'}</span>
                        </div>
                        {(() => {
                            try {
                                const details = JSON.parse(currentItem?.Details || '{}');
                                return Object.entries(details).map(([key, value]) => (
                                    <div key={key} className="flex justify-between border-b border-gray-100 py-2">
                                        <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                                        <span className="font-medium">{String(value) || '-'}</span>
                                    </div>
                                ));
                            } catch {
                                return null;
                            }
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
