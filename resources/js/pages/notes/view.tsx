import { DialogContent, DialogHeader, DialogTitle } from '@components/UserInterface/Dialog';
import { NotebookPen, Share2, User, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ViewProps {
    record: any;
}

export default function View({ record }: ViewProps) {
    const { t: translate } = useTranslation();

    return (
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="border-b px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-lg p-2">
                        <NotebookPen className="text-primary h-5 w-5" />
                    </div>
                    <DialogTitle className="text-xl font-semibold">{translate('Note Details')}</DialogTitle>
                </div>
            </DialogHeader>

            <div className="space-y-4 px-6 py-4 pb-6">
                {/* Title & Created By */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <NotebookPen className="h-4 w-4" />
                            {translate('Title')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.title || '-'}</p>
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <User className="h-4 w-4" />
                            {translate('Created By')}
                        </label>
                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{record.creator?.name || '-'}</p>
                    </div>
                </div>

                {/* Shared With */}
                {record.shared_users?.length > 0 && (
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <Share2 className="h-4 w-4" />
                            {translate('Shared With')}
                        </label>
                        <div className="mt-1 flex flex-wrap gap-2">
                            {record.shared_users.map((user: any) => (
                                <span
                                    key={user.id}
                                    className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-600/20 ring-inset"
                                >
                                    <Users className="h-3 w-3" />
                                    {user.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div>
                    <label className="text-sm font-medium text-gray-500">{translate('Content')}</label>
                    <div
                        className="prose prose-sm mt-2 max-w-none text-sm text-gray-900 dark:text-white"
                        dangerouslySetInnerHTML={{ __html: record.content || translate('No content') }}
                    />
                </div>
            </div>
        </DialogContent>
    );
}
