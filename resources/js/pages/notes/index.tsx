import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { CrudFormModal } from '@/components/CrudFormModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useHasPermission } from '@/utils/Permissions';
import { router, usePage } from '@inertiajs/react';
import { Calendar, Edit, Eye, MoreHorizontal, NotebookPen, Plus, Share2, Trash2, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ViewPopup from '@pages/notes/view';
export default function Notes() {
    const { t } = useTranslation();
    const {
        auth,
        myNotes,
        sharedNotes,
        totalPersonalNotes = 0,
        totalSharedNotes = 0,
        users = [],
        allUsers = [],
        filters: pageFilters = {},
    } = usePage().props as any;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedCreator, setSelectedCreator] = useState(pageFilters.created_by || 'all');
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [activeView, setActiveView] = useState(pageFilters.view || 'grid');

    const applyFilters = (e?: React.FormEvent) => {
        e?.preventDefault();
        router.get(
            route('notes.index'),
            {
                view: activeView,
                search: searchTerm || undefined,
                created_by: selectedCreator !== 'all' ? selectedCreator : undefined,
                page: 1,
                sort_field: pageFilters.sort_field || undefined,
                sort_direction: pageFilters.sort_direction || undefined,
                ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const hasActiveFilters = () => {
        return searchTerm !== '' || selectedCreator !== 'all';
    };

    const activeFilterCount = () => {
        return (searchTerm ? 1 : 0) + (selectedCreator !== 'all' ? 1 : 0);
    };

    const pageInitialState = useState(true);
    useEffect(() => {
        if (pageInitialState[0]) {
            pageInitialState[1](false);
            return;
        }
        applyFilters();
    }, [searchTerm, selectedCreator]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedCreator('all');
        router.get(route('notes.index'), { view: activeView });
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);
        if (action === 'edit') {
            setFormMode('edit');
            setIsFormModalOpen(true);
        } else if (action === 'delete') {
            setIsDeleteModalOpen(true);
        } else if (action === 'view') {
            setIsViewModalOpen(true);
        }
    };

    const handleFormSubmit = (formData: any) => {
        const routeName = formMode === 'create' ? 'notes.store' : 'notes.update';
        const method = formMode === 'create' ? 'post' : 'put';

        router[method](route(routeName, formMode === 'edit' ? currentItem.id : undefined), formData, {
            onSuccess: () => {
                setIsFormModalOpen(false);
                toast.success(t(formMode === 'create' ? 'Note created successfully.' : 'Note updated successfully.'));
            },
            onError: () => toast.error(t('Failed to save note.')),
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('notes.destroy', currentItem.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                toast.success(t('Note deleted successfully.'));
            },
            onError: () => toast.error(t('Failed to delete note.')),
        });
    };

    const columns = [
        { key: 'title', label: t('Title'), sortable: true },
        { key: 'creator', label: t('Created By'), render: (value: any) => value?.name || '-' },
        {
            key: 'shared_users',
            label: t('Shared With'),
            render: (value: any[]) => (value?.length ? `${value.length} users` : t('Not shared')),
        },
        { key: 'created_at', label: t('Created At'), sortable: true, render: (value: string) => new Date(value).toLocaleDateString() },
    ];

    const actions = [
        {
            label: t('View'),
            icon: 'Eye',
            action: 'view',
            className: 'text-blue-500',
            requiredPermission: 'view-notes',
        },
        {
            label: t('Edit'),
            icon: 'Edit',
            action: 'edit',
            className: 'text-amber-500',
            requiredPermission: 'edit-notes',
            condition: (item: any) => item.created_by === auth.user.id,
        },
        {
            label: t('Delete'),
            icon: 'Trash2',
            action: 'delete',
            className: 'text-red-500',
            requiredPermission: 'delete-notes',
            condition: (item: any) => item.created_by === auth.user.id,
        },
    ];

    const myNotesData = myNotes?.data || [];
    const sharedNotesData = sharedNotes?.data || [];

    return (
        <PageTemplate
            title={t('Notes')}
            description={t('Manage your personal and shared notes')}
            actions={
                useHasPermission('create-notes')
                    ? [
                          {
                              label: t('Add Note'),
                              variant: 'default',
                              icon: <Plus className="mr-0 h-4 w-4 min-[360px]:mr-2" />,
                              className: 'h-8 w-8 min-[360px]:h-9 min-[360px]:w-auto px-0 min-[360px]:px-4',
                              labelClassName: 'hidden min-[360px]:inline',
                              tooltip: t('Add Note'),
                              tooltipClassName: 'min-[360px]:hidden',
                              onClick: () => {
                                  setCurrentItem(null);
                                  setFormMode('create');
                                  setIsFormModalOpen(true);
                              },
                          },
                      ]
                    : []
            }
            noPadding
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Notes') }]}
        >
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{t('Total Notes')}</p>
                            <p className="text-2xl font-bold">{totalPersonalNotes + totalSharedNotes}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                            <NotebookPen className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{t('Personal Notes')}</p>
                            <p className="text-2xl font-bold">{totalPersonalNotes}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">{t('Shared Notes')}</p>
                            <p className="text-2xl font-bold">{totalSharedNotes}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                            <Share2 className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </Card>
            </div>
            <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={applyFilters}
                    filters={[
                        {
                            name: 'created_by',
                            label: t('Created By'),
                            type: 'select' as const,
                            searchable: true,
                            value: selectedCreator,
                            onChange: setSelectedCreator,
                            options: [
                                { value: 'all', label: t('All Users') },
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
                    {...(activeView !== 'kanban' && {
                        currentPerPage: pageFilters.per_page?.toString() || '10',
                        onPerPageChange: (value: string) => {
                            router.get(
                                route('notes.index'),
                                {
                                    view: activeView,
                                    page: 1,
                                    search: searchTerm || undefined,
                                    created_by: selectedCreator !== 'all' ? selectedCreator : undefined,
                                    sort_field: pageFilters.sort_field || undefined,
                                    sort_direction: pageFilters.sort_direction || undefined,
                                    ...(parseInt(value) !== 10 && { per_page: parseInt(value) }),
                                },
                                { preserveState: true, preserveScroll: true },
                            );
                        },
                    })}
                    showViewToggle={true}
                    activeView={activeView}
                    onViewChange={(view) => {
                        setActiveView(view);
                        router.get(route('notes.index'), {
                            view,
                            page: pageFilters.page || undefined,
                            search: searchTerm || undefined,
                            created_by: selectedCreator !== 'all' ? selectedCreator : undefined,
                            sort_field: pageFilters.sort_field || undefined,
                            sort_direction: pageFilters.sort_direction || undefined,
                            ...(parseInt(pageFilters.per_page) !== 10 && pageFilters.per_page && { per_page: pageFilters.per_page }),
                        });
                    }}
                    viewOptions={[
                        { value: 'grid', label: t('Grid'), icon: 'Grid3X3' },
                        { value: 'kanban', label: t('Kanban'), icon: 'Columns' },
                    ]}
                />
            </div>

            {activeView === 'kanban' ? (
                <div className="h-[calc(100vh-380px)] md:h-[calc(100vh-320px)]">
                    <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex h-full flex-col overflow-hidden rounded-lg bg-gray-100 p-3 md:p-4 dark:bg-gray-900">
                            <h3 className="mb-3 flex flex-shrink-0 items-center gap-2 text-sm font-semibold md:mb-4 md:text-base">
                                <Users className="h-4 w-4 md:h-5 md:w-5" />
                                {t('Personal Notes')} ({myNotesData.length})
                            </h3>
                            <div className="flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 space-y-2 overflow-y-auto pr-1 md:pr-2">
                                {myNotesData.map((note: any) => (
                                    <Card key={note.id} className="bg-white p-3 hover:shadow-md md:p-4">
                                        <div className="mb-2 flex items-start justify-between">
                                            <h4 className="flex-1 cursor-pointer truncate text-sm font-medium md:text-base">{note.title}</h4>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 flex-shrink-0 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {useHasPermission('view-notes') && (
                                                        <DropdownMenuItem onClick={() => handleAction('view', note)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t('View')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('edit-notes') && note.created_by === auth.user.id && (
                                                        <DropdownMenuItem onClick={() => handleAction('edit', note)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            {t('Edit')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('delete-notes') && note.created_by === auth.user.id && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleAction('delete', note)} className="text-red-600">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                {t('Delete')}
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div
                                            className="line-clamp-2 h-[40px] cursor-pointer overflow-hidden text-sm md:line-clamp-3 md:h-[60px]"
                                            dangerouslySetInnerHTML={{ __html: note.content || t('No content') }}
                                        />
                                    </Card>
                                ))}
                                {myNotesData.length === 0 && (
                                    <p className="py-6 text-center text-sm text-gray-400 md:py-8 md:text-base">{t('No notes yet')}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex h-full flex-col overflow-hidden rounded-lg bg-gray-100 p-3 md:p-4 dark:bg-gray-900">
                            <h3 className="mb-3 flex flex-shrink-0 items-center gap-2 text-sm font-semibold md:mb-4 md:text-base">
                                <Share2 className="h-4 w-4 md:h-5 md:w-5" />
                                {t('Shared Notes')} ({sharedNotesData.length})
                            </h3>
                            <div className="flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 space-y-2 overflow-y-auto pr-1 md:pr-2">
                                {sharedNotesData.map((note: any) => (
                                    <Card key={note.id} className="cursor-pointer bg-white p-3 hover:shadow-md md:p-4">
                                        <div className="mb-2 flex items-start justify-between">
                                            <h4 className="flex-1 cursor-pointer truncate text-sm font-medium md:text-base">{note.title}</h4>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 flex-shrink-0 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {useHasPermission('view-notes') && (
                                                        <DropdownMenuItem onClick={() => handleAction('view', note)}>
                                                            <Eye className="mr-2 h-4 w-4 text-gray-500" />
                                                            {t('View')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('edit-notes') && note.created_by === auth.user.id && (
                                                        <DropdownMenuItem onClick={() => handleAction('edit', note)}>
                                                            <Edit className="mr-2 h-4 w-4 text-gray-500" />
                                                            {t('Edit')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('delete-notes') && note.created_by === auth.user.id && (
                                                        <>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleAction('delete', note)} className="text-red-600">
                                                                <Trash2 className="mr-2 h-4 w-4 text-gray-500" />
                                                                {t('Delete')}
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div
                                            className="line-clamp-2 h-[40px] overflow-hidden text-sm md:line-clamp-3 md:h-[60px]"
                                            dangerouslySetInnerHTML={{ __html: note.content || t('No content') }}
                                        />
                                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                                            <Users className="h-3 w-3" />
                                            <span>
                                                {t('By')} {note.creator?.name}
                                            </span>
                                        </div>
                                    </Card>
                                ))}
                                {sharedNotesData.length === 0 && (
                                    <p className="py-6 text-center text-sm text-gray-400 md:py-8 md:text-base">{t('No shared notes')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="mb-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Users className="h-5 w-5" />
                            {t('Personal Notes')} <span className="text-gray-500">({myNotesData.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {myNotesData.map((note: any) => (
                                <Card
                                    key={note.id}
                                    className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="p-4">
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <h3 className="truncate font-semibold text-gray-900">{note.title}</h3>
                                            </div>
                                            <User className="text-primary ml-2 h-4 w-4 flex-shrink-0" />
                                        </div>
                                        <p className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                                            <span>
                                                {t('By')} {note.creator?.name}
                                            </span>

                                            {note.created_at ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 text-gray-500" />
                                                    {window.appSettings?.formatDateTime(note.created_at, false) ||
                                                        new Date(note.created_at).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </p>
                                        <div
                                            className="mb-4 line-clamp-2 h-[40px] overflow-hidden text-sm text-gray-600"
                                            dangerouslySetInnerHTML={{ __html: note.content || t('No content') }}
                                        />
                                        <div className="flex justify-end gap-1 border-t pt-3">
                                            {useHasPermission('view-notes') && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('view', note)}
                                                            className="h-8 w-8 text-blue-500 hover:text-blue-700"
                                                        >
                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('View')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                            {useHasPermission('edit-notes') && note.created_by === auth.user.id && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('edit', note)}
                                                            className="h-8 w-8 text-amber-500 hover:text-amber-700"
                                                        >
                                                            <Edit className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Edit')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                            {useHasPermission('delete-notes') && note.created_by === auth.user.id && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('delete', note)}
                                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Delete')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Share2 className="h-5 w-5" />
                            {t('Shared Notes')} <span className="text-gray-500">({sharedNotesData.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                            {sharedNotesData.map((note: any) => (
                                <Card
                                    key={note.id}
                                    className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="p-4">
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                                <h3 className="truncate font-semibold text-gray-900">{note.title}</h3>
                                            </div>
                                            <Share2 className="text-primary ml-2 h-4 w-4 flex-shrink-0" />
                                        </div>
                                        <p className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                                            <span>
                                                {t('By')} {note.creator?.name}
                                            </span>

                                            {note.created_at ? (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4 text-gray-500" />
                                                    {window.appSettings?.formatDateTime(note.created_at, false) ||
                                                        new Date(note.created_at).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span>-</span>
                                            )}
                                        </p>
                                        <div
                                            className="mb-4 line-clamp-2 h-[40px] overflow-hidden text-sm text-gray-600"
                                            dangerouslySetInnerHTML={{ __html: note.content || t('No content') }}
                                        />
                                        <div className="flex justify-end gap-1 border-t pt-3">
                                            {useHasPermission('view-notes') && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('view', note)}
                                                            className="h-8 w-8 text-blue-500 hover:text-blue-700"
                                                        >
                                                            <Eye className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('View')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                            {useHasPermission('edit-notes') && note.created_by === auth.user.id && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('edit', note)}
                                                            className="h-8 w-8 text-amber-500 hover:text-amber-700"
                                                        >
                                                            <Edit className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Edit')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                            {useHasPermission('delete-notes') && note.created_by === auth.user.id && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleAction('delete', note)}
                                                            className="h-8 w-8 text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-gray-500" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{t('Delete')}</TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
                        <Pagination
                            from={myNotes?.from || 1}
                            to={myNotes?.to || 0}
                            total={myNotes?.total || 0}
                            links={myNotes?.links}
                            entityName={t('notes')}
                            onPageChange={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
                        />
                    </div>
                </div>
            )}

            <CrudFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSubmit={handleFormSubmit}
                formConfig={{
                    fields: [
                        {
                            name: 'title',
                            label: t('Title'),
                            type: 'text',
                            required: true,
                            placeholder: t('e.g. Meeting Notes, Project Ideas, Follow-up Tasks'),
                        },
                        {
                            name: 'content',
                            label: t('Content'),
                            type: 'rich-textbox',
                            required: true,
                            colSpan: 12,
                        },
                        {
                            name: 'shared_users',
                            label: t('Share With'),
                            type: 'multi-select',
                            options: users.filter((u: any) => u.id !== auth.user.id).map((u: any) => ({ value: u.id, label: u.name })),
                            row: 2,
                        },
                    ],
                    modalSize: '2xl',
                }}
                initialData={
                    currentItem
                        ? {
                              ...currentItem,
                              shared_users: currentItem.shared_users?.map((u: any) => u.id) || [],
                              shared_users_names: currentItem.shared_users?.map((u: any) => u.name).join(', ') || t('-'),
                          }
                        : null
                }
                title={formMode === 'create' ? t('Add Note') : t('Edit Note')}
                mode={formMode}
            />

            {/* View Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                {currentItem && <ViewPopup record={currentItem} />}
            </Dialog>

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.title || ''}
                entityName={t('note')}
            />
        </PageTemplate>
    );
}
