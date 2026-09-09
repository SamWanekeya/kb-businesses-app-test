import { ColumnMappingModal } from '@components/ColumnMappingModal';
import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    importRoute: string;
    parseRoute: string;
    sampleRoute?: string;
    importNotes: string;
    databaseFields: { key: string; required?: boolean }[];
    modalSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ImportModal({
    isOpen,
    onClose,
    title,
    importRoute,
    parseRoute,
    sampleRoute,
    importNotes,
    databaseFields,
    modalSize = 'lg',
}: ImportModalProps) {
    const { t: translate } = useTranslation();
    const { csrfToken } = usePage().props;

    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [excelColumns, setExcelColumns] = useState<string[]>([]);
    const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);

    const handleDownloadSample = async () => {
        if (!sampleRoute) return;

        const response = await fetch(route(sampleRoute), {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            toast.error(translate(data.error));
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Extract filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'sample-template.xlsx';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error(translate('Please select a file to import'));
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        const toastId = toast.loading(translate('Parsing file...'));

        const response = await fetch(route(parseRoute), {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': csrfToken,
            },
        });

        const data = await response.json();

        if (data.excelColumns && data.previewData) {
            setExcelColumns(data.excelColumns);
            setParsedData(data.previewData);
            setPreviewData(data.previewData || []);
            toast.dismiss(toastId);
            onClose();
            setShowMappingModal(true);
        } else {
            toast.dismiss(toastId);
            if (data.message) {
                toast.error(translate(data.message));
            } else {
                toast.error(translate('Failed to parse file'));
            }
        }
    };

    const handleMappingClose = () => {
        setShowMappingModal(false);
        setFile(null);
        setExcelColumns([]);
        setParsedData([]);
        setPreviewData([]);
    };

    const handleClose = () => {
        if (!isImporting && !showMappingModal) {
            setFile(null);
            onClose();
        }
    };

    const modalSizeClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
    }[modalSize];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className={modalSizeClass}>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {sampleRoute && (
                            <div className="flex items-center justify-between rounded-md border border-neutral-200 p-3">
                                <p className="text-sm text-neutral-700">{translate('Download sample template for required format')}</p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="lg"
                                    onClick={handleDownloadSample}
                                    className="ml-3 text-blue-600 hover:text-blue-800"
                                >
                                    <Download className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="file">
                                {translate('Select file')} <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => {
                                    setFile(e.target.files?.[0] || null);
                                }}
                                disabled={isImporting}
                                required
                            />
                        </div>

                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                            <h4 className="mb-2 text-sm font-medium text-blue-800">{translate('Import notes:')}</h4>
                            <p className="text-xs text-blue-700">{importNotes}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" size="lg" variant="outline" onClick={handleClose} disabled={isImporting}>
                            {translate('Cancel')}
                        </Button>
                        <Button type="button" size="lg" onClick={handleSubmit} disabled={isImporting}>
                            {translate('Import')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ColumnMappingModal
                isOpen={showMappingModal}
                onClose={handleMappingClose}
                excelColumns={excelColumns}
                databaseFields={databaseFields}
                importRoute={importRoute}
                data={parsedData}
                previewData={previewData}
            />
        </>
    );
}
