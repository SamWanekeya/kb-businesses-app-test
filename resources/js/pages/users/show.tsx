import { PageTemplate } from '@/components/page-template';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Calendar, Mail, Shield, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UserShow() {
    const { t } = useTranslation();
    const { user, meetings } = usePage().props;

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        { title: t('Users'), href: route('users.index') },
        { title: user.name },
    ];

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <PageTemplate
            title={user.name}
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: t('Back'),
                    icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => window.history.back(),
                },
            ]}
        >
            <div className="mx-auto space-y-6">
                {/* User Information */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-gray-50 px-8 py-6">
                        <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                            <User className="mr-3 h-5 w-5" />
                            {t('User Information')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">{t('Name')}</label>
                                    <p className="mt-2 text-base font-medium text-gray-800">{user.name}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">{t('Email')}</label>
                                    <div className="mt-2 flex items-center">
                                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                                        <p className="text-base font-medium text-gray-800">{user.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">{t('Role')}</label>
                                    <div className="mt-2 flex items-center">
                                        <Shield className="mr-2 h-4 w-4 text-gray-400" />
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-600/20 ring-inset">
                                            {user.roles?.[0]?.name || user.type || 'No Role'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">{t('Status')}</label>
                                    <div className="mt-2">
                                        <span
                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                user.status === 'active'
                                                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                                                    : 'bg-red-50 text-red-700 ring-red-600/20'
                                            }`}
                                        >
                                            {user.status === 'active' ? t('Active') : t('Inactive')}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">{t('Created At')}</label>
                                    <p className="mt-2 text-base font-medium text-gray-700">{formatDate(user.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold tracking-wide text-gray-500 uppercase">{t('Created By')}</label>
                                    <p className="mt-2 text-base font-medium text-gray-800">{user.creator?.name || 'System'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Related Meetings */}
                {meetings && meetings.length > 0 && (
                    <Card className="shadow-sm">
                        <CardHeader className="border-b bg-gray-50 px-8 py-6">
                            <CardTitle className="flex items-center text-xl font-bold text-gray-800">
                                <Calendar className="mr-3 h-5 w-5" />
                                {t('Related Meetings')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-3">
                                {meetings.map((meeting: any) => (
                                    <div
                                        key={meeting.id}
                                        className="rounded-lg border border-purple-200 bg-purple-50 p-4 transition-shadow hover:shadow-md"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Link
                                                    href={route('meetings.show', meeting.id)}
                                                    className="text-base font-medium text-purple-700 transition-colors hover:text-purple-900 hover:underline"
                                                >
                                                    {meeting.title}
                                                </Link>
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {new Date(meeting.start_date).toLocaleDateString()} -{' '}
                                                    {meeting.assigned_user?.name || 'Unassigned'}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                                    meeting.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : meeting.status === 'in_progress'
                                                          ? 'bg-blue-100 text-blue-800'
                                                          : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {meeting.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </PageTemplate>
    );
}
