import CrudDeleteModal from '@components/CrudDeleteModal';
import CrudTable from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SignInHistory() {
    const { t: translate } = useTranslation();
    const { auth, signInHistory, filters: pageFilters = {} } = usePage().props;
    const permissions = auth?.permissions ?? [];

    // State
    const [searchTerm, setSearchTerm] = useState<string>(pageFilters.search ?? '');
    const [showFilters, setShowFilters] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

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
                per_page: pageFilters.per_page || 10,
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
                per_page: pageFilters.per_page || 10,
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
        const toastId = toast.loading(translate('Deleting sign in history...'));

        router.delete(route('sign-in-history.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setShowFilters(false);

        router.get(
            route('sign-in-history.index'),
            {
                page: 1,
                per_page: pageFilters.per_page || 10,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard.index') },
        ...(auth?.user?.type === 'organization'
            ? [{ title: translate('Users'), href: route('users-permissions.users.index') }]
            : [{ title: translate('Organizations'), href: route('organizations.index') }]),
        { title: translate('Sign in history') },
    ];

    // Define table columns
    const columns = [
        {
            key: 'user.name',
            label: translate('User'),
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row.user?.name || ''}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">{row.user?.email || ''}</div>
                </div>
            ),
        },
        {
            key: 'user.type',
            label: translate('User type'),
            render: (_, row) => {
                const userType = row.user?.type || '';
                return userType.charAt(0).toUpperCase() + userType.slice(1);
            },
        },
        {
            key: 'ip_address',
            label: translate('IP address'),
            sortable: true,
            render: (value) => value || '',
        },
        {
            key: 'date',
            label: translate('Sign in date'),
            sortable: true,
            render: (value) => window.hfSettings.formatDateTimeSimple(value, true),
        },
        {
            key: 'Details',
            label: translate('Details'),
            render: (value) => {
                try {
                    const details = JSON.parse(value || '{}');
                    return (
                        <div className="text-xs">
                            <div>{details.browser_name || ''}</div>
                            <div className="text-neutral-500 dark:text-neutral-400">{details.os_name || ''}</div>
                        </div>
                    );
                } catch {
                    return '';
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
            className: 'text-red-600',
            requiredPermission: 'delete-sign-in-history',
        },
    ];

    return (
        <PageTemplate
            title={translate('Sign in history')}
            description={translate('')}
            url="/sign-in-history"
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => {
                        router.visit(auth?.user?.type === 'organization' ? route('users-permissions.users.index') : route('organizations.index'));
                    },
                },
            ]}
        >
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg bg-neutral-50 p-4 shadow dark:bg-neutral-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[]}
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={applyFilters}
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

            {/* Content section */}
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-neutral-900">
                <CrudTable
                    columns={columns}
                    actions={actions}
                    data={signInHistory?.data || []}
                    from={signInHistory?.from || 1}
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
                    from={signInHistory?.from || 0}
                    to={signInHistory?.to || 0}
                    total={signInHistory?.total || 0}
                    links={signInHistory?.links}
                    entityName={translate('Sign in records')}
                    onPageChange={(url) => {
                        router.get(url);
                    }}
                />
            </div>

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                }}
                onConfirm={handleDeleteConfirm}
                itemName={`${currentItem?.user?.name || ''} `}
                itemType={translate('Sign in history')}
                entityName="sign in histroy"
            />

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-h-[80vh] max-w-xl scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{translate('Sign in details')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-neutral-100 py-2">
                            <span className="text-neutral-600">{translate('User')}</span>
                            <span className="font-medium">{currentItem?.user?.name || ''}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 py-2">
                            <span className="text-neutral-600">{translate('Email')}</span>
                            <span className="font-medium">{currentItem?.user?.email || ''}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 py-2">
                            <span className="text-neutral-600">{translate('User type')}</span>
                            <span className="font-medium">
                                {currentItem?.user?.type ? currentItem.user.type.charAt(0).toUpperCase() + currentItem.user.type.slice(1) : ''}
                            </span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 py-2">
                            <span className="text-neutral-600">{translate('IP address')}</span>
                            <span className="font-medium">{currentItem?.ip || ''}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 py-2">
                            <span className="text-neutral-600">{translate('Sign in date')}</span>
                            <span className="font-medium">
                                {currentItem?.date ? window.hfSettings.formatDateTimeSimple(currentItem.date, true) : ''}
                            </span>
                        </div>
                        {(() => {
                            try {
                                const details = JSON.parse(currentItem?.Details || '{}');
                                return Object.entries(details).map(([key, value]) => (
                                    <div key={key} className="flex justify-between border-b border-neutral-100 py-2">
                                        <span className="text-neutral-600 capitalize">{key?.replace(/_/g, ' ')}</span>
                                        <span className="font-medium">{String(value) || ''}</span>
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
