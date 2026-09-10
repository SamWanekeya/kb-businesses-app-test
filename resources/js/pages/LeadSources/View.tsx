import { DialogContent, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { FileText, Lock, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t: translate } = useTranslation();

    return (
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="border-b px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2">
                        <Radio className="text-primary h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">{translate('Lead Source Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <div className="space-y-4 px-6 py-4 pb-6">
                {/* Name & Status */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Radio className="h-4 w-4" />
                            {translate('Source Name')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.name || '-'}</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Lock className="h-4 w-4" />
                            {translate('Status')}
                        </label>
                        <div className="mt-1">
                            <span
                                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                    record.status === 'active'
                                        ? 'bg-green-50 text-green-700 ring-green-600/20'
                                        : 'bg-red-50 text-red-700 ring-red-600/20'
                                }`}
                            >
                                {record.status === 'active' ? translate('Active') : translate('Inactive')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                {record.description && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <FileText className="h-4 w-4" />
                            {translate('Description')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.description}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
