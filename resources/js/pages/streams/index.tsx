import { toast } from '@/components/custom-toast';
import { PageWrapper } from '@/components/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHasPermission } from '@/utils/Permissions';
import { Head, router, usePage } from '@inertiajs/react';
import { Briefcase, Building2, FileIcon, FileText, ShoppingBag, Users } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface StreamsIndexProps {
    modules: Record<string, string>;
}

export default function Index({ modules }: StreamsIndexProps) {
    const { t: translate } = useTranslation();
    const { auth, flash } = usePage().props;
    const permissions = auth?.permissions || [];

    React.useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const getModuleIcon = (moduleKey: string) => {
        const iconMap: Record<string, any> = {
            account_activities: Building2,
            lead_activities: Users,
            opportunity_activities: Briefcase,
            invoice_activities: FileText,
            purchase_order_activities: ShoppingBag,
            quote_activities: FileText,
            sales_order_activities: ShoppingBag,
        };
        return iconMap[moduleKey] || FileIcon;
    };

    const handleViewStream = (key: string) => {
        if (useHasPermission('view-stream')) {
            router.visit(route(`stream.${key.replace(/_/g, '-')}`));
        }
    };

    return (
        <PageWrapper title={translate('Streams')} description={translate('View activity logs for various modules')} url={route('stream.index')}>
            <Head title={translate('Streams')} />

            {useHasPermission('manage-stream') && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(modules || {}).map(([key, title]) => {
                        const IconComponent = getModuleIcon(key);
                        return (
                            <div key={key} onClick={() => handleViewStream(key)}>
                                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                                        <IconComponent className="text-primary mr-3 h-6 w-6" />
                                        <CardTitle className="text-lg">{t(title)}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {useHasPermission('view-stream') && (
                                            <p className="text-sm text-gray-600">
                                                {translate('View activity logs for')} {t(title.toLowerCase())}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        );
                    })}
                </div>
            )}
        </PageWrapper>
    );
}
