import { PageTemplate } from '@components/page-template';
import { Badge } from '@components/UserInterface/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft, Calendar, Folder, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DocumentFolderShow() {
    const { t: translate } = useTranslation();
    const { documentFolder } = usePage().props;

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Document Folders'), href: route('document-folders.index') },
        { title: documentFolder.name },
    ];

    return (
        <PageTemplate
            title={documentFolder.name}
            url={`/document-folders/${documentFolder.id}`}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => window.history.back(),
                },
            ]}
        >
            <div className="space-y-6">
                {/* Main Information Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-blue-600" />
                            {translate('Folder Information')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-gray-500">{translate('Folder Name')}</label>
                                <p className="mt-1 text-sm text-gray-900">{documentFolder.name}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">{translate('Parent Folder')}</label>
                                <p className="mt-1 text-sm text-gray-900">{documentFolder.parent_folder?.name || translate('Root Folder')}</p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">{translate('Status')}</label>
                                <div className="mt-1">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${documentFolder.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20 ring-inset' : 'bg-red-50 text-red-700 ring-1 ring-red-600/20 ring-inset'}`}
                                    >
                                        {documentFolder.status === 'active' ? translate('Active') : translate('Inactive')}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">{translate('Description')}</label>
                                <p className="mt-1 text-sm text-gray-900">{documentFolder.description || translate('No description provided')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sub-folders Card */}
                {documentFolder.sub_folders && documentFolder.sub_folders.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FolderOpen className="h-5 w-5 text-blue-600" />
                                {translate('Sub-folders')} ({documentFolder.sub_folders.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {documentFolder.sub_folders.map((subFolder: any) => (
                                    <div
                                        key={subFolder.id}
                                        className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                            <Folder className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900">{subFolder.name}</p>
                                            <p className="truncate text-xs text-gray-500">{subFolder.description || translate('No description')}</p>
                                        </div>
                                        <Badge variant={subFolder.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                            {subFolder.status === 'active' ? translate('Active') : translate('Inactive')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Metadata Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            {translate('Metadata')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium text-gray-500">{translate('Created At')}</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {window.appSettings?.formatDateTime(documentFolder.created_at, false) ||
                                        new Date(documentFolder.created_at).toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">{translate('Last Updated')}</label>
                                <p className="mt-1 text-sm text-gray-900">
                                    {window.appSettings?.formatDateTime(documentFolder.updated_at, false) ||
                                        new Date(documentFolder.updated_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
