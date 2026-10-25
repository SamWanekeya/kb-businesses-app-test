import CrudTable from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import useInitials from '@hooks/useInitials';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Supported plan-request statuses returned by the backend. */
type PlanRequestStatus = 'pending' | 'approved' | 'rejected';

type PlanDuration = 'monthly' | 'yearly';

/** Organization associated with a plan request. */
interface PlanRequestUser {
    name: string | null;
    email: string | null;
    avatar: string | null;
}

/** Plan selected by the organization. */
interface RequestedPlan {
    name: string | null;
    duration: PlanDuration | null;
}

/** A single subscription plan request. */
interface PlanRequest {
    id: number;
    status: PlanRequestStatus;
    created_at: string;
    user: PlanRequestUser | null;
    plan: RequestedPlan | null;
}

/** Pagination metadata supplied by Laravel. */
interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedPlanRequests {
    data: PlanRequest[];
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
}

/** Query parameters reflected in the current server response. */
interface PlanRequestFilters {
    search?: string | null;
    status?: PlanRequestStatus | null;
    per_page?: number | string | null;
    sort_field?: string | null;
    sort_direction?: 'asc' | 'desc' | null;
}

/** Minimum authentication data required by this page. */
interface PlanRequestAuth {
    user?: {
        type?: string | null;
    } | null;
    permissions?: string[];
}

/** Actions exposed by the existing CrudTable component. */
type PlanRequestAction = 'approve' | 'reject';

/**
 * PlanRequests
 *
 * Displays and manages organization requests to change or upgrade
 * subscription plans.
 *
 * Responsibilities:
 * - Search and filter plan requests.
 * - Sort and paginate server-provided results.
 * - Expose authorized approval and rejection actions.
 * - Render organization, plan, status, and request-date information.
 *
 * Architecture:
 * - Laravel remains responsible for filtering, sorting, pagination,
 *   authorization, and persisting approval or rejection decisions.
 * - Inertia handles navigation and form submissions.
 * - Existing shared UI components remain the presentation layer.
 *
 * Accessibility:
 * - Uses semantic page and form structure through shared components.
 * - Preserves visible text labels and existing keyboard interactions.
 * - Provides text-based status labels instead of color-only indicators.
 *
 * Performance:
 * - Memoizes table configuration and derived filter metadata.
 * - Stabilizes event handlers where useful to child components.
 *
 * Extension points:
 * - Add additional server-supported filters to the centralized
 *   navigation helper and SearchAndFilterBar configuration.
 */
export default function PlanRequests() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();

    const { planRequests, filters: pageFilters = {}, auth } = usePage().props;

    const permissions = auth?.permissions ?? [];
    const isSuperAdmin = auth?.user?.type === 'super_admin';

    const [searchTerm, setSearchTerm] = useState(pageFilters.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState<PlanRequestStatus | '_empty_'>(pageFilters.status ?? '_empty_');
    const [showFilters, setShowFilters] = useState(false);

    const currentPerPage = Number(pageFilters.per_page) || 10;

    const hasActiveFilters = useMemo(() => searchTerm.trim() !== '' || selectedStatus !== '_empty_', [searchTerm, selectedStatus]);

    const activeFilterCount = useMemo(() => Number(searchTerm.trim() !== '') + Number(selectedStatus !== '_empty_'), [searchTerm, selectedStatus]);

    /**
     * Builds consistent index-query parameters for every table navigation.
     *
     * Keeping filter and pagination parameters together prevents sorting
     * and page-size changes from silently dropping the active filters.
     */
    const buildIndexParams = useCallback(
        (overrides: Record<string, string | number | undefined> = {}) => ({
            page: 1,
            per_page: currentPerPage,
            search: searchTerm.trim() || undefined,
            status: selectedStatus !== '_empty_' ? selectedStatus : undefined,
            ...overrides,
        }),
        [currentPerPage, searchTerm, selectedStatus],
    );

    /**
     * Applies the current search and status filters.
     * Server-side filtering remains the source of truth.
     */
    const applyFilters = useCallback(() => {
        router.get(route('subscriptions.plan-requests.index'), buildIndexParams(), {
            preserveState: true,
            preserveScroll: true,
        });
    }, [buildIndexParams]);

    /**
     * Handles the search form submission without depending on deprecated
     * event-handler aliases or duplicating navigation logic.
     */
    const handleSearch = useCallback(() => {
        applyFilters();
    }, [applyFilters]);

    /**
     * Sorts the table and resets pagination to the first page.
     */
    const handleSort = useCallback(
        (field: string) => {
            const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

            router.get(
                route('subscriptions.plan-requests.index'),
                buildIndexParams({
                    sort_field: field,
                    sort_direction: direction,
                }),
                {
                    preserveState: true,
                    preserveScroll: true,
                },
            );
        },
        [buildIndexParams, pageFilters.sort_direction, pageFilters.sort_field],
    );

    /**
     * Clears all filters and returns to the first results page.
     */
    const handleResetFilters = useCallback(() => {
        setSearchTerm('');
        setSelectedStatus('_empty_');
        setShowFilters(false);

        router.get(
            route('subscriptions.plan-requests.index'),
            {
                page: 1,
                per_page: currentPerPage,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    }, [currentPerPage]);

    /**
     * Changes the number of results displayed per page.
     */
    const handlePerPageChange = useCallback(
        (value: string) => {
            const perPage = Number(value);

            if (!Number.isInteger(perPage) || perPage < 1) {
                return;
            }

            router.get(route('subscriptions.plan-requests.index'), buildIndexParams({ per_page: perPage }), {
                preserveState: true,
                preserveScroll: true,
            });
        },
        [buildIndexParams],
    );

    /**
     * Submits an approval or rejection request.
     *
     * The backend must independently enforce permissions and valid
     * state transitions; frontend action visibility is not authorization.
     */
    const handleAction = useCallback(
        (action: string, item: PlanRequest) => {
            if ((action !== 'approve' && action !== 'reject') || item.status !== 'pending') {
                return;
            }

            const requestAction = action as PlanRequestAction;
            const actionLabel = requestAction === 'approve' ? translate('Approving plan request...') : translate('Rejecting plan request...');

            const endpoint = requestAction === 'approve' ? 'subscriptions.plan-requests.approve' : 'subscriptions.plan-requests.reject';

            const toastId = toast.loading(actionLabel);

            router.post(
                route(endpoint, item.id),
                {},
                {
                    onSuccess: () => {
                        toast.dismiss(toastId);
                    },
                    onError: (errors) => {
                        toast.dismiss(toastId);

                        Object.values(errors).forEach((message) => {
                            if (typeof message === 'string') {
                                toast.error(translate(message));
                            }
                        });
                    },
                    onCancel: () => {
                        toast.dismiss(toastId);
                    },
                    onFinish: () => {
                        toast.dismiss(toastId);
                    },
                },
            );
        },
        [translate],
    );

    const breadcrumbs = useMemo(
        () => [
            { title: translate('Subscriptions') },
            {
                title: translate('Plan requests'),
                href: route('subscriptions.plan-requests.index'),
            },
        ],
        [translate],
    );

    const statusOptions = useMemo(
        () => [
            {
                value: '_empty_',
                label: translate('All statuses'),
                disabled: true,
            },
            { value: 'pending', label: translate('Pending') },
            { value: 'approved', label: translate('Approved') },
            { value: 'rejected', label: translate('Rejected') },
        ],
        [translate],
    );

    const columns = useMemo(
        () => [
            {
                key: 'user.name',
                label: translate('Organization'),
                render: (_value: unknown, row: PlanRequest) => (
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold"
                            aria-hidden="true"
                        >
                            {row.user?.avatar ? (
                                <img src={row.user.avatar} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                            ) : (
                                getInitials(row.user?.name ?? '')
                            )}
                        </div>

                        <div className="min-w-0">
                            <p className="text-foreground truncate font-medium">{row.user?.name || '—'}</p>
                            <p className="text-foreground/75 truncate text-sm">{row.user?.email || '—'}</p>
                        </div>
                    </div>
                ),
            },
            {
                key: 'plan.name',
                label: translate('Plan'),
                render: (_value: unknown, row: PlanRequest) =>
                    row.plan?.name ? (
                        <span className="border-border bg-muted text-foreground inline-flex items-center rounded-md border px-2.5 py-1 text-sm capitalize">
                            {row.plan.name}
                        </span>
                    ) : (
                        <span className="text-foreground/75">—</span>
                    ),
            },
            {
                key: 'plan.duration',
                label: translate('Duration'),
                render: (_value: unknown, row: PlanRequest) => {
                    const duration = row.plan?.duration;

                    if (!duration) {
                        return <span className="text-foreground/75">—</span>;
                    }

                    return translate(duration === 'monthly' ? 'Monthly' : 'Yearly');
                },
            },
            {
                key: 'status',
                label: translate('Status'),
                render: (value: PlanRequestStatus) => {
                    const statusClasses: Record<PlanRequestStatus, string> = {
                        pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                        approved: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400',
                        rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
                    };

                    return (
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm capitalize ${statusClasses[value]}`}>
                            {translate(value)}
                        </span>
                    );
                },
            },
            {
                key: 'created_at',
                label: translate('Request date'),
                sortable: true,
                render: (value: string) => {
                    const formatted = window.kbSettings.formatDateTimeSimple(value, false);

                    return (
                        <time dateTime={value} className="text-foreground/75 text-sm whitespace-nowrap">
                            {formatted || value}
                        </time>
                    );
                },
            },
        ],
        [getInitials, translate],
    );

    const actions = useMemo(
        () =>
            isSuperAdmin
                ? [
                      {
                          label: translate('Approve'),
                          icon: 'Check',
                          action: 'approve',
                          className: 'text-fuchsia-600',
                          requiredPermission: 'approve-plan-requests',
                          condition: (row: PlanRequest) => row.status === 'pending',
                      },
                      {
                          label: translate('Reject'),
                          icon: 'X',
                          action: 'reject',
                          className: 'text-destructive',
                          requiredPermission: 'reject-plan-requests',
                          condition: (row: PlanRequest) => row.status === 'pending',
                      },
                  ]
                : [],
        [isSuperAdmin, translate],
    );

    const handlePageChange = useCallback((url: string) => {
        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    }, []);

    return (
        <PageTemplate
            title={translate('Plan requests')}
            description={translate('Review and manage organization requests to change or upgrade their subscription plans.')}
            url="/subscriptions/plan-requests"
            breadcrumbs={breadcrumbs}
        >
            <section
                aria-label={translate('Search and filter plan requests')}
                className="border-border bg-card mb-5 rounded-xl border p-4 shadow-sm sm:p-5"
            >
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
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={() => hasActiveFilters}
                    activeFilterCount={() => activeFilterCount}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={applyFilters}
                    currentPerPage={String(currentPerPage)}
                    onPerPageChange={handlePerPageChange}
                />
            </section>

            <section aria-label={translate('Plan request results')} className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
                <div className="overflow-x-auto">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={planRequests?.data ?? []}
                        from={planRequests?.from ?? 0}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                    />
                </div>

                <div className="border-border border-t px-3 py-3 sm:px-5">
                    <Pagination
                        from={planRequests?.from ?? 0}
                        to={planRequests?.to ?? 0}
                        total={planRequests?.total ?? 0}
                        links={planRequests?.links}
                        entityName={translate('Plan requests')}
                        onPageChange={handlePageChange}
                    />
                </div>
            </section>
        </PageTemplate>
    );
}
