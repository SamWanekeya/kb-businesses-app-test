import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { formatTitleCase } from '@/utils/Helpers/StringFormatters';
import { useHasPermission } from '@/utils/Permissions';
import { Link, router, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle, FileDown, Plus, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Invoices() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) toast.success(t(flash.success));
        else if (flash?.error) toast.error(t(flash.error));
        else if (flash?.warning) toast.warning ? toast.warning(t(flash.warning)) : toast.error(t(flash.warning));
    }, [flash]);

    const {
        auth,
        invoices,
        accounts,
        allAccounts,
        contacts,
        salesOrders,
        quotes,
        opportunities,
        products,
        availableSalesOrders,
        users = [],
        allUsers = [],
        filters: pageFilters = {},
        publicUrlBase,
        encryptedInvoiceIds,
        pendingPayments = [],
    } = usePage().props;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [currentPayment, setCurrentPayment] = useState<any>(null);
    const [rejectNotes, setRejectNotes] = useState('');
    const [showReminderHistoryModal, setShowReminderHistoryModal] = useState(false);
    const [reminderHistory, setReminderHistory] = useState<any[]>([]);

    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedStatus !== 'all' || selectedAccount !== 'all' || selectedAssignee !== 'all';
    };

    const activeFilterCount = () => {
        return (searchTerm ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (selectedAccount !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('invoices.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
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
            route('invoices.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
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
                router.get(route('invoices.show', item.id));
                break;
            case 'edit':
                router.visit(route('invoices.edit', item.id));
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                setIsStatusModalOpen(true);
                break;

            case 'copy-link':
                handleCopyInvoiceLink(item);
                break;
            case 'send-reminder':
                handleSendReminder(item, 'email');
                break;
            case 'reminder-history':
                handleReminderHistory(item);
                break;
        }
    };

    const handleAddNew = () => {
        router.visit(route('invoices.create'));
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting invoice...'));

        router.delete(route('invoices.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(`Failed to delete invoice: ${Object.values(errors).join(', ')}`);
                }
            },
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('invoices.toggle-status', currentItem.id), formData, {
            onSuccess: () => {
                setIsStatusModalOpen(false);
            },
            onError: (errors) => {
                toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleToggleStatus = (invoice: any) => {
        const newStatus = invoice.status === 'draft' ? 'sent' : 'draft';
        toast.loading(`${newStatus === 'sent' ? translate('Sending') : translate('Setting to draft')} invoice...`);

        router.put(
            route('invoices.toggle-status', invoice.id),
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to update status: ${Object.values(errors).join(', ')}`);
                    }
                },
            },
        );
    };

    const handleCopyInvoiceLink = (invoice: any) => {
        const baseUrl = publicUrlBase?.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
        const encryptedId = encryptedInvoiceIds[invoice.id];
        const invoiceUrl = `${baseUrl}/invoices/public/${encryptedId}`;
        navigator.clipboard
            .writeText(invoiceUrl)
            .then(() => {
                toast.success(translate('Invoice link copied to clipboard!'));
            })
            .catch(() => {
                toast.error(translate('Failed to copy invoice link'));
            });
    };

    const handleSendReminder = (invoice: any, type: string) => {
        toast.loading(translate('Sending payment reminder...'));

        router.post(
            route('invoices.send-reminder', invoice.id),
            { type },
            {
                onSuccess: () => {
                    toast.dismiss();
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to send reminder: ${Object.values(errors).join(', ')}`);
                    }
                },
            },
        );
    };

    const handleReminderHistory = async (invoice: any) => {
        try {
            const response = await fetch(route('invoices.reminder-history', invoice.id));
            const data = await response.json();
            setReminderHistory(data.reminders || []);
            setShowReminderHistoryModal(true);
        } catch (error) {
            toast.error(translate('Failed to load reminder history'));
        }
    };

    const handleApprovePayment = async (payment: any) => {
        toast.loading(translate('Approving payment...'));
        try {
            const response = await fetch(route('invoice-payments.approve', payment.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            toast.dismiss();
            if (data.success) {
                if (data.message) {
                    toast.success(t(data.message));
                } else {
                    toast.success(translate('Payment approved successfully'));
                }
                router.reload({ only: ['pendingPayments', 'invoices'] });
            } else {
                if (data.message) {
                    toast.error(t(data.message));
                } else {
                    toast.error(translate('Failed to approve payment'));
                }
            }
        } catch (error) {
            toast.dismiss();
            toast.error(translate('Failed to approve payment'));
        }
    };

    const handleRejectPayment = (payment: any) => {
        setCurrentPayment(payment);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async () => {
        toast.loading(translate('Rejecting payment...'));
        try {
            const response = await fetch(route('invoice-payments.reject', currentPayment.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ notes: rejectNotes }),
            });
            const data = await response.json();
            toast.dismiss();
            if (data.success) {
                if (data.message) {
                    toast.success(t(data.message));
                } else {
                    toast.success(translate('Payment rejected successfully'));
                }
                setShowRejectModal(false);
                setRejectNotes('');
                router.reload({ only: ['pendingPayments', 'invoices'] });
            } else {
                if (data.message) {
                    toast.error(t(data.message));
                } else {
                    toast.error(translate('Failed to reject payment'));
                }
            }
        } catch (error) {
            toast.dismiss();
            toast.error(translate('Failed to reject payment'));
        }
    };

    const pageInitialState = useState(true);
    useEffect(() => {
        if (pageInitialState[0]) {
            pageInitialState[1](false);
            return;
        }
        applyFilters();
    }, [searchTerm, selectedStatus, selectedAccount, selectedAssignee]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        setSelectedAccountranslate('all');
        setSelectedAssignee('all');
        router.get(route('invoices.index'));
    };

    const pageActions = [];

    // Add export button
    if (useHasPermission('export-invoices')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[400px]:mr-2" />,
            variant: 'outline',
            onClick: () => (window.location.href = route('invoice.export')),
            className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
            labelClassName: 'hidden min-[400px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[400px]:hidden',
        });
    }

    if (useHasPermission('create-invoices')) {
        pageActions.push({
            label: translate('Add Invoice'),
            icon: <Plus className="mr-0 h-4 w-4 min-[400px]:mr-2" />,
            variant: 'default',
            onClick: () => handleAddNew(),
            className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
            labelClassName: 'hidden min-[400px]:inline',
            tooltip: translate('Add Invoice'),
            tooltipClassName: 'min-[400px]:hidden',
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Invoices') }];

    const columns = [
        {
            key: 'invoice_number',
            label: translate('Invoice Number'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value: string, item: any) => (
                <Link
                    href={route('invoices.show', item.id)}
                    className="inline-flex cursor-pointer items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-blue-700 transition-colors duration-200 hover:border-blue-400 hover:bg-blue-100"
                    style={{ color: '#1d4ed8' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                >
                    {value}
                </Link>
            ),
        },
        {
            key: 'name',
            label: translate('Name'),
            sortable: true,
            render: (value: string) => <span className="font-medium whitespace-nowrap">{value || '-'}</span>,
        },
        {
            key: 'assigned_user',
            label: translate('Assigned To'),
            className: 'whitespace-nowrap',
            render: (value: any) =>
                value ? (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={value.avatar} alt={value.name} />
                            <AvatarFallback className="text-xs">{getInitials(value.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium whitespace-nowrap">{value.name}</div>
                            <div className="text-muted-foreground text-sm whitespace-nowrap">{value.email}</div>
                        </div>
                    </div>
                ) : (
                    <span className="whitespace-nowrap">{translate('Unassigned')}</span>
                ),
        },
        {
            key: 'total_amount',
            label: translate('Total Amount'),
            className: 'whitespace-nowrap',
            render: (value: any) => (
                <span className="font-mono whitespace-nowrap">
                    {window.appSettings?.formatCurrency(Number(value || 0)) || `$${Number(value || 0).toFixed(2)}`}
                </span>
            ),
        },
        {
            key: 'status',
            label: translate('Status'),
            className: 'whitespace-nowrap',
            render: (value: string) => {
                const statusColors = {
                    draft: 'bg-gray-50 text-gray-700 ring-gray-600/20',
                    sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
                    pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                    paid: 'bg-green-50 text-green-700 ring-green-600/20',
                    partially_paid: 'bg-orange-50 text-orange-700 ring-orange-600/20',
                    overdue: 'bg-red-50 text-red-700 ring-red-600/20',
                    cancelled: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                };
                const getStatusLabel = (status: string) => {
                    switch (status) {
                        case 'draft':
                            return translate('Draft');
                        case 'sent':
                            return translate('Sent');
                        case 'pending':
                            return translate('Pending');
                        case 'paid':
                            return translate('Paid');
                        case 'partially_paid':
                            return translate('Partially Paid');
                        case 'overdue':
                            return translate('Overdue');
                        case 'cancelled':
                            return translate('Cancelled');
                        default:
                            return translate('Draft');
                    }
                };
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${statusColors[value as keyof typeof statusColors] || statusColors.draft}`}
                    >
                        {getStatusLabel(value)}
                    </span>
                );
            },
        },
        // {
        //     key: 'due_date',
        //     label: translate('Due Date'),
        //     sortable: true,
        //     className: 'whitespace-nowrap',
        //     render: (value: string, item: any) => (
        //         <span className={`whitespace-nowrap ${item.status === 'overdue' ? 'text-red-600' : ''}`}>
        //             {window.appSettings?.formatDateTime(value, false) || '-'}
        //         </span>
        //     )
        // }
        {
            key: 'due_date',
            label: translate('Due Date'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value: string, item: any) => (
                <span className={`flex items-center gap-2 whitespace-nowrap ${item.status === 'overdue' ? 'text-red-600' : 'text-gray-500'}`}>
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{window.appSettings?.formatDateTime(value, false) || '-'}</span>
                </span>
            ),
        },
    ];

    const actions = [
        {
            label: translate('Send Reminder'),
            icon: 'Mail',
            action: 'send-reminder',
            className: 'text-purple-500',
            requiredPermission: 'send-reminder-invoices',
            condition: (item: any) => ['pending', 'overdue', 'partially_paid'].includes(item.status),
        },
        // {
        //     label: translate('Reminder History'),
        //     icon: 'History',
        //     action: 'reminder-history',
        //     className: 'text-indigo-500',
        //     requiredPermission: 'view-invoices'
        // },
        {
            label: translate('Copy Invoice Link'),
            icon: 'Copy',
            action: 'copy-link',
            className: 'text-purple-500',
            requiredPermission: 'view-invoices',
        },
        {
            label: translate('Change Status'),
            icon: 'RefreshCw',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-invoices',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-invoices',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-invoices',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-invoices',
        },
    ];

    const statusOptions = [
        { value: 'all', label: translate('All Statuses') },
        { value: 'draft', label: translate('Draft') },
        { value: 'sent', label: translate('Sent') },
        { value: 'pending', label: translate('Pending') },
        { value: 'paid', label: translate('Paid') },
        { value: 'partially_paid', label: translate('Partially Paid') },
        { value: 'overdue', label: translate('Overdue') },
        { value: 'cancelled', label: translate('Cancelled') },
    ];

    return (
        <PageTemplate
            title={translate('Invoices')}
            description={translate('Manage your invoices.')}
            url="/invoices"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
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
                            name: 'account_id',
                            label: translate('Account'),
                            type: 'select',
                            searchable: true,
                            value: selectedAccount,
                            onChange: setSelectedAccount,
                            options: [
                                { value: 'all', label: translate('All Accounts') },
                                ...(allAccounts?.map((acc: any) => ({ value: acc.id.toString(), label: acc.name })) || []),
                            ],
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
                                ...allUsers.map((user: any) => ({ value: user.id.toString(), label: user.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                />
            </div>

            {/* Pending Invoice Payments Section */}
            {pendingPayments.length > 0 && (
                <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800">{translate('Pending Invoice Payments')}</h3>
                    <div className="space-y-3">
                        {pendingPayments.map((payment: any) => (
                            <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4">
                                        <div>
                                            <p className="font-medium text-gray-900">Invoice #{payment.invoice.invoice_number}</p>
                                            <p className="text-sm text-gray-500">
                                                {payment.payment_method === 'bank' ? translate('Bank Transfer') : payment.payment_method} -
                                                <span className="font-mono">
                                                    {window.appSettings?.formatCurrency(Number(payment.amount)) ||
                                                        `$${Number(payment.amount).toFixed(2)}`}
                                                </span>{' '}
                                                ({payment.payment_type})
                                            </p>
                                            {payment.receipt_path && (
                                                <a
                                                    href={resolveImageUrl(payment.receipt_path)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    {translate('View Receipt')}
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {translate('Requested')}:{' '}
                                            {window.appSettings?.formatDateTime(payment.created_at, false) ||
                                                new Date(payment.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-green-600 text-green-600 hover:bg-green-50"
                                        onClick={() => handleApprovePayment(payment)}
                                    >
                                        <CheckCircle className="mr-1 h-4 w-4" />
                                        {translate('Approve')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-600 text-red-600 hover:bg-red-50"
                                        onClick={() => handleRejectPayment(payment)}
                                    >
                                        <XCircle className="mr-1 h-4 w-4" />
                                        {translate('Reject')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={invoices?.data || []}
                        from={invoices?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-invoices',
                            create: 'create-invoices',
                            edit: 'edit-invoices',
                            delete: 'delete-invoices',
                        }}
                    />
                </div>

                <Pagination
                    from={invoices?.from || 0}
                    to={invoices?.to || 0}
                    total={invoices?.total || 0}
                    links={invoices?.links}
                    entityName={translate('invoices')}
                    onPageChange={(url) => router.get(url)}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('invoices.index'),
                            {
                                page: 1,
                                search: searchTerm || undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
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
                                { value: 'draft', label: translate('Draft') },
                                { value: 'sent', label: translate('Sent') },
                                { value: 'pending', label: translate('Pending') },
                                { value: 'paid', label: translate('Paid') },
                                { value: 'partially_paid', label: translate('Partially Paid') },
                                { value: 'overdue', label: translate('Overdue') },
                                { value: 'cancelled', label: translate('Cancelled') },
                            ],
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={translate('Change Invoice Status')}
                mode="edit"
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={translate('invoice')}
            />

            {/* Reject Payment Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{translate('Reject Payment')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            {translate('Are you sure you want to reject this payment for Invoice #{{invoiceNumber}}?', {
                                invoiceNumber: currentPayment?.invoice?.invoice_number,
                            })}
                        </p>
                        <div>
                            <Label htmlFor="reject-notes">{translate('Rejection Notes (Optional)')}</Label>
                            <Textarea
                                id="reject-notes"
                                value={rejectNotes}
                                onChange={(e) => setRejectNotes(e.target.value)}
                                placeholder={translate('Enter reason for rejection...')}
                                className="mt-1"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                                {translate('Cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleRejectConfirm}>
                                {translate('Reject Payment')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Reminder History Modal */}
            <Dialog open={showReminderHistoryModal} onOpenChange={setShowReminderHistoryModal}>
                <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>{translate('Invoice Payment Reminder History')}</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 flex-1 overflow-y-auto">
                        {reminderHistory.length === 0 ? (
                            <p className="py-4 text-center text-sm text-gray-500">{translate('No reminders sent yet')}</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500">
                                                {translate('Sent At')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500">
                                                {translate('Type')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500">
                                                {translate('Sent By')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {reminderHistory.map((reminder: any, index: number) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                    {window.appSettings?.formatDateTime(reminder.created_at, false) ||
                                                        new Date(reminder.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-600/20 ring-inset">
                                                        {formatTitleCase(reminder.type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                                    {reminder.sent_by?.name || translate('-')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
