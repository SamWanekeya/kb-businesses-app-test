// config/Crud/currencies.ts
import { CrudConfig } from '@/types/crud.d';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export const useCurrenciesConfig = (): CrudConfig => {
    const { t: translate } = useTranslation();

    return {
        entity: {
            name: 'currencies',
            endpoint: route('currencies.index'),
            permissions: {
                view: 'manage-currencies',
                create: 'manage-currencies',
                edit: 'manage-currencies',
                delete: 'manage-currencies',
            },
        },
        table: {
            columns: [
                {
                    key: 'name',
                    label: translate('Name'),
                    sortable: true,
                },
                {
                    key: 'code',
                    label: translate('Code'),
                    sortable: true,
                },
                {
                    key: 'symbol',
                    label: translate('Symbol'),
                    sortable: true,
                },
                {
                    key: 'description',
                    label: translate('Description'),
                },
                {
                    key: 'is_default',
                    label: translate('Default'),
                    type: 'boolean',
                },
            ],
            actions: [
                {
                    label: translate('Edit'),
                    icon: 'Edit',
                    action: 'edit',
                    className: 'text-amber-500',
                    requiredPermission: 'manage-currencies',
                },
                {
                    label: translate('Delete'),
                    icon: 'Trash2',
                    action: 'delete',
                    className: 'text-red-600',
                    requiredPermission: 'manage-currencies',
                    condition: (row) => !row.is_default, // Don’t allow deleting default currency
                },
            ],
        },
        filters: [],
        form: {
            fields: [
                {
                    name: 'name',
                    label: translate('Currency name'),
                    type: 'text',
                    required: true,
                },
                {
                    name: 'code',
                    label: translate('Currency code'),
                    type: 'text',
                    required: true,
                    placeholder: 'e.g. USD, EUR, GBP',
                },
                {
                    name: 'symbol',
                    label: translate('Currency symbol'),
                    type: 'text',
                    required: true,
                    placeholder: 'e.g. $, €, £',
                },
                {
                    name: 'description',
                    label: translate('Description'),
                    type: 'textarea',
                },
                {
                    name: 'is_default',
                    label: translate('Set as default currency'),
                    type: 'checkbox',
                },
            ],
        },
    } satisfies CrudConfig;
};
