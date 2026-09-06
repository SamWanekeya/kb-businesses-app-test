// config/crud/contacts.ts
import { CrudConfig } from '@/types/crud';
import { columnRenderers } from '@/utils/ColumnRenderers';

export const contactsConfig: CrudConfig = {
    entity: {
        name: 'contacts',
        endpoint: route('contacts.index'),
        permissions: {
            view: 'view-contacts',
            create: 'create-contacts',
            edit: 'edit-contacts',
            delete: 'delete-contacts',
        },
    },
    table: {
        columns: [
            { key: 'organization.name', label: translate('Organization Name'), sortable: false },
            { key: 'name', label: translate('Name'), sortable: true },
            { key: 'email', label: translate('Email'), sortable: true },
            { key: 'phone', label: translate('Phone') },
            { key: 'message', label: translate('Message') },
            {
                key: 'status',
                label: translate('Status'),
                sortable: true,
                render: columnRenderers.status({
                    new: 'bg-blue-100 text-blue-800',
                    contacted: 'bg-yellow-100 text-yellow-800',
                    qualified: 'bg-purple-100 text-purple-800',
                    converted: 'bg-green-100 text-green-800',
                    closed: 'bg-gray-100 text-gray-800',
                }),
            },
        ],
        actions: [
            {
                label: translate('Reply'),
                icon: 'MessageSquare',
                action: 'reply',
                className: 'text-blue-500',
                requiredPermission: 'edit-contacts',
            },
            {
                label: translate('Delete'),
                icon: 'Trash2',
                action: 'delete',
                className: 'text-red-500',
                requiredPermission: 'delete-contacts',
            },
        ],
    },
    filters: [
        {
            key: 'status',
            label: translate('Status'),
            type: 'select',
            options: [
                { value: 'new', label: translate('New') },
                { value: 'contacted', label: translate('Contacted') },
                { value: 'qualified', label: translate('Qualified') },
                { value: 'converted', label: translate('Converted') },
                { value: 'closed', label: translate('Closed') },
            ],
        },
    ],
    form: {
        fields: [
            { name: 'business_id', label: translate('Business'), type: 'select', required: true },
            { name: 'name', label: translate('Name'), type: 'text', required: true },
            { name: 'email', label: translate('Email'), type: 'email' },
            { name: 'phone', label: translate('Phone'), type: 'text' },
            { name: 'message', label: translate('Message'), type: 'textarea' },
            {
                name: 'status',
                label: translate('Status'),
                type: 'select',
                required: true,
                options: [
                    { value: 'new', label: translate('New') },
                    { value: 'contacted', label: translate('Contacted') },
                    { value: 'qualified', label: translate('Qualified') },
                    { value: 'converted', label: translate('Converted') },
                    { value: 'closed', label: translate('Closed') },
                ],
            },
            { name: 'notes', label: translate('Notes'), type: 'textarea' },
        ],
    },
};
