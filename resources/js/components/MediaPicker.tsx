import MediaLibraryModal from '@components/MediaLibraryModal';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { File, FileText, Image as ImageIcon, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MediaPickerProps {
    label?: string;
    value?: string | number | number[];
    onChange: (value: string | number | number[]) => void;
    multiple?: boolean;
    placeholder?: string;
    showPreview?: boolean;
    returnType?: 'url' | 'id';
}

export default function MediaPicker({
    label,
    value = '',
    onChange,
    multiple = false,
    placeholder = 'Select image...',
    showPreview = true,
    returnType = 'url',
}: MediaPickerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSelect = (selectedData: string | number | number[]) => {
        onChange(selectedData);
    };

    const handleClear = () => {
        if (multiple) {
            onChange([]);
        } else {
            onChange('');
        }
        setImageUrls([]);
        setImageNames([]);
        setImageMimeTypes([]);
    };

    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [imageNames, setImageNames] = useState<string[]>([]);
    const [imageMimeTypes, setImageMimeTypes] = useState<string[]>([]);

    const getMimeFromUrl = (url: string) => {
        const ext = url.split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image/' + ext;
        if (ext === 'pdf') return 'application/pdf';
        if (['doc', 'docx'].includes(ext)) return 'application/msword';
        if (['xls', 'xlsx'].includes(ext)) return 'application/vnd.ms-excel';
        if (ext === 'csv') return 'text/csv';
        return 'application/octet-stream';
    };

    // Fetch image URLs and names when using ID return type
    useEffect(() => {
        if (returnType === 'id' && value) {
            const ids = Array.isArray(value) ? value : [value].filter(Boolean);
            if (ids.length > 0) {
                fetch(route('api.media.index'), {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                })
                    .then((response) => response.json())
                    .then((media) => {
                        const urls: string[] = [];
                        const names: string[] = [];
                        const mimes: string[] = [];
                        ids.forEach((id) => {
                            const mediaItem = media.find((m: any) => m.id === Number(id));
                            if (mediaItem) {
                                urls.push(mediaItem.url);
                                names.push(mediaItem.name || mediaItem.file_name || `File ${id}`);
                                mimes.push(mediaItem.mime_type || getMimeFromUrl(mediaItem.url));
                            }
                        });
                        setImageUrls(urls);
                        setImageNames(names);
                        setImageMimeTypes(mimes);
                    })
                    .catch(() => {
                        setImageUrls([]);
                        setImageNames([]);
                        setImageMimeTypes([]);
                    });
            } else {
                setImageUrls([]);
                setImageNames([]);
                setImageMimeTypes([]);
            }
        } else if (returnType === 'url') {
            const valueStr = Array.isArray(value) ? value.join(',') : String(value || '');
            const urls = valueStr
                ? valueStr
                      .split(',')
                      .map((url) => url.trim())
                      .filter(Boolean)
                : [];
            setImageUrls(urls);
            setImageNames(urls.map((_, index) => `File ${index + 1}`));
            setImageMimeTypes(urls.map(getMimeFromUrl));
        }
    }, [value, returnType]);

    const displayValue = imageUrls
        .map((img) => {
            const imagePathArr = String(img || '').split('/');
            return imagePathArr[imagePathArr.length - 1];
        })
        .join(', ');

    const getFileIcon = (mime: string) => {
        if (mime.includes('pdf')) return <FileText className="h-7 w-7 text-red-500" />;
        if (mime.includes('word') || mime.includes('document')) return <FileText className="h-7 w-7 text-blue-500" />;
        if (mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv') return <FileText className="h-7 w-7 text-green-500" />;
        return <File className="h-7 w-7 text-gray-500" />;
    };

    return (
        <div className="space-y-2">
            {label && <Label>{label}</Label>}

            <div className="flex w-full min-w-0 gap-2">
                <Input
                    className="min-w-0 flex-1"
                    value={displayValue}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    readOnly={multiple}
                />
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(true)} className="shrink-0 max-[400px]:px-2.5">
                    <ImageIcon className="mr-0 h-4 w-4 min-[405px]:mr-2" />
                    <span className="max-[405px]:hidden">Browse</span>
                </Button>
                {(imageNames.length > 0 || displayValue) && (
                    <Button type="button" variant="outline" size="icon" onClick={handleClear} className="shrink-0">
                        <X className="mx-2 h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Preview */}
            {showPreview && imageUrls.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                    {imageUrls.map((url, index) => {
                        const mime = imageMimeTypes[index] || '';
                        const isImage = mime.startsWith('image/');
                        return (
                            <div key={index} className="relative">
                                {isImage ? (
                                    <img
                                        src={url}
                                        alt={`Preview ${index + 1}`}
                                        className="h-20 w-full rounded border object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="bg-muted flex h-20 w-full flex-col items-center justify-center gap-1 rounded border">
                                        {getFileIcon(mime)}
                                        <span className="text-muted-foreground max-w-full truncate px-1 text-xs">
                                            {mime.split('/')[1]?.toUpperCase() || 'FILE'}
                                        </span>
                                    </div>
                                )}
                                {multiple && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (Array.isArray(value)) {
                                                const newValue = value.filter((_, i) => i !== index);
                                                onChange(newValue);
                                            }
                                        }}
                                        className="absolute top-1 right-1 h-6 w-6 bg-red-500 p-0 text-white hover:bg-red-600"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <MediaLibraryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSelect={handleSelect}
                multiple={multiple}
                returnType={returnType}
                preSelected={Array.isArray(value) ? value : value ? [value] : []}
            />
        </div>
    );
}
