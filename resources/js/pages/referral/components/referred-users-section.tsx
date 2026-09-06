import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { useInitials } from '@/hooks/use-initials';
import { router } from '@inertiajs/react';
import { Calendar, CheckCircle, DollarSign, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReferredUser {
    id: number;
    name: string;
    email: string;
    created_at: string;
    avatar: string | null;
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

interface ReferredUsersSectionProps {
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
    usersWithPlans: number;
    totalCommissionEarned: number;
    userType: string;
    currencySymbol: string;
}

export default function ReferredUsersSection({
    referredUsers,
    usersWithPlans,
    totalCommissionEarned,
    userType,
    currencySymbol,
}: ReferredUsersSectionProps) {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();

    const getTotalCommission = (user: ReferredUser) => {
        return user.referrals?.reduce((total, referral) => total + (Number(referral.amount) || 0), 0) || 0;
    };

    const getTotalCommissionAll = () => {
        return referredUsers.data.reduce((total, user) => total + getTotalCommission(user), 0) || 0;
    };

    const getPlanDisplayInfo = (user: ReferredUser) => {
        if (!user.plan) return null;

        const latestOrder = user.plan_orders?.[0];

        if (latestOrder) {
            const isYearly = latestOrder.billing_cycle === 'yearly';
            return {
                name: user.plan.name,
                price: latestOrder.final_price,
                cycle: isYearly ? 'year' : 'month',
            };
        }

        return {
            name: user.plan.name,
            price: user.plan.price,
            cycle: 'month',
        };
    };

    return (
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
                                <p className="mt-2 text-2xl font-bold">{usersWithPlans}</p>
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
                                <p className="mt-2 font-mono text-2xl font-bold">
                                    {currencySymbol}
                                    {(totalCommissionEarned || 0).toFixed(2)}
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
                                        <div className="flex min-w-0 flex-1 items-start space-x-3">
                                            <div className="bg-primary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                                                {user?.avatar ? (
                                                    <Avatar className="h-12 w-12 shrink-0 rounded-full object-cover">
                                                        <AvatarImage src={user.avatar} />
                                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <span className="text-primary text-sm font-medium">{user.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold" title={user.name}>
                                                    {user.name}
                                                </p>
                                                <p className="text-muted-foreground mb-2 truncate text-sm" title={user.email}>
                                                    {user.email}
                                                </p>
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="text-muted-foreground h-4 w-4" />
                                                    <span className="text-muted-foreground truncate text-xs">
                                                        {translate('Registered')}{' '}
                                                        {window.appSettings?.formatDateTime(user.created_at, false) ||
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
                                                            <span className="mb-1.5 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset">
                                                                {planInfo.name}
                                                            </span>
                                                            <p className="text-muted-foreground font-mono text-sm">
                                                                {currencySymbol}
                                                                {planInfo.price}/{translate(planInfo.cycle)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">
                                                            {translate('No Plan')}
                                                        </span>
                                                    );
                                                })()}
                                            </div>

                                            {getTotalCommission(user) > 0 && (
                                                <div className="min-w-[80px] text-end">
                                                    <p className="font-mono text-sm font-semibold text-green-600">
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
                                                        <span className="font-mono text-sm font-semibold text-green-600">
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
                            only: ['referredUsers'],
                        });
                    }}
                    hidePerPage={true}
                />
            )}
        </div>
    );
}
