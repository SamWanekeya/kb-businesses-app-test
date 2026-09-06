import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/ColumnRenderers';

export const organizationPlanRequestsConfig: CrudConfig = {
    entity: {
        name: 'organizationPlanRequests',
        endpoint: route('organization.plan-requests.index'),
        permissions: {
            view: 'view-plan-requests',
            create: 'create-plan-requests',
            edit: 'edit-plan-requests',
            delete: 'delete-plan-requests',
        },
    },
    modalSize: '4xl',
    description: translate('View plan upgrade requests from your team members'),
    table: {
        columns: [
            { key: 'user.name', label: translate('Name'), sortable: true },
            { key: 'user.email', label: translate('Email'), sortable: true },
            { key: 'plan.name', label: translate('Plan Name'), sortable: true },
            {
                key: 'plan.duration',
                label: translate('Plan Duration'),
                render: (value) => (value === 'monthly' ? translate('Monthly') : translate('Yearly')),
            },
            {
                key: 'status',
                label: translate('Status'),
                render: columnRenderers.status(),
            },
            {
                key: 'created_at',
                label: translate('Requested At'),
                sortable: true,
                render: (value) => `${window.appSettings?.formatDateTime(value, false) || '-'}`,
            },
        ],
        actions: [],
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
