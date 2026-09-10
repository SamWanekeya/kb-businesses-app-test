import CrudDeleteModal from '@components/CrudDeleteModal';
import { toast } from '@components/CustomToast';
import PageTemplate from '@components/PageTemplate';
import { Badge } from '@components/UserInterface/Badge';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent } from '@components/UserInterface/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { Input } from '@components/UserInterface/Input';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useHasPermission } from '@utils/Permissions';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Copy,
    Download,
    Eye,
    File,
    FileText,
    HardDrive,
    Image,
    Image as ImageIcon,
    Plus,
    Search,
    Upload,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MediaItem {
    id: number;
    name: string;
    file_name: string;
    url: string;
    thumb_url: string;
    size: number;
    mime_type: string;
    created_at: string;
}

export default function MediaLibraryDemo() {
    const { t: translate } = useTranslation();
    const { csrf_token, storageSettings, auth, planLimits } = usePage().props;
    const permissions = auth?.permissions || [];

    const allowedTypes = storageSettings?.allowed_file_types || 'jpg,png,webp,gif';
    const acceptAttribute = allowedTypes
        .split(',')
        .map((type) => `.${type.trim()}`)
        .join(',');
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [filteredMedia, setFilteredMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [selectedMediaInfo, setSelectedMediaInfo] = useState<MediaItem | null>(null);
    // Check if ChatGPT modal is open
    const [isChatGptOpen, setIsChatGptOpen] = useState(false);
    useEffect(() => {
        const checkChatGpt = () => {
            const chatGptModal =
                document.querySelector('[data-chatgpt-modal]') ||
                document.querySelector('.chatgpt-modal') ||
                document.querySelector('[class*="chatgpt"]') ||
                document.querySelector('[id*="chatgpt"]');
            setIsChatGptOpen(!!chatGptModal);
        };

        const observer = new MutationObserver(checkChatGpt);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    const itemsPerPage = 12;

    const fetchMedia = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(route('api.media.index'), {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMedia(data);
            setFilteredMedia(data);
        } catch (error) {
            toast.error('Failed to load media');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    useEffect(() => {
        const filtered = media.filter(
            (item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.file_name.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        setFilteredMedia(filtered);
        setCurrentPage(1);
    }, [searchTerm, media]);

    const handleFileUpload = async (files: FileList) => {
        setUploading(true);

        const allowedExtensions = allowedTypes.split(',').map((type) => type.trim().toLowerCase());

        const validFiles = Array.from(files).filter((file) => {
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
                toast.error(`${file.name} - File type not allowed. Allowed types: ${allowedTypes}`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) {
            setUploading(false);
            return;
        }

        const formData = new FormData();
        validFiles.forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            const response = await fetch(route('api.media.batch'), {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': csrf_token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const result = await response.json();

            if (response.ok) {
                setMedia((prev) => [...result.data, ...prev]);
                toast.success(result.message);

                // Show individual errors if any
                if (result.errors && result.errors.length > 0) {
                    result.errors.forEach((error: string) => {
                        toast.error(error);
                    });
                }
            } else {
                // Handle demo mode and other errors
                if (response.status === 403) {
                    toast.error(result.message);
                } else if (result.errors && result.errors.length > 0) {
                    result.errors.forEach((error: string) => {
                        toast.error(error);
                    });
                } else {
                    toast.error(result.message || 'Failed to upload files');
                }
            }
        } catch (error) {
            toast.error('Error uploading files');
        }

        setUploading(false);
        setIsUploadModalOpen(false);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    const deleteMedia = async () => {
        try {
            const id = selectedMediaInfo?.id;
            if (!id) {
                return;
            }
            const response = await fetch(route('api.media.destroy', id), {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': csrf_token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const result = await response.json();
            setIsDeleteModalOpen(false);
            setInfoModalOpen(false);

            if (response.ok) {
                setMedia((prev) => prev.filter((item) => item.id !== id));
                toast.success(result.message || 'Media deleted successfully');
            } else {
                // Handle demo mode and other errors
                if (response.status === 403 && result.demo_mode) {
                    toast.error(result.message);
                } else {
                    toast.error(result.message || 'Failed to delete media');
                }
            }
        } catch (error) {
            setIsDeleteModalOpen(false);
            setInfoModalOpen(false);
            toast.error('Error deleting media');
        }
    };

    const handleCopyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        toast.success('Image URL copied to clipboard');
    };

    const handleDownload = async (id: number, filename: string) => {
        try {
            // Find the media item to get its URL
            const mediaItem = media.find((item) => item.id === id);
            if (!mediaItem) {
                toast.error('File not found');
                return;
            }

            const response = await fetch(mediaItem.url);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElementranslate('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success('Download started');
            } else {
                toast.error('File not available for download');
            }
        } catch (error) {
            toast.error('Error downloading file');
        }
    };

    const handleShowInfo = (item: MediaItem) => {
        if (!useHasPermission('view-media')) return;
        setSelectedMediaInfo(item);
        setInfoModalOpen(true);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return window.appSettings?.formatDateTime(dateString);
    };

    const getFileIcon = (mimeType: string, fileName: string = '') => {
        if (
            mimeType.startsWith('image/') ||
            mimeType.startsWith('video/') ||
            mimeType.startsWith('audio/') ||
            fileName.toLowerCase().endsWith('.mp3')
        ) {
            return null; // Show actual image/video/audio
        }
        if (mimeType === 'application/pdf' || mimeType.includes('pdf')) {
            return (
                <div className="flex flex-col items-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                        <FileText className="h-8 w-8 text-red-600" />
                    </div>
                    <span className="text-xs font-medium text-red-600">PDF</span>
                </div>
            );
        }
        if (mimeType.includes('word') || mimeType.includes('document')) {
            return (
                <div className="flex flex-col items-center">
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                        <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-blue-600">DOC</span>
                </div>
            );
        }
        if (mimeType === 'text/csv' || mimeType.includes('spreadsheet')) {
            return <FileText className="h-12 w-12 text-green-500" />;
        }
        return <File className="h-12 w-12 text-gray-500" />;
    };
    const getFileTypeLabel = (mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return mimeType.split('/')[1].toUpperCase();
        }
        if (mimeType.startsWith('video/')) {
            return mimeType.split('/')[1].toUpperCase();
        }
        if (mimeType.startsWith('audio/')) {
            return mimeType.split('/')[1].toUpperCase();
        }
        if (mimeType === 'application/pdf' || mimeType.includes('pdf')) {
            return 'PDF';
        }
        if (mimeType.includes('word') || mimeType.includes('document')) {
            return 'DOC';
        }
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
            return 'XLS';
        }
        if (mimeType === 'text/csv') {
            return 'CSV';
        }
        if (mimeType === 'text/csv') {
            return 'CSV';
        }
        return mimeType.split('/')[1].toUpperCase();
    };

    const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentMedia = filteredMedia.slice(startIndex, startIndex + itemsPerPage);

    const breadcrumbs = [{ title: translate('Dashboard'), href: '/dashboard' }, { title: translate('Media Library') }];

    const canCreate = !planLimits || planLimits.can_create;
    const pageActions = useHasPermission('create-media')
        ? [
              {
                  label:
                      planLimits && !canCreate
                          ? translate('Storage Limit Reached ({{current}}/{{max}})', {
                                current: formatFileSize(planLimits.current_storage),
                                max: formatFileSize(planLimits.maximum_storage),
                            })
                          : translate('Upload Media'),
                  icon: <Plus className="mr-0 h-4 w-4 min-[400px]:mr-2" />,
                  variant: canCreate ? ('default' as const) : ('outline' as const),
                  onClick: canCreate
                      ? () => setIsUploadModalOpen(true)
                      : () =>
                            toast.error(
                                translate('Storage limit exceeded. Your plan allows maximum {{max}} storage. Please upgrade your plan.', {
                                    max: formatFileSize(planLimits.maximum_storage),
                                }),
                            ),
                  disabled: !canCreate,
                  className: 'h-8 w-8 min-[400px]:h-9 min-[400px]:w-auto px-0 min-[400px]:px-4',
                  labelClassName: 'hidden min-[400px]:inline',
                  tooltip: translate('Upload Media'),
                  tooltipClassName: 'min-[400px]:hidden',
              },
          ]
        : [];

    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    return (
        <PageTemplate
            title={translate('Media Library')}
            url="/media-library"
            breadcrumbs={breadcrumbs}
            description={translate('Manage all your media files in one place.')}
            actions={pageActions}
            noPadding
        >
            <div className="space-y-6">
                {/* Search and Stats Bar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4 lg:flex-row">
                            {/* Search Section */}
                            <div className="flex-1">
                                <div className="relative max-w-sm">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                                    <Input
                                        placeholder={translate('Search media files...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                {searchTerm && (
                                    <p className="text-muted-foreground mt-1 text-xs">
                                        {translate('Showing results for "{{term}}"', { term: searchTerm })}
                                    </p>
                                )}
                            </div>

                            {/* Stats Section */}
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 rounded-md p-1.5">
                                        <ImageIcon className="text-primary h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {filteredMedia.length} {translate('Files')}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="rounded-md bg-green-500/10 p-1.5">
                                        <HardDrive className="h-4 w-4 text-green-600" />
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {formatFileSize(useMemo(() => filteredMedia.reduce((acc, item) => acc + item.size, 0), [filteredMedia]))}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="rounded-md bg-blue-500/10 p-1.5">
                                        <ImageIcon className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-semibold">
                                        {filteredMedia.filter((item) => item.mime_type.startsWith('image/')).length} {translate('Images')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Media Grid */}
                <Card>
                    <CardContent className="flex h-full flex-col gap-3 overflow-hidden bg-[#F0F0F1] p-3 lg:gap-6 lg:p-6 dark:bg-gray-800">
                        {loading ? (
                            <div className="py-12 text-center">
                                <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                                <p className="text-muted-foreground">{translate('Loading media...')}</p>
                            </div>
                        ) : currentMedia.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="bg-muted mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full">
                                    <ImageIcon className="text-muted-foreground h-10 w-10" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">{translate('No media files found')}</h3>
                                <p className="text-muted-foreground mb-6">
                                    {searchTerm
                                        ? translate('No results found for "{{term}}"', { term: searchTerm })
                                        : translate('Get started by uploading your first file')}
                                </p>
                                {!searchTerm && (
                                    <Button onClick={() => setIsUploadModalOpen(true)} size="lg">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {translate('Upload Files')}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                                    {currentMedia.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group bg-card relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-200 hover:shadow-md"
                                            onClick={() => handleShowInfo(item)}
                                        >
                                            {/* File Preview Container */}
                                            <div className="bg-muted relative flex aspect-square items-center justify-center">
                                                {item.mime_type.startsWith('image/') ? (
                                                    <img
                                                        src={item.thumb_url}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = item.url;
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-4">
                                                        <div className="mb-2 text-2xl">{getFileIcon(item.mime_type)}</div>
                                                        <div className="text-muted-foreground w-full truncate text-center text-xs font-medium">
                                                            {item.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Hover Overlay */}
                                                {useHasPermission('view-media') && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                                                        <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                            <div className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 backdrop-blur-sm">
                                                                {translate('Click to view')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* File Type Badge */}
                                                <div className="absolute top-2 left-2">
                                                    <Badge variant="secondary" className="bg-background/95 text-xs">
                                                        {item.mime_type.split('/')[1].toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="space-y-2 p-3">
                                                <div>
                                                    <h3 className="truncate text-sm font-medium" title={item.name}>
                                                        {item.name}
                                                    </h3>
                                                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                                        <HardDrive className="h-3 w-3" />
                                                        {formatFileSize(item.size)}
                                                    </p>
                                                </div>

                                                <div className="text-muted-foreground flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {window.appSettings?.formatDateTime(item.created_at, false) || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
                                        <div className="text-muted-foreground text-sm">
                                            {translate('Showing')} <span className="font-semibold">{startIndex + 1}</span> {translate('to')}{' '}
                                            <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredMedia.length)}</span>{' '}
                                            {translate('of')} <span className="font-semibold">{filteredMedia.length}</span> {translate('results')}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Desktop view */}
                                            <div className="hidden items-center gap-2 min-[992px]:flex">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                >
                                                    {translate('Previous')}
                                                </Button>

                                                <div className="flex gap-1">
                                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                        let page;
                                                        if (totalPages <= 5) {
                                                            page = i + 1;
                                                        } else if (currentPage <= 3) {
                                                            page = i + 1;
                                                        } else if (currentPage >= totalPages - 2) {
                                                            page = totalPages - 4 + i;
                                                        } else {
                                                            page = currentPage - 2 + i;
                                                        }

                                                        return (
                                                            <Button
                                                                key={page}
                                                                variant={currentPage === page ? 'default' : 'outline'}
                                                                size="sm"
                                                                className="h-8 w-10"
                                                                onClick={() => setCurrentPage(page)}
                                                            >
                                                                {page}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                >
                                                    {translate('Next')}
                                                </Button>
                                            </div>

                                            {/* Mobile view (< 992px) */}
                                            <div className="flex items-center gap-1 min-[992px]:hidden">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>

                                                {(() => {
                                                    const items = [];
                                                    const isNearStart = currentPage <= 3;
                                                    const isNearEnd = currentPage >= totalPages - 2;

                                                    if (isNearStart) {
                                                        items.push(1);
                                                        if (totalPages >= 2) items.push(2);
                                                        if (totalPages > 3) items.push({ type: 'ellipsis' });
                                                    } else if (isNearEnd) {
                                                        if (totalPages > 3) items.push({ type: 'ellipsis' });
                                                        if (totalPages - 1 > 1) items.push(totalPages - 1);
                                                        items.push(totalPages);
                                                    } else {
                                                        if (currentPage - 1 > 1) items.push({ type: 'ellipsis' });
                                                        items.push(currentPage);
                                                        if (currentPage + 1 < totalPages) items.push({ type: 'ellipsis' });
                                                    }

                                                    return items.map((item, i) => {
                                                        if (typeof item === 'object') {
                                                            return (
                                                                <span
                                                                    key={`el-${i}`}
                                                                    className="text-muted-foreground flex h-8 w-8 items-center justify-center text-sm"
                                                                >
                                                                    ...
                                                                </span>
                                                            );
                                                        }
                                                        return (
                                                            <Button
                                                                key={item}
                                                                variant={currentPage === item ? 'default' : 'outline'}
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => setCurrentPage(item)}
                                                            >
                                                                {item}
                                                            </Button>
                                                        );
                                                    });
                                                })()}

                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Upload Modal */}
                <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} modal={!isChatGptOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Upload className="h-5 w-5" />
                                {translate('Upload Files')}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div
                                className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 ${
                                    dragActive ? 'scale-[1.02] border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className={`transition-all duration-200 ${dragActive ? 'scale-110' : ''}`}>
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                        <Upload className={`h-8 w-8 transition-colors ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                                    </div>
                                    <h3 className="mb-2 text-lg font-medium">
                                        {dragActive ? translate('Drop files here') : translate('Upload your files')}
                                    </h3>
                                    <p className="text-muted-foreground mb-6 text-sm">
                                        {translate('Drag and drop your files here, or click to browse')}
                                    </p>

                                    <Input
                                        type="file"
                                        multiple
                                        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                                        className="hidden"
                                        id="file-upload-modal"
                                    />

                                    <Button
                                        type="button"
                                        onClick={() => document.getElementById('file-upload-modal')?.click()}
                                        disabled={uploading}
                                        size="lg"
                                    >
                                        {uploading ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                {translate('Uploading...')}
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="mr-2 h-4 w-4" />
                                                {translate('Choose Files')}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {dragActive && <div className="absolute inset-0 rounded-xl bg-blue-500/10" />}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Info Modal */}
                <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen} modal={!isChatGptOpen}>
                    <DialogContent className="max-h-[95vh] max-w-7xl overflow-hidden">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Image className="h-5 w-5" />
                                {translate('Media Details')}
                            </DialogTitle>
                        </DialogHeader>

                        {selectedMediaInfo && (
                            <div className="grid max-h-[calc(95vh-100px)] grid-cols-1 gap-8 overflow-y-auto pr-2 lg:grid-cols-4">
                                {/* Left Side - Large Media Preview (75% width) */}
                                <div className="space-y-4 lg:col-span-3">
                                    <div className="border-border flex min-h-[700px] items-center justify-center rounded-lg border bg-[#F0F0F1] p-8">
                                        {selectedMediaInfo.mime_type.startsWith('image/') ? (
                                            <img
                                                src={selectedMediaInfo.url}
                                                alt={selectedMediaInfo.name}
                                                className="h-auto max-h-[700px] w-auto max-w-full rounded-md object-contain shadow-lg"
                                                onError={(e) => {
                                                    e.currentTarget.src = selectedMediaInfo.thumb_url;
                                                }}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center">
                                                <div className="mb-6 text-9xl">{getFileIcon(selectedMediaInfo.mime_type)}</div>
                                                <div className="text-muted-foreground mb-3 text-3xl font-semibold">
                                                    {selectedMediaInfo.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                                                </div>
                                                <div className="text-muted-foreground mt-2 max-w-md px-4 text-center text-base break-all">
                                                    {selectedMediaInfo.file_name}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Side - Compact Details & Actions (25% width) */}
                                <div className="space-y-4 lg:col-span-1">
                                    {/* File Information */}
                                    <div className="space-y-3">
                                        <h3 className="text-foreground text-sm font-semibold">{translate('File Information')}</h3>

                                        <div className="space-y-2.5">
                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {translate('File Name')}
                                                </span>
                                                <p className="text-foreground text-sm leading-tight font-medium break-all">
                                                    {selectedMediaInfo.file_name}
                                                </p>
                                            </div>

                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {translate('Display Name')}
                                                </span>
                                                <p className="text-foreground text-sm leading-tight font-medium break-all">
                                                    {selectedMediaInfo.name}
                                                </p>
                                            </div>

                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {translate('File Type')}
                                                </span>
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {selectedMediaInfo.mime_type}
                                                </Badge>
                                            </div>

                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {translate('File Size')}
                                                </span>
                                                <p className="text-foreground text-sm font-semibold">{formatFileSize(selectedMediaInfo.size)}</p>
                                            </div>

                                            <div className="space-y-0.5">
                                                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                    {translate('Uploaded')}
                                                </span>
                                                <p className="text-foreground text-sm font-medium">{formatDate(selectedMediaInfo.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* URL Section */}
                                    <div className="space-y-1.5">
                                        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                            {translate('File URL')}
                                        </span>
                                        <div className="bg-muted/50 border-border flex items-center gap-2 rounded-lg border p-2">
                                            <code className="text-muted-foreground flex-1 font-mono text-xs leading-tight break-all">
                                                {selectedMediaInfo.url}
                                            </code>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyLink(selectedMediaInfo.url);
                                                }}
                                                className="h-7 w-7 flex-shrink-0 p-0"
                                                title={translate('Copy URL')}
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="border-border space-y-2 border-t pt-3">
                                        {useHasPermission('view-media') && (
                                            <Button
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(selectedMediaInfo.url, '_blank');
                                                }}
                                                className="w-full justify-start"
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                {translate('View')}
                                            </Button>
                                        )}
                                        {useHasPermission('download-media') && (
                                            <Button
                                                variant="outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDownload(selectedMediaInfo.id, selectedMediaInfo.file_name);
                                                }}
                                                className="w-full justify-start"
                                            >
                                                <Download className="mr-2 h-4 w-4" />
                                                {translate('Download')}
                                            </Button>
                                        )}
                                        {useHasPermission('delete-media') && (
                                            <Button
                                                variant="outline"
                                                onClick={handleDelete}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full justify-start"
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                {translate('Delete')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
                {/* Delete Modal */}
                <CrudDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={deleteMedia}
                    itemName={selectedMediaInfo?.name || ''}
                    entityName="Media"
                />
            </div>
        </PageTemplate>
    );
}
