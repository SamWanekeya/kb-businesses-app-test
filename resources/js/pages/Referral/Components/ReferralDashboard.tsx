import { toast } from '@components/CustomToast';
import { Avatar, AvatarFallback, AvatarImage } from '@components/UserInterface/Avatar';
import { Button } from '@components/UserInterface/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/UserInterface/Card';
import { Input } from '@components/UserInterface/Input';
import useInitials from '@hooks/useInitials';
import { Award, Calendar, Check, Clock, Copy, DollarSign, Mail, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ReferralDashboardProps {
    userType: string;
    stats: any;
    referralLink?: string;
    recentReferredUsers?: any[];
    currencySymbol?: string;
}

export default function ReferralDashboard({ userType, stats, referralLink, recentReferredUsers, currencySymbol }: ReferralDashboardProps) {
    const { t: translate } = useTranslation();
    const getInitials = useInitials();

    const [copied, setCopied] = useState(false);

    const copyReferralLink = async () => {
        if (referralLink) {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            toast.success(translate('Referral link copied to clipboard'));
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (userType === 'super_admin') {
        return (
            <div className="space-y-4">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 min-[1550px]:grid-cols-4 sm:grid-cols-2">
                    <Card className="border-l-4 border-l-blue-500 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Total Referral Users')}</p>
                                    <h3 className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalReferralUsers}</h3>
                                    <p className="text-muted-foreground mt-1 text-xs">{translate('Registered users')}</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Pending Payouts')}</p>
                                    <h3 className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pendingPayouts}</h3>
                                    <p className="text-muted-foreground mt-1 text-xs">{translate('Awaiting approval')}</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Total Commission Paid')}</p>
                                    <h3 className="mt-1 font-mono text-2xl font-bold text-green-600 dark:text-green-400">
                                        {currencySymbol}
                                        {stats.totalCommissionPaid}
                                    </h3>
                                    <p className="text-muted-foreground mt-1 text-xs">{translate('Total payouts')}</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 transition-shadow duration-300 hover:shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">{translate('Active Organizations')}</p>
                                    <h3 className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {stats.topOrganizations?.length || 0}
                                    </h3>
                                    <p className="text-muted-foreground mt-1 text-xs">{translate('Referring organizations')}</p>
                                </div>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 gap-4 min-[1550px]:grid-cols-2">
                    <Card className="transition-shadow duration-300 hover:shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 pb-3 dark:from-blue-950/20 dark:to-purple-950/20">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">{translate('Top Referring Organizations')}</CardTitle>
                                    <CardDescription className="text-xs">{translate('Organizations with most referrals')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {stats.topOrganizations && stats.topOrganizations.length > 0 ? (
                                <div className="space-y-2">
                                    {stats.topOrganizations.slice(0, 5).map((organization: any, index: number) => (
                                        <div
                                            key={organization.id}
                                            className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center space-x-3">
                                                <Avatar className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                                                    <AvatarImage src={organization?.avatar} alt={organization?.name} />
                                                    <AvatarFallback className="text-lg">{getInitials(organization?.name)}</AvatarFallback>
                                                </Avatar>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">{organization.name}</p>
                                                    <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                                        <Mail className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{organization.email}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ms-3 shrink-0 text-end">
                                                <div className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400">
                                                    <Users className="h-4 w-4" />
                                                    {organization.referral_count}
                                                </div>
                                                <p className="font-mono text-xs font-medium text-green-600 dark:text-green-400">
                                                    {currencySymbol}
                                                    {organization.total_earned || 0}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <Award className="text-muted-foreground mx-auto mb-2 h-10 w-10 opacity-50" />
                                    <p className="text-muted-foreground text-sm font-medium">{translate('No organizations yet')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="transition-shadow duration-300 hover:shadow-lg">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 pb-3 dark:from-green-950/20 dark:to-emerald-950/20">
                            <div className="flex items-center gap-2">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">{translate('Monthly Performance')}</CardTitle>
                                    <CardDescription className="text-xs">{translate('This year statistics')}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3 dark:border-blue-800 dark:from-blue-950/30 dark:to-blue-900/20">
                                    <div className="mb-1 flex items-center justify-between">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">{translate('Referral Signups')}</p>
                                        <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {typeof stats.monthlyReferrals === 'object'
                                            ? Object.values(stats.monthlyReferrals || {}).reduce((a: any, b: any) => a + b, 0)
                                            : stats.monthlyReferrals || 0}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300">
                                        <Calendar className="h-3 w-3" />
                                        {translate('Total this year')}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-3 dark:border-green-800 dark:from-green-950/30 dark:to-green-900/20">
                                    <div className="mb-1 flex items-center justify-between">
                                        <p className="text-sm font-medium text-green-900 dark:text-green-100">{translate('Payouts Processed')}</p>
                                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="font-mono text-2xl font-bold text-green-600 dark:text-green-400">
                                        {currencySymbol}
                                        {typeof stats.monthlyPayouts === 'object'
                                            ? Object.values(stats.monthlyPayouts || {}).reduce((a: any, b: any) => a + b, 0)
                                            : stats.monthlyPayouts || 0}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-green-700 dark:text-green-300">
                                        <Calendar className="h-3 w-3" />
                                        {translate('Total this year')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 min-[1550px]:grid-cols-4 sm:grid-cols-2">
                <Card className="border-l-4 border-l-green-500 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Total Referrals')}</p>
                                <h3 className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalReferrals}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">{translate('All referrals')}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Referred Users')}</p>
                                <h3 className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.referredUsersCount || 0}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">{translate('Active users')}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Total Earned')}</p>
                                <h3 className="mt-1 font-mono text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {currencySymbol}
                                    {stats.totalEarned}
                                </h3>
                                <p className="text-muted-foreground mt-1 text-xs">{translate('Commission earned')}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500 transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">{translate('Available Balance')}</p>
                                <h3 className="mt-1 font-mono text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {currencySymbol}
                                    {stats.availableBalance.toFixed(2)}
                                </h3>
                                <p className="text-muted-foreground mt-1 text-xs">{translate('Ready to withdraw')}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 gap-4 min-[1550px]:grid-cols-2">
                <Card className="transition-shadow duration-300 hover:shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3 dark:from-blue-950/20 dark:to-indigo-950/20">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Copy className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">{translate('Your Referral Link')}</CardTitle>
                                <CardDescription className="text-xs">{translate('Share and earn commissions')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex space-x-2">
                            <Input value={referralLink || ''} readOnly className="min-w-0 flex-1 font-mono text-sm" />
                            <Button onClick={copyReferralLink} variant="outline" size="icon" className="shrink-0">
                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <p className="text-muted-foreground bg-muted/50 mt-2 rounded-lg p-2 text-xs">
                            {translate('Share this link to earn commissions when users sign up and purchase plans')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="transition-shadow duration-300 hover:shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-3 dark:from-purple-950/20 dark:to-pink-950/20">
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-semibold">{translate('Recent Referred Users')}</CardTitle>
                                <CardDescription className="text-xs">{translate('Latest referrals')}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {recentReferredUsers && recentReferredUsers.length > 0 ? (
                            <div className="space-y-2">
                                {recentReferredUsers.map((user: any) => (
                                    <div
                                        key={user.id}
                                        className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center space-x-3">
                                            {user.avatar ? (
                                                <Avatar className="h-8 w-8 shrink-0 rounded-full object-cover">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                                                    <span className="text-xs font-semibold text-white">{user.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold">{user.name}</p>
                                                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ms-3 shrink-0 text-end">
                                            <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                                                {user?.plan?.name || translate('No Plan')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center">
                                <Users className="text-muted-foreground mx-auto mb-2 h-10 w-10 opacity-50" />
                                <p className="text-muted-foreground mb-1 text-sm font-medium">{translate('No referred users yet')}</p>
                                <p className="text-muted-foreground text-xs">{translate('Share your link to get started')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
