import CrudDeleteModal from '@components/CrudDeleteModal';
import { CrudFormModal } from '@components/CrudFormModal';
import { CrudTable } from '@components/CrudTable';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import UserInitials from '@components/UserInitials';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import useInitials from '@hooks/useInitials';
import { router, usePage } from '@inertiajs/react';
import { formatTitleCase } from '@utils/Helpers/StringFormatters';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { Calendar, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Calls() {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();
    const { auth, calls, users = [], allUsers = [], allContacts = [], allLeads = [], filters: pageFilters = {}, settings = {} } = usePage().props;

    const userMap: Record<number, any> = Object.fromEntries(allUsers.map((u: any) => [u.id, u]));
    const contactMap: Record<number, any> = Object.fromEntries(allContacts.map((c: any) => [c.id, c]));
    const leadMap: Record<number, any> = Object.fromEntries(allLeads.map((l: any) => [l.id, l]));

    const resolveAttendees = (call: any) =>
        (call.attendees || [])
            .map((a: any) => {
                if (a.attendee_type === 'user') {
                    const u = userMap[a.attendee_id];
                    return u ? { name: u.name, avatar: u.avatar, type: 'user' } : null;
                }
                if (a.attendee_type === 'contact') {
                    const c = contactMap[a.attendee_id];
                    return c ? { name: c.name, avatar: null, type: 'contact' } : null;
                }
                if (a.attendee_type === 'lead') {
                    const l = leadMap[a.attendee_id];
                    return l ? { name: l.name, avatar: null, type: 'lead' } : null;
                }
                return null;
            })
            .filter(Boolean);
    const permissions = auth?.permissions || [];
    const isGoogleCalendarSynced = settings?.googleCalendarEnabled === '1';

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [selectedAssignee, setSelectedAssignee] = useState(pageFilters.assigned_to || 'all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');

    const hasActiveFilters = () => searchTerm !== '' || selectedStatus !== 'all' || selectedAssignee !== 'all';
    const activeFilterCount = () => (searchTerm ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0) + (selectedAssignee !== 'all' ? 1 : 0);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(
            route('calls.index'),
            {
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
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
            route('calls.index'),
            {
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);
        switch (action) {
            case 'view':
                router.get(route('calls.show', item.id));
                break;
            case 'edit':
                setFormMode('edit');
                setIsFormModalOpen(true);
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                setIsStatusModalOpen(true);
                break;
        }
    };

    const handleAddNew = () => {
        setCurrentItem(null);
        setFormMode('create');
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (formData: any) => {
        if (formData.attendees && Array.isArray(formData.attendees)) {
            formData.attendees = formData.attendees.filter((attendee: any) => attendee.type && attendee.id && attendee.id !== '');
        }

        if (formData.parent_id) {
            formData.parent_id = String(formData.parent_id);
        }
        if (formData.assigned_to) {
            formData.assigned_to = String(formData.assigned_to);
        }

        if (formMode === 'create') {
            toast.loading(translate('Creating call...'));
            router.post(route('calls.store'), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) => {
                            const messageArray = Array.isArray(messages) ? messages : [messages];
                            return `${field}: ${messageArray.join(', ')}`;
                        })
                        .join('; ');
                    toast.error(errorMessages);
                },
            });
        } else if (formMode === 'edit') {
            toast.loading(translate('Updating call...'));
            router.put(route('calls.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    setIsFormModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    } else if (page.props.flash.error) {
                        toast.error(translate(page.props.flash.error));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    const errorMessages = Object.entries(errors)
                        .map(([field, messages]) => {
                            const messageArray = Array.isArray(messages) ? messages : [messages];
                            return `${field}: ${messageArray.join(', ')}`;
                        })
                        .join('; ');
                    toast.error(errorMessages);
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting call...'));
        router.delete(route('calls.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(translate(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(translate(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(translate('Failed to delete call: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleStatusChange = (formData: any) => {
        router.put(route('calls.toggle-status', currentItem.id), formData, {
            onSuccess: (page) => {
                setIsStatusModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(translate(page.props.flash.success));
                } else if (page.props.flash.error) {
                    toast.error(translate(page.props.flash.error));
                }
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(translate('Failed to update call status: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleToggleStatus = (call: any) => {
        const newStatus = call.status === 'planned' ? 'held' : 'planned';
        toast.loading(`${newStatus === 'held' ? translate('Marking as held') : translate('Marking as planned')} call...`);
        router.put(
            route('calls.toggle-status', call.id),
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss();
                    if (page.props.flash.success) {
                        toast.success(translate(page.props.flash.success));
                    }
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(translate('Failed to update call status: {{errors}}', { errors: Object.values(errors).join(', ') }));
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
    }, [searchTerm, selectedStatus, selectedAssignee]);

    const handleResetFilters = () => {
        router.get(route('calls.index'));
    };

    const pageActions = [];
    if (useHasPermission('create-calls')) {
        pageActions.push({
            label: translate('Add Call'),
            icon: <Plus className="mr-2 h-4 w-4" />,
            variant: 'default',
            onClick: () => handleAddNew(),
        });
    }

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Calls') }];

    const columns = [
        {
            key: 'title',
            label: translate('Title'),
            sortable: true,
            render: (value: string) => <div className="font-medium whitespace-nowrap">{value}</div>,
        },
        {
            key: 'assigned_user',
            label: translate('Assigned To'),
            className: 'whitespace-nowrap',
            render: (value: any) =>
                value ? (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={value.avatar} alt={value.name} />
                            <AvatarFallback className="text-xs">{getInitials(value.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium whitespace-nowrap">{value.name}</div>
                            <div className="text-muted-foreground text-sm whitespace-nowrap">{value.email}</div>
                        </div>
                    </div>
                ) : (
                    <span className="whitespace-nowrap">{translate('Unassigned')}</span>
                ),
        },
        {
            key: 'start_date',
            label: translate('Date & Time'),
            sortable: true,
            className: 'whitespace-nowrap',
            render: (value: string, row: any) => (
                <div className="flex flex-col gap-1 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        {window.appSettings?.formatDateTime(`${value.split('T')[0]}T${row.start_time}`, true) || '-'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                        {window.appSettings?.formatDateTime(`${row.end_date.split('T')[0]}T${row.end_time}`, true) || '-'}
                    </span>
                </div>
            ),
        },

        {
            key: 'parent_module',
            label: translate('Related To'),
            className: 'whitespace-nowrap',
            render: (value: string, row: any) =>
                value ? (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium whitespace-nowrap text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                        {formatTitleCase(value)}
                    </span>
                ) : (
                    <span className="whitespace-nowrap">-</span>
                ),
        },
        {
            key: 'attendees',
            label: translate('Attendees'),
            render: (_: any, row: any) => {
                const att = resolveAttendees(row);
                const visible = att.slice(0, 3);
                const extra = att.length - 3;
                return visible.length > 0 ? (
                    <div className="flex items-center -space-x-0">
                        {visible.map((a: any, i: number) => (
                            <TooltipProvider key={i}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="cursor-pointer">
                                            {a.type === 'user' ? (
                                                <Avatar className="h-6 w-6 ring-2 ring-white dark:ring-gray-900">
                                                    <AvatarImage src={a.avatar} alt={a.name} />
                                                    <AvatarFallback className="text-[10px]">{getInitials(a.name)}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="h-6 w-6 [&_[data-slot=avatar-fallback]]:text-[9px] [&_[data-slot=avatar]]:h-6 [&_[data-slot=avatar]]:w-6">
                                                    <UserInitials name={a.name} />
                                                </div>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>{a.name}</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                        {extra > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-700 ring-2 ring-white dark:bg-gray-600 dark:text-gray-200 dark:ring-gray-900">
                                            +{extra}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="flex flex-col gap-0.5">
                                            {att.slice(3).map((a: any, i: number) => (
                                                <span key={i}>{a.name}</span>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                );
            },
        },
        {
            key: 'status',
            label: translate('Status'),
            className: 'whitespace-nowrap',
            render: (value: string) => {
                const getStatusColor = (status: string) => {
                    switch (status) {
                        case 'planned':
                            return 'bg-blue-50 text-blue-700 ring-blue-600/20';
                        case 'held':
                            return 'bg-green-50 text-green-700 ring-green-600/20';
                        case 'not_held':
                            return 'bg-red-50 text-red-700 ring-red-600/20';
                        default:
                            return 'bg-gray-50 text-gray-700 ring-gray-600/20';
                    }
                };
                const getStatusLabel = (status: string) => {
                    switch (status) {
                        case 'planned':
                            return translate('Planned');
                        case 'held':
                            return translate('Held');
                        case 'not_held':
                            return translate('Not Held');
                        default:
                            return status;
                    }
                };
                return (
                    <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${getStatusColor(value)}`}
                    >
                        {getStatusLabel(value)}
                    </span>
                );
            },
        },
        // {
        //     key: 'created_at',
        //     label: translate('Created At'),
        //     sortable: true,
        //     className: 'whitespace-nowrap',
        //     type: 'date'
        // }
    ];

    const actions = [
        {
            label: translate('Change Status'),
            icon: 'RefreshCw',
            action: 'toggle-status',
            className: 'text-amber-500',
            requiredPermission: 'toggle-status-calls',
        },
        {
            label: translate('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-calls',
        },
        {
            label: translate('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-calls',
        },
        {
            label: translate('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-calls',
        },
    ];

    return (
        <PageTemplate
            title={translate('Calls')}
            description={translate('Manage your calls.')}
            url="/calls"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            value: selectedStatus,
                            onChange: setSelectedStatus,
                            options: [
                                { value: 'all', label: translate('All Status') },
                                { value: 'planned', label: translate('Planned') },
                                { value: 'held', label: translate('Held') },
                                { value: 'not_held', label: translate('Not Held') },
                            ],
                        },
                        {
                            name: 'assigned_to',
                            label: translate('Assigned To'),
                            type: 'select',
                            searchable: true,
                            value: selectedAssignee,
                            onChange: setSelectedAssignee,
                            options: [
                                { value: 'all', label: translate('All Users') },
                                { value: 'unassigned', label: translate('Unassigned') },
                                ...allUsers.map((user: any) => ({
                                    value: user.id.toString(),
                                    label: user.name,
                                })),
                            ],
                        },
                    ]}
                    hasActiveFilters={hasActiveFilters}
                    activeFilterCount={activeFilterCount}
                    onResetFilters={handleResetFilters}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <CrudTable
                        columns={columns}
                        actions={actions}
                        data={calls?.data || []}
                        from={calls?.from || 1}
                        onAction={handleAction}
                        sortField={pageFilters.sort_field}
                        sortDirection={pageFilters.sort_direction}
                        onSort={handleSort}
                        permissions={permissions}
                        entityPermissions={{
                            view: 'view-calls',
                            create: 'create-calls',
                            edit: 'edit-calls',
                            delete: 'delete-calls',
                        }}
                    />
                </div>

                <Pagination
                    from={calls?.from || 0}
                    to={calls?.to || 0}
                    total={calls?.total || 0}
                    links={calls?.links}
                    entityName={translate('calls')}
                    onPageChange={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('calls.index'),
                            {
                                page: 1,
                                search: searchTerm || undefined,
                                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                                assigned_to: selectedAssignee !== 'all' ? selectedAssignee : undefined,
                                sort_field: pageFilters.sort_field || undefined,
                                sort_direction: pageFilters.sort_direction || undefined,
                                ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                            },
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                />
            </div>

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        {
                            name: 'title',
                            label: translate('Call Title'),
                            type: 'text' as const,
                            required: true,
                            placeholder: translate('e.g. Follow-up Call, Sales Discovery, Support Call'),
                        },
                        {
                            name: 'description',
                            label: translate('Description'),
                            type: 'textarea' as const,
                            placeholder: translate('Enter call description or agenda...'),
                        },
                        { name: 'start_date', label: translate('Start Date'), type: 'date' as const, required: true },
                        { name: 'end_date', label: translate('End Date'), type: 'date' as const, required: true },
                        { name: 'start_time', label: translate('Start Time'), type: 'time' as const, required: true },
                        { name: 'end_time', label: translate('End Time'), type: 'time' as const, required: true },
                        {
                            name: 'parent_module',
                            label: translate('Related To'),
                            type: 'select' as const,
                            required: true,
                            options: [
                                { value: 'lead', label: translate('Lead') },
                                { value: 'account', label: translate('Account') },
                                { value: 'contact', label: translate('Contact') },
                                { value: 'opportunity', label: translate('Opportunity') },
                                { value: 'case', label: translate('Case') },
                                { value: 'project', label: translate('Project') },
                            ],
                        },
                        {
                            name: 'parent_id',
                            label: translate('Select Record'),
                            type: 'select' as const,
                            required: true,
                            searchable: true,
                            options: [],
                            placeholder: translate('Select Record'),
                            emptyNote: (formData: any) => {
                                const parentModule = formData.parent_module;
                                if (!parentModule || parentModule === 'none') return null;
                                const routes: Record<string, string> = {
                                    lead: route('leads.index'),
                                    account: route('accounts.index'),
                                    contact: route('contacts.index'),
                                    opportunity: route('opportunities.index'),
                                    case: route('cases.index'),
                                    project: route('projects.index'),
                                };
                                const labels: Record<string, string> = {
                                    lead: translate('Leads'),
                                    account: translate('Accounts'),
                                    contact: translate('Contacts'),
                                    opportunity: translate('Opportunities'),
                                    case: translate('Cases'),
                                    project: translate('Projects'),
                                };
                                return { link: routes[parentModule], linkText: labels[parentModule] };
                            },
                            conditional: (mode: string, formData: any) => {
                                const parentModule = formData.parent_module;
                                return parentModule && parentModule !== 'none';
                            },
                        },
                        {
                            name: 'attendees',
                            label: translate('Attendees'),
                            type: 'array' as const,
                            required: true,
                            fields: [
                                {
                                    name: 'type',
                                    label: translate('Type'),
                                    type: 'select' as const,
                                    required: true,
                                    options: [
                                        { value: 'user', label: translate('User') },
                                        { value: 'contact', label: translate('Contact') },
                                        { value: 'lead', label: translate('Lead') },
                                    ],
                                },
                                {
                                    name: 'id',
                                    label: translate('Select Person'),
                                    type: 'select' as const,
                                    required: true,
                                    searchable: true,
                                    options: [],
                                    emptyNote: (formData: any, arrayIndex?: number) => {
                                        if (arrayIndex === undefined) return null;
                                        const attendees = formData.attendees || [];
                                        const attendeeType = attendees[arrayIndex]?.type;
                                        if (!attendeeType) return null;
                                        const routes: Record<string, string> = {
                                            user: route('users.index'),
                                            contact: route('contacts.index'),
                                            lead: route('leads.index'),
                                        };
                                        const labels: Record<string, string> = {
                                            user: translate('Users'),
                                            contact: translate('Contacts'),
                                            lead: translate('Leads'),
                                        };
                                        return { link: routes[attendeeType], linkText: labels[attendeeType] };
                                    },
                                },
                            ],
                        },
                        {
                            name: 'assigned_to',
                            label: translate('Assign To'),
                            type: 'select' as const,
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('users.index'), linkText: translate('Users') },
                            options: [...users.map((user: any) => ({ value: user.id, label: `${user.name} (${user.email})` }))],
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select' as const,
                            options: [
                                { value: 'planned', label: translate('Planned') },
                                { value: 'held', label: translate('Held') },
                                { value: 'not_held', label: translate('Not Held') },
                            ],
                            defaultValue: 'planned',
                        },
                        ...(isGoogleCalendarSynced
                            ? [
                                  {
                                      name: 'sync_with_google_calendar',
                                      label: translate('Sync with Google Calendar'),
                                      type: 'switch' as const,
                                      defaultValue: false,
                                      conditional: (mode: string) => mode === 'create',
                                  },
                              ]
                            : []),
                    ],
                    modalSize: 'xl',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              attendees:
                                  currentItem.attendees?.map((attendee: any) => ({
                                      type: attendee.attendee_type,
                                      id: attendee.attendee_id,
                                  })) || [],
                          }
                        : {}
                }
                title={formMode === 'create' ? translate('Add Call') : formMode === 'edit' ? translate('Edit Call') : translate('View Call')}
                mode={formMode}
            />

            {/* Status Modal */}
            <CrudFormModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onSubmit={handleStatusChange}
                formConfig={{
                    fields: [
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            required: true,
                            options: [
                                { value: 'planned', label: translate('Planned') },
                                { value: 'held', label: translate('Held') },
                                { value: 'not_held', label: translate('Not Held') },
                            ],
                        },
                    ],
                    modalSize: 'sm',
                }}
                initialData={currentItem ? { status: currentItem.status } : null}
                title={translate('Change Call Status')}
                mode="edit"
            />

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.title || ''}
                entityName={translate('call')}
            />
        </PageTemplate>
    );
}
