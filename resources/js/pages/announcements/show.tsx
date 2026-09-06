import { CrudDeleteModal } from '@/components/CrudDeleteModal';
import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useHasPermission } from '@/utils/Permissions';
import { Head, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AnnouncementShow() {
    const { t: translate } = useTranslation();
    const { auth, announcement } = usePage().props;
    const permissions = auth?.permissions || [];
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleDeleteConfirm = () => {
        toast.loading(translate('Deleting announcement...'));

        router.delete(route('announcements.destroy', announcement.id), {
            onSuccess: (page) => {
                toast.dismiss();
                if (page.props.flash.success) {
                    toast.success(t(page.props.flash.success));
                }
                router.get(route('announcements.index'));
            },
            onError: (errors) => {
                toast.dismiss();
                if (typeof errors === 'string') {
                    toast.error(errors);
                } else {
                    toast.error(translate('Failed to delete: {{errors}}', { errors: Object.values(errors).join(', ') }));
                }
            },
        });
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Announcements'), href: route('announcements.index') },
        { title: announcement.title },
    ];

    const pageActions = [];

    if (useHasPermission('delete-announcements')) {
        pageActions.push({
            label: translate('Delete'),
            icon: <Trash2 className="mr-2 h-4 w-4" />,
            variant: 'destructive',
            onClick: () => setIsDeleteModalOpen(true),
        });
    }

    pageActions.push({
        label: translate('Back'),
        icon: <ArrowLeft className="h-4 w-4" />,
        variant: 'outline',
        onClick: () => window.history.back(),
    });

    const getStatusBadge = (status: string) => {
        const statusColors = {
            expired: 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-600/20',
            active: 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20',
            inactive: 'bg-red-100 text-red-800 ring-1 ring-inset ring-red-600/20',
        };

        return (
            <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.inactive}>
                {translate(status?.charAt(0).toUpperCase() + status?.slice(1)) || translate('Inactive')}
            </Badge>
        );
    };

    return (
        <PageTemplate
            title={announcement.title}
            description={translate('View announcement details and content')}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <Head title={announcement.title} />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-xl">{announcement.title}</CardTitle>
                            <div className="flex gap-2">
                                {announcement.category && (
                                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 ring-inset">
                                        {announcement.category.name}
                                    </Badge>
                                )}
                                {getStatusBadge(announcement.status)}
                                {announcement.is_featured && (
                                    <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800 ring-1 ring-purple-600/20 ring-inset">
                                        <Star className="h-3 w-3" />
                                        {translate('Featured')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="text-muted-foreground mt-4 flex items-center gap-6 text-sm">
                            {announcement.start_date && (
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" /> <span className="font-bold">{translate('Start Date')}:</span>{' '}
                                    {window.appSettings?.formatDateTime(announcement.start_date, false) || '-'}
                                </div>
                            )}
                            {announcement.end_date && (
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4" /> <span className="font-bold">{translate('End Date')}:</span>{' '}
                                    {window.appSettings?.formatDateTime(announcement.end_date, false) || '-'}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <div dangerouslySetInnerHTML={{ __html: announcement.content || translate('No content') }} />
                    </CardHeader>
                </Card>
            </div>

            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={announcement.title || ''}
                entityName={translate('announcement')}
            />
        </PageTemplate>
    );
}
