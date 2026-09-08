import { CrudConfig } from '@/types/crud.d';

export const usePlanOrdersConfig: CrudConfig = {
    entity: {
        name: 'organization-plan-orders',
        endpoint: route('organization.plan-orders.index'),
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
            { key: 'order_number', label: translate('Order Number'), sortable: true },
            {
                key: 'ordered_at',
                label: translate('Order Date'),
                sortable: true,
                render: (value) => `${window.appSettings?.formatDateTime(value, false) || '-'}`,
            },
            {
                key: 'user.name',
                label: translate('User Name'),
                sortable: false,
            },
            {
                key: 'plan.name',
                label: translate('Plan Name'),
                sortable: false,
            },
            {
                key: 'original_price',
                label: translate('Original Price'),
                render: (value) => `${window.appSettings.formatCurrency(value)}`,
            },
            {
                key: 'coupon_code',
                label: translate('Coupon Code'),
                render: (value) => value || '-',
            },
            {
                key: 'discount_amount',
                label: translate('Discount'),
                render: (value) => (value > 0 ? `-${window.appSettings.formatCurrency(value)}` : '-'),
            },
            {
                key: 'final_price',
                label: translate('Final Price'),
                render: (value) => `${window.appSettings.formatCurrency(value)}`,
            },
            {
                key: 'status',
                label: translate('Status'),
                render: (value) => {
                    const statusMap = {
                        pending: { label: translate('Pending'), className: 'bg-yellow-100 text-yellow-800' },
                        approved: { label: translate('Approved'), className: 'bg-green-100 text-green-800' },
                        rejected: { label: translate('Rejected'), className: 'bg-red-100 text-red-800' },
                    };
                    const status = statusMap[value as keyof typeof statusMap] || statusMap.pending;
                    return status.label;
                },
            },
            {
                key: 'receipt_path',
                label: translate('Receipt'),
            },
        ],
        actions: [],
    },
    search: {
        enabled: true,
        placeholder: translate('Search orders...'),
        fields: ['order_number', 'user.name', 'plan.name', 'coupon_code'],
    },
    filters: [
        {
            key: 'status',
            label: translate('Status'),
            type: 'select',
            options: [
                { value: 'all', label: translate('All Status') },
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
