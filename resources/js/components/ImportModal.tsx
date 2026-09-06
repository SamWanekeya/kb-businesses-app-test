import { toast } from '@/components/custom-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColumnMappingModal } from '@components/ColumnMappingModal';
import axios from 'axios';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    importRoute: string;
    parseRoute: string;
    samplePath?: string;
    importNotes: string;
    databaseFields: { key: string; required?: boolean }[];
}

export function ImportModal({ isOpen, onClose, title, importRoute, parseRoute, samplePath, importNotes, databaseFields }: ImportModalProps) {
    const { t: translate } = useTranslation();
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const [excelColumns, setExcelColumns] = useState<string[]>([]);
    const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
    const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error(translate('Please select a file to import'));
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsImporting(true);
        toast.loading(translate('Parsing file...'));

        try {
            const { data } = await axios.post(route(parseRoute), formData);

            if (data.excelColumns && data.previewData) {
                setExcelColumns(data.excelColumns);
                setParsedData(data.previewData);
                setPreviewData(data.previewData || []);
                toast.dismiss();
                onClose();
                setShowMappingModal(true);
            } else {
                toast.dismiss();
                toast.error(data.message || translate('Failed to parse file'));
            }
        } catch (error) {
            toast.dismiss();
            toast.error(translate('Network error or invalid response'));
        } finally {
            setIsImporting(false);
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

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {samplePath && (
                            <div className="text-center">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            const response = await fetch(samplePath);
                                            if (!response.ok) {
                                                const error = await response.json();
                                                toast.error(t(error.error || 'Failed to download template'));
                                                return;
                                            }
                                            window.location.href = samplePath;
                                        } catch (error) {
                                            toast.error(translate('Failed to download template'));
                                        }
                                    }}
                                    disabled={!samplePath}
                                    className="mb-4"
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    {translate('Download Template')}
                                </Button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="file" required>
                                {translate('Select File')}
                            </Label>
                            <Input
                                id="file"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                disabled={isImporting}
                                required
                            />
                        </div>

                        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                            <h4 className="mb-2 text-sm font-medium text-blue-800">{translate('Import Notes:')}</h4>
                            <p className="text-xs text-blue-700">{importNotes}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isImporting}>
                            {translate('Cancel')}
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={isImporting}>
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
