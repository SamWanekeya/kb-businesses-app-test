import { PageTemplate } from '@components/page-template';
import { Badge } from '@components/UserInterface/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/UserInterface/card';
import { router, usePage } from '@inertiajs/react';
import { formatTitleCase } from '@utils/Helpers/StringFormatters';
import { route } from '@utils/Routes';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function RolesShow() {
    const { t: translate } = useTranslation();
    const { auth, role, permissions: allPermissions } = usePage().props;
    const userPermissions = auth?.permissions || [];

    const assignedPermissionNames: string[] = role.permissions?.map((p: any) => p.name) || [];

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Staff'), href: route('users.index') },
        { title: translate('Roles'), href: route('roles.index') },
        { title: role.label || translate('View Role') },
    ];

    const pageActions = [
        {
            label: translate('Back'),
            icon: <ArrowLeft className="mr-2 h-4 w-4" />,
            variant: 'outline' as const,
            onClick: () => router.get(route('roles.index')),
        },
    ];

    return (
        <PageTemplate
            title={role.label || translate('View Role')}
            description={translate('Role details and related information')}
            url={`/roles/${role.id}`}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
        >
            <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">{translate('Role Information')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{translate('Role Name')}</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{role.label || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{translate('Slug')}</p>
                                <p className="mt-1 font-mono text-sm text-gray-600 dark:text-gray-400">{role.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{translate('Total Permissions')}</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{assignedPermissionNames.length}</p>
                            </div>
                            {role.description && (
                                <div className="sm:col-span-2 md:col-span-3">
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{translate('Description')}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{role.description}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Permissions grouped by module */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">{translate('Assigned Permissions')}</CardTitle>
                        <CardDescription>{translate('Permissions assigned to this role, grouped by module.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {assignedPermissionNames.length === 0 ? (
                            <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                {translate('No permissions assigned to this role.')}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(allPermissions as Record<string, any[]>).map(([module, modulePermissions]) => {
                                    const assignedInModule = modulePermissions.filter((p) => assignedPermissionNames.includes(p.name));

                                    if (assignedInModule.length === 0) return null;

                                    return (
                                        <div key={module} className="overflow-hidden rounded-lg border dark:border-gray-700">
                                            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
                                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                    {formatTitleCase(module)}
                                                </span>
                                                <span className="rounded-full border bg-white px-2 py-0.5 text-xs text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                    {assignedInModule.length} / {modulePermissions.length}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 p-3">
                                                {assignedInModule.map((permission) => (
                                                    <Badge
                                                        key={permission.id}
                                                        variant="outline"
                                                        className="border-blue-200 bg-blue-50 text-xs font-normal text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                                    >
                                                        {permission.label || permission.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
