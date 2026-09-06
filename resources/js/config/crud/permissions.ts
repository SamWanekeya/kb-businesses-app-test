// config/crud/permissions.ts
import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/ColumnRenderers';
import { useTranslation } from 'react-i18next';

export const permissionsConfig: CrudConfig = {
    entity: {
        name: 'permissions',
        endpoint: route('permissions.index'),
        permissions: {
            view: 'view-permissions',
            create: 'create-permissions',
            edit: 'edit-permissions',
            delete: 'delete-permissions',
        },
    },
    description: translate('Manage system permissions for different modules'),
    table: {
        columns: [
            {
                key: 'module',
                label: translate('Module'),
                sortable: true,
                render: columnRenderers.status({
                    [translate('Products')]: 'bg-blue-100 text-blue-800',
                    [translate('Categories')]: 'bg-green-100 text-green-800',
                    [translate('Contacts')]: 'bg-purple-100 text-purple-800',
                    [translate('Permissions')]: 'bg-amber-100 text-amber-800',
                    [translate('Roles')]: 'bg-red-100 text-red-800',
                    [translate('Users')]: 'bg-indigo-100 text-indigo-800',
                }),
            },
            { key: 'name', label: translate('Name'), sortable: true },
            { key: 'label', label: translate('Label'), sortable: true },
            { key: 'description', label: translate('Description') },
            {
                key: 'created_at',
                label: translate('Created At'),
                sortable: true,
                render: (value) => `${window.appSettings?.formatDateTime(value, false) || '-'}`,
            },
        ],
        actions: [
            {
                label: translate('View'),
                icon: 'Eye',
                action: 'view',
                className: 'text-blue-500',
                requiredPermission: 'view-permissions',
            },
            {
                label: translate('Edit'),
                icon: 'Edit',
                action: 'edit',
                className: 'text-amber-500',
                requiredPermission: 'edit-permissions',
            },
            {
                label: translate('Delete'),
                icon: 'Trash2',
                action: 'delete',
                className: 'text-red-500',
                requiredPermission: 'delete-permissions',
            },
        ],
    },
    filters: [
        {
            key: 'module',
            label: translate('Module'),
            type: 'select',
            options: [],
        },
    ],
    form: {
        fields: [
            { name: 'module', label: translate('Module'), type: 'text', required: true },
            {
                name: 'label',
                label: translate('Label'),
                type: 'text',
                required: true,
                description: translate('The name field will be automatically generated from this label'),
            },
            { name: 'description', label: translate('Description'), type: 'textarea' },
        ],
    },
};
