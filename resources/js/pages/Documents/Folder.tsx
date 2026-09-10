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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { useBrand } from '@contexts/BrandContext';
import { THEME_COLORS } from '@hooks/use-appearance';
import { router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import * as LucidIcons from 'lucide-react';
import {
    ArrowLeft,
    Download,
    Edit,
    File,
    FileArchive,
    FileAudio,
    FileCode,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Folder,
    FolderPlus,
    MoreHorizontal,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function DocumentFolderView() {
    const { t: translate } = useTranslation();
    const {
        auth,
        folder,
        documents = [],
        users = [],
        accounts = [],
        folders = [],
        types = [],
        opportunities = [],
        parentFolders = [],
    } = usePage().props;
    const permissions = auth?.permissions || [];
    const { themeColor, customColor } = useBrand();
    const resolvedThemeColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS] || '#10b77f';

    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isDocDeleteModalOpen, setIsDocDeleteModalOpen] = useState(false);
    const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
    const [isFolderDeleteModalOpen, setIsFolderDeleteModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState<any>(null);
    const [currentSubFolder, setCurrentSubFolder] = useState<any>(null);
    const [docFormMode, setDocFormMode] = useState<'create' | 'edit'>('create');
    const [folderFormMode, setFolderFormMode] = useState<'create' | 'edit'>('create');

    const handleDocFormSubmit = (formData: any) => {
        ['account_id', 'folder_id', 'type_id', 'opportunity_id', 'assigned_to'].forEach((field) => {
            if (formData[field] === 'null') formData[field] = null;
        });
        if (!formData.folder_id) formData.folder_id = folder.id;
        if (docFormMode === 'create') {
            const toastId = toast.loading(translate('Creating document...'));
            router.post(route('documents.store'), formData, {
                preserveState: false,
                onSuccess: (page) => {
                    setIsDocModalOpen(false);
                    toast.dismiss(toastId);
                    if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                    if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    toast.error(translate('Failed to create: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            });
        } else {
            const toastId = toast.loading(translate('Updating document...'));
            router.put(route('documents.update', currentDoc.id), formData, {
                preserveState: false,
                onSuccess: (page) => {
                    setIsDocModalOpen(false);
                    toast.dismiss(toastId);
                    if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                    if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            });
        }
    };

    const handleDocDeleteConfirm = () => {
        const toastId = toast.loading(translate('Deleting document...'));
        router.delete(route('documents.destroy', currentDoc.id), {
            onSuccess: (page) => {
                setIsDocDeleteModalOpen(false);
                toast.dismiss(toastId);
                if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                toast.error(translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const handleDocToggleStatus = (doc: any) => {
        router.put(
            route('documents.toggle-status', doc.id),
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss(toastId);
                    if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                    if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    toast.error(translate('Failed to update status: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            },
        );
    };

    const handleFolderFormSubmit = (formData: any) => {
        if (formData.parent_folder_id === 'null') formData.parent_folder_id = null;
        if (folderFormMode === 'create') {
            const toastId = toast.loading(translate('Creating folder...'));
            router.post(route('document-folders.store'), formData, {
                preserveState: false,
                onSuccess: (page) => {
                    setIsFolderModalOpen(false);
                    toast.dismiss(toastId);
                    if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                    if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    toast.error(translate('Failed to create: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            });
        } else {
            const toastId = toast.loading(translate('Updating folder...'));
            router.put(route('document-folders.update', currentSubFolder.id), formData, {
                preserveState: false,
                onSuccess: (page) => {
                    setIsFolderModalOpen(false);
                    toast.dismiss(toastId);
                    if (page.props.flash.success_title) toast.success(translate(page.props.flash.success_title));
                    if (page.props.flash.success) toast.success(translate(page.props.flash.success));
                    else if (page.props.flash.error) toast.error(translate(page.props.flash.error));
                },
                onError: (errors) => {
                    toast.dismiss(toastId);
                    toast.error(translate('Failed to update: {{errors}}', { errors: Object.values(errors).join(', ') }));
                },
            });
        }
    };

    const handleFolderDeleteConfirm = () => {
        const toastId = toast.loading(translate('Deleting folder...'));
        const deletingCurrentFolder = currentSubFolder?.id === folder.id;
        router.delete(route('document-folders.destroy', currentSubFolder.id), {
            onSuccess: (page) => {
                setIsFolderDeleteModalOpen(false);
                toast.dismiss(toastId);
                const f = page.props.flash as any;
                if (f?.success_title) toast.success(t(f.success_title));
                else if (f?.success) toast.success(t(f.success));
                else if (f?.error) toast.error(t(f.error));
                if (deletingCurrentFolder) {
                    folder.parent_folder?.id ? router.get(route('documents.folder', folder.parent_folder.id)) : router.get(route('documents.index'));
                }
            },
            onError: (errors) => {
                toast.dismiss(toastId);
                toast.error(translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
            },
        });
    };

    const pageActions: any[] = [
        {
            label: translate('Back'),
            icon: <ArrowLeft className="mr-2 h-4 w-4" />,
            variant: 'outline',
            onClick: () =>
                folder.parent_folder?.id ? router.get(route('documents.folder', folder.parent_folder.id)) : router.get(route('documents.index')),
        },
    ];
    if (useHasPermission('create-document-folders')) {
        pageActions.push({
            label: translate('Create Folder'),
            icon: <FolderPlus className="mr-0 h-4 w-4 min-[1020px]:mr-2" />,
            variant: 'outline',
            className: 'h-8 w-8 min-[1020px]:h-9 min-[1020px]:w-auto px-0 min-[1020px]:px-4',
            labelClassName: 'hidden min-[1020px]:inline',
            tooltip: translate('Create Folder'),
            tooltipClassName: 'min-[1020px]:hidden',
            onClick: () => {
                setCurrentSubFolder(null);
                setFolderFormMode('create');
                setIsFolderModalOpen(true);
            },
        });
    }
    if (useHasPermission('create-documents')) {
        pageActions.push({
            label: translate('Upload Document'),
            icon: <Plus className="mr-0 h-4 w-4 min-[1020px]:mr-2" />,
            variant: 'default',
            className: 'h-8 w-8 min-[1020px]:h-9 min-[1020px]:w-auto px-0 min-[1020px]:px-4',
            labelClassName: 'hidden min-[1020px]:inline',
            tooltip: translate('Upload Document'),
            tooltipClassName: 'min-[1020px]:hidden',
            onClick: () => {
                setCurrentDoc(null);
                setDocFormMode('create');
                setIsDocModalOpen(true);
            },
        });
    }

    const breadcrumbs: any[] = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Document Management') },
        { title: translate('Documents'), href: route('documents.index') },
    ];
    if (folder.parent_folder) {
        breadcrumbs.push({ title: folder.parent_folder.name, href: route('documents.folder', folder.parent_folder.id) });
    }
    breadcrumbs.push({ title: folder.name });

    const folderFields = [
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

    const getExt = (url: string) => (url || '').split('?')[0].split('.').pop()?.toLowerCase() || '';
    const isImageExt = (ext: string) => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);

    const getDocIcon = (doc: any) => {
        const ext = getExt(doc.attachment_url || doc.name || '');
        if (isImageExt(ext)) return <FileImage className="text-primary h-14 w-14" strokeWidth={1.2} />;
        if (ext === 'pdf') return <FileText className="h-14 w-14 text-red-500" strokeWidth={1.2} />;
        if (ext === 'doc' || ext === 'docx') return <FileText className="h-14 w-14 text-blue-500" strokeWidth={1.2} />;
        if (['xls', 'xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="h-14 w-14 text-green-500" strokeWidth={1.2} />;
        if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return <FileVideo className="h-14 w-14 text-pink-500" strokeWidth={1.2} />;
        if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return <FileAudio className="h-14 w-14 text-yellow-500" strokeWidth={1.2} />;
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <FileArchive className="h-14 w-14 text-orange-500" strokeWidth={1.2} />;
        if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'php', 'py'].includes(ext))
            return <FileCode className="h-14 w-14 text-cyan-500" strokeWidth={1.2} />;
        return <File className="h-14 w-14 text-gray-400" strokeWidth={1.2} />;
    };

    const getDocHoverClasses = (doc: any) => {
        const ext = getExt(doc.attachment_url || doc.name || '');
        if (isImageExt(ext)) return null; // handled via inline style
        const map: Record<string, string> = {
            pdf: 'hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10',
            doc: 'hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10',
            docx: 'hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10',
            xls: 'hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10',
            xlsx: 'hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/10',
            csv: 'hover:border-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/10',
            zip: 'hover:border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/10',
            rar: 'hover:border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/10',
            json: 'hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10',
            xml: 'hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10',
            txt: 'hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
        };
        return map[ext] || 'hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800';
    };

    const getImageDocHoverHandlers = () => ({
        onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
            e.currentTarget.style.borderColor = resolvedThemeColor;
            e.currentTarget.style.backgroundColor = resolvedThemeColor + '1a';
        },
        onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.backgroundColor = '';
        },
    });

    const subFolders = folder.sub_folders?.data || folder.sub_folders || [];
    const docsList = documents?.data || documents || [];
    const docsPagination = documents?.links ? documents : null;
    const total = (docsPagination?.total || docsList.length) + subFolders.length;

    return (
        <PageTemplate
            title={folder.name}
            description={translate('Manage your documents and folders.')}
            url={`/documents/folder/${folder.id}`}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            {/* Outer container */}
            <div className="-mt-2 space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                {/* (1) Folder Header Card */}
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <div className="bg-primary h-1.5 w-full" />
                    <div className="flex items-center gap-3 px-4 py-3">
                        <div className="bg-primary/10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl">
                            <Folder className="text-primary h-7 w-7" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white">{folder.name}</h1>
                            <p className="text-xs text-gray-400">
                                {subFolders.length + docsList.length} {translate('items')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* (2) + (3) Two-column layout */}
                {/* <div className="flex gap-4 items-start"> */}
                <div className="grid grid-cols-1 items-start gap-5 pr-5 lg:grid-cols-[70%_30%]">
                    {/* (2) Grid of folders + documents */}
                    <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className="p-3">
                            <div
                                className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5"
                                style={{ minHeight: '422px', maxHeight: '422px', overflowY: 'auto', gridAutoRows: '135px' }}
                            >
                                {subFolders.length === 0 && docsList.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center gap-3" style={{ minHeight: '390px' }}>
                                        <Folder className="h-16 w-16 text-gray-300 dark:text-gray-600" strokeWidth={1} />
                                        <p className="text-base font-semibold text-gray-500 dark:text-gray-400">
                                            {translate('This folder is empty')}
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500">{translate('No subfolders or documents found')}</p>
                                    </div>
                                )}
                                {subFolders.map((sf: any) => (
                                    <div key={`folder-${sf.id}`} className="group relative h-full">
                                        <div
                                            className="hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 flex h-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-4 pt-6 pb-5 transition-all duration-150 select-none dark:border-gray-700 dark:bg-gray-800"
                                            onClick={() =>
                                                useHasPermission('view-documents')
                                                    ? router.get(route('documents.folder', sf.id))
                                                    : toast.error(translate('Permission denied.'))
                                            }
                                        >
                                            <Folder className="text-primary mb-3 h-14 w-14" strokeWidth={1.8} />
                                            <span className="line-clamp-1 w-full px-1 text-center text-sm leading-snug text-gray-700 dark:text-gray-300">
                                                {sf.name}
                                            </span>
                                        </div>
                                        <div className="absolute top-1.5 right-1.5" onClick={(e) => e.stopPropagation()}>
                                            {useHasPermission('edit-document-folders') || useHasPermission('delete-document-folders') ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="border-none bg-transparent p-0 text-gray-400 opacity-0 shadow-none transition-opacity group-hover:opacity-100 hover:bg-transparent hover:text-gray-700"
                                                        >
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="z-50 w-28">
                                                        {useHasPermission('edit-document-folders') && (
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setCurrentSubFolder(sf);
                                                                    setFolderFormMode('edit');
                                                                    setIsFolderModalOpen(true);
                                                                }}
                                                            >
                                                                <Edit className="mr-2 h-4 w-4 text-gray-500" />
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
                                                                    setCurrentSubFolder(sf);
                                                                    setIsFolderDeleteModalOpen(true);
                                                                }}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4 text-gray-500" />
                                                                {translate('Delete')}
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="border-none bg-transparent p-0 text-gray-400 opacity-0 shadow-none transition-opacity group-hover:opacity-100 hover:bg-transparent hover:text-gray-700"
                                                    onClick={() => toast.error(translate('Permission denied.'))}
                                                >
                                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {docsList.map((doc: any, docIdx: number) => {
                                    const isExpired = doc.expiration_date && new Date(doc.expiration_date) < new Date();
                                    const isFirst = docIdx === 0 && subFolders.length === 0;
                                    const isImage = isImageExt(getExt(doc.attachment_url || doc.name || ''));
                                    return (
                                        <div key={`doc-${doc.id}`} className="group relative">
                                            <div
                                                className={`flex h-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-4 pt-6 pb-5 transition-all duration-150 select-none dark:border-gray-700 dark:bg-gray-800 ${getDocHoverClasses(doc) ?? ''}`}
                                                onClick={() =>
                                                    useHasPermission('view-documents')
                                                        ? router.get(route('documents.show', doc.id))
                                                        : toast.error(translate('Permission denied.'))
                                                }
                                                {...(isImage ? getImageDocHoverHandlers() : {})}
                                            >
                                                <div className="mb-3 flex items-center justify-center">{getDocIcon(doc)}</div>
                                                <span className="w-full truncate px-1 text-center text-sm leading-snug text-gray-700 dark:text-gray-300">
                                                    {doc.name}
                                                </span>
                                            </div>
                                            <div className="absolute top-1.5 right-1.5" onClick={(e) => e.stopPropagation()}>
                                                {useHasPermission('view-documents') ||
                                                useHasPermission('edit-documents') ||
                                                useHasPermission('delete-documents') ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="border-none bg-transparent p-0 text-gray-400 opacity-0 shadow-none transition-opacity group-hover:opacity-100 hover:bg-transparent hover:text-gray-700"
                                                            >
                                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="z-50 w-28">
                                                            {useHasPermission('view-documents') && doc.attachment_url && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        const l = document.createElementranslate('a');
                                                                        l.href = route('documents.download', doc.id);
                                                                        l.download = '';
                                                                        document.body.appendChild(l);
                                                                        l.click();
                                                                        document.body.removeChild(l);
                                                                    }}
                                                                >
                                                                    <Download className="mr-2 h-4 w-4 text-gray-500" />
                                                                    {translate('Download')}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {useHasPermission('edit-documents') && (
                                                                <DropdownMenuItem
                                                                    onClick={() => {
                                                                        setCurrentDoc(doc);
                                                                        setDocFormMode('edit');
                                                                        setIsDocModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="mr-2 h-4 w-4 text-gray-500" />
                                                                    {translate('Edit')}
                                                                </DropdownMenuItem>
                                                            )}
                                                            {(useHasPermission('view-documents') || useHasPermission('edit-documents')) &&
                                                                useHasPermission('delete-documents') && <DropdownMenuSeparator />}
                                                            {useHasPermission('delete-documents') && (
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => {
                                                                        setCurrentDoc(doc);
                                                                        setIsDocDeleteModalOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4 text-gray-500" />
                                                                    {translate('Delete')}
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="border-none bg-transparent p-0 text-gray-400 opacity-0 shadow-none transition-opacity group-hover:opacity-100 hover:bg-transparent hover:text-gray-700"
                                                        onClick={() => toast.error(translate('Permission denied.'))}
                                                    >
                                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {docsPagination?.links && docsPagination.links.length > 3 && (
                            <Pagination
                                from={docsPagination.from || 0}
                                to={docsPagination.to || 0}
                                total={total}
                                links={docsPagination.links}
                                entityName={translate('items')}
                                onPageChange={(url) => router.get(url)}
                            />
                        )}
                    </div>

                    {/* Right — Folder Details panel */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
                                <Folder className="text-grey h-4 w-4" strokeWidth={1.5} />
                                {translate('Folder Details')}
                            </div>
                            <div className="flex items-center gap-1.5">
                                {useHasPermission('edit-document-folders') && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-500 transition-colors"
                                                    onClick={() => {
                                                        setCurrentSubFolder(folder);
                                                        setFolderFormMode('edit');
                                                        setIsFolderModalOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>{translate('Edit')}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                {useHasPermission('delete-document-folders') && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition-colors"
                                                    onClick={() => {
                                                        setCurrentSubFolder(folder);
                                                        setIsFolderDeleteModalOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>{translate('Delete')}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>
                        {/* Rows */}
                        <div>
                            <PanelRow label={translate('Name')} value={folder.name} />
                            <PanelRow
                                label={translate('Parent Folder')}
                                value={folder.parent_folder ? folder.parent_folder.name : translate('Root Folder')}
                            />
                            <PanelRow
                                label={translate('Created')}
                                value={
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                        {folder.created_at && <LucidIcons.Calendar className="h-4 w-4 text-gray-500" />}
                                        <span>
                                            {folder.created_at
                                                ? window.appSettings?.formatDateTime(folder.created_at, false) ||
                                                  new Date(folder.created_at).toLocaleDateString()
                                                : '-'}
                                        </span>
                                    </div>
                                }
                            />
                        </div>
                        {folder.description && (
                            <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                                <p className="mb-1 text-sm font-bold text-gray-800 dark:text-gray-100">{translate('Description')}</p>
                                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-500 dark:text-gray-400">
                                    {folder.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Document Modal */}
            <CrudFormModal
                isOpen={isDocModalOpen}
                onClose={() => setIsDocModalOpen(false)}
                onSubmit={handleDocFormSubmit}
                formConfig={{
                    fields: [
                        {
                            name: 'name',
                            label: translate('Document Name'),
                            type: 'text',
                            required: true,
                            placeholder: translate('e.g. Q1 Sales Contract'),
                        },
                        {
                            name: 'account_id',
                            label: translate('Account'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('accounts.index'), linkText: translate('Accounts') },
                            options: accounts.map((a: any) => ({ value: a.id, label: a.name })),
                        },
                        {
                            name: 'folder_id',
                            label: translate('Folder'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('documents.index'), linkText: translate('Document Folders') },
                            options: folders.map((f: any) => ({ value: f.id, label: f.name })),
                        },
                        {
                            name: 'type_id',
                            label: translate('Type'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('document-types.index'), linkText: translate('Document Types') },
                            options: types.map((type: any) => ({ value: type.id, label: type.type_name })),
                        },
                        {
                            name: 'opportunity_id',
                            label: translate('Opportunity'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('opportunities.index'), linkText: translate('Opportunities') },
                            options: opportunities.map((o: any) => ({ value: o.id, label: o.name })),
                        },
                        { name: 'publish_date', label: translate('Publish Date'), type: 'date' },
                        { name: 'expiration_date', label: translate('Expiration Date'), type: 'date' },
                        {
                            name: 'attachment',
                            label: translate('Attachment'),
                            required: true,
                            type: 'media-picker',
                            returnType: 'id',
                            placeholder: translate('Select file...'),
                        },
                        {
                            name: 'assigned_to',
                            label: translate('Assign To'),
                            type: 'select',
                            required: true,
                            searchable: true,
                            emptyNote: { link: route('users.index'), linkText: translate('Users') },
                            options: users.map((u: any) => ({ value: u.id, label: `${u.name} (${u.email})` })),
                        },
                        {
                            name: 'description',
                            label: translate('Description'),
                            type: 'textarea',
                            placeholder: translate('Enter document description...'),
                        },
                        {
                            name: 'status',
                            label: translate('Status'),
                            type: 'select',
                            options: [
                                { value: 'active', label: translate('Active') },
                                { value: 'inactive', label: translate('Inactive') },
                            ],
                            defaultValue: 'active',
                        },
                    ],
                    modalSize: 'xl',
                }}
                initialData={
                    currentDoc
                        ? {
                              name: currentDoc.name || '',
                              account_id: currentDoc.account_id ? String(currentDoc.account_id) : 'null',
                              folder_id: currentDoc.folder_id ? String(currentDoc.folder_id) : String(folder.id),
                              type_id: currentDoc.type_id ? String(currentDoc.type_id) : 'null',
                              opportunity_id: currentDoc.opportunity_id ? String(currentDoc.opportunity_id) : 'null',
                              publish_date: currentDoc.publish_date || '',
                              expiration_date: currentDoc.expiration_date || '',
                              attachment: currentDoc.attachment || '',
                              assigned_to: currentDoc.assigned_to ? String(currentDoc.assigned_to) : 'null',
                              description: currentDoc.description || '',
                              status: currentDoc.status || 'active',
                          }
                        : { folder_id: folder.id, status: 'active' }
                }
                title={docFormMode === 'create' ? translate('Upload Document') : translate('Edit Document')}
                mode={docFormMode}
            />

            <CrudFormModal
                isOpen={isFolderModalOpen}
                onClose={() => setIsFolderModalOpen(false)}
                onSubmit={handleFolderFormSubmit}
                formConfig={{ fields: folderFields, modalSize: 'md' }}
                initialData={
                    folderFormMode === 'create'
                        ? {
                              name: '',
                              parent_folder_id: String(folder.id),
                          }
                        : {
                              ...currentSubFolder,
                              parent_folder_id: currentSubFolder?.parent_folder_id ? String(currentSubFolder.parent_folder_id) : 'null',
                          }
                }
                title={folderFormMode === 'create' ? translate('Create Folder') : translate('Edit Folder')}
                mode={folderFormMode}
            />

            <CrudDeleteModal
                isOpen={isDocDeleteModalOpen}
                onClose={() => setIsDocDeleteModalOpen(false)}
                onConfirm={handleDocDeleteConfirm}
                itemName={currentDoc?.name || ''}
                entityName={translate('document')}
            />
            <CrudDeleteModal
                isOpen={isFolderDeleteModalOpen}
                onClose={() => setIsFolderDeleteModalOpen(false)}
                onConfirm={handleFolderDeleteConfirm}
                itemName={currentSubFolder?.name || folder.name}
                entityName={translate('folder')}
            />
        </PageTemplate>
    );
}

function PanelRow({ label, value, badge = false, badgeColor = 'blue' }: { label: string; value?: string; badge?: boolean; badgeColor?: string }) {
    if (!value) return null;
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300',
        green: 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-300',
        red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/30 dark:text-red-300',
    };
    return (
        <div className="flex items-center justify-between px-4 py-2.5">
            <p className="mr-3 shrink-0 text-sm font-bold text-gray-700 dark:text-gray-300">{label}</p>
            {badge ? (
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${colors[badgeColor] || colors.blue}`}>
                    {value}
                </span>
            ) : (
                <p className="text-right text-sm text-gray-600 dark:text-gray-400">{value}</p>
            )}
        </div>
    );
}
