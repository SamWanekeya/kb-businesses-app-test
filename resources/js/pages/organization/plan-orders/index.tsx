import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/CustomToast';
import { PageTemplate } from '@/components/page-template';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { usePlanOrdersConfig } from '@/config/Crud/PlanOrders';
import { router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function OrganizationPlanOrdersPage() {
    const { t: translate } = useTranslation();
    const { flash, planOrders, filters: pageFilters = {}, auth } = usePage().props;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        const initialFilters: Record<string, any> = {};
        usePlanOrdersConfig.filters?.forEach((filter) => {
            initialFilters[filter.key] = pageFilters[filter.key] || 'all';
        });
        setFilterValues(initialFilters);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        Object.entries(filterValues).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params[key] = value;
            }
        });

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(route('organization.plan-orders.index'), params, { preserveState: true, preserveScroll: true });
    };

    const handleFilterChange = (key: string, value: any) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));

        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        const newFilters = { ...filterValues, [key]: value };
        Object.entries(newFilters).forEach(([k, v]) => {
            if (v && v !== 'all') {
                params[k] = v;
            }
        });

        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(route('organization.plan-orders.index'), params, { preserveState: true, preserveScroll: true });
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Plans'), href: route('plans.index') },
        { title: translate('Plan Orders') },
    ];

    const hasActiveFilters = () => {
        return (
            Object.entries(filterValues).some(([key, value]) => {
                return value && value !== '';
            }) || searchTerm !== ''
        );
    };

    return (
        <PageTemplate title={translate('Plan Orders')} url="/organization/plan-orders" breadcrumbs={breadcrumbs} noPadding>
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={
                        usePlanOrdersConfig.filters?.map((filter) => ({
                            name: filter.key,
                            label: translate(filter.label),
                            type: 'select',
                            value: filterValues[filter.key] || '',
                            onChange: (value) => handleFilterChange(filter.key, value),
                            options:
                                filter.options?.map((option) => ({
                                    value: option.value,
                                    label: translate(option.label),
                                })) || [],
                        })) || []
                    }
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={() => {
                        return Object.values(filterValues).filter((v) => v && v !== '').length + (searchTerm ? 1 : 0);
                    }}
                    onResetFilters={() => {
                        setSearchTerm('');
                        setFilterValues({});
                        router.get(route('organization.plan-orders.index'), { page: 1 }, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    columns={usePlanOrdersConfig.table.columns.map((col) => ({
                        ...col,
                        label: translate(col.label),
                    }))}
                    actions={[]}
                    data={planOrders?.data || []}
                    from={planOrders?.from || 1}
                    onAction={() => {}}
                    permissions={permissions}
                    entityPermissions={usePlanOrdersConfig.entity.permissions}
                />

                <Pagination
                    from={planOrders?.from || 0}
                    to={planOrders?.to || 0}
                    total={planOrders?.total || 0}
                    links={planOrders?.links}
                    entityName={translate('plan orders')}
                    onPageChange={(url) => {
                        if (url) {
                            const urlObj = new URL(url, window.location.origin);
                            if (pageFilters.per_page) {
                                urlObj.searchParams.setranslate('per_page', pageFilters.per_page.toString());
                            }
                            router.get(urlObj.toString());
                        }
                    }}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        const params: any = { page: 1, per_page: parseInt(value) };

                        if (searchTerm) {
                            params.search = searchTerm;
                        }

                        Object.entries(filterValues).forEach(([key, val]) => {
                            if (val && val !== '') {
                                params[key] = val;
                            }
                        });

                        router.get(route('organization.plan-orders.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>
        </PageTemplate>
    );
}
