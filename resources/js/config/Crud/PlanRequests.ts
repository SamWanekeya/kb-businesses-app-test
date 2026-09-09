import { CrudConfig } from '@/types/crud.d';
import { columnRenderers } from '@utils/ColumnRenderers';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

export const usePlanRequestsConfig = (): CrudConfig => {
    const { t: translate } = useTranslation();

    return {
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
                { key: 'user.email', label: translate('Work email'), sortable: true },
                { key: 'plan.name', label: translate('Plan name'), sortable: true },
                {
                    key: 'plan.duration',
                    label: translate('Plan duration'),
                    render: (value) => (value === 'monthly' ? translate('Monthly') : translate('Yearly')),
                },
                {
                    key: 'status',
                    label: translate('Status'),
                    render: columnRenderers.status({
                        [translate('Pending')]: 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20',
                        [translate('Approved')]: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20',
                        [translate('Rejected')]: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
                    }),
                },
                {
                    key: 'created_at',
                    label: translate('Requested at'),
                    sortable: true,
                    render: (value) => window.hfSettings.formatDateTime(value, false),
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
            fields: ['user.name', 'user.email', 'plan.name'],
        },
        filters: [
            {
                key: 'status',
                label: translate('Status'),
                type: 'select',
                options: [
                    { value: 'all', label: translate('All statuses'), disabled: true },
                    { value: 'pending', label: translate('Pending') },
                    { value: 'approved', label: translate('Approved') },
                    { value: 'rejected', label: translate('Rejected') },
                ],
            },
        ],
        form: {
            fields: [],
        },
    } satisfies CrudConfig;
};
