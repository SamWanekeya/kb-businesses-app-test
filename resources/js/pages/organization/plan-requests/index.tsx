import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { usePlanRequestsConfig } from '@config/Crud/PlanRequests';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function OrganizationPlanRequestsPage() {
    const { t: translate } = useTranslation();
    const { flash, planRequests, filters: pageFilters = {}, auth } = usePage().props;
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
        usePlanRequestsConfig.filters?.forEach((filter) => {
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

        router.get(route('organization.plan-requests.index'), params, { preserveState: true, preserveScroll: true });
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

        router.get(route('organization.plan-requests.index'), params, { preserveState: true, preserveScroll: true });
    };

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Plan Requests') }];

    const hasActiveFilters = () => {
        return (
            Object.entries(filterValues).some(([key, value]) => {
                return value && value !== '' && value !== 'all';
            }) || searchTerm !== ''
        );
    };

    return (
        <PageTemplate title={translate('Plan Requests')} url="/organization/plan-requests" breadcrumbs={breadcrumbs} noPadding>
            <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={
                        usePlanRequestsConfig.filters?.map((filter) => ({
                            name: filter.key,
                            label: translate(filter.label),
                            type: 'select',
                            value: filterValues[filter.key] || 'all',
                            onChange: (value) => handleFilterChange(filter.key, value),
                            options:
                                filter.options?.map((option) => ({
                                    value: option.value,
                                    label: translate(option.label),
                                })) || [],
                        })) || []
                    }
                    showFilters={showFilters}
                    setShowFilters={setShowFilters}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={() => {
                        return Object.values(filterValues).filter((v) => v && v !== '' && v !== 'all').length + (searchTerm ? 1 : 0);
                    }}
                    onResetFilters={() => {
                        setSearchTerm('');
                        setFilterValues({});
                        router.get(route('organization.plan-requests.index'), { page: 1 }, { preserveState: true, preserveScroll: true });
                    }}
                    onApplyFilters={applyFilters}
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

                        router.get(route('organization.plan-requests.index'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <CrudTable
                    columns={usePlanRequestsConfig.table.columns.map((col) => ({
                        ...col,
                        label: translate(col.label),
                    }))}
                    actions={[]}
                    data={planRequests?.data || []}
                    from={planRequests?.from || 1}
                    onAction={() => {}}
                    permissions={permissions}
                    entityPermissions={usePlanRequestsConfig.entity.permissions}
                />

                <Pagination
                    from={planRequests?.from || 0}
                    to={planRequests?.to || 0}
                    total={planRequests?.total || 0}
                    links={planRequests?.links}
                    entityName={translate('plan requests')}
                    onPageChange={(url) => router.get(url)}
                />
            </div>
        </PageTemplate>
    );
}
