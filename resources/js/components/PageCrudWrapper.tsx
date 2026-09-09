// components/PageCrudWrapper.tsx
import { ReactNode, useEffect, useState } from 'react';

import { BreadcrumbItemTypes } from '@/types';
import { CrudConfig } from '@/types/crud.d';
import CrudDeleteModal from '@components/CrudDeleteModal';
import CrudFormModal from '@components/CrudFormModal';
import CrudTable from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate, { PageAction } from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import Pagination from '@components/UserInterface/Pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Filter, PlusIcon, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CrudButton {
    label: string;
    icon?: ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick?: () => void;
    requiredPermission?: string;
    className?: string;
    showAddButton?: boolean;
}

interface PageCrudWrapperProps {
    config: CrudConfig;
    title?: string;
    url: string;
    buttons?: CrudButton[];
    breadcrumbs?: BreadcrumbItemTypes[];
    description: string | null;
}

export default function PageCrudWrapper({ config, title, url, buttons = [], breadcrumbs, description }: PageCrudWrapperProps) {
    const { t: translate } = useTranslation();
    const { entity, table, filters, form, hooks } = config;
    const { auth, ...pageProps } = usePage().props;
    const permissions = auth?.permissions ?? [];

    // Get data from page props using entity name
    const data = pageProps[entity.name] || { data: [], links: [] };
    const pageFilters = pageProps.filters || {};

    // State
    const [searchTerm, setSearchTerm] = useState<string>(pageFilters.search ?? '');
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [showFilters, setShowFilters] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    // Initialize filter values from URL
    useEffect(() => {
        const initialFilters: Record<string, any> = {};
        filters.forEach((filter) => {
            const filterKey = filter.label || filter.key;
            initialFilters[filterKey] = pageFilters[filterKey] || '';
        });
        setFilterValues(initialFilters);
    }, [filters]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return (
            Object.entries(filterValues).some(([, value]) => {
                return value && value !== '';
            }) || searchTerm !== ''
        );
    };

    // Count active filters
    const activeFilterCount = () => {
        return (
            Object.entries(filterValues).filter(([_key, value]) => {
                return value && value !== '';
            }).length + (searchTerm ? 1 : 0)
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        // Add filter values to params
        Object.entries(filterValues).forEach(([key, value]) => {
            if (value && value !== '') {
                params[key] = value;
            }
        });

        // Add per_page if it exists
        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(entity.endpoint, params, { preserveState: true, preserveScroll: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));

        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        // Add all current filter values
        const newFilters = { ...filterValues, [key]: value };
        Object.entries(newFilters).forEach(([k, v]) => {
            if (v && v !== '') {
                params[k] = v;
            }
        });

        // Add per_page if it exists
        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(entity.endpoint, params, { preserveState: true, preserveScroll: true });
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';

        const params: any = {
            sort_field: field,
            sort_direction: direction,
            page: 1,
        };

        // Add search and filters
        if (searchTerm) {
            params.search = searchTerm;
        }

        Object.entries(filterValues).forEach(([key, value]) => {
            if (value && value !== '') {
                params[key] = value;
            }
        });

        // Add per_page if it exists
        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(entity.endpoint, params, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view':
                setFormMode('view');
                setIsFormModalOpen(true);
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            default:
                break;
        }
    };

    const handleAddNew = () => {
        setCurrentItem(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        // Make a copy of the form data to avoid modifying the original
        const processedFormData = { ...formData };

        // For roles, create a simplified object with only the required fields
        if (entity.name === 'roles') {
            // Extract permission names from the permissions array if they're objects
            if (processedFormData.permissions && Array.isArray(processedFormData.permissions)) {
                processedFormData.permissions = processedFormData.permissions.map((p) => {
                    if (typeof p === 'object' && p !== null && p.name) {
                        return p.name;
                    }
                    return String(p);
                });
            }

            // Reset the object with only the fields we need
            const cleanData = {
                label: processedFormData.label,
                description: processedFormData.description ?? '',
                permissions: processedFormData.permissions || [],
            };

            // Replace all properties
            Object.keys(processedFormData).forEach((key) => {
                delete processedFormData[key];
            });

            Object.assign(processedFormData, cleanData);
        }
        // Fix permissions format for other entities
        else if (processedFormData.permissions && Array.isArray(processedFormData.permissions)) {
            const permissionsObj = {};
            processedFormData.permissions.forEach((id, index) => {
                permissionsObj[index] = String(id);
            });
            processedFormData.permissions = permissionsObj;
        }

        // Ensure we're not sending the name field for permissions as it's auto-generated
        if (entity.name === 'permissions' && formMode === 'edit') {
            delete processedFormData.name;
        }

        // Check if this entity has file uploads
        const hasFileFields = form.fields.some((field) => field.type === 'file');

        if (hasFileFields) {
            // Get file field names
            const fileFields = form.fields.filter((field) => field.type === 'file').map((field) => field.name);

            // Use FormData for file uploads
            const formDataObj = new FormData();

            // Add all fields to FormData
            Object.keys(processedFormData).forEach((key) => {
                // For file fields in edit mode
                if (fileFields.includes(key) && formMode === 'edit') {
                    // Only include the file if a new one was selected
                    if (processedFormData[key] && typeof processedFormData[key] === 'object') {
                        formDataObj.append(key, processedFormData[key]);
                    }
                    // Otherwise skip this field - don’t send empty file fields
                    return;
                }
                formDataObj.append(key, processedFormData[key]);
            });

            if (formMode === 'create') {
                // Show loading toast
                const toastId = toast.loading(translate('Creating...'));

                router.post(entity.endpoint, formDataObj, {
                    onSuccess: () => {
                        setIsFormModalOpen(false);
                        toast.dismiss(toastId);

                        if (hooks?.afterCreate) {
                            hooks.afterCreate(formData, pageProps[entity.name]);
                        }
                    },
                    onError: (errors) => {
                        toast.dismiss(toastId);
                        Object.values(errors).forEach((message) => toast.error(translate(message)));
                    },
                });
            } else if (formMode === 'edit') {
                // Show loading toast
                const toastId = toast.loading(translate('Updating...'));

                router.post(`${entity.endpoint}/${currentItem.id}?_method=PUT`, formDataObj, {
                    onSuccess: () => {
                        setIsFormModalOpen(false);
                        toast.dismiss(toastId);

                        if (hooks?.afterUpdate) {
                            hooks.afterUpdate(formData, pageProps[entity.name]);
                        }
                    },
                    onError: (errors) => {
                        toast.dismiss(toastId);
                        Object.values(errors).forEach((message) => toast.error(translate(message)));
                    },
                });
            }
            return;
        }

        if (formMode === 'create') {
            // Show loading toast
            const toastId = toast.loading(translate('Creating...'));

            router.post(entity.endpoint, processedFormData, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    toast.dismiss(toastId);
                    if (hooks?.afterCreate) {
                        hooks.afterCreate(formData, pageProps[entity.name]);
                    }
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    Object.values(errors).forEach((message) => toast.error(translate(message)));
                },
            });
        } else if (formMode === 'edit') {
            // Show loading toast
            const toastId = toast.loading(translate('Updating...'));

            router.put(`${entity.endpoint}/${currentItem.id}`, processedFormData, {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    toast.dismiss(toastId);
                    if (hooks?.afterUpdate) {
                        hooks.afterUpdate(formData, pageProps[entity.name]);
                    }
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    Object.values(errors).forEach((message) => toast.error(translate(message)));
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        // Show loading toast
        const toastId = toast.loading(translate('Deleting...'));

        router.delete(`${entity.endpoint}/${currentItem.id}`, {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.dismiss(toastId);

                if (hooks?.afterDelete) {
                    hooks.afterDelete(currentItem.id);
                }
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                Object.values(errors).forEach((message) => toast.error(translate(message)));
            },
        });
    };

    const hasPermission = (permission?: string) => {
        if (!permission) return true;
        if (!auth || !auth.user || !auth.permissions) return false;
        return auth.permissions.includes(permission);
    };

    const handleResetFilters = () => {
        const resetFilters: Record<string, any> = {};
        filters.forEach((filter) => {
            resetFilters[filter.key] = filter.type === 'select' ? 'all' : '';
        });

        setFilterValues(resetFilters);
        setSearchTerm('');
        setShowFilters(false);

        router.get(
            entity.endpoint,
            {
                page: 1,
                per_page: pageFilters.per_page || 10,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Check if we should show the add button
    const showAddButton = buttons.every((button) => button.showAddButton !== false);

    // Build page actions safely
    const pageActions: PageAction[] = buttons
        .filter((button) => hasPermission(button.requiredPermission))
        .map((button) => ({
            label: button.label,
            icon: button.icon,
            variant: button.variant,
            onClick: button.onClick,
        }));

    // Check create permission
    const canCreateEntity = hasPermission(entity.permissions.create);

    // Add default "Add a new" button
    if (showAddButton && canCreateEntity) {
        pageActions.push({
            label: `${translate('Add a new')} ${entity.name.slice(0, -1).charAt(0).toUpperCase() + entity.name.slice(0, -1).slice(1)}`,
            icon: <PlusIcon className="h-4 w-4" />,
            variant: 'default',
            onClick: handleAddNew,
        });
    }

    const pageTitle = translate(title || entity.name.charAt(0).toUpperCase() + entity.name.slice(1));

    const defaultBreadcrumbs: BreadcrumbItemTypes[] = [
        {
            title: translate('Dashboard'),
            href: route('dashboard.index'),
        },
        { title: pageTitle },
    ];

    const pageBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

    return (
        <PageTemplate title={pageTitle} url={url} actions={pageActions} breadcrumbs={pageBreadcrumbs} description={description}>
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg bg-white shadow dark:bg-neutral-900">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <form autoComplete="off" onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative w-64">
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                        }}
                                        className="w-full"
                                    />
                                </div>
                                <Button type="submit" size="lg">
                                    <Search className="mr-1.5 h-4 w-4" />
                                    {translate('Search')}
                                </Button>
                            </form>

                            {filters.length > 0 && (
                                <div className="ml-2">
                                    <Button
                                        variant={hasActiveFilters() ? 'default' : 'outline'}
                                        size="lg"
                                        onClick={() => {
                                            setShowFilters(!showFilters);
                                        }}
                                    >
                                        <Filter className="mr-1.5 h-3.5 w-3.5" />
                                        {showFilters ? translate('Hide filters') : translate('Show filters')}
                                        {hasActiveFilters() && (
                                            <span className="bg-primary-foreground text-primary ml-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                                                {activeFilterCount()}
                                            </span>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <Label className="text-muted-foreground text-xs">{translate('Per page')}:</Label>
                            <Select
                                value={pageFilters.per_page?.toString() || '10'}
                                onValueChange={(value) => {
                                    const params: any = { page: 1, per_page: parseInt(value) };

                                    if (searchTerm) {
                                        params.search = searchTerm;
                                    }

                                    Object.entries(filterValues).forEach(([key, val]) => {
                                        if (val && val !== '') {
                                            params[key] = val;
                                        }
                                    });

                                    router.get(entity.endpoint, params, { preserveState: true, preserveScroll: true });
                                }}
                            >
                                <SelectTrigger className="h-8 w-16">
                                    <SelectValue placeholder={translate('Select...')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {showFilters && filters.length > 0 && (
                        <div className="mt-3 w-full rounded-md border bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                            <div className="flex flex-wrap items-end gap-4">
                                {filters.map((filter) => {
                                    const filterKey = filter.name || filter.key;
                                    return (
                                        <div key={filterKey} className="space-y-2">
                                            <Label>{filter.label}</Label>
                                            {filter.type === 'select' && (
                                                <Select
                                                    value={filterValues[filterKey] || ''}
                                                    onValueChange={(value) => {
                                                        handleFilterChange(filterKey, value);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-40">
                                                        <SelectValue placeholder={`All ${filter.label}`} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filter.options?.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    );
                                })}

                                <Button variant="outline" size="lg" onClick={handleResetFilters} disabled={!hasActiveFilters()}>
                                    {translate('Reset filters')}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Table section */}
            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-neutral-900">
                <CrudTable
                    columns={table.columns}
                    actions={table.actions}
                    data={data.data}
                    from={data.from || 1}
                    onAction={handleAction}
                    sortField={pageFilters.sort_field}
                    sortDirection={pageFilters.sort_direction}
                    onSort={handleSort}
                    statusColors={table.statusColors}
                    permissions={permissions}
                    entityPermissions={entity.permissions}
                />

                {/* Pagination section */}
                <Pagination
                    from={data.from || 0}
                    to={data.to || 0}
                    total={data.total}
                    links={data.links}
                    entityName={entity.name}
                    onPageChange={(url) => {
                        router.get(url);
                    }}
                />
            </div>

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                }}
                autoComplete="off"
                onSubmit={handleFormSubmit}
                formConfig={{
                    ...form,
                    modalSize: config.modalSize || form.modalSize,
                }}
                initialData={currentItem}
                title={
                    formMode === 'create'
                        ? `Add New ${entity.name.slice(0, -1).charAt(0).toUpperCase() + entity.name.slice(0, -1).slice(1)}`
                        : formMode === 'edit'
                          ? `Edit ${entity.name.slice(0, -1).charAt(0).toUpperCase() + entity.name.slice(0, -1).slice(1)}`
                          : `View ${entity.name.slice(0, -1).charAt(0).toUpperCase() + entity.name.slice(0, -1).slice(1)}`
                }
                mode={formMode}
                description={config.description}
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                }}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={entity.name.slice(0, -1)}
            />
        </PageTemplate>
    );
}
