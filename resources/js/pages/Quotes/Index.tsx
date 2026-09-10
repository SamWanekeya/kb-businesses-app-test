import CrudDeleteModal from '@components/CrudDeleteModal';
import { CrudFormModal } from '@components/CrudFormModal';
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import useInitials from '@hooks/useInitials';
import { Link, router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { FileDown, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Quotes() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const {
        auth,
        quotes,
        allAccounts,
        allOpportunities,
        allUsers = [],
        filters: pageFilters = {},
        publicUrlBase,
        encryptedQuoteIds,
        flash = {},
    } = usePage().props;
    const permissions = auth?.permissions || [];

    useEffect(() => {
        if (flash?.success) toast.success(translate(flash.success));
        else if (flash?.error) toast.error(translate(flash.error));
        else if (flash?.warning) toast.warning(translate(flash.warning));
    }, [flash]);

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAccount, setSelectedAccount] = useState(pageFilters.account_id || 'all');
    const [selectedOpportunity, setSelectedOpportunity] = useState(pageFilters.opportunity_id || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [pageInitialState, setPageInitialState] = useState(true);

    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedStatus, selectedAccount, selectedOpportunity, selectedAssignee]);

    const hasActiveFilters = () =>
        searchTerm !== '' || selectedStatus !== 'all' || selectedAccount !== 'all' || selectedOpportunity !== 'all' || selectedAssignee !== 'all';

    const activeFilterCount = () =>
        (searchTerm ? 1 : 0) +
        (selectedStatus !== 'all' ? 1 : 0) +
        (selectedAccount !== 'all' ? 1 : 0) +
        (selectedOpportunity !== 'all' ? 1 : 0) +
        (selectedAssignee !== 'all' ? 1 : 0);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('quotes.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                opportunity_id: selectedOpportunity !== 'all' ? selectedOpportunity : undefined,
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
            route('quotes.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                opportunity_id: selectedOpportunity !== 'all' ? selectedOpportunity : undefined,
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
                router.get(route('quotes.show', item.id));
                break;
            case 'edit':
                router.visit(route('quotes.edit', item.id));
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                setIsStatusModalOpen(true);
                break;
            case 'copy-link':
                handleCopyQuoteLink(item);
                break;
        }
    };

    const handleDeleteConfirm = () => {
        const toastId = toast.loading(translate('Deleting quote...'));
        router.delete(route('quotes.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                toast.error(translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleCopyQuoteLink = (quote: any) => {
        const baseUrl = publicUrlBase?.endsWith('/') ? publicUrlBase.slice(0, -1) : publicUrlBase;
        const encryptedId = encryptedQuoteIds[quote.id];
        const quoteUrl = `${baseUrl}/quotes/public/${encryptedId}`;
        navigator.clipboard
            .writeText(quoteUrl)
            .then(() => {
                toast.success(translate('Quote link copied to clipboard!'));
            })
            .catch(() => {
                toast.error(translate('Failed to copy quote link'));
            });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('quotes.toggle-status', currentItem.id), formData, {
            onSuccess: () => {
                setIsStatusModalOpen(false);
                toast.dismiss(toastId);
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleResetFilters = () => {
        router.get(route('quotes.index'));
    };

    const pageActions: any[] = [];

    if (useHasPermission('export-quotes')) {
        pageActions.push({
            label: translate('Export'),
            icon: <FileDown className="mr-0 h-4 w-4 min-[380px]:mr-2" />,
            variant: 'outline',
            onClick: () => {
                window.location.href = route('quote.export');
            },
            className: 'h-8 w-8 min-[380px]:h-9 min-[380px]:w-auto px-0 min-[380px]:px-4',
            labelClassName: 'hidden min-[380px]:inline',
            tooltip: translate('Export'),
            tooltipClassName: 'min-[380px]:hidden',
        });
    }

    if (useHasPermission('create-quotes')) {
        pageActions.push({
            label: translate('Add Quote'),
            icon: <Plus className="mr-0 h-4 w-4 min-[380px]:mr-2" />,
            variant: 'default',
            onClick: () => router.visit(route('quotes.create')),
            className: 'h-8 w-8 min-[380px]:h-9 min-[380px]:w-auto px-0 min-[380px]:px-4',
            labelClassName: 'hidden min-[380px]:inline',
            tooltip: translate('Add Quote'),
            tooltipClassName: 'min-[380px]:hidden',
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Quotes') }];

    const columns = [
        {
            key: 'quote_number',
            label: translate('Quote Number'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value: string, item: any) =>
                useHasPermission('view-quotes') ? (
                    <Link
                        href={route('quotes.show', item.id)}
                        className="inline-flex cursor-pointer items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-blue-700 transition-colors duration-200 hover:border-blue-400 hover:bg-blue-100"
                        style={{ color: '#1d4ed8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#1d4ed8')}
                    >
                        {value}
                    </Link>
                ) : (
                    <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-blue-700">
                        {value}
                    </span>
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
            label: translate('Amount'),
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
                const statusColors: Record<string, string> = {
                    draft: 'bg-gray-50 text-gray-700 ring-gray-600/20',
                    sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
                    accepted: 'bg-green-50 text-green-700 ring-green-600/20',
                    rejected: 'bg-red-50 text-red-700 ring-red-600/20',
                    expired: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
                };
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${statusColors[value] || statusColors.draft}`}
                    >
                        {translate(value?.charAt(0).toUpperCase() + value?.slice(1)) || translate('Draft')}
                    </span>
                );
            },
        },

        // {
        //     key: 'created_at',
        //     label: translate('Date'),
        //     sortable: true,
        //     className: 'whitespace-nowrap',
        //     type: 'date'
        // }
    ];

    const actions = [
        { label: translate('Copy Quote Link'), icon: 'Copy', action: 'copy-link', className: 'text-purple-500', requiredPermission: 'view-quotes' },
        {
            label: translate('Change Status'),
            icon: 'RefreshCw',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-quotes',
        },
        { label: translate('View'), icon: 'Eye', action: 'view', className: 'text-blue-500', requiredPermission: 'view-quotes' },
        { label: translate('Edit'), icon: 'Edit', action: 'edit', className: 'text-amber-500', requiredPermission: 'edit-quotes' },
        { label: translate('Delete'), icon: 'Trash2', action: 'delete', className: 'text-grey-500', requiredPermission: 'delete-quotes' },
    ];

    const statusOptions = [
        { value: 'all', label: translate('All Statuses') },
        { value: 'draft', label: translate('Draft') },
        { value: 'sent', label: translate('Sent') },
        { value: 'accepted', label: translate('Accepted') },
        { value: 'rejected', label: translate('Rejected') },
        { value: 'expired', label: translate('Expired') },
    ];

    return (
        <PageTemplate
            title={translate('Quotes')}
            description={translate('Manage your quotes.')}
            url="/quotes"
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
                            name: 'opportunity_id',
                            label: translate('Opportunity'),
                            type: 'select',
                            searchable: true,
                            value: selectedOpportunity,
                            onChange: setSelectedOpportunity,
                            options: [
                                { value: 'all', label: translate('All Opportunities') },
                                ...(allOpportunities?.map((opp: any) => ({ value: opp.id.toString(), label: opp.name })) || []),
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
                                ...allUsers.map((user: any) => ({ value: user.id.toString(), label: user.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={quotes?.data || []}
                        from={quotes?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{ view: 'view-quotes', create: 'create-quotes', edit: 'edit-quotes', delete: 'delete-quotes' }}
                    />
                </div>
                <Pagination
                    from={quotes?.from || 0}
                    to={quotes?.to || 0}
                    total={quotes?.total || 0}
                    links={quotes?.links}
                    entityName={translate('quotes')}
                    onPageChange={(url) => router.get(url)}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('quotes.index'),
                            {
                                page: 1,
                                search: searchTerm || undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                account_id: selectedAccount !== 'all' ? selectedAccount : undefined,
                                opportunity_id: selectedOpportunity !== 'all' ? selectedOpportunity : undefined,
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
                                { value: 'accepted', label: translate('Accepted') },
                                { value: 'rejected', label: translate('Rejected') },
                                { value: 'expired', label: translate('Expired') },
                            ],
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={translate('Change Quote Status')}
                mode="edit"
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={translate('quote')}
            />
        </PageTemplate>
    );
}
