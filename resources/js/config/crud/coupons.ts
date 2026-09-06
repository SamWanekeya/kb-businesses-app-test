// config/crud/coupons.ts
import { toast } from '@/components/custom-toast';
import { Switch } from '@/components/ui/switch';
import { CrudConfig } from '@/types/crud';
import React from 'react';

export const couponsConfig: CrudConfig = {
    entity: {
        name: 'coupons',
        endpoint: route('coupons.index'),
        permissions: {
            view: 'view-coupons',
            create: 'create-coupons',
            edit: 'create-coupons',
            delete: 'delete-coupons',
        },
    },
    modalSize: '4xl',
    table: {
        columns: [
            { key: 'name', label: translate('Name'), sortable: true },
            {
                key: 'type',
                label: translate('Type'),
                sortable: true,
                render: (value) => {
                    const className = value === 'percentage' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
                    return value === 'percentage' ? translate('Percentage') : translate('Flat Amount');
                },
            },
            {
                key: 'minimum_spend',
                label: translate('Min Spend'),
                render: (value) => (value ? window.appSettings?.formatCurrency(value) || `$${parseFloat(value).toFixed(2)}` : '-'),
            },
            {
                key: 'maximum_spend',
                label: translate('Max Spend'),
                render: (value) => (value ? window.appSettings?.formatCurrency(value) || `$${parseFloat(value).toFixed(2)}` : '-'),
            },
            {
                key: 'discount_amount',
                label: translate('Discount'),
                render: (value, row) => {
                    const amount = parseFloat(value);
                    return row.type === 'percentage' ? `${amount}%` : window.appSettings?.formatCurrency(amount) || `$${amount.toFixed(2)}`;
                },
            },
            { key: 'use_limit_per_coupon', label: translate('Coupon Limit'), render: (value) => value || translate('Unlimited') },
            { key: 'use_limit_per_user', label: translate('User Limit'), render: (value) => value || translate('Unlimited') },
            {
                key: 'expiry_date',
                label: translate('Expiry Date'),
                sortable: true,
                render: (value) => window.appSettings.formatDateTime(value, false) || '-',
            },
            { key: 'code', label: translate('Code'), sortable: true },
            {
                key: 'status',
                label: translate('Status'),
                type: 'custom',
                render: (value, row) => {
                    const StatusSwitch = () => {
                        const [isChecked, setIsChecked] = React.useState(!!value);

                        const handleToggle = async () => {
                            try {
                                const response = await fetch(route('coupons.toggle-status', row.id), {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                                        Accept: 'application/json',
                                    },
                                });

                                if (response.ok) {
                                    const data = await response.json();
                                    setIsChecked(data.status);
                                    row.status = data.status;
                                    toast.success(data.message || 'Status updated successfully');
                                } else {
                                    const errorData = await response.json();
                                    if (errorData.demo_mode) {
                                        toast.error(errorData.message || 'This action is disabled in demo mode');
                                    } else {
                                        toast.error('Failed to update status');
                                    }
                                }
                            } catch (error) {
                                toast.error('Network error updating status');
                            }
                        };

                        return React.createElement(
                            'div',
                            { className: 'flex items-center justify-center' },
                            React.createElement(Switch, {
                                checked: isChecked,
                                onCheckedChange: handleToggle,
                            }),
                        );
                    };

                    return React.createElement(StatusSwitch);
                },
            },
        ],
        actions: [
            {
                label: translate('View Details'),
                icon: 'Eye',
                action: 'view-details',
                href: (row: any) => route('coupons.show', row.id),
                className: 'text-blue-500',
            },
            {
                label: translate('Edit'),
                icon: 'Edit',
                action: 'edit',
                className: 'text-amber-500',
            },
            {
                label: translate('Delete'),
                icon: 'Trash2',
                action: 'delete',
                className: 'text-red-500',
            },
        ],
    },
    search: {
        enabled: true,
        placeholder: translate('Search coupons...'),
        fields: ['name', 'code'],
    },
    filters: [
        {
            key: 'type',
            label: translate('Type'),
            type: 'select',
            options: [
                { value: 'all', label: translate('All Types') },
                { value: 'percentage', label: translate('Percentage') },
                { value: 'flat', label: translate('Flat Amount') },
            ],
        },
        {
            key: 'status',
            label: translate('Status'),
            type: 'select',
            options: [
                { value: 'all', label: translate('All Status') },
                { value: '1', label: translate('Active') },
                { value: '0', label: translate('Inactive') },
            ],
        },
    ],
    form: {
        fields: [
            {
                name: 'name',
                label: translate('Coupon Name'),
                type: 'text',
                required: true,
                colSpan: 12,
                placeholder: translate('Enter coupon name'),
            },
            {
                name: 'type',
                label: translate('Discount Type'),
                type: 'select',
                required: true,
                colSpan: 6,
                options: [
                    { value: 'percentage', label: translate('Percentage (%)') },
                    { value: 'flat', label: translate('Fixed Amount ($)') },
                ],
            },
            {
                name: 'discount_amount',
                label: translate('Discount Value'),
                type: 'number',
                required: true,
                colSpan: 6,
                min: 0,
                max: 99,
                step: 0.01,
                placeholder: translate('Enter value'),
            },
            {
                name: 'code_type',
                label: translate('Code Generation'),
                type: 'radio',
                required: true,
                colSpan: 12,
                options: [
                    { value: 'manual', label: translate('Manual Entry') },
                    { value: 'auto', label: translate('Auto Generate') },
                ],
                defaultValue: 'manual',
            },
            {
                name: 'code',
                label: translate('Coupon Code'),
                type: 'custom',
                required: true,
                colSpan: 12,
                render: (field: any, formData: any, onChange: any, errors: any) => {
                    const generateCode = () => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let result = '';
                        for (let i = 0; i < 10; i++) {
                            result += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        onChange('code', result);
                    };

                    const isAuto = formData.code_type === 'auto';
                    const hasError = errors?.code;
                    const inputClass = `px-3 py-2 border rounded-md${hasError ? ' border-red-500' : ''}`;

                    return React.createElementranslate('div', { className: 'space-y-2' }, [
                        React.createElement(
                            'div',
                            {
                                className: isAuto ? 'flex gap-2' : '',
                                key: 'input-group',
                            },
                            isAuto
                                ? [
                                      React.createElementranslate('input', {
                                          key: 'code-input',
                                          type: 'text',
                                          value: formData.code || '',
                                          onChange: (e: any) => onChange('code', e.target.value.toUpperCase()),
                                          placeholder: translate('Click generate to create code'),
                                          className: `flex-1 ${inputClass}`,
                                      }),
                                      React.createElement(
                                          'button',
                                          {
                                              key: 'generate-btn',
                                              type: 'button',
                                              onClick: generateCode,
                                              className: 'px-4 py-2 bg-primary text-white rounded-md hover:bg-primary',
                                          },
                                          translate('Generate'),
                                      ),
                                  ]
                                : [
                                      React.createElementranslate('input', {
                                          key: 'code-input-manual',
                                          type: 'text',
                                          value: formData.code || '',
                                          onChange: (e: any) => onChange('code', e.target.value.toUpperCase()),
                                          placeholder: translate('Enter coupon code'),
                                          className: `w-full ${inputClass}`,
                                      }),
                                  ],
                        ),
                    ]);
                },
            },
            {
                name: 'minimum_spend',
                label: translate('Minimum Spend ($)'),
                type: 'number',
                colSpan: 6,
                min: 0,
                step: 0.01,
                placeholder: translate('Optional'),
            },
            {
                name: 'maximum_spend',
                label: translate('Maximum Spend ($)'),
                type: 'number',
                colSpan: 6,
                min: 0,
                step: 0.01,
                placeholder: translate('Optional'),
            },
            {
                name: 'use_limit_per_coupon',
                label: translate('Total Usage Limit'),
                type: 'number',
                colSpan: 6,
                min: 1,
                placeholder: translate('Leave empty for unlimited'),
            },
            {
                name: 'use_limit_per_user',
                label: translate('Usage Limit Per User'),
                type: 'number',
                colSpan: 6,
                min: 1,
                placeholder: translate('Leave empty for unlimited'),
            },
            {
                name: 'expiry_date',
                label: translate('Expiry Date'),
                type: 'date',
                colSpan: 6,
            },
            {
                name: 'status',
                label: translate('Status'),
                type: 'switch',
                // colSpan: 6,
                defaultValue: true,
                // placeholder: translate('Enable or disable this coupon')
            },
        ],
    },
};
