import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, FileText, Mail, MessageSquare, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t } = useTranslation();

    return (
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="border-b px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2">
                        <MessageSquare className="text-primary h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">{t('Contact Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <div className="space-y-4 px-6 py-4 pb-6">
                {/* Name & Email */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <User className="h-4 w-4" />
                            {t('Name')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record?.name || '-'}</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Mail className="h-4 w-4" />
                            {t('Email')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record?.email || '-'}</p>
                    </div>
                </div>

                {/* Subject & Date */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <FileText className="h-4 w-4" />
                            {t('Subject')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record?.subject || '-'}</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {t('Date')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                            {record?.created_at
                                ? window.appSettings?.formatDateTime(record.created_at, true) || new Date(record.created_at).toLocaleString()
                                : '-'}
                        </p>
                    </div>
                </div>

                {/* Message */}
                {record?.message && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <MessageSquare className="h-4 w-4" />
                            {t('Message')}
                        </label>
                        <p className="mt-1 text-sm font-medium whitespace-pre-wrap text-gray-900 dark:text-white">{record.message}</p>
                    </div>
                )}
            </div>
        </DialogContent>
    );
}
