import { toast } from '@/components/custom-toast';
import { PageTemplate } from '@/components/page-template';
import { RolePermissionCheckboxGroup } from '@/components/RolePermissionCheckboxGroup';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function RolesEdit() {
    const { t: translate } = useTranslation();
    const { auth, role, permissions, globalSettings } = usePage().props;
    const isDemo = globalSettings?.is_demo;

    const [label, setLabel] = useState(role.label || '');
    const [description, setDescription] = useState(role.description || '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions?.map((p: any) => p.name) || []);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const isEditable = role.is_editable !== false;

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Staff'), href: route('users.index') },
        { title: translate('Roles'), href: route('roles.index') },
        { title: translate('Edit Role') },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!label.trim()) newErrors.label = translate('Role name is required');
        if (selectedPermissions.length === 0) newErrors.permissions = translate('At least one permission is required');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!isDemo) {
            setProcessing(true);
            if (!globalSettings?.is_demo) toast.loading(translate('Updating role...'));
        }

        router.put(
            route('roles.update', role.id),
            {
                label,
                description,
                permissions: selectedPermissions,
            },
            {
                onSuccess: (page) => {
                    if (!isDemo) {
                        if (!globalSettings?.is_demo) toast.dismiss();
                        if (page.props.flash.success) toast.success(t(page.props.flash.success));
                        else if (page.props.flash.error) toast.error(t(page.props.flash.error));
                    }
                },
                onError: (errs) => {
                    if (!isDemo) if (!globalSettings?.is_demo) toast.dismiss();
                    if (typeof errs === 'object') setErrors(errs as Record<string, string>);
                    else if (!isDemo) toast.error(t(errs));
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

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
            title={translate('Edit Role')}
            description={translate('Update role details and related information')}
            url={`/roles/${role.id}/edit`}
            actions={pageActions}
            breadcrumbs={breadcrumbs}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">{translate('Role Information')}</CardTitle>
                        <CardDescription>{translate('Update the role name and description.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label required htmlFor="label">
                                    {translate('Role Name')}
                                </Label>
                                <Input
                                    id="label"
                                    required
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder={translate('e.g. Legal Consultant, Junior Advocate, Associate Advocate')}
                                    disabled={!isEditable}
                                    className={errors.label ? 'border-red-500' : ''}
                                />
                                {!isEditable && <p className="text-xs text-amber-600">{translate('This role name cannot be changed.')}</p>}
                                {errors.label && <p className="text-xs text-red-500">{errors.label}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="description">{translate('Description')}</Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={translate('Enter role description...')}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Permissions */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">{translate('Role Permissions')}</CardTitle>
                        <CardDescription>
                            {translate('Select permissions for this role. You can select all permissions at once or manage them by module.')}
                            {auth?.user?.type !== 'super_admin' && (
                                <span className="mt-1 block text-xs text-amber-600">
                                    {translate('Note: Only permissions for modules available to your role are shown.')}
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {errors.permissions && <p className="mb-3 text-xs text-red-500">{errors.permissions}</p>}
                        <RolePermissionCheckboxGroup
                            permissions={permissions}
                            selectedPermissions={selectedPermissions}
                            onChange={setSelectedPermissions}
                        />
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex flex-col-reverse justify-end gap-3 pb-2 sm:flex-row">
                    <Button type="button" variant="outline" onClick={() => router.get(route('roles.index'))}>
                        {translate('Cancel')}
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing && !isDemo ? translate('Saving...') : translate('Save')}
                    </Button>
                </div>
            </form>
        </PageTemplate>
    );
}
