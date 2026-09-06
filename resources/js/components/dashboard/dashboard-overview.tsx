import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { ArrowRight, Briefcase, Building2, CreditCard, Sparkles, Target, TicketPercent, TrendingUp, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DashboardOverviewProps {
    userType: 'super_admin' | 'organization';
    stats: any;
}

export function DashboardOverview({ userType, stats }: DashboardOverviewProps) {
    const { t: translate } = useTranslation();

    const superAdminFeatures = [
        {
            title: translate('Organization Management'),
            description: translate('Manage all registered organizations and their subscriptions'),
            icon: Building2,
            color: 'blue',
            href: route('organizations.index'),
            count: stats?.totalOrganizations || 0,
        },
        {
            title: translate('Plan Management'),
            description: translate('Create and manage subscription plans'),
            icon: CreditCard,
            color: 'purple',
            href: route('plans.index'),
            count: stats?.activePlans || 0,
        },
        {
            title: translate('Subscription Management'),
            description: translate('Monitor and manage all system subscriptions'),
            icon: Wallet,
            color: 'green',
            href: route('plan-orders.index'),
            count: stats?.totalSubscriptions || 0,
        },
        {
            title: translate('Coupon Management'),
            description: translate('Manage all coupons'),
            icon: TicketPercent,
            color: 'orange',
            href: route('coupons.index'),
            count: stats?.activeCoupons || 0,
        },
    ];

    const organizationFeatures = [
        {
            title: translate('Lead Management'),
            description: translate('Track and manage your sales leads'),
            icon: Target,
            color: 'green',
            href: route('leads.index'),
            count: stats?.totalLeads || 0,
        },
        {
            title: translate('Sales Tracking'),
            description: translate('Monitor your sales performance'),
            icon: TrendingUp,
            color: 'purple',
            href: route('sales-orders.index'),
            count: stats?.totalSales || 0,
        },
        {
            title: translate('Customer Base'),
            description: translate('Manage your customer relationships'),
            icon: Building2,
            color: 'orange',
            href: route('accounts.index'),
            count: stats?.totalCustomers || 0,
        },
        {
            title: translate('Project Portfolio'),
            description: translate('Track your active projects'),
            icon: Briefcase,
            color: 'blue',
            href: route('projects.index'),
            count: stats?.totalProjects || 0,
        },
    ];

    const features = userType === 'super_admin' ? superAdminFeatures : organizationFeatures;

    const getColorClasses = (color: string) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
            green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400',
            purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
            orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400',
        };
        return colors[color as keyof typeof colors] || colors.blue;
    };

    return (
        <Card className="border-primary/20 border-2 border-dashed">
            <CardHeader className="pb-4 text-center">
                <div className="mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="text-primary h-5 w-5" />
                    <CardTitle className="text-xl font-semibold">{translate('Features')}</CardTitle>
                </div>
                <p className="text-muted-foreground text-base">
                    {userType === 'super_admin'
                        ? translate('Comprehensive system management and oversight tools')
                        : translate('Everything you need to manage your digital organization presence')}
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {features.map((feature) => {
                        const IconComponent = feature.icon;
                        return (
                            <Link key={feature.title} href={feature.href} className="group relative">
                                <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-md">
                                    <CardContent className="p-4">
                                        <div className="mb-3 flex items-start justify-between">
                                            <div className={`rounded-full p-2 ${getColorClasses(feature.color)}`}>
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-sm font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset">
                                                {feature.count}
                                            </span>
                                        </div>
                                        <h3 className="group-hover:text-primary mb-1 text-base font-semibold transition-colors">{feature.title}</h3>
                                        <p className="text-muted-foreground mb-3 text-sm">{feature.description}</p>
                                        <div className="text-muted-foreground group-hover:text-primary flex items-center justify-between text-sm transition-colors">
                                            <span>{translate('Explore')}</span>
                                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>

                {/* Additional Info */}
                <div className="mt-4 text-center">
                    <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3 py-1.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-sm font-medium">
                            {userType === 'super_admin'
                                ? translate('System growing at {{growth}}% monthly', { growth: stats?.monthlyGrowth || 0 })
                                : translate('Your organization growing at {{growth}}% monthly', { growth: stats?.monthlyGrowth || 0 })}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
