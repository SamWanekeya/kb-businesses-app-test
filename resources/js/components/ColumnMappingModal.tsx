import { toast } from '@components/CustomToast';
import { Alert, AlertDescription } from '@components/UserInterface/Alert';
import { Button } from '@components/UserInterface/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ColumnMappingModalProps {
    isOpen: boolean;
    onClose: () => void;
    excelColumns: string[];
    databaseFields: { key: string; required?: boolean }[];
    importRoute: string;
    data: Record<string, string>[];
    previewData?: Record<string, string>[];
}

export function ColumnMappingModal({ isOpen, onClose, excelColumns, databaseFields, importRoute, data, previewData = [] }: ColumnMappingModalProps) {
    const { t: translate } = useTranslation();
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (isOpen && excelColumns.length > 0) {
            const autoMapping: Record<string, string> = {};
            databaseFields.forEach((field) => {
                const match = excelColumns.find((col) => col.toLowerCase()?.replace(/[_\s]/g, '') === field.key.toLowerCase()?.replace(/[_\s]/g, ''));
                if (match) {
                    autoMapping[field.key] = match;
                }
            });
            setMapping(autoMapping);
        }
    }, [isOpen, excelColumns, databaseFields]);

    const handleSubmit = () => {
        if (!data || data.length === 0) {
            toast.error(translate('No data available for import'));
            return;
        }

        const requiredFields = databaseFields.filter((f) => f.required);
        const missingFields = requiredFields.filter((f) => !mapping[f.key]);

        if (missingFields.length > 0) {
            toast.error(translate('Please map all required fields: {{fields}}', { fields: missingFields.map((f) => f.key).join(', ') }));
            return;
        }

        // Map data according to column mapping
        const mappedData = (data || []).map((row) => {
            const mappedRow: Record<string, any> = {};
            Object.entries(mapping).forEach(([dbField, excelColumn]) => {
                mappedRow[dbField] = row[excelColumn];
            });
            return mappedRow;
        });

        setIsImporting(true);
        const toastId = toast.loading(translate('Importing...'));

        router.post(
            route(importRoute),
            {
                data: mappedData,
            },
            {
                preserveState: true,
                onSuccess: () => {
                    setIsImporting(false);
                    toast.dismiss(toastId);
                },
                onError: (errors) => {
                    setIsImporting(false);
                    toast.dismiss(toastId);
                    Object.values(errors).forEach((message) => toast.error(translate(message)));
                },
            },
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
            <DialogContent className="flex max-h-[85vh] max-w-7xl flex-col overflow-hidden">
                <DialogHeader>
                    <DialogTitle>{translate('Map columns')}</DialogTitle>
                </DialogHeader>

                <Alert className="border-amber-200 bg-amber-50">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">{translate('Map your CSV columns to database fields')}</AlertDescription>
                </Alert>

                <div className="flex-1 overflow-auto">
                    <h3 className="mb-3 text-base font-semibold">{translate('Column mapping & preview')}</h3>
                    <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full">
                            <thead className="sticky top-0 border-b bg-neutral-50">
                                <tr>
                                    {databaseFields.map((field) => (
                                        <th key={field.key} className="min-w-[180px] px-4 py-3 text-left font-medium text-neutral-700">
                                            <div className="space-y-2">
                                                <div className="text-sm font-semibold">
                                                    {field.key?.replace(/_/g, ' ')?.replace(/\b\w/g, (l) => l.toUpperCase())}
                                                    {field.required && <span className="ml-1 text-red-600">*</span>}
                                                </div>
                                                <Select
                                                    value={mapping[field.key] || '__unselect__'}
                                                    onValueChange={(value) => {
                                                        setMapping((prev) => {
                                                            const newMapping = { ...prev };
                                                            if (value === '__unselect__') {
                                                                delete newMapping[field.key];
                                                            } else {
                                                                Object.keys(newMapping).forEach((key) => {
                                                                    if (newMapping[key] === value) delete newMapping[key];
                                                                });
                                                                newMapping[field.key] = value;
                                                            }
                                                            return newMapping;
                                                        });
                                                    }}
                                                >
                                                    <SelectTrigger className="h-9 w-full bg-white text-sm">
                                                        <SelectValue placeholder={translate('Select...')} />
                                                    </SelectTrigger>
                                                    <SelectContent position="popper" className="z-[9999]">
                                                        <SelectItem value="__unselect__">{translate('Select...')}</SelectItem>
                                                        {excelColumns.map((col) => {
                                                            const isUsed = Object.values(mapping).includes(col) && mapping[field.key] !== col;
                                                            return (
                                                                <SelectItem key={col} value={col} disabled={isUsed}>
                                                                    {col}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.map((row, idx) => (
                                    <tr key={idx} className="border-b hover:bg-neutral-50">
                                        {databaseFields.map((field) => (
                                            <td key={field.key} className="px-4 py-3 text-sm text-neutral-700">
                                                <div className="max-w-[200px] truncate" title={mapping[field.key] ? row[mapping[field.key]] : ''}>
                                                    {mapping[field.key] ? (
                                                        row[mapping[field.key]] || <span className="text-xs text-neutral-400 italic">empty</span>
                                                    ) : (
                                                        <span className="text-neutral-400">-</span>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                        {translate('Showing all {{count}} rows', { count: previewData.length })}
                    </p>
                </div>

                <DialogFooter>
                    <Button type="button" size="lg" variant="outline" onClick={onClose} disabled={isImporting}>
                        {translate('Back')}
                    </Button>
                    <Button type="button" size="lg" onClick={handleSubmit} disabled={isImporting}>
                        {translate('Import data')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
