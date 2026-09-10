// pages/plans/plan-orders.tsx
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Button } from '@components/UserInterface/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { Label } from '@components/UserInterface/Label';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { Textarea } from '@components/UserInterface/Textarea';
import useInitials from '@hooks/useInitials';
import { router, usePage } from '@inertiajs/react';
import { formatTitleCase } from '@utils/Helpers/StringFormatters';
import { route } from '@utils/Routes';
import { Calendar, CheckCircle, CreditCard, Download, FileText, ShoppingCart, Tag, User, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PlanOrdersPage() {
    const { t: translate } = useTranslation();
    const { planOrders, filters: pageFilters = {}, auth, globalSettings } = usePage().props;
    const permissions = auth?.permissions || [];

    // State
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [dateFrom, setDateFrom] = useState(pageFilters.date_from || '');
    const [dateTo, setDateTo] = useState(pageFilters.date_to || '');
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return selectedStatus !== 'all' || dateFrom !== '' || dateTo !== '' || searchTerm !== '';
    };

    // Count active filters
    const activeFilterCount = () => {
        return (selectedStatus !== 'all' ? 1 : 0) + (dateFrom !== '' ? 1 : 0) + (dateTo !== '' ? 1 : 0) + (searchTerm !== '' ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('plan-orders.index'),
            {
                page: 1,
                search: searchTerm || undefined,
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
            route('plan-orders.index'),
            {
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        if (action === 'approve') {
            if (!globalSettings?.is_demo) {
                const toastId = toast.loading(translate('Approving plan order...'));
            }

            router.post(
                route('plan-orders.approve', item.id),
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
                            toast.error(translate('Failed to approve plan order: {{errors}}', { errors: Object.values(errors).join(', ') }));
                        }
                    },
                },
            );
        } else if (action === 'reject') {
            setCurrentItem(item);
            setIsRejectModalOpen(true);
        } else if (action === 'view') {
            setCurrentItem(item);
            setIsViewModalOpen(true);
        }
    };

    const handleRejectConfirm = (notes: string) => {
        if (!globalSettings?.is_demo) {
            const toastId = toast.loading(translate('Rejecting plan order...'));
        }

        router.post(
            route('plan-orders.reject', currentItem.id),
            { notes },
            {
                onSuccess: (page) => {
                    setIsRejectModalOpen(false);
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
                        toast.error(translate('Failed to reject plan order: {{errors}}', { errors: Object.values(errors).join(', ') }));
                    }
                },
            },
        );
    };

    const [pageInitialState, setPageInitialState] = useState(true);
    useEffect(() => {
        if (pageInitialState) {
            setPageInitialState(false);
            return;
        }
        applyFilters();
    }, [selectedStatus, dateFrom, dateTo]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setDateFrom('');
        setDateTo('');
        router.get(route('plan-orders.index'));
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Plans'), href: route('plans.index') },
        { title: translate('Plan Orders') },
    ];

    // Define table columns
    const statusColors: Record<string, string> = {
        pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
        approved: 'bg-green-50 text-green-700 ring-green-600/20',
        rejected: 'bg-red-50 text-red-700 ring-red-600/20',
        completed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    };

    const columns = [
        {
            key: 'order_number',
            label: translate('Order Number'),
            className: 'whitespace-nowrap',
            render: (value) => <span className="whitespace-nowrap">{value || '-'}</span>,
        },
        {
            key: 'user.name',
            label: translate('Ordered By'),
            className: 'whitespace-nowrap',
            render: (_, row) => {
                const avatarUrl = row.user?.avatar ? resolveImageUrl(row.user.avatar) : resolveImageUrl('avatars/avatar.png');
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={avatarUrl} alt={row.user?.name || ''} />
                            <AvatarFallback>{getInitials(row.user?.name || '')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium whitespace-nowrap">{row.user?.name || '-'}</div>
                            <div className="text-muted-foreground text-sm whitespace-nowrap">{row.user?.email || ''}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'plan.name',
            label: translate('Plan'),
            className: 'whitespace-nowrap',
            render: (_, row) => {
                const planName = row.plan?.name;
                if (!planName) return '-';
                return (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium whitespace-nowrap text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                        {formatTitleCase(planName)}
                    </span>
                );
            },
        },
        {
            key: 'original_price',
            label: translate('Original Price'),
            className: 'whitespace-nowrap',
            render: (value) => <span className="font-mono whitespace-nowrap">{window.appSettings.formatCurrency(value) || '0'}</span>,
        },
        {
            key: 'discount_amount',
            label: translate('Discount'),
            className: 'whitespace-nowrap',
            render: (value) => (
                <span className="font-mono whitespace-nowrap">{value > 0 ? `-${window.appSettings.formatCurrency(value)}` : '-'}</span>
            ),
        },
        {
            key: 'final_price',
            label: translate('Final Price'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value) => <span className="font-mono whitespace-nowrap">{window.appSettings.formatCurrency(value) || '0'}</span>,
        },
        {
            key: 'status',
            label: translate('Status'),
            className: 'whitespace-nowrap',
            render: (value) => (
                <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap capitalize ring-1 ring-inset ${statusColors[value] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                >
                    {translate(value)}
                </span>
            ),
        },
        {
            key: 'receipt_path',
            label: translate('Receipt'),
            className: 'whitespace-nowrap',
            render: (value) =>
                value ? (
                    <a
                        href={resolveImageUrl(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={translate('View Receipt')}
                    >
                        <FileText className="h-4 w-4 text-green-600 hover:text-green-800" />
                    </a>
                ) : (
                    '-'
                ),
        },
        {
            key: 'ordered_at',
            label: translate('Order Date'),
            sortable: true,
            className: 'whitespace-nowrap',
            type: 'date',
        },
    ];

    // Define table actions - only visible to super admin
    const getInitials = useInitials();
    const isSuperAdmin = auth?.user?.type === 'super_admin';
    const actions = isSuperAdmin
        ? [
              {
                  label: translate('View'),
                  icon: 'Eye',
                  action: 'view',
                  className: 'text-blue-500',
                  requiredPermission: 'view-plan-orders',
                  // condition: (row) => row.payment_method === 'bank'
              },
              {
                  label: translate('Approve'),
                  icon: 'Check',
                  action: 'approve',
                  className: 'text-green-500',
                  requiredPermission: 'approve-plan-orders',
                  condition: (row) => row.status === 'pending',
              },
              {
                  label: translate('Reject'),
                  icon: 'X',
                  action: 'reject',
                  className: 'text-red-500',
                  requiredPermission: 'reject-plan-orders',
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
        { value: 'completed', label: translate('Completed') },
    ];

    return (
        <PageTemplate
            title={translate('Plan Orders')}
            url="/plan-orders"
            breadcrumbs={breadcrumbs}
            description={isSuperAdmin ? translate('View and manage all plan orders from organizations.') : translate('View your plan orders.')}
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
                <div className="overflow-x-auto">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={planOrders?.data || []}
                        from={planOrders?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                    />
                </div>

                {/* Pagination section */}
                <Pagination
                    from={planOrders?.from || 0}
                    to={planOrders?.to || 0}
                    total={planOrders?.total || 0}
                    links={planOrders?.links}
                    entityName={translate('plan orders')}
                    onPageChange={(url) => router.get(url)}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('plan-orders.index'),
                            {
                                page: 1,
                                per_page: parseInt(value) !== 10 ? parseInt(value) : undefined,
                                search: searchTerm || undefined,
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

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader className="border-b px-6 pt-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 rounded-lg p-2">
                                <ShoppingCart className="text-primary h-5 w-5" />
                            </div>
                            <DialogTitle className="text-xl font-semibold">{translate('Plan Order Details')}</DialogTitle>
                        </div>
                    </DialogHeader>

                    {currentItem && (
                        <div className="space-y-4 px-6 py-4 pb-6">
                            {/* Order Number | Order Date */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <ShoppingCart className="h-4 w-4" />
                                        {translate('Order Number')}
                                    </label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{currentItem.order_number || '-'}</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        {translate('Order Date')}
                                    </label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                        {window.appSettings?.formatDateTime(currentItem.ordered_at, false) || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Status | Payment Method */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <CheckCircle className="h-4 w-4" />
                                        {translate('Status')}
                                    </label>
                                    <div className="mt-1">
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusColors[currentItem.status] || 'bg-gray-50 text-gray-700 ring-gray-600/20'}`}
                                        >
                                            {translate(currentItem.status)}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <CreditCard className="h-4 w-4" />
                                        {translate('Payment Method')}
                                    </label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 capitalize dark:text-white">
                                        {currentItem.payment_method || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* User | Plan */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <User className="h-4 w-4" />
                                        {translate('User')}
                                    </label>
                                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{currentItem.user?.name || '-'}</p>
                                    <p className="text-muted-foreground text-xs">{currentItem.user?.email || ''}</p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <Tag className="h-4 w-4" />
                                        {translate('Plan')}
                                    </label>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-900/30 dark:text-blue-300">
                                            {formatTitleCase(currentItem.plan?.name || '-')}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-xs capitalize">{currentItem.billing_cycle || ''}</p>
                                </div>
                            </div>

                            {/* Original Price | Discount */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <CreditCard className="h-4 w-4" />
                                        {translate('Original Price')}
                                    </label>
                                    <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-white">
                                        {window.appSettings.formatCurrency(currentItem.original_price)}
                                    </p>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <Tag className="h-4 w-4" />
                                        {translate('Discount')}
                                    </label>
                                    <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-white">
                                        {currentItem.discount_amount > 0 ? `-${window.appSettings.formatCurrency(currentItem.discount_amount)}` : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Final Price | Payment Receipt */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <CreditCard className="h-4 w-4" />
                                        {translate('Final Price')}
                                    </label>
                                    <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-white">
                                        {window.appSettings.formatCurrency(currentItem.final_price)}
                                    </p>
                                </div>
                                {currentItem.receipt_path && (
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Download className="h-4 w-4" />
                                            {translate('Payment Receipt')}
                                        </label>
                                        <div className="mt-1">
                                            <Button
                                                size={'sm'}
                                                varient={'primary'}
                                                onClick={() => {
                                                    const link = document.createElementranslate('a');
                                                    link.href = resolveImageUrl(currentItem.receipt_path);
                                                    link.download = '';
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                            >
                                                {translate('Download Receipt')}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Processed By | Notes - only when present */}
                            {(currentItem.processedBy || currentItem.notes) && (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {currentItem.processedBy && (
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <UserCheck className="h-4 w-4" />
                                                {translate('Processed By')}
                                            </label>
                                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{currentItem.processedBy.name}</p>
                                        </div>
                                    )}
                                    {currentItem.notes && (
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                                <FileText className="h-4 w-4" />
                                                {translate('Notes')}
                                            </label>
                                            <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{currentItem.notes}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translate('Reject Plan Order')}</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const notes = formData.getranslate('notes') as string;
                            handleRejectConfirm(notes);
                        }}
                    >
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="notes">{translate('Rejection Reason (Optional)')}</Label>
                                <Textarea id="notes" name="notes" placeholder={translate('Enter rejection reason...')} className="mt-1" />
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                                {translate('Cancel')}
                            </Button>
                            <Button type="submit" variant="destructive">
                                {translate('Reject')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
