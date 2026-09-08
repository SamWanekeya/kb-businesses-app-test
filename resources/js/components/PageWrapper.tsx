// components/PageWrapper.tsx
import { PageAction, PageTemplate } from '@/components/page-template';
import { BreadcrumbItem } from '@/types';
import { useHasPermission } from '@/utils/Permissions';
import { usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export interface PageButton {
    label: string;
    icon?: ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick?: () => void;
    permission?: string;
    className?: string;
}

interface PageWrapperProps {
    title: string;
    url: string;
    description: string;
    buttons?: PageButton[];
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export function PageWrapper({ title, url, description, buttons = [], children, breadcrumbs }: PageWrapperProps) {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;
    const permissions = auth?.permissions || [];

    // Generate default breadcrumbs if not provided
    const defaultBreadcrumbs: BreadcrumbItem[] = [{ title: translate('Dashboard'), href: route('dashboard') }, { title }];

    const pageBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

    // Filter buttons based on permissions
    const filteredActions: PageAction[] = buttons
        .filter((button) => !button.permission || useHasPermission(button.permission))
        .map((button) => ({
            label: button.label,
            icon: button.icon,
            variant: button.variant,
            onClick: button.onClick,
        }));

    return (
        <PageTemplate title={title} url={url} description={description} actions={filteredActions} breadcrumbs={pageBreadcrumbs}>
            <div className="space-y-4">{children}</div>
        </PageTemplate>
    );
}
