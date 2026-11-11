import { CrudConfig } from '@/types/crud.d';

export const usePlanOrdersConfig: CrudConfig = {
    entity: {
        name: 'organization-plan-orders',
        endpoint: route('subscriptions.plan-orders.index'),
        permissions: {
            view: 'view-plan-orders',
            create: 'create-plan-orders',
            edit: 'edit-plan-orders',
            delete: 'delete-plan-orders',
        },
    },
    modalSize: '4xl',
    description: translate('View plan orders and subscription history for your team'),
    table: {
        columns: [
            { key: 'order_number', label: translate('Order number'), sortable: true },
            {
                key: 'ordered_at',
                label: translate('Order date'),
                sortable: true,
                render: (value) => `${window.kbSettings.formatDateTime(value, false) || '-'}`,
            },
            {
                key: 'user.name',
                label: translate('User name'),
                sortable: false,
            },
            {
                key: 'plan.name',
                label: translate('Plan name'),
                sortable: false,
            },
            {
                key: 'original_price',
                label: translate('Original price'),
                render: (value) => `${window.kbSettings.formatCurrency(value)}`,
            },
            {
                key: 'discount_code',
                label: translate('Discount code'),
                render: (value) => value || '-',
            },
            {
                key: 'discount_amount',
                label: translate('Discount'),
                render: (value) => (value > 0 ? `-${window.kbSettings.formatCurrency(value)}` : '-'),
            },
            {
                key: 'final_price',
                label: translate('Final price'),
                render: (value) => `${window.kbSettings.formatCurrency(value)}`,
            },
            {
                key: 'status',
                label: translate('Status'),
                render: (value) => {
                    const statusMap = {
                        pending: { label: translate('Pending'), className: 'bg-yellow-100 text-yellow-800' },
                        approved: { label: translate('Approved'), className: 'bg-fuchsia-100 text-fuchsia-800' },
                        rejected: { label: translate('Rejected'), className: 'bg-red-100 text-red-800' },
                    };
                    const status = statusMap[value as keyof typeof statusMap] || statusMap.pending;
                    return status.label;
                },
            },
            {
                key: 'receipt',
                label: translate('Receipt'),
            },
        ],
        actions: [],
    },
    search: {
        enabled: true,
        fields: ['order_number', 'user.name', 'plan.name', 'discount_code'],
    },
    filters: [
        {
            key: 'status',
            label: translate('Status'),
            type: 'select',
            options: [
                { value: 'all', label: translate('All status') },
                { value: 'pending', label: translate('Pending') },
                { value: 'approved', label: translate('Approved') },
                { value: 'rejected', label: translate('Rejected') },
            ],
        },
    ],
    form: {
        fields: [],
    },
};
