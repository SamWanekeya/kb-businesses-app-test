// pages/users/index.tsx
import CrudDeleteModal from '@components/CrudDeleteModal';
import { CrudFormModal } from '@components/CrudFormModal';
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Button } from '@components/UserInterface/Button';
import { Card } from '@components/UserInterface/Card';
import { Dialog } from '@components/UserInterface/Dialog';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/UserInterface/Tooltip';
import useInitials from '@hooks/useInitials';
import { router, usePage } from '@inertiajs/react';
import ViewPopup from '@pages/users/view';
import { resolveImageUrl } from '@utils/Helpers/Url';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { Edit, Eye, History, KeyRound, Lock, Plus, Trash2, Unlock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Users() {
    const { t: translate } = useTranslation();
    const { auth, users, roles, planLimits, filters: pageFilters = {} } = usePage().props;
    const permissions = auth?.permissions || [];
    const getInitials = useInitials();

    // State
    const [activeView, setActiveView] = useState(['list', 'grid'].includes(pageFilters.view) ? pageFilters.view : 'list');
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedRole, setSelectedRole] = useState(pageFilters.role || 'all');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    // Check if any filters are active
    const hasActiveFilters = () => {
        return selectedRole !== 'all' || searchTerm !== '';
    };

    // Count active filters
    const activeFilterCount = () => {
        return selectedRole !== 'all' ? 1 : 0;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('users.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                role: selectedRole !== 'all' ? selectedRole : undefined,
                sort_field: pageFilters.sort_field || undefined,
                sort_direction: pageFilters.sort_direction || undefined,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(
            route('users.index'),
            {
                view: activeView,
                page: 1,
                search: searchTerm || undefined,
                role: selectedRole !== 'all' ? selectedRole : undefined,
                sort_field: field,
                sort_direction: direction,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);

        switch (action) {
            case 'view':
                setIsViewModalOpen(true);
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'reset-password':
                setIsResetPasswordModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(item);
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
        // Keep roles as single string value, not array
        if (formData.roles && Array.isArray(formData.roles)) {
            formData.roles = formData.roles[0];
        }

        if (formMode === 'create') {
            toast.loading(translate('Creating user...'));

            router.post(route('users.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(translate(page.props.flash.error));
                    } else if (page.props.flash.warning) {
                        toast.warning(translate(page.props.flash.warning));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to create user: ${Object.values(errors).join(', ')}`);
                    }
                },
            });
        } else if (formMode === 'edit') {
            toast.loading(translate('Updating user...'));

            router.put(route('users.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(translate(page.props.flash.error));
                    } else if (page.props.flash.warning) {
                        toast.warning(translate(page.props.flash.warning));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to update user: ${Object.values(errors).join(', ')}`);
                    }
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting user...'));

        router.delete(route('users.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(translate(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(translate(page.props.flash.error));
                } else if (page.props.flash.warning) {
                    toast.warning(translate(page.props.flash.warning));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(`Failed to delete user: ${Object.values(errors).join(', ')}`);
                }
            },
        });
    };

    const handleResetPasswordConfirm = (data: { password: string; password_confirmation: string }) => {
        toast.loading(translate('Resetting password...'));

        router.put(route('users.reset-password', currentItem.id), data, {
            onSuccess: (page) => {
                setIsResetPasswordModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(translate(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(translate(page.props.flash.error));
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

    const handleToggleStatus = (user: any) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        toast.loading(`${newStatus === 'active' ? translate('Activating') : translate('Deactivating')} user...`);

        router.put(
            route('users.toggle-status', user.id),
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(translate(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    if (typeof errors === 'string') {
                        toast.error(errors);
                    } else {
                        toast.error(`Failed to update user status: ${Object.values(errors).join(', ')}`);
                    }
                },
            },
        );
    };

    const pageInitialState = useState(true);
    useEffect(() => {
        if (pageInitialState[0]) {
            pageInitialState[1](false);
            return;
        }
        applyFilters();
    }, [searchTerm, selectedRole]);

    const handleResetFilters = () => {
        setSelectedRole('all');
        setSearchTerm('');
        router.get(route('users.index'), { view: activeView });
    };

    // Define page actions
    const pageActions = [];

    // Add User Logs button
    if (useHasPermission('manage-sign-in-history')) {
        pageActions.push({
            icon: <History className="mx-auto h-4 w-4" />,
            variant: 'outline',
            onClick: () => router.visit(route('sign-in-history.index')),
            tooltip: translate('Sign in History'),
        });
    }

    // Add the "Add New User" button if user has permission and within limits
    if (useHasPermission('create-users')) {
        const canCreate = !planLimits || planLimits.can_create;
        pageActions.push({
            label:
                planLimits && !canCreate
                    ? translate('User Limit Reached ({{current}}/{{max}})', { current: planLimits.current_users, max: planLimits.maximum_users })
                    : translate('Add User'),
            icon: <Plus className="mr-0 h-4 w-4 min-[300px]:mr-2" />,
            variant: canCreate ? 'default' : 'outline',
            className: 'h-8 w-8 min-[300px]:h-9 min-[300px]:w-auto px-0 min-[300px]:px-4',
            labelClassName: 'hidden min-[300px]:inline',
            tooltip: translate('Add User'),
            tooltipClassName: 'min-[300px]:hidden',
            onClick: canCreate
                ? () => handleAddNew()
                : () =>
                      toast.error(
                          translate('User limit exceeded. Your plan allows maximum {{max}} users. Please upgrade your plan.', {
                              max: planLimits.maximum_users,
                          }),
                      ),
            disabled: !canCreate,
        });
    }

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Staff'), href: route('users.index') },
        { title: translate('Users') },
    ];

    // Define table columns
    const columns = [
        {
            key: 'name',
            label: translate('Name'),
            sortable: true,
            render: (value: any, row: any) => {
                return (
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
                );
            },
        },
        {
            key: 'roles',
            label: translate('Roles'),
            render: (value: any) => {
                if (!value || !value.length) return <span className="text-muted-foreground">No roles assigned</span>;

                return value.map((role: any) => {
                    return (
                        <span
                            key={role.id}
                            className="mr-1 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset"
                        >
                            {role.label || role.name}
                        </span>
                    );
                });
            },
        },
        {
            key: 'created_at',
            label: translate('Joined'),
            sortable: true,
            type: 'date',
            // render: (value: string) => window.appSettings?.formatDateTime(value, false) || '-'
        },
    ];

    // Define table actions
    const actions = [
        {
            label: translate('Reset Password'),
            icon: 'KeyRound',
            action: 'reset-password',
            className: 'text-blue-500',
            requiredPermission: 'reset-password-users',
        },
        {
            label: translate('Toggle Status'),
            icon: 'Lock',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-users',
        },
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
    ];

    return (
        <PageTemplate
            title={translate('Users')}
            description={translate('Manage your users.')}
            url="/users"
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
                            name: 'role',
                            label: translate('Role'),
                            type: 'select',
                            value: selectedRole,
                            searchable: true,
                            onChange: setSelectedRole,
                            options: [
                                { value: 'all', label: translate('All Roles') },
                                ...(roles || []).map((role: any) => ({
                                    value: role.id.toString(),
                                    label: role.label || role.name,
                                })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={(view) => {
                        setActiveView(view);
                        router.get(route('users.index'), {
                            view,
                            page: 1,
                            search: searchTerm || undefined,
                            role: selectedRole !== 'all' ? selectedRole : undefined,
                            sort_field: pageFilters.sort_field || undefined,
                            sort_direction: pageFilters.sort_direction || undefined,
                            ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
                        });
                    }}
                />
            </div>

            {/* Content section */}
            {activeView === 'list' ? (
                <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={users?.data || []}
                        from={users?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-users',
                            create: 'create-users',
                            edit: 'edit-users',
                            delete: 'delete-users',
                        }}
                    />

                    {/* Pagination section */}
                    <Pagination
                        from={users?.from || 0}
                        to={users?.to || 0}
                        total={users?.total || 0}
                        links={users?.links}
                        entityName={translate('users')}
                        onPageChange={(url) => router.get(url)}
                        currentPerPage={pageFilters.per_page?.toString() || '10'}
                        onPerPageChange={(value) => {
                            router.get(
                                route('users.index'),
                                {
                                    view: activeView,
                                    page: 1,
                                    search: searchTerm || undefined,
                                    role: selectedRole !== 'all' ? selectedRole : undefined,
                                    sort_field: pageFilters.sort_field || undefined,
                                    sort_direction: pageFilters.sort_direction || undefined,
                                    ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                                },
                                { preserveState: true, preserveScroll: true },
                            );
                        }}
                    />
                </div>
            ) : (
                <div>
                    {/* Grid View */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {users?.data?.map((user: any) => (
                            <Card
                                key={user.id}
                                className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                            >
                                <div className="p-4">
                                    {/* Top: Avatar + Name + Email */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0">
                                            {user.avatar ? (
                                                <Avatar className="h-12 w-12 rounded-lg object-cover">
                                                    <AvatarImage
                                                        src={user.avatar}
                                                        alt={user?.name || 'Avatar'}
                                                        onError={(e) => {
                                                            // Fallback to default avatar on error
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = resolveImageUrl('avatars/avatar.png');
                                                        }}
                                                    />
                                                    <AvatarFallback className="text-lg">{user.name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                                                </Avatar>
                                            ) : null}
                                            <div
                                                className={`bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold ${
                                                    user.avatar ? 'hidden' : ''
                                                }`}
                                            >
                                                {getInitials(user.name)}
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="my-3 border-t border-gray-100 dark:border-gray-700" />

                                    {/* Bottom: Actions + Role badge */}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            {useHasPermission('view-users') && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAction('view', user)}
                                                            className="h-8 w-8 p-0 text-blue-500 hover:bg-transparent hover:text-blue-600 dark:hover:bg-transparent"
                                                        >
                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{translate('View')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                            {useHasPermission('edit-users') && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAction('edit', user)}
                                                            className="h-8 w-8 p-0 text-amber-500 hover:bg-transparent hover:text-amber-600 dark:hover:bg-transparent"
                                                        >
                                                            <Edit className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{translate('Edit')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                            {useHasPermission('reset-password-users') && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAction('reset-password', user)}
                                                            className="h-8 w-8 p-0 text-blue-500 hover:bg-transparent hover:text-blue-600 dark:hover:bg-transparent"
                                                        >
                                                            <KeyRound className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{translate('Reset Password')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                            {useHasPermission('toggle-status-users') && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAction('toggle-status', user)}
                                                            className="h-8 w-8 p-0 text-amber-500 hover:bg-transparent hover:text-amber-600 dark:hover:bg-transparent"
                                                        >
                                                            {user.status === 'active' ? (
                                                                <Lock className="h-4 w-4 text-gray-500" />
                                                            ) : (
                                                                <Unlock className="h-4 w-4 text-gray-500" />
                                                            )}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {user.status === 'active' ? translate('Disable User') : translate('Enable User')}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            {useHasPermission('delete-users') && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAction('delete', user)}
                                                            className="h-8 w-8 p-0 text-red-500 hover:bg-transparent hover:text-red-600 dark:hover:bg-transparent"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{translate('Delete')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>

                                        {/* Role badge */}
                                        <div>
                                            {user.roles && user.roles.length > 0 ? (
                                                <span className="bg-primary inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium text-white capitalize">
                                                    {user.roles[0].label || user.roles[0].name}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                                    {translate('No role')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        {(!users?.data || users.data.length === 0) && (
                            <div className="col-span-full py-16 text-center">
                                <div className="mx-auto mb-4 h-20 w-20 text-gray-300 dark:text-gray-600">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-full w-full">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{translate('No users found')}</h3>
                                <p className="mb-6 text-gray-500 dark:text-gray-400">{translate('Get started by creating your first user')}</p>
                                {useHasPermission('create-users') && (
                                    <Button onClick={handleAddNew}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        {translate('Add User')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="mt-6">
                        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                            <Pagination
                                from={users?.from || 0}
                                to={users?.to || 0}
                                total={users?.total || 0}
                                links={users?.links}
                                entityName={translate('users')}
                                onPageChange={(url) => router.get(url)}
                                perPageOptions={[12, 24, 48, 96]}
                                currentPerPage={pageFilters.per_page?.toString() || '12'}
                                onPerPageChange={(value) => {
                                    router.get(
                                        route('users.index'),
                                        {
                                            view: activeView,
                                            page: 1,
                                            search: searchTerm || undefined,
                                            role: selectedRole !== 'all' ? selectedRole : undefined,
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
                {currentItem && <ViewPopup record={currentItem} />}
            </Dialog>

            {/* Form Modal */}
            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        { name: 'name', label: translate('Name'), type: 'text', required: true, placeholder: translate('eg. John Smith') },
                        { name: 'email', label: translate('Email'), type: 'email', required: true, placeholder: translate('eg. john@kakbima.dev') },
                        {
                            name: 'password',
                            label: translate('Password'),
                            type: 'password',
                            placeholder: translate('Enter Password'),
                            required: true,
                            conditional: (mode) => mode === 'create',
                        },
                        {
                            name: 'password_confirmation',
                            label: translate('Confirm Password'),
                            type: 'password',
                            placeholder: translate('Confirm Password'),
                            required: true,
                            conditional: (mode) => mode === 'create',
                        },
                        {
                            name: 'roles',
                            label: translate('Role'),
                            type: 'select',
                            searchable: true,
                            options: roles
                                ? roles.map((role: any) => ({
                                      value: role.id.toString(),
                                      label: role.label || role.name,
                                  }))
                                : [],
                            required: true,
                            emptyNote:
                                !roles || roles.length === 0
                                    ? {
                                          link: route('roles.index'),
                                          linkText: translate('Roles'),
                                      }
                                    : undefined,
                        },
                    ],
                    modalSize: 'lg',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              roles: currentItem.roles && currentItem.roles.length > 0 ? currentItem.roles[0].id.toString() : '',
                          }
                        : null
                }
                title={formMode === 'create' ? translate('Add User') : translate('Edit User')}
                mode={formMode}
            />

            {/* Delete Modal */}
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName="user"
            />

            {/* Reset Password Modal */}
            <CrudFormModal
                isOpen={isResetPasswordModalOpen}
                onClose={() => setIsResetPasswordModalOpen(false)}
                onSubmit={handleResetPasswordConfirm}
                formConfig={{
                    fields: [
                        {
                            name: 'password',
                            label: translate('New Password'),
                            type: 'password',
                            required: true,
                            placeholder: translate('Enter New Password'),
                        },
                        {
                            name: 'password_confirmation',
                            label: translate('Confirm Password'),
                            type: 'password',
                            required: true,
                            placeholder: translate('Confirm New Password'),
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={{}}
                title={`Reset Password for ${currentItem?.name || 'User'}`}
                mode="edit"
            />
        </PageTemplate>
    );
}
