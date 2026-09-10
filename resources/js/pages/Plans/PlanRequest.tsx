// pages/plans/plan-request.tsx
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { router, usePage } from '@inertiajs/react';
import { formatTitleCase } from '@utils/Helpers/StringFormatters';
import { route } from '@utils/Routes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PlanRequestsPage() {
    const { t: translate } = useTranslation();
    const { planRequests, filters: pageFilters = {}, auth, globalSettings } = usePage().props;
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');

    // Check if any filters are active
    const hasActiveFilters = () => {
        return selectedStatus !== 'all' || searchTerm !== '';
    };

    // Count active filters
    const activeFilterCount = () => {
        return (selectedStatus !== 'all' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('plan-requests.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
                ...(pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        router.get(
            route('plan-requests.index'),
            {
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        if (action === 'approve') {
            if (!globalSettings?.is_demo) {
                toast.loading(translate('Approving plan request...'));
            }

            router.post(
                route('plan-requests.approve', item.id),
                {},
                {
                    onSuccess: (page) => {
                        if (!globalSettings?.is_demo) {
                            toast.dismiss();
                        }
                        if (page.props.flash.success) {
                            toast.success(translate(page.props.flash.success));
                        } else if (page.props.flash.error) {
                            toast.error(translate(page.props.flash.error));
                        }
                    },
                    onError: (errors) => {
                        if (!globalSettings?.is_demo) {
                            toast.dismiss();
                        }
                        if (typeof errors === 'string') {
                            toast.error(t(errors));
                        } else {
                            toast.error(translate('Failed to approve plan request: {{errors}}', { errors: Object.values(errors).join(', ') }));
                        }
                    },
                },
            );
        } else if (action === 'reject') {
            if (!globalSettings?.is_demo) {
                toast.loading(translate('Rejecting plan request...'));
            }

            router.post(
                route('plan-requests.reject', item.id),
                {},
                {
                    onSuccess: (page) => {
                        if (!globalSettings?.is_demo) {
                            toast.dismiss();
                        }
                        if (page.props.flash.success) {
                            toast.success(translate(page.props.flash.success));
                        } else if (page.props.flash.error) {
                            toast.error(translate(page.props.flash.error));
                        }
                    },
                    onError: (errors) => {
                        if (!globalSettings?.is_demo) {
                            toast.dismiss();
                        }
                        if (typeof errors === 'string') {
                            toast.error(t(errors));
                        } else {
                            toast.error(translate('Failed to reject plan request: {{errors}}', { errors: Object.values(errors).join(', ') }));
                        }
                    },
                },
            );
        }
    };

    const [pageInitialState, setPageInitialState] = useState(true);
    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedStatus, searchTerm]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        router.get(route('plan-requests.index'));
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Plans'), href: route('plans.index') },
        { title: translate('Plan Requests') },
    ];

    // Define table columns
    const columns = [
        {
            key: 'user.name',
            label: translate('Organization'),
            render: (_, row) => {
                const avatarUrl = row.user?.avatar ? resolveImageUrl(row.user.avatar) : resolveImageUrl('media/avatars/avatar.png');
                return (
                    <div className="flex items-center gap-3">
                        <img
                            src={avatarUrl}
                            alt={row.user?.name || 'User'}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = resolveImageUrl('media/avatars/avatar.png');
                            }}
                        />
                        <div>
                            <div className="font-medium">{row.user?.name || '-'}</div>
                            <div className="text-xs text-gray-500">{row.user?.email || ''}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'plan.name',
            label: translate('Plan'),
            render: (_, row) => {
                const planName = row.plan?.name;
                if (!planName) return '-';
                return (
                    <span
                        className={
                            'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset'
                        }
                    >
                        {formatTitleCase(planName)}
                    </span>
                );
            },
        },
        {
            key: 'plan.duration',
            label: translate('Duration'),
            render: (_, row) => {
                const duration = row.duration;
                if (!duration) return '-';
                return duration === 'monthly' ? translate('Monthly') : translate('Yearly');
            },
        },
        {
            key: 'status',
            label: translate('Status'),
            render: (value) => {
                const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                    approved: 'bg-green-50 text-green-700 ring-green-600/20',
                    rejected: 'bg-red-50 text-red-700 ring-red-600/20',
                };
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusColors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                    >
                        {translate(value)}
                    </span>
                );
            },
        },
        {
            key: 'created_at',
            label: translate('Request Date'),
            sortable: true,
            type: 'date',
            // render: (value) => window.appSettings?.formatDateTime(value, false) || '-'
        },
    ];

    // Define table actions - only visible to super admin
    const isSuperAdmin = auth?.user?.type === 'super_admin';
    const actions = isSuperAdmin
        ? [
              {
                  label: translate('Approve'),
                  icon: 'Check',
                  action: 'approve',
                  className: 'text-green-500',
                  requiredPermission: 'approve-plan-requests',
                  condition: (row) => row.status === 'pending',
              },
              {
                  label: translate('Reject'),
                  icon: 'X',
                  action: 'reject',
                  className: 'text-red-500',
                  requiredPermission: 'reject-plan-requests',
                  condition: (row) => row.status === 'pending',
              },
          ]
        : [];

    // Prepare status options for filter
    const statusOptions = [
        { value: 'all', label: translate('All Status') },
        { value: 'pending', label: translate('Pending') },
        { value: 'approved', label: translate('Approved') },
        { value: 'rejected', label: translate('Rejected') },
    ];

    return (
        <PageTemplate
            title={translate('Plan Requests')}
            url="/plan-requests"
            breadcrumbs={breadcrumbs}
            // description={translate('View and manage all plan requests from organizations.')}
            description={isSuperAdmin ? translate('View and manage all plan requests from organizations.') : translate('View your plan requests.')}
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
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: statusOptions,
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
                    data={planRequests?.data || []}
                    from={planRequests?.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    permissions={permissions}
                />

                {/* Pagination section */}
                <Pagination
                    from={planRequests?.from || 0}
                    to={planRequests?.to || 0}
                    total={planRequests?.total || 0}
                    links={planRequests?.links}
                    entityName={translate('plan requests')}
                    onPageChange={(url) => router.get(url)}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('plan-requests.index'),
                            {
                                page: 1,
                                per_page: parseInt(value) !== 10 ? parseInt(value) : undefined,
                                search: searchTerm || undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
                            },
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                />
            </div>
        </PageTemplate>
    );
}
