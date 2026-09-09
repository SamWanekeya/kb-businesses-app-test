import { PageTemplate } from '@components/page-template';
import { Badge } from '@components/UserInterface/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@components/UserInterface/card';
import { Pagination } from '@components/UserInterface/pagination';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { ArrowLeft, Calendar, CheckCircle, DollarSign, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReferredUser {
    id: number;
    name: string;
    email: string;
    created_at: string;
    plan?: {
        id: number;
        name: string;
        price: number;
        yearly_price?: number;
    };
    plan_orders?: Array<{
        id: number;
        billing_cycle: string;
        final_price: number;
    }>;
    referrals?: Array<{
        id: number;
        amount: number;
        commission_percentage: number;
        created_at: string;
    }>;
}

interface ReferredUsersProps {
    referredUsers: {
        data: ReferredUser[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: any[];
    };
    userType: string;
    currencySymbol: string;
}

interface PageProps {
    props: ReferredUsersProps;
}

export default function ReferredUsers() {
    const { t: translate } = useTranslation();
    const { props } = usePage<PageProps>();
    const { referredUsers, userType, currencySymbol } = props;

    const getTotalCommission = (user: ReferredUser) => {
        return user.referrals?.reduce((total, referral) => total + (Number(referral.amount) || 0), 0) || 0;
    };

    const getPlanDisplayInfo = (user: ReferredUser) => {
        if (!user.plan) return null;

        // Get the latest plan order to determine billing cycle and actual price paid
        const latestOrder = user.plan_orders?.[0];

        if (latestOrder) {
            const isYearly = latestOrder.billing_cycle === 'yearly';
            return {
                name: user.plan.name,
                price: latestOrder.final_price,
                cycle: isYearly ? 'year' : 'month',
            };
        }

        // Fallback to plan's monthly price if no order found
        return {
            name: user.plan.name,
            price: user.plan.price,
            cycle: 'month',
        };
    };

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Referral Program'), href: route('referral.index') },
        { title: translate('Referral Users') },
    ];

    return (
        <PageTemplate
            title={translate('Referred Users')}
            url="/referral/referred-users"
            breadcrumbs={breadcrumbs}
            actions={[
                {
                    label: translate('Back'),
                    icon: <ArrowLeft className="me-2 h-4 w-4" />,
                    variant: 'outline',
                    onClick: () => router.get(route('referral.index')),
                },
            ]}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Total Referred Users')}</p>
                                    <p className="mt-2 text-2xl font-bold">{referredUsers.total}</p>
                                </div>
                                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Users with Plans')}</p>
                                    <p className="mt-2 text-2xl font-bold">{referredUsers.data.filter((user) => user.plan).length}</p>
                                </div>
                                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Total Commission Earned')}</p>
                                    <p className="mt-2 text-2xl font-bold">
                                        {currencySymbol}
                                        {(referredUsers.data.reduce((total, user) => total + getTotalCommission(user), 0) || 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                                    <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">{translate('Referred Users List')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {referredUsers.data.length === 0 ? (
                            <div className="py-12 text-center">
                                <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                                <p className="text-muted-foreground mb-2 text-base font-semibold">{translate('No referred users yet')}</p>
                                <p className="text-muted-foreground text-sm">
                                    {userType === 'super_admin'
                                        ? translate('No users have registered using referral codes yet.')
                                        : translate('Share your referral link to start earning commissions.')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {referredUsers.data.map((user) => (
                                    <div key={user.id} className="rounded-lg border p-4 transition-shadow hover:shadow-md">
                                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                            <div className="flex min-w-0 flex-1 items-start space-x-3 rtl:space-x-reverse">
                                                <div className="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                                                    <span className="text-primary text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold" title={user.name}>
                                                        {user.name}
                                                    </p>
                                                    <p className="text-muted-foreground mb-2 truncate text-sm" title={user.email}>
                                                        {user.email}
                                                    </p>
                                                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                                        <Calendar className="text-muted-foreground h-4 w-4" />
                                                        <span className="text-muted-foreground truncate text-xs">
                                                            {translate('Registered')}{' '}
                                                            {window.appSettings?.formatDateTimeSimple(user.created_at, false) ||
                                                                new Date(user.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex w-full flex-shrink-0 flex-row justify-between gap-6 sm:w-auto sm:items-start sm:justify-end">
                                                <div className="text-start sm:text-end">
                                                    {(() => {
                                                        const planInfo = getPlanDisplayInfo(user);
                                                        return planInfo ? (
                                                            <div>
                                                                <Badge variant="default" className="mb-1.5">
                                                                    {planInfo.name}
                                                                </Badge>
                                                                <p className="text-muted-foreground text-sm">
                                                                    {currencySymbol}
                                                                    {planInfo.price}/{translate(planInfo.cycle)}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="secondary">{translate('No Plan')}</Badge>
                                                        );
                                                    })()}
                                                </div>

                                                {getTotalCommission(user) > 0 && (
                                                    <div className="min-w-[80px] text-end">
                                                        <p className="text-sm font-semibold text-green-600">
                                                            +{currencySymbol}
                                                            {getTotalCommission(user)?.toFixed(2)}
                                                        </p>
                                                        <p className="text-muted-foreground mt-1 text-xs">{translate('Commission')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {user.referrals && user.referrals.length > 0 && (
                                            <div className="mt-4 border-t pt-4">
                                                <p className="mb-2 text-sm font-semibold">{translate('Commission History')}</p>
                                                <div className="space-y-2">
                                                    {user.referrals.map((referral) => (
                                                        <div key={referral.id} className="flex items-center justify-between">
                                                            <span className="text-muted-foreground text-sm">
                                                                {referral.commission_percentage}% {translate('commission')}
                                                            </span>
                                                            <span className="text-sm font-semibold text-green-600">
                                                                +{currencySymbol}
                                                                {referral.amount}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {referredUsers.last_page > 1 && (
                    <Pagination
                        className="rounded-lg"
                        from={referredUsers.from}
                        to={referredUsers.to}
                        total={referredUsers.total}
                        links={referredUsers.links}
                        currentPage={referredUsers.current_page}
                        lastPage={referredUsers.last_page}
                        entityName={translate('users')}
                        onPageChange={(url) => {
                            router.visit(url, {
                                preserveState: true,
                                preserveScroll: true,
                            });
                        }}
                    />
                )}
            </div>
        </PageTemplate>
    );
}
