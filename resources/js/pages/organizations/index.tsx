// pages/organizations/index.tsx
import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { CrudTable } from '@/components/CrudTable';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UpgradePlanModal } from '@/components/UpgradePlanModal';
import { useInitials } from '@/hooks/use-initials';
import { useHasPermission } from '@/utils/Permissions';
import { capitalize, getDisplayUrl } from '@/utils/helper';
import { router, usePage } from '@inertiajs/react';
import { ArrowUpRight, Calendar, CreditCard, Edit, History, Info, KeyRound, Lock, Plus, Trash2, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ViewPopup from '@pages/organizations/view';

export default function Organizations() {
    const { t } = useTranslation();
    const { auth, organizations, plans, filters: pageFilters = {} } = usePage().props;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    // State
    const [activeView, setActiveView] = useState(['list', 'grid'].includes(pageFilters.view) ? pageFilters.view : 'list');
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [startDate, setStartDate] = useState<Date | undefined>(pageFilters.start_date ? new Date(pageFilters.start_date) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(pageFilters.end_date ? new Date(pageFilters.end_date) : undefined);
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');

    // Modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [isUpgradePlanModalOpen, setIsUpgradePlanModalOpen] = useState(false);

    const [currentOrganization, setCurrentOrganization] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);

    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    const [pageInitialState, setPageInitialState] = useState(true);

    useEffect(() => {
        if (!pageInitialState) applyFilters();
        setPageInitialState(false);
    }, [selectedStatus, startDate, endDate, searchTerm]);

    // Check if any filters are active
    const hasActiveFilters = () => {
        return selectedStatus !== 'all' || searchTerm !== '' || startDate !== undefined || endDate !== undefined;
    };

    // Count active filters
    const activeFilterCount = () => {
        return (selectedStatus !== 'all' ? 1 : 0) + (searchTerm ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('organizations.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
                end_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
                ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
                ...(pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleStatusFilter = (value: string) => {
        setSelectedStatus(value);
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'desc' ? 'asc' : 'desc';

        router.get(
            route('organizations.index'),
            {
                view: activeView,
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
                end_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
                ...(pageFilters.per_page && pageFilters.per_page !== 10 && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, organization: any) => {
        setCurrentOrganization(organization);

        switch (action) {
            case 'sign-in-as':
                router.get(route('impersonate.start', organization.id));
                break;
            case 'organization-info':
                setIsViewModalOpen(true);
                break;
            case 'upgrade-plan':
                handleUpgradePlan(organization);
                break;

            case 'reset-password':
                setIsResetPasswordModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(organization);
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
        setCurrentOrganization(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (formMode === 'create') {
            toast.loading(t('Creating organization...'));

            router.post(route('organizations.store'), formData, {
                forceFormData: true,
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to create organization: ${Object.values(errors).join(', ')}`);
                    }
                },
            });
        } else if (formMode === 'edit') {
            toast.loading(t('Updating organization...'));

            router.put(route('organizations.update', currentOrganization.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to update organization: ${Object.values(errors).join(', ')}`);
                    }
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(t('Deleting organization...'));

        router.delete(route('organizations.destroy', currentOrganization.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(`Failed to delete organization: ${Object.values(errors).join(', ')}`);
                }
            },
        });
    };

    const handleResetPasswordConfirm = (data: { password: string }) => {
        toast.loading(t('Resetting password...'));

        router.put(route('organizations.reset-password', currentOrganization.id), data, {
            onSuccess: (page) => {
                setIsResetPasswordModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(t(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(`Failed to reset password: ${Object.values(errors).join(', ')}`);
                }
            },
        });
    };

    const handleToggleStatus = (organization: any) => {
        toast.loading(t('Updating status...'));

        router.put(
            route('organizations.toggle-status', organization.id),
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to update status: ${Object.values(errors).join(', ')}`);
                    }
                },
            },
        );
    };

    const handleResetFilters = () => {
        setSelectedStatus('all');
        setSearchTerm('');
        setStartDate(undefined);
        setEndDate(undefined);
        setShowFilters(false);

        router.get(
            route('organizations.index'),
            {
                view: activeView,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleUpgradePlan = (organization: any) => {
        setCurrentOrganization(organization);

        // Fetch available plans
        toast.loading(t('Loading plans...'));
        fetch(route('organizations.plans', organization.id))
            .then((res) => res.json())
            .then((data) => {
                setAvailablePlans(data.plans);
                setIsUpgradePlanModalOpen(true);
                toast.dismiss();
            })
            .catch((err) => {
                toast.dismiss();
                toast.error(t('Failed to load plans'));
            });
    };

    const handleUpgradePlanConfirm = (planId: number, duration: string) => {
        toast.loading(t('Upgrading plan...'));

        // Use Inertia router to handle the request
        router.put(
            route('organizations.upgrade-plan', currentOrganization.id),
            {
                plan_id: planId,
                duration: duration,
            },
            {
                onSuccess: (page) => {
                    setIsUpgradePlanModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(t(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(t(page.props.flash.error));
                    }
                    router.reload();
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to upgrade plan: ${Object.values(errors).join(', ')}`);
                    }
                },
            },
        );
    };

    // Define page actions
    const pageActions = [];

    // Add User Logs button for super_admin
    if (auth?.user?.type === 'super_admin' && useHasPermission('manage-sign-in-history')) {
        pageActions.push({
            icon: <History className="mx-auto h-4 w-4" />,
            variant: 'outline',
            onClick: () => router.visit(route('sign-in-history.index')),
            tooltip: t('Sign in History'),
        });
    }

    pageActions.push({
        label: t('Add Organization'),
        icon: <Plus className="mr-0 h-4 w-4 min-[480px]:mr-2" />,
        variant: 'default',
        onClick: () => handleAddNew(),
        className: 'h-8 w-8 min-[480px]:h-9 min-[480px]:w-auto px-0 min-[480px]:px-4',
        labelClassName: 'hidden min-[480px]:inline',
        tooltip: t('Add Organization'),
        tooltipClassName: 'min-[480px]:hidden',
    });

    const breadcrumbs = [{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Organizations') }];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: t('Name'),
            sortable: true,
            render: (value: any, row: any) => (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={row.avatar} />
                        <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-muted-foreground text-sm">{row.email}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'plan_name',
            label: t('Plan'),
            render: (value: string) => (
                <span
                    className={
                        'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset'
                    }
                >
                    {capitalize(value)}
                </span>
            ),
        },
        {
            key: 'created_at',
            label: t('Created At'),
            sortable: true,
            render: (value: string) => (
                <div className="flex items-center gap-1.5 whitespace-nowrap text-gray-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{window.appSettings?.formatDateTime(value, false) || '-'}</span>
                </div>
            ),
        },
    ];

    const actions = [
        {
            label: t('Sign in as Organization'),
            icon: 'ArrowUpRight',
            action: 'sign-in-as',
            className: 'text-blue-500',
        },
        {
            label: t('Organization Info'),
            icon: 'Info',
            action: 'organization-info',
            className: 'text-blue-500',
        },
        {
            label: t('Upgrade Plan'),
            icon: 'CreditCard',
            action: 'upgrade-plan',
            className: 'text-amber-500',
        },
        {
            label: t('Reset Password'),
            icon: 'KeyRound',
            action: 'reset-password',
            className: 'text-blue-500',
        },
        {
            label: t('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
        },
    ];

    return (
        <PageTemplate
            title={t('Organizations')}
            description={t('Manage and view all organizations in the system.')}
            url="/organizations"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'status',
                            label: t('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: handleStatusFilter,
                            options: [
                                { value: 'all', label: t('All Status') },
                                { value: 'active', label: t('Active') },
                                { value: 'inactive', label: t('Inactive') },
                            ],
                        },
                        {
                            name: 'start_date',
                            label: t('Start Date'),
                            type: 'date',
                            value: startDate,
                            onChange: (date) => setStartDate(date),
                        },
                        {
                            name: 'end_date',
                            label: t('End Date'),
                            type: 'date',
                            value: endDate,
                            onChange: (date) => setEndDate(date),
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}

                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={(view) => {
                        setActiveView(view);
                        router.get(
                            route('organizations.index'),
                            {
                                view,
                                page: pageFilters.page || 1,
                                search: searchTerm || undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
                                end_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
                                sort_field: pageFilters.sort_field || undefined,
                                sort_direction: pageFilters.sort_direction || undefined,
                                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
                            },
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                />
            </div>

            {/* Content section */}
            {activeView === 'list' ? (
                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={organizations?.data || []}
                        from={organizations?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-organizations',
                            create: 'create-organizations',
                            edit: 'edit-organizations',
                            delete: 'delete-organizations',
                        }}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={organizations?.from || 0}
                        to={organizations?.to || 0}
                        total={organizations?.total || 0}
                        links={organizations?.links}
                        entityName={t('organizations')}
                        onPageChange={(url) => router.get(url)}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            router.get(
                                route('organizations.index'),
                                {
                                    view: activeView,
                                    page: 1,
                                    per_page: parseInt(value) !== 10 ? parseInt(value) : undefined,
                                    search: searchTerm || undefined,
                                    status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                    start_date: startDate ? startDate.toISOString().split('T')[0] : undefined,
                                    end_date: endDate ? endDate.toISOString().split('T')[0] : undefined,
                                    ...(pageFilters.sort_field && { sort_field: pageFilters.sort_field, sort_direction: pageFilters.sort_direction }),
                                },
                                { preserveState: true, preserveScroll: true },
                            );
                        }}
                    />
                </div>
            ) : (
                <div>
                    {/* Grid View */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {organizations?.data?.map((organization: any) => (
                            <Card
                                key={organization.id}
                                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-900"
                            >
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4 z-10">
                                    <div
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                                            organization.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 ring-inset'
                                                : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'
                                        }`}
                                    >
                                        {organization.status === 'active' ? t('Active') : t('Inactive')}
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-6">
                                    {/* Organization Header */}
                                    <div className="mb-6 flex items-start space-x-4">
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 rounded-full object-cover shadow-sm">
                                                <AvatarImage
                                                    src={organization.avatar}
                                                    alt={organization?.name || 'Avatar'}
                                                    onError={(e) => {
                                                        // Fallback to default avatar on error
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = getDisplayUrl('avatars/avatar.png');
                                                    }}
                                                />
                                                <AvatarFallback className="text-lg">
                                                    {organization.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="max-w-80 min-w-0 flex-1">
                                            <h3 className="mr-10 mb-1 line-clamp-1 text-lg font-semibold text-gray-900 dark:text-white">
                                                {organization.name}
                                            </h3>
                                            <p className="line-clamp-1 text-sm text-gray-500 dark:text-gray-400">{organization.email}</p>
                                        </div>
                                    </div>

                                    {/* Plan Information */}
                                    <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <CreditCard className="text-primary mr-2 h-4 w-4" />
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">{organization.plan_name}</span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleAction('upgrade-plan', organization)}
                                                className="text-primary hover:text-primary hover:bg-primary/10 h-6 px-2 text-xs"
                                            >
                                                {t('Upgrade')}
                                            </Button>
                                        </div>
                                        {organization.plan_expiry_date && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {t('Expires')}:{' '}
                                                {window.appSettings?.formatDateTime(organization.plan_expiry_date, false) ||
                                                    new Date(organization.plan_expiry_date).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex space-x-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAction('sign-in-as', organization)}
                                                        className="h-8 w-8 p-0 text-blue-600 dark:hover:bg-blue-900/20"
                                                    >
                                                        <ArrowUpRight className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('Sign in as Organization')}</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAction('organization-info', organization)}
                                                        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-800"
                                                    >
                                                        <Info className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('Organization Info')}</TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleAction('edit', organization)}
                                                        className="h-8 w-8 p-0 text-amber-600 dark:hover:bg-amber-900/20"
                                                    >
                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>{t('Edit')}</TooltipContent>
                                            </Tooltip>
                                        </div>

                                        {/* More Actions Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <circle cx="12" cy="12" r="1"></circle>
                                                        <circle cx="12" cy="5" r="1"></circle>
                                                        <circle cx="12" cy="19" r="1"></circle>
                                                    </svg>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="z-50 w-48" sideOffset={5}>
                                                <DropdownMenuItem onClick={() => handleAction('reset-password', organization)}>
                                                    <KeyRound className="mr-2 h-4 w-4 text-gray-500" />
                                                    <span>{t('Reset Password')}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleAction('toggle-status', organization)}>
                                                    {organization.status === 'active' ? (
                                                        <Lock className="mr-2 h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <Unlock className="mr-2 h-4 w-4 text-gray-500" />
                                                    )}
                                                    <span>{organization.status === 'active' ? t('Disable Sign in') : t('Enable Sign in')}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleAction('delete', organization)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4 text-gray-500" />
                                                    <span>{t('Delete')}</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Hover Effect Overlay - REMOVED */}
                            </Card>
                        ))}

                        {(!organizations?.data || organizations.data.length === 0) && (
                            <div className="col-span-full">
                                <div className="py-12 text-center">
                                    <div className="mx-auto mb-4 h-24 w-24 text-gray-300 dark:text-gray-600">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{t('No organizations found')}</h3>
                                    <p className="mb-6 text-gray-500 dark:text-gray-400">{t('Get started by creating your first organization')}</p>
                                    <Button onClick={handleAddNew} className="inline-flex items-center">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('Add Organization')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pagination for grid view */}
                    <div className="mt-8">
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            <Pagination
                                from={organizations?.from || 0}
                                to={organizations?.to || 0}
                                total={organizations?.total || 0}
                                links={organizations?.links}
                                entityName={t('organizations')}
                                onPageChange={(url) => router.get(url)}
                                perPageOptions={[12, 24, 48, 96]}
                                currentPerPage={pageFilters.per_page?.toString() || '12'}
                                onPerPageChange={(value) => {
                                    router.get(
                                        route('organizations.index'),
                                        {
                                            view: activeView,
                                            page: 1,
                                            search: searchTerm || undefined,
                                            status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                            sort_field: pageFilters.sort_field || undefined,
                                            sort_direction: pageFilters.sort_direction || undefined,
                                            ...(parseInt(value) !== 12 && { per_page: parseInt(value) }),
                                        },
                                        { preserveState: true, preserveScroll: true },
                                    );
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                {currentOrganization && <ViewPopup record={currentOrganization} />}
            </Dialog>

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={(data) => {
                    // If sign_in_enabled is false, remove password field
                    if (data.sign_in_enabled === false) {
                        delete data.password;
                    }
                    // Set status based on sign_in_enabled
                    data.status = data.sign_in_enabled ? 'active' : 'inactive';

                    // Remove sign_in_enabled field as it's not needed in the backend
                    delete data.sign_in_enabled;
                    handleFormSubmit(data);
                }}
                formConfig={{
                    fields: [
                        { name: 'name', label: t('Organization Name'), type: 'text', placeholder: t('eg. Acme Corp'), required: true },
                        { name: 'email', label: t('Email'), type: 'email', placeholder: t('eg. admin@acmecorp.com'), required: true },
                        {
                            name: 'sign_in_enabled',
                            label: t('Enable Sign in'),
                            placeholder: '', // Empty placeholder to prevent duplicate label
                            type: 'switch',
                            defaultValue: true,
                            conditional: (mode) => mode !== 'edit',
                        },
                        {
                            name: 'password',
                            label: t('Password'),
                            type: 'password',
                            placeholder: t('Enter Password'),
                            required: (mode) => mode === 'create',
                            conditional: (mode, data) => {
                                return mode !== 'edit' && data?.sign_in_enabled === true;
                            },
                        },
                    ],
                    modalSize: 'lg',
                }}
                initialData={{
                    ...currentOrganization,
                    sign_in_enabled: currentOrganization?.status === 'active',
                }}
                title={formMode === 'create' ? t('Add Organization') : t('Edit Organization')}
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentOrganization?.name || ''}
                entityName="organization"
            />

            {/* Reset Password Modal */}
            <CrudFormModal
                isOpen={isResetPasswordModalOpen}
                onClose={() => setIsResetPasswordModalOpen(false)}
                onSubmit={handleResetPasswordConfirm}
                formConfig={{
                    fields: [{ name: 'password', label: t('New Password'), type: 'password', placeholder: t('Enter New Password'), required: true }],
                    modalSize: 'sm',
                }}
                initialData={{}}
                title={`Reset Password for ${currentOrganization?.name || 'Organization'}`}
                mode="edit"
            />

            {/* Upgrade Plan Modal */}
            <UpgradePlanModal
                isOpen={isUpgradePlanModalOpen}
                onClose={() => setIsUpgradePlanModalOpen(false)}
                onConfirm={handleUpgradePlanConfirm}
                plans={availablePlans}
                currentPlanId={currentOrganization?.plan_id}
                organizationName={currentOrganization?.name || ''}
            />
        </PageTemplate>
    );
}
