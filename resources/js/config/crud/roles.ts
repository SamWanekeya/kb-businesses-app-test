// config/crud/roles.ts
import { CrudConfig } from '@/types/crud';

export const rolesConfig: CrudConfig = {
    entity: {
        name: 'roles',
        endpoint: route('roles.index'),
        permissions: {
            view: 'view-roles',
            create: 'create-roles',
            edit: 'edit-roles',
            delete: 'delete-roles',
        },
    },
    modalSize: '5xl',
    description: translate('Manage user roles and their permissions'),
    table: {
        columns: [
            { key: 'label', label: translate('Name'), sortable: true },
            { key: 'name', label: translate('Slug'), sortable: true },
        ],
        actions: [
            {
                label: translate('View'),
                icon: 'Eye',
                action: 'view',
                className: 'text-blue-500',
                requiredPermission: 'view-roles',
            },
            {
                label: translate('Edit'),
                icon: 'Edit',
                action: 'edit',
                className: 'text-amber-500',
                requiredPermission: 'edit-roles',
            },
            {
                label: translate('Delete'),
                icon: 'Trash2',
                action: 'delete',
                className: 'text-red-500',
                requiredPermission: 'delete-roles',
                condition: (row) => !row.is_system_role,
            },
        ],
    },
    filters: [],
    form: {
        fields: [
            { name: 'label', label: translate('Role Name'), type: 'text', required: true },
            { name: 'description', label: translate('Description'), type: 'textarea' },
            // Permissions field will be added dynamically in the Roles component
        ],
    },
};
