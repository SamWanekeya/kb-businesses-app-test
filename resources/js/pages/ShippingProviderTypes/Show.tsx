import PageTemplate from '@components/PageTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft, Palette, Truck, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ShippingProviderTypeShow() {
    const { t: translate } = useTranslation();
    const { shippingProviderType } = usePage().props;

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Shipping Provider Types'), href: route('shipping-provider-types.index') },
        { title: shippingProviderType.name },
    ];

    const getStatusBadge = (status: string) => {
        const statusColors = {
            active: 'bg-green-50 text-green-700 ring-green-600/20',
            inactive: 'bg-red-50 text-red-700 ring-red-600/10',
        };

        return (
            <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[status as keyof typeof statusColors] || statusColors.active}`}
            >
                {translate(status?.charAt(0).toUpperCase() + status?.slice(1)) || translate('Active')}
            </span>
        );
    };

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
            title={shippingProviderType.name}
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
            <div className="mx-auto space-y-6">
                {/* Header Section */}
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="flex items-center text-lg font-bold">
                                <Truck className="text-muted-foreground mr-2 h-5 w-5" />
                                {shippingProviderType.name}
                            </h1>
                            <p className="mt-2 text-sm">{shippingProviderType.description || translate('No description provided')}</p>
                        </div>
                        <div className="text-right">{getStatusBadge(shippingProviderType.status)}</div>
                    </div>
                </div>

                {/* Shipping Provider Type Information */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-lg font-semibold">{translate('Shipping Provider Type Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">{translate('Name')}</label>
                                    <p className="mt-1 text-sm">{shippingProviderType.name}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">{translate('Description')}</label>
                                    <p className="mt-1 text-sm">{shippingProviderType.description || translate('-')}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Palette className="text-muted-foreground h-4 w-4" />
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">{translate('Color')}</label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <div
                                                className="h-6 w-6 rounded border border-gray-300"
                                                style={{ backgroundColor: shippingProviderType.color || '#3B82F6' }}
                                            ></div>
                                            <span className="font-mono text-sm">{shippingProviderType.color || '#3B82F6'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">{translate('Status')}</label>
                                    <div className="mt-1">{getStatusBadge(shippingProviderType.status)}</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <User className="text-muted-foreground h-4 w-4" />
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">{translate('Created By')}</label>
                                        <p className="mt-1 text-sm">{shippingProviderType.creator?.name || translate('-')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Timestamps */}
                <Card className="shadow-sm">
                    <CardHeader className="border-b bg-gray-50">
                        <CardTitle className="text-lg font-semibold">{translate('Record Information')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">{translate('Created At')}</label>
                                <p className="mt-1 text-sm">
                                    {window.appSettings?.formatDateTime(shippingProviderType.created_at, false) ||
                                        new Date(shippingProviderType.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">{translate('Updated At')}</label>
                                <p className="mt-1 text-sm">
                                    {window.appSettings?.formatDateTime(shippingProviderType.updated_at, false) ||
                                        new Date(shippingProviderType.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageTemplate>
    );
}
