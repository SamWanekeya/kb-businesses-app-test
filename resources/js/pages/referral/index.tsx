import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import PayoutRequests from '@pages/referral/components/payout-requests';
import ReferralDashboard from '@pages/referral/components/referral-dashboard';
import ReferralSettings from '@pages/referral/components/referral-settings';
import ReferredUsersSection from '@pages/referral/components/referred-users-section';
import { BarChart3, DollarSign, Settings as SettingsIcon, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

export default function Referral() {
    const { t: translate } = useTranslation();
    const { props } = usePage();
    const { userType, settings, stats, payoutRequests, referralLink, usersWithPlans, currencySymbol, globalSettings } = props as any;
    const [activeSection, setActiveSection] = useState('dashboard');

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Referral Program') }];
    const sidebarNavItems: NavItem[] = [
        {
            title: translate('Dashboard'),
            href: '#dashboard',
            icon: <BarChart3 className="me-2 h-4 w-4" />,
        },
        {
            title: translate('Referred Users'),
            href: '#referred-users',
            icon: <Users className="me-2 h-4 w-4" />,
        },
        {
            title: translate('Payout Requests'),
            href: '#payout-requests',
            icon: <DollarSign className="me-2 h-4 w-4" />,
        },
        ...(userType === 'super_admin'
            ? [
                  {
                      title: translate('Settings'),
                      href: '#settings',
                      icon: <SettingsIcon className="me-2 h-4 w-4" />,
                  },
              ]
            : []),
    ];

    const dashboardRef = useRef<HTMLDivElement>(null);
    const referredUsersRef = useRef<HTMLDivElement>(null);
    const payoutRequestsRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100;

            const dashboardPosition = dashboardRef.current?.offsetTop || 0;
            const referredUsersPosition = referredUsersRef.current?.offsetTop || 0;
            const payoutRequestsPosition = payoutRequestsRef.current?.offsetTop || 0;
            const settingsPosition = settingsRef.current?.offsetTop || 0;

            if (userType === 'super_admin' && scrollPosition >= settingsPosition) {
                setActiveSection('settings');
            } else if (scrollPosition >= payoutRequestsPosition) {
                setActiveSection('payout-requests');
            } else if (scrollPosition >= referredUsersPosition) {
                setActiveSection('referred-users');
            } else {
                setActiveSection('dashboard');
            }
        };

        window.addEventListener('scroll', handleScroll);

        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const element = document.getElementById(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                setActiveSection(hash);
            }
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [userType]);

    // Force layout recalculation on mount to fix issues where navigating back
    // from another module leaves responsive components (like tables) stuck at the previous size.
    useEffect(() => {
        const triggerResize = () => {
            window.dispatchEvent(new Eventranslate('resize'));
        };

        const timers = [setTimeout(triggerResize, 0), setTimeout(triggerResize, 100), setTimeout(triggerResize, 300)];

        return () => {
            timers.forEach(clearTimeout);
        };
    }, []);

    const handleNavClick = (href: string) => {
        const id = href.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    return (
        <PageTemplate
            breadcrumbs={breadcrumbs}
            title={translate('Referral Program')}
            url="/referral"
            description={translate('Manage your referral program.')}
        >
            <style>{`
        @media (min-width: 1280px) {
          [data-slot="sidebar-inset"] {
            overflow-x: clip !important;
          }
        }
      `}</style>

            <div className="flex w-full flex-col gap-8 xl:flex-row xl:items-start">
                {/* Sidebar Navigation */}
                <div className="z-10 w-full flex-shrink-0 xl:sticky xl:top-20 xl:w-64 xl:self-start">
                    <div className="flex flex-col justify-center gap-2 rounded-lg border bg-white p-3 shadow dark:bg-gray-900">
                        {sidebarNavItems.map((item) => (
                            <Button
                                key={item.href}
                                variant="ghost"
                                className={cn('w-full justify-start text-sm', {
                                    'bg-muted font-semibold': activeSection === item.href.replace('#', ''),
                                })}
                                onClick={() => handleNavClick(item.href)}
                            >
                                {item.icon}
                                {item.title}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <section id="dashboard" ref={dashboardRef} className="mb-8">
                        <h2 className="mb-4 text-xl font-semibold">{translate('Dashboard')}</h2>
                        <ReferralDashboard
                            userType={userType}
                            stats={stats}
                            referralLink={referralLink}
                            recentReferredUsers={props.recentReferredUsers}
                            currencySymbol={currencySymbol}
                        />
                    </section>

                    <section id="referred-users" ref={referredUsersRef} className="mb-8">
                        <h2 className="mb-4 text-xl font-semibold">{translate('Referred Users')}</h2>
                        <ReferredUsersSection
                            referredUsers={props.referredUsers}
                            usersWithPlans={props.usersWithPlans}
                            totalCommissionEarned={props.totalCommissionEarned}
                            userType={userType}
                            currencySymbol={currencySymbol}
                        />
                    </section>

                    <section id="payout-requests" ref={payoutRequestsRef} className="mb-8">
                        <h2 className="mb-4 text-xl font-semibold">{translate('Payout Requests')}</h2>
                        <PayoutRequests
                            userType={userType}
                            payoutRequests={payoutRequests}
                            settings={settings}
                            stats={stats}
                            currencySymbol={currencySymbol}
                        />
                    </section>

                    {userType === 'super_admin' && (
                        <section id="settings" ref={settingsRef} className="mb-8">
                            <h2 className="mb-4 text-xl font-semibold">{translate('Settings')}</h2>
                            <ReferralSettings settings={settings} currencySymbol={currencySymbol} globalSettings={globalSettings} />
                        </section>
                    )}
                </div>
            </div>
            <Toaster />
        </PageTemplate>
    );
}
