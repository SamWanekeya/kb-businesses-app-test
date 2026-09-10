import { PageCrudWrapper } from '@components/PageCrudWrapper';
import { usePermissionsConfig } from '@config/Crud/Permissions';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

export default function PermissionsPage() {
    const { t: translate } = useTranslation();
    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('User Management'), href: route('roles.index') },
        { title: translate('Permissions') },
    ];

    return <PageCrudWrapper config={usePermissionsConfig} url="/permissions" breadcrumbs={breadcrumbs} />;
}
