import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/ColumnRenderers';
import { useTranslation } from 'react-i18next';

export const planRequestsConfig: CrudConfig = {
    entity: {
        name: 'planRequests',
        endpoint: route('plan-requests.index'),
        permissions: {
            view: 'view-plan-requests',
            create: 'create-plan-requests',
            edit: 'edit-plan-requests',
            delete: 'delete-plan-requests',
        },
    },
    modalSize: '4xl',
    description: translate('Manage plan upgrade requests from users'),
    table: {
        columns: [
            { key: 'user.name', label: translate('Name'), sortable: true },
            { key: 'user.email', label: translate('Email'), sortable: true },
            { key: 'plan.name', label: translate('Plan'), sortable: true },
            {
                key: 'duration',
                label: translate('Plan Duration'),
                render: (value) => (value === 'monthly' ? translate('Monthly') : translate('Yearly')),
            },
            {
                key: 'status',
                label: translate('Status'),
                render: columnRenderers.status({
                    approved: 'bg-green-100 text-green-800',
                    rejected: 'bg-red-100 text-red-800',
                    pending: 'bg-yellow-100 text-yellow-800',
                }),
            },
            {
                key: 'created_at',
                label: translate('Requested At'),
                sortable: true,
                render: (value) => `${window.appSettings?.formatDateTime(value, false) || '-'}`,
            },
        ],
        actions: [
            {
                label: translate('Approve'),
                icon: 'Check',
                action: 'approve',
                className: 'text-green-600',
                condition: (item: any) => item.status === 'pending',
                requiredPermission: 'approve-plan-requests',
            },
            {
                label: translate('Reject'),
                icon: 'X',
                action: 'reject',
                className: 'text-red-600',
                condition: (item: any) => item.status === 'pending',
                requiredPermission: 'reject-plan-requests',
            },
        ],
    },
    search: {
        enabled: true,
        placeholder: translate('Search plan requests...'),
        fields: ['user.name', 'user.email', 'plan.name'],
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
