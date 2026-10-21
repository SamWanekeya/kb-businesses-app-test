import CrudTable from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { Label } from '@components/UserInterface/Label';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { Textarea } from '@components/UserInterface/Textarea';
import useInitials from '@hooks/useInitials';
import { router, usePage } from '@inertiajs/react';
import View from '@pages/Subscriptions/PlanOrders/View';
import { formatCurrencySimple } from '@utils/Helpers/NumberFormatters';
import { route } from '@utils/Routes';
import { FileText } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** Supported plan-order lifecycle statuses. */
type PlanOrderStatus = 'pending' | 'approved' | 'rejected' | 'completed';

/** Organization associated with a plan order. */
interface PlanOrderUser {
    name: string | null;
    email: string | null;
    avatar: string | null;
}

/** Subscription plan associated with an order. */
interface PlanOrderPlan {
    name: string | null;
}

/** A subscription purchase recorded by the backend. */
interface PlanOrder {
    id: number;
    order_number: string | null;
    status: PlanOrderStatus;
    original_price: number | string;
    discount_amount: number | string;
    final_price: number | string;
    receipt: string | null;
    ordered_at: string;
    user: PlanOrderUser | null;
    plan: PlanOrderPlan | null;
}

/** Laravel pagination link. */
interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** Paginated order data returned by Inertia. */
interface PaginatedPlanOrders {
    data: PlanOrder[];
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
}

/** Active server-side query parameters. */
interface PlanOrderFilters {
    search?: string | null;
    status?: PlanOrderStatus | null;
    date_from?: string | null;
    date_to?: string | null;
    per_page?: number | string | null;
    sort_field?: string | null;
    sort_direction?: 'asc' | 'desc' | null;
}

interface PlanOrdersAuth {
    user?: {
        type?: string | null;
    } | null;
    permissions?: string[];
}

interface PlanOrdersPageProps {
    planOrders: PaginatedPlanOrders;
    filters?: PlanOrderFilters;
    auth?: PlanOrdersAuth | null;
}

type IndexParams = {
    page: number;
    per_page: number;
    search: string | undefined;
    status: PlanOrderStatus | undefined;
    date_from: string | undefined;
    date_to: string | undefined;
    sort_field?: string;
    sort_direction?: 'asc' | 'desc';
};

/**
 * Converts a date value into a date-only query parameter.
 *
 * Date-only strings avoid sending locale-dependent Date object
 * representations to Laravel. Local calendar components are used
 * to prevent timezone conversion from shifting the selected day.
 */
function toDateQueryValue(value: Date | undefined): string | undefined {
    if (!value || Number.isNaN(value.getTime())) {
        return undefined;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Initializes a date filter from a server-provided date-only string.
 */
function parseDateFilter(value: string | null | undefined): Date | undefined {
    if (!value) {
        return undefined;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
        return undefined;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return undefined;
    }

    return date;
}

/**
 * Formats an order date using the existing application formatter when
 * available, with a locale-aware fallback.
 */
function formatOrderDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    const formatted = window.hfSettings?.formatDateTimeSimple?.(value, false);

    return formatted || date.toLocaleDateString();
}

/**
 * PlanOrders
 *
 * Provides administrative oversight of subscription purchases, including
 * order inspection, approval, rejection, and receipt access.
 *
 * Architecture:
 * - Laravel owns authorization, filtering, sorting, and persistence.
 * - Inertia performs server navigation and order mutations.
 * - Existing shared components retain their UI and interaction contracts.
 *
 * Accessibility:
 * - Receipt links have accessible names and safe new-tab behavior.
 * - The rejection dialog uses a labelled, semantic form.
 * - Status is communicated through text as well as color.
 *
 * Performance:
 * - Table configuration and derived filter metadata are memoized.
 * - Stable callbacks reduce unnecessary child-component updates.
 *
 * Extension points:
 * - Additional order filters can be added to the shared query builder
 *   and the existing SearchAndFilterBar configuration.
 */
export default function PlanOrders() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();

    const { planOrders, filters: pageFilters = {}, auth } = usePage().props;

    const permissions = auth?.permissions ?? [];
    const isSuperAdmin = auth?.user?.type === 'super_admin';

    const [searchTerm, setSearchTerm] = useState(pageFilters.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState<PlanOrderStatus | '_empty_'>(pageFilters.status ?? '_empty_');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(() => parseDateFilter(pageFilters.date_from));
    const [dateTo, setDateTo] = useState<Date | undefined>(() => parseDateFilter(pageFilters.date_to));
    const [showFilters, setShowFilters] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<PlanOrder | null>(null);
    const [viewingItem, setViewingItem] = useState<PlanOrder | null>(null);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const currentPerPage = Number(pageFilters.per_page) || 10;

    const hasActiveFilters = useMemo(
        () => searchTerm.trim() !== '' || selectedStatus !== '_empty_' || dateFrom !== undefined || dateTo !== undefined,
        [searchTerm, selectedStatus, dateFrom, dateTo],
    );

    const activeFilterCount = useMemo(
        () => Number(searchTerm.trim() !== '') + Number(selectedStatus !== '_empty_') + Number(dateFrom !== undefined) + Number(dateTo !== undefined),
        [searchTerm, selectedStatus, dateFrom, dateTo],
    );

    /**
     * Keeps query parameters consistent across search, sorting,
     * and page-size changes.
     */
    const buildIndexParams = useCallback(
        (overrides: Partial<IndexParams> = {}): IndexParams => ({
            page: 1,
            per_page: currentPerPage,
            search: searchTerm.trim() || undefined,
            status: selectedStatus !== '_empty_' ? selectedStatus : undefined,
            date_from: toDateQueryValue(dateFrom),
            date_to: toDateQueryValue(dateTo),
            ...overrides,
        }),
        [currentPerPage, dateFrom, dateTo, searchTerm, selectedStatus],
    );

    const navigateToIndex = useCallback((params: IndexParams) => {
        router.get(route('subscriptions.plan-orders.index'), params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    /** Applies the currently selected search and filter values. */
    const applyFilters = useCallback(() => {
        navigateToIndex(buildIndexParams());
    }, [buildIndexParams, navigateToIndex]);

    /** Submits the search using the shared filter state. */
    const handleSearch = useCallback(() => {
        applyFilters();
    }, [applyFilters]);

    /** Toggles sort direction when the same column is selected again. */
    const handleSort = useCallback(
        (field: string) => {
            const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

            navigateToIndex(
                buildIndexParams({
                    sort_field: field,
                    sort_direction: direction,
                }),
            );
        },
        [buildIndexParams, navigateToIndex, pageFilters.sort_direction, pageFilters.sort_field],
    );

    /** Updates the page size without dropping active filters. */
    const handlePerPageChange = useCallback(
        (value: string) => {
            const perPage = Number(value);

            if (!Number.isInteger(perPage) || perPage < 1) {
                return;
            }

            navigateToIndex(buildIndexParams({ per_page: perPage }));
        },
        [buildIndexParams, navigateToIndex],
    );

    /** Resets search and filters and returns to the first page. */
    const handleResetFilters = useCallback(() => {
        setSearchTerm('');
        setSelectedStatus('_empty_');
        setDateFrom(undefined);
        setDateTo(undefined);
        setShowFilters(false);

        navigateToIndex({
            page: 1,
            per_page: currentPerPage,
            search: undefined,
            status: undefined,
            date_from: undefined,
            date_to: undefined,
        });
    }, [currentPerPage, navigateToIndex]);

    /**
     * Executes an order action selected from the shared table.
     * Only pending orders can be approved or rejected from this screen.
     */
    const handleAction = useCallback(
        (action: string, item: PlanOrder) => {
            if (action === 'view') {
                setViewingItem(item);
                return;
            }

            if (item.status !== 'pending' || (action !== 'approve' && action !== 'reject')) {
                return;
            }

            setCurrentItem(item);

            if (action === 'reject') {
                setRejectionNotes('');
                setIsRejectModalOpen(true);
                return;
            }

            const toastId = toast.loading(translate('Approving plan order...'));

            router.post(
                route('subscriptions.plan-orders.approve', item.id),
                {},
                {
                    onError: (errors) => {
                        toast.dismiss(toastId);
                        Object.values(errors).forEach((message) => toast.error(translate(message)));
                    },
                    onFinish: () => toast.dismiss(toastId),
                },
            );
        },
        [translate],
    );

    /** Closes the rejection dialog and clears its transient form state. */
    const handleRejectDialogChange = useCallback(
        (open: boolean) => {
            if (isRejecting) {
                return;
            }

            setIsRejectModalOpen(open);

            if (!open) {
                setCurrentItem(null);
                setRejectionNotes('');
            }
        },
        [isRejecting],
    );

    /** Submits the rejection reason for the selected order. */
    const handleRejectSubmit = useCallback(
        (event: React.SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!currentItem || isRejecting) {
                return;
            }

            setIsRejecting(true);

            const toastId = toast.loading(translate('Rejecting plan order...'));

            router.post(
                route('subscriptions.plan-orders.reject', currentItem.id),
                { notes: rejectionNotes.trim() || null },
                {
                    onSuccess: () => {
                        setIsRejectModalOpen(false);
                        setCurrentItem(null);
                        setRejectionNotes('');
                    },
                    onError: (errors) => {
                        toast.dismiss(toastId);
                        Object.values(errors).forEach((message) => toast.error(translate(message)));
                    },
                    onFinish: () => {
                        setIsRejecting(false);
                        toast.dismiss(toastId);
                    },
                },
            );
        },
        [currentItem, isRejecting, rejectionNotes, translate],
    );

    /** Navigates to a selected pagination URL. */
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

    const breadcrumbs = useMemo(
        () => [
            { title: translate('Subscriptions') },
            {
                title: translate('Plan orders'),
                href: route('subscriptions.plan-orders.index'),
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
            { value: 'completed', label: translate('Completed') },
        ],
        [translate],
    );

    const columns = useMemo(
        () => [
            {
                key: 'order_number',
                label: translate('Order number'),
                render: (value: string | null) => value || '—',
            },
            {
                key: 'user.name',
                label: translate('Name'),
                render: (_value: unknown, row: PlanOrder) => (
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            aria-hidden="true"
                            className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
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
                render: (_value: unknown, row: PlanOrder) =>
                    row.plan?.name ? (
                        <span className="border-border bg-muted text-foreground inline-flex items-center rounded-md border px-2.5 py-1 text-sm capitalize">
                            {row.plan.name}
                        </span>
                    ) : (
                        <span className="text-foreground/75">—</span>
                    ),
            },
            {
                key: 'original_price',
                label: translate('Original price'),
                render: (value: number | string) => formatCurrencySimple(value, 'USD', 'en-US'),
            },
            {
                key: 'discount_amount',
                label: translate('Discount'),
                render: (value: number | string) => {
                    const amount = Number(value);

                    return amount > 0 ? (
                        <span className="font-medium text-green-700 dark:text-green-400">−{formatCurrencySimple(amount, 'USD', 'en-US')}</span>
                    ) : (
                        <span className="text-foreground/75">—</span>
                    );
                },
            },
            {
                key: 'status',
                label: translate('Status'),
                render: (value: PlanOrderStatus) => {
                    const statusClasses: Record<PlanOrderStatus, string> = {
                        pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                        approved: 'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400',
                        rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
                        completed: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
                    };

                    return (
                        <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-sm capitalize ${statusClasses[value]}`}>
                            {translate(value)}
                        </span>
                    );
                },
            },
            {
                key: 'receipt',
                label: translate('Receipt'),
                render: (value: string | null) =>
                    value ? (
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={translate('View receipt')}
                            title={translate('View receipt')}
                            className="text-primary hover:bg-muted focus-visible:ring-ring inline-flex size-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                            <FileText aria-hidden="true" className="size-4" />
                        </a>
                    ) : (
                        <span className="text-foreground/75 text-sm">—</span>
                    ),
            },
            {
                key: 'ordered_at',
                label: translate('Order date'),
                sortable: true,
                render: (value: string) => (
                    <time dateTime={value} className="text-foreground/75 text-sm whitespace-nowrap">
                        {formatOrderDate(value)}
                    </time>
                ),
            },
        ],
        [getInitials, translate],
    );

    const actions = useMemo(
        () =>
            isSuperAdmin
                ? [
                      {
                          label: translate('View'),
                          icon: 'Eye',
                          action: 'view',
                          className: 'text-primary',
                          requiredPermission: 'view-plan-orders',
                      },
                      {
                          label: translate('Approve'),
                          icon: 'Check',
                          action: 'approve',
                          className: 'text-emerald-600',
                          requiredPermission: 'approve-plan-orders',
                          condition: (row: PlanOrder) => row.status === 'pending',
                      },
                      {
                          label: translate('Reject'),
                          icon: 'X',
                          action: 'reject',
                          className: 'text-destructive',
                          requiredPermission: 'reject-plan-orders',
                          condition: (row: PlanOrder) => row.status === 'pending',
                      },
                  ]
                : [],
        [isSuperAdmin, translate],
    );

    return (
        <PageTemplate
            title={translate('Plan orders')}
            description={translate('Review subscription purchases, payment details, discounts, and order status.')}
            url="/subscriptions/plan-orders"
            breadcrumbs={breadcrumbs}
        >
            <section
                aria-label={translate('Search and filter plan orders')}
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
                        {
                            name: 'date_from',
                            label: translate('Date from'),
                            type: 'date',
                            value: dateFrom,
                            onChange: setDateFrom,
                        },
                        {
                            name: 'date_to',
                            label: translate('Date to'),
                            type: 'date',
                            value: dateTo,
                            onChange: setDateTo,
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

            <section aria-label={translate('Plan order results')} className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
                <div className="overflow-x-auto">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={planOrders?.data ?? []}
                        from={planOrders?.from ?? 0}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                    />
                </div>

                <div className="border-border border-t px-3 py-3 sm:px-5">
                    <Pagination
                        from={planOrders?.from ?? 0}
                        to={planOrders?.to ?? 0}
                        total={planOrders?.total ?? 0}
                        links={planOrders?.links}
                        entityName={translate('Plan orders')}
                        onPageChange={handlePageChange}
                    />
                </div>
            </section>

            <Dialog
                open={viewingItem !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setViewingItem(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translate('Plan order details')}</DialogTitle>
                    </DialogHeader>

                    {viewingItem && <View planOrder={viewingItem} />}
                </DialogContent>
            </Dialog>

            <Dialog open={isRejectModalOpen} onOpenChange={handleRejectDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translate('Reject plan order')}</DialogTitle>
                    </DialogHeader>

                    <form autoComplete="off" onSubmit={handleRejectSubmit} className="space-y-5">
                        {currentItem && (
                            <div className="border-border bg-muted/50 rounded-lg border p-3">
                                <p className="text-foreground/75 text-sm">{translate('Order number')}</p>
                                <p className="text-foreground font-medium">{currentItem.order_number || '—'}</p>
                                <p className="text-foreground/75 mt-1 text-sm">{currentItem.user?.name || '—'}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="rejection-notes">{translate('Rejection reason (optional)')}</Label>
                            <Textarea
                                id="rejection-notes"
                                name="notes"
                                value={rejectionNotes}
                                onChange={setRejectionNotes}
                                disabled={isRejecting}
                                placeholder={translate('Add a reason for rejecting this order...')}
                                className="min-h-24 resize-y"
                            />
                            <p className="text-foreground/75 text-sm">
                                {translate('The reason may be used to explain the decision to the organization.')}
                            </p>
                        </div>

                        <DialogFooter>
                            <Button type="button" size="lg" variant="outline" disabled={isRejecting} onClick={() => handleRejectDialogChange(false)}>
                                {translate('Cancel')}
                            </Button>

                            <Button type="submit" size="lg" variant="destructive" disabled={!currentItem || isRejecting}>
                                {isRejecting ? translate('Rejecting...') : translate('Reject order')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
