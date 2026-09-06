// config/crud/users.ts
import { CrudConfig } from '@/types/crud';
import { useTranslation } from 'react-i18next';

export const usersConfig: CrudConfig = {
    entity: {
        name: 'users',
        endpoint: route('users.index'),
        permissions: {
            view: 'view-users',
            create: 'create-users',
            edit: 'edit-users',
            delete: 'delete-users',
        },
    },
    modalSize: 'lg',
    table: {
        columns: [
            {
                key: 'name',
                label: translate('Name'),
                sortable: true,
                render: (value, row) => {
                    return `<div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                ${row.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
              </div>
              <div>
                <div class="font-medium">${row.name}</div>
                <div class="text-sm text-muted-foreground">${row.email}</div>
              </div>
            </div>`;
                },
            },
            {
                key: 'roles',
                label: translate('Roles'),
                render: (value) => {
                    if (!value || !value.length) return '<span class="text-muted-foreground">No roles assigned</span>';

                    return value
                        .map((role: any) => {
                            return `<span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 mr-1">${role.label || role.name}</span>`;
                        })
                        .join(' ');
                },
            },
            {
                key: 'created_at',
                label: translate('Joined'),
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
                requiredPermission: 'view-users',
            },
            {
                label: translate('Edit'),
                icon: 'Edit',
                action: 'edit',
                className: 'text-amber-500',
                requiredPermission: 'edit-users',
            },
            {
                label: translate('Delete'),
                icon: 'Trash2',
                action: 'delete',
                className: 'text-red-500',
                requiredPermission: 'delete-users',
            },
        ],
    },
    filters: [
        {
            key: 'role',
            label: translate('Role'),
            type: 'select',
            options: [], // Will be populated dynamically
        },
    ],
    form: {
        fields: [
            { name: 'name', label: translate('Name'), type: 'text', required: true },
            { name: 'email', label: translate('Email'), type: 'email', required: true },
            {
                name: 'password',
                label: translate('Password'),
                type: 'password',
                required: true,
                conditional: (mode) => mode === 'create',
            },
            {
                name: 'password_confirmation',
                label: translate('Confirm Password'),
                type: 'password',
                required: true,
                conditional: (mode) => mode === 'create',
            },
            {
                name: 'roles',
                label: translate('Roles'),
                type: 'multiselect',
                options: [], // Will be populated dynamically
            },
        ],
    },
};
