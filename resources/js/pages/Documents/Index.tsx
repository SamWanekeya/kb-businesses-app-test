import CrudDeleteModal from '@components/CrudDeleteModal';
import { CrudFormModal } from '@components/CrudFormModal';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Button } from '@components/UserInterface/Button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@components/UserInterface/DropdownMenu';
import Pagination from '@components/UserInterface/Pagination';
import SearchAndFilterBar from '@components/UserInterface/SearchAndFilterBar';
import { useBrand } from '@contexts/BrandContext';
import { THEME_COLORS } from '@hooks/use-appearance';
import { router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { Edit, Folder, FolderPlus, MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Documents() {
    const { t: translate } = useTranslation();
    const { themeColor, customColor } = useBrand();
    const color = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    const { auth, rootFolders = [], parentFolders = [], filters: pageFilters = {} } = usePage().props;
    const permissions = auth?.permissions || [];
    const flash = (usePage().props as any).flash || {};

    useEffect(() => {
        if (flash.error) toast.error(translate(flash.error));
    }, [flash.error]);

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isFolderDeleteModalOpen, setIsFolderDeleteModalOpen] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<any>(null);
    const [folderFormMode, setFolderFormMode] = useState<'create' | 'edit'>('create');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('documents.index'), { search: searchTerm || undefined, page: 1 }, { preserveState: true, preserveScroll: true });
    };

    const handleFolderFormSubmit = (formData: any) => {
        if (formData.parent_folder_id === 'null') formData.parent_folder_id = null;
        delete formData.status;
        if (folderFormMode === 'create') {
            toast.loading(translate('Creating folder...'));
            router.post(route('document-folders.store'), formData, {
                preserveState: false,
                onSuccess: (page) => {
                    setIsFolderModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                    if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(translate('Failed to create: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            });
        } else {
            toast.loading(translate('Updating folder...'));
            router.put(route('document-folders.update', currentFolder.id), formData, {
                preserveState: false,
                onSuccess: (page) => {
                    setIsFolderModalOpen(false);
                    toast.dismiss();
                    if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                    if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss();
                    toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            });
        }
    };

    const handleFolderDeleteConfirm = () => {
        toast.loading(translate('Deleting folder...'));
        router.delete(route('document-folders.destroy', currentFolder.id), {
            onSuccess: (page) => {
                setIsFolderDeleteModalOpen(false);
                toast.dismiss();
                if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
            },
            onError: (errors) => {
                toast.dismiss();
                toast.error(translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const pageActions: any[] = [];
    if (useHasPermission('create-document-folders')) {
        pageActions.push({
            label: translate('Create Folder'),
            icon: <FolderPlus className="mr-0 h-4 w-4 min-[790px]:mr-2" />,
            variant: 'default',
            className: 'h-8 w-8 min-[790px]:h-9 min-[790px]:w-auto px-0 min-[790px]:px-4',
            labelClassName: 'hidden min-[790px]:inline',
            tooltip: translate('Create Folder'),
            tooltipClassName: 'min-[790px]:hidden',
            onClick: () => {
                setCurrentFolder(null);
                setFolderFormMode('create');
                setIsFolderModalOpen(true);
            },
        });
    }

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Document Management') },
        { title: translate('Documents') },
    ];

    const folderFormFields = [
        { name: 'name', label: translate('Folder Name'), type: 'text', required: true, placeholder: translate('e.g. Contracts, HR Documents') },
        {
            name: 'parent_folder_id',
            label: translate('Parent Folder'),
            type: 'select',
            searchable: true,
            options: [
                { value: 'null', label: translate('Root Folder') },
                ...parentFolders.map((f: any) => ({ value: f.id, label: f.display_name || f.name })),
            ],
        },
        { name: 'description', label: translate('Description'), type: 'textarea', placeholder: translate('Enter folder description...') },
    ];

    const folders = rootFolders?.data || rootFolders || [];

    return (
        <PageTemplate
            title={translate('Documents')}
            description={translate('Manage your documents and organizing them into folders.')}
            url="/documents"
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            {/* Search bar */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    hasActiveFilters={() => false}
                    activeFilterCount={() => 0}
                    onResetFilters={() => {}}
                />
            </div>

            {/* Folders grid */}
            <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-900">
                <div className="p-4">
                    {folders.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {folders.map((folder: any) => (
                                <div key={folder.id} className="group relative h-full">
                                    <div
                                        className="flex h-full min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-4 pt-6 pb-5 transition-all duration-150 select-none dark:border-gray-700 dark:bg-gray-800"
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.borderColor = color;
                                            e.currentTarget.style.backgroundColor = `${color}14`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.borderColor = '';
                                            e.currentTarget.style.backgroundColor = '';
                                        }}
                                        onClick={() =>
                                            useHasPermission('view-documents')
                                                ? router.get(route('documents.folder', folder.id))
                                                : toast.error(translate('Permission denied.'))
                                        }
                                    >
                                        <Folder className="mb-3 h-14 w-14" style={{ color }} strokeWidth={1.8} />
                                        <span className="line-clamp-2 w-full text-center text-sm leading-snug text-gray-700 dark:text-gray-300">
                                            {folder.name}
                                        </span>
                                    </div>

                                    {/* Three-dot menu */}
                                    <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                                        {useHasPermission('edit-document-folders') || useHasPermission('delete-document-folders') ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="border-none bg-transparent p-0 text-gray-400 opacity-0 shadow-none transition-opacity group-hover:opacity-100 hover:bg-transparent hover:text-gray-700 dark:hover:text-gray-200"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="z-50 w-24">
                                                    {useHasPermission('edit-document-folders') && (
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setCurrentFolder(folder);
                                                                setFolderFormMode('edit');
                                                                setIsFolderModalOpen(true);
                                                            }}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            {translate('Edit')}
                                                        </DropdownMenuItem>
                                                    )}
                                                    {useHasPermission('edit-document-folders') && useHasPermission('delete-document-folders') && (
                                                        <DropdownMenuSeparator />
                                                    )}
                                                    {useHasPermission('delete-document-folders') && (
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => {
                                                                setCurrentFolder(folder);
                                                                setIsFolderDeleteModalOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            {translate('Delete')}
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="border-none bg-transparent p-0 text-gray-400 opacity-0 shadow-none transition-opacity group-hover:opacity-100 hover:bg-transparent hover:text-gray-700 dark:hover:text-gray-200"
                                                onClick={() => toast.error(translate('Permission denied.'))}
                                            >
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                <Folder className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="mb-1 text-base font-medium text-gray-900 dark:text-white">
                                {searchTerm ? translate('No folders match your search') : translate('No folders yet')}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {searchTerm
                                    ? translate('Try a different search term.')
                                    : translate('Create a folder to start organizing your documents.')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <Pagination
                    from={rootFolders?.from || 0}
                    to={rootFolders?.to || 0}
                    total={rootFolders?.total || 0}
                    links={rootFolders?.links || []}
                    entityName={translate('documents')}
                    onPageChange={(url) => router.get(url)}
                    perPageOptions={[24, 48, 96]}
                    currentPerPage={pageFilters.per_page?.toString() || '24'}
                    onPerPageChange={(value) => {
                        router.get(
                            route('documents.index'),
                            {
                                search: searchTerm || undefined,
                                page: 1,
                                ...(parseInt(value) !== 24 && { per_page: parseInt(value) }),
                            },
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                />
            </div>

            {/* Create/Edit Folder Modal */}
            <CrudFormModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                onSubmit={handleFolderFormSubmit}
                formConfig={{ fields: folderFormFields, modalSize: 'md' }}
                initialData={
                    currentFolder
                        ? {
                              ...currentFolder,
                              parent_folder_id: currentFolder.parent_folder_id ? String(currentFolder.parent_folder_id) : 'null',
                          }
                        : { parent_folder_id: 'null' }
                }
                title={folderFormMode === 'create' ? translate('Create Folder') : translate('Edit Folder')}
                mode={folderFormMode}
            />

            {/* Delete Folder Modal */}
            <CrudDeleteModal
                isOpen={isFolderDeleteModalOpen}
                onClose={() => setIsFolderDeleteModalOpen(false)}
                onConfirm={handleFolderDeleteConfirm}
                itemName={currentFolder?.name || ''}
                entityName={translate('folder')}
            />
        </PageTemplate>
    );
}
