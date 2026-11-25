import { route } from '@/utils/Routes';
import PageTemplate from '@components/PageTemplate';
import { ScrollArea } from '@components/UserInterface/ScrollArea';
import Toaster from '@components/UserInterface/Toaster';
import { usePage } from '@inertiajs/react';
import { cn } from '@lib/utils';
import {
    Bell,
    Brain,
    Calendar,
    Cookie,
    CreditCard,
    Currency,
    FileText,
    HardDrive,
    type LucideIcon,
    MessagesCircle,
    MessageSquare,
    Palette,
    Settings as SettingsIcon,
    Shield,
    ShoppingBag,
    Webhook,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BrandSettings from '@pages/Settings/BrandSettings';
import CacheSettings from '@pages/Settings/CacheSettings';
import CookieSettings from '@pages/Settings/CookieSettings';
import CurrencySettings from '@pages/Settings/CurrencySettings';
import KakbimaIntelligenceSettings from '@pages/Settings/KakbimaIntelligenceSettings';
import SystemSettings from '@pages/Settings/SystemSettings';
// import EmailSettings from '@pages/Settings/EmailSettings';
import EmailNotificationSettings from '@pages/Settings/EmailNotificationSettings';
import GoogleCalendarSettings from '@pages/Settings/GoogleCalendarSettings';
import InvoiceTemplateSettings from '@pages/Settings/InvoiceTemplateSettings';
import PaymentSettings from '@pages/Settings/PaymentSettings/PaymentSettings';
import QuoteTemplateSettings from '@pages/Settings/QuoteTemplateSettings';
import RecaptchaSettings from '@pages/Settings/RecaptchaSettings';
import SalesOrderTemplateSettings from '@pages/Settings/SalesOrderTemplateSettings';
import SlackNotificationSettings from '@pages/Settings/SlackNotificationSettings';
import StorageSettings from '@pages/Settings/StorageSettings';
import TwilioNotificationSettings from '@pages/Settings/TwilioNotificationSettings';
import WebhookSettings from '@pages/Settings/WebhookSettings';

interface SettingsNavigationItem {
    title: string;
    href: `#${string}`;
    icon: LucideIcon;
    requiredPermission?: string;
}

const ORGANIZATION_SETTINGS_PERMISSIONS = [
    'manage-system-settings',
    'manage-email-settings',
    'manage-brand-settings',
    'manage-currency-settings',
    'manage-webhook-settings',
    'manage-email-notification-settings',
    'manage-twilio-notification-settings',
    'manage-slack-notification-settings',
    'manage-quotes-settings',
    'manage-sales-order-settings',
    'manage-invoice-settings',
    'manage-google-calendar-settings',
    'manage-settings',
] as const;

const SUPER_ADMIN_EXCLUDED_PERMISSIONS = [
    'manage-webhook-settings',
    'manage-email-notification-settings',
    'manage-twilio-notification-settings',
    'manage-slack-notification-settings',
    'manage-quotes-settings',
    'manage-sales-order-settings',
    'manage-invoice-settings',
    'manage-google-calendar-settings',
] as const;

/**
 * Settings
 *
 * Provides the application settings workspace, including permission-aware
 * navigation and the existing settings forms.
 *
 * Responsibilities:
 * - Render settings available to the current user.
 * - Synchronize section navigation with scrolling and URL fragments.
 * - Preserve existing child-component contracts and settings behavior.
 *
 * Accessibility:
 * - Uses a named navigation landmark and semantic section headings.
 * - Supports native anchor navigation and visible keyboard focus.
 * - Respects reduced-motion preferences when scrolling.
 *
 * Performance:
 * - Memoizes translated navigation configuration.
 * - Uses IntersectionObserver instead of continuously calculating layout
 *   positions in a scroll event handler.
 *
 * Extension points:
 * - Add new navigation metadata and a corresponding permission-guarded
 *   section when introducing another settings category.
 */
export default function Settings() {
    const { t: translate } = useTranslation();

    const {
        systemSettings = {},
        cacheSize = '0.00',
        timeZones = {},
        dateFormats = {},
        timeFormats = {},
        paymentSettings = {},
        auth,
    } = usePage().props;

    const [activeSection, setActiveSection] = useState('system-settings');

    const userType = auth?.user?.type;
    const EMPTY_PERMISSIONS: string[] = [];
    const permissions = auth?.permissions ?? EMPTY_PERMISSIONS;

    const isSuperAdmin = userType === 'super_admin';
    const isOrganization = userType === 'organization';

    /**
     * Navigation metadata is kept separate from rendering so labels,
     * anchors, icons, and permission requirements remain easy to audit.
     */
    const navigationItems = useMemo<SettingsNavigationItem[]>(
        () => [
            {
                title: translate('System'),
                href: '#system-settings',
                icon: SettingsIcon,
                requiredPermission: 'manage-system-settings',
            },
            {
                title: translate('Branding'),
                href: '#brand-settings',
                icon: Palette,
                requiredPermission: 'manage-brand-settings',
            },
            {
                title: translate('Currency'),
                href: '#currency-settings',
                icon: Currency,
                requiredPermission: 'manage-currency-settings',
            },
            {
                title: translate('Google Calendar'),
                href: '#google-calendar-settings',
                icon: Calendar,
                requiredPermission: 'manage-google-calendar-settings',
            },
            // {
            //     title: translate('Email address'),
            //     href: '#email-settings',
            //     icon: Mail,
            //     requiredPermission: 'manage-email-settings'
            // },
            {
                title: translate('Email notification'),
                href: '#email-notification-settings',
                icon: Bell,
                requiredPermission: 'manage-email-notification-settings',
            },
            {
                title: translate('Twilio'),
                href: '#twilio-notification-settings',
                icon: MessageSquare,
                requiredPermission: 'manage-twilio-notification-settings',
            },
            {
                title: translate('Slack'),
                href: '#slack-notification-settings',
                icon: MessagesCircle,
                requiredPermission: 'manage-slack-notification-settings',
            },
            {
                title: translate('Quote templates'),
                href: '#quote-templates',
                icon: FileText,
                requiredPermission: 'manage-quotes-settings',
            },
            {
                title: translate('Sales order templates'),
                href: '#sales-order-templates',
                icon: ShoppingBag,
                requiredPermission: 'manage-sales-order-settings',
            },
            {
                title: translate('Invoice templates'),
                href: '#invoice-templates',
                icon: FileText,
                requiredPermission: 'manage-invoice-settings',
            },

            {
                title: translate('Payment'),
                href: '#payment-settings',
                icon: CreditCard,
                requiredPermission: 'manage-payment-settings',
            },
            {
                title: translate('Storage'),
                href: '#storage-settings',
                icon: HardDrive,
                requiredPermission: 'manage-storage-settings',
            },
            {
                title: translate('Google reCAPTCHA'),
                href: '#recaptcha-settings',
                icon: Shield,
                requiredPermission: 'manage-recaptcha-settings',
            },
            {
                title: translate('Kakbima Intelligence'),
                href: '#kakbima-intelligence-settings',
                icon: Brain,
                requiredPermission: 'manage-kakbima-intelligence-settings',
            },
            {
                title: translate('Cookie'),
                href: '#cookie-settings',
                icon: Cookie,
                requiredPermission: 'manage-cookie-settings',
            },
            {
                title: translate('Cache'),
                href: '#cache-settings',
                icon: HardDrive,
                requiredPermission: 'manage-cache-settings',
            },
            {
                title: translate('Webhook'),
                href: '#webhook-settings',
                icon: Webhook,
                requiredPermission: 'manage-webhook-settings',
            },
        ],
        [translate],
    );

    /**
     * Mirrors the existing sidebar visibility rules.
     *
     * Special role exclusions take precedence over ordinary permission
     * checks. Organization users retain the existing fallback allowlist.
     */
    const sidebarNavItems = useMemo(
        () =>
            navigationItems.filter((item) => {
                const permission = item.requiredPermission;

                if (!permission) {
                    return true;
                }

                if (isSuperAdmin && SUPER_ADMIN_EXCLUDED_PERMISSIONS.includes(permission as (typeof SUPER_ADMIN_EXCLUDED_PERMISSIONS)[number])) {
                    return false;
                }

                if (permissions.includes(permission)) {
                    return true;
                }

                if (isOrganization) {
                    return ORGANIZATION_SETTINGS_PERMISSIONS.includes(permission as (typeof ORGANIZATION_SETTINGS_PERMISSIONS)[number]);
                }

                return false;
            }),
        [isOrganization, isSuperAdmin, navigationItems, permissions],
    );

    /**
     * Update the active anchor only when its value changes.
     * This avoids unnecessary renders when observers report repeatedly.
     */
    const updateActiveSection = useCallback((sectionId: string) => {
        setActiveSection((current) => (current === sectionId ? current : sectionId));
    }, []);

    /**
     * Observe rendered sections rather than maintaining a separate ref
     * for every settings component.
     *
     * Missing sections are ignored, which is important because section
     * visibility depends on the current user's role and permissions.
     */
    useEffect(() => {
        const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-settings-section]'));

        if (sections.length === 0) {
            return;
        }

        const visibleSections = new Map<string, number>();

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const sectionId = entry.target.id;

                    if (entry.isIntersecting) {
                        visibleSections.set(sectionId, entry.intersectionRatio);
                    } else {
                        visibleSections.delete(sectionId);
                    }
                }

                const currentSection = [...visibleSections.entries()].sort((first, second) => {
                    return second[1] - first[1];
                })[0]?.[0];

                if (currentSection) {
                    updateActiveSection(currentSection);
                }
            },
            {
                rootMargin: '-12% 0px -65% 0px',
                threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
            },
        );

        sections.forEach((section) => observer.observe(section));

        return () => {
            observer.disconnect();
        };
    }, [updateActiveSection]);

    /**
     * Honor direct links to settings sections.
     * The section must exist in the rendered DOM before scrolling.
     */
    useEffect(() => {
        const hash = window.location.hash.slice(1);

        if (!hash) {
            return;
        }

        const target = document.getElementById(hash);

        if (!target?.hasAttribute('data-settings-section')) {
            return;
        }

        updateActiveSection(hash);

        target.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start',
        });
    }, [updateActiveSection]);

    /**
     * Keep the URL fragment and selected navigation item synchronized.
     * Native anchors remain usable without JavaScript.
     */
    const handleNavigation = useCallback(
        (sectionId: string) => {
            updateActiveSection(sectionId);

            const target = document.getElementById(sectionId);

            if (!target) {
                return;
            }

            target.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                block: 'start',
            });
        },
        [updateActiveSection],
    );

    const breadcrumbs = useMemo(
        () => [
            {
                title: translate('Settings'),
                href: route('settings.index'),
            },
        ],
        [translate],
    );

    return (
        <PageTemplate
            title={translate('Settings')}
            description={translate('Manage system configuration, integrations, and workspace defaults.')}
            url="/settings"
            breadcrumbs={breadcrumbs}
        >
            <div className="min-w-0 space-y-8">
                {/* Settings layout */}
                <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
                    {/* Settings navigation */}
                    <aside className="min-w-0 lg:sticky lg:top-20 lg:w-60 lg:shrink-0">
                        <nav aria-label={translate('Settings navigation')}>
                            <div className="mb-3 hidden px-3 lg:block">
                                <span className="text-muted-foreground text-xs font-medium">{translate('Your organization preferences')}</span>
                            </div>

                            <ScrollArea className="w-full lg:h-[calc(100dvh-12rem)]">
                                <ul className="flex min-w-0 gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0">
                                    {sidebarNavItems.map((item) => {
                                        const sectionId = item.href.slice(1);
                                        const isActive = activeSection === sectionId;
                                        const Icon = item.icon;

                                        return (
                                            <li key={item.href} className="shrink-0 lg:w-full">
                                                <a
                                                    href={item.href}
                                                    aria-current={isActive ? 'location' : undefined}
                                                    onClick={(event) => {
                                                        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                                                            return;
                                                        }

                                                        event.preventDefault();
                                                        handleNavigation(sectionId);

                                                        window.history.replaceState(null, '', item.href);
                                                    }}
                                                    className={cn(
                                                        'flex h-10 items-center gap-3 rounded-full px-4',
                                                        'text-sm font-medium whitespace-nowrap',
                                                        'transition-colors duration-150',
                                                        'motion-reduce:transition-none',
                                                        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',

                                                        // Default state
                                                        'text-muted-foreground hover:bg-muted hover:text-foreground',

                                                        // Active state
                                                        isActive && [
                                                            'border-primary/20 bg-primary/10 text-primary font-medium',
                                                            'hover:border-primary/20 hover:bg-primary/10 hover:text-primary',
                                                            'dark:text-fuchsia-300 dark:hover:text-fuchsia-300',
                                                        ],
                                                    )}
                                                >
                                                    <Icon aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />

                                                    <span className="min-w-0 truncate">{item.title}</span>
                                                </a>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </ScrollArea>
                        </nav>
                    </aside>

                    {/* Settings content */}
                    <main className="min-w-0 flex-1 space-y-8">
                        {(permissions.includes('manage-system-settings') || isSuperAdmin) && (
                            <section
                                id="system-settings"
                                data-settings-section="true"
                                aria-labelledby="system-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="system-settings-heading" className="sr-only">
                                    {translate('System')}
                                </h2>

                                <SystemSettings
                                    settings={systemSettings}
                                    timeZones={timeZones}
                                    dateFormats={dateFormats}
                                    timeFormats={timeFormats}
                                    isOrganizationUser={isOrganization}
                                />
                            </section>
                        )}

                        {(permissions.includes('manage-brand-settings') || isSuperAdmin) && (
                            <section
                                id="brand-settings"
                                data-settings-section="true"
                                aria-labelledby="brand-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="brand-settings-heading" className="sr-only">
                                    {translate('Branding')}
                                </h2>

                                <BrandSettings settings={systemSettings} />
                            </section>
                        )}

                        {(permissions.includes('manage-currency-settings') || isSuperAdmin) && (
                            <section
                                id="currency-settings"
                                data-settings-section="true"
                                aria-labelledby="currency-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="currency-settings-heading" className="sr-only">
                                    {translate('Currency')}
                                </h2>

                                <CurrencySettings />
                            </section>
                        )}

                        {isOrganization && permissions.includes('manage-google-calendar-settings') && (
                            <section
                                id="google-calendar-settings"
                                data-settings-section="true"
                                aria-labelledby="google-calendar-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="google-calendar-settings-heading" className="sr-only">
                                    {translate('Google Calendar')}
                                </h2>

                                <GoogleCalendarSettings settings={GoogleCalendarSettings} />
                            </section>
                        )}

                        {/*{(permissions.includes('manage-email-settings') ||
                isSuperAdmin) && (
                <section
                    id="email-settings"
                    data-settings-section="true"
                    aria-labelledby="email-settings-heading"
                    className="scroll-mt-24"
                >
                    <h2 id="email-settings-heading" className="sr-only">
                        {translate('Email address')}
                    </h2>

                    <EmailSettings />
                </section>
            )}*/}

                        {isOrganization && permissions.includes('manage-email-notification-settings') && (
                            <section
                                id="email-notification-settings"
                                data-settings-section="true"
                                aria-labelledby="email-notification-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="email-notification-settings-heading" className="sr-only">
                                    {translate('Email notification')}
                                </h2>

                                <EmailNotificationSettings />
                            </section>
                        )}

                        {isOrganization && permissions.includes('manage-twilio-notification-settings') && (
                            <section
                                id="twilio-notification-settings"
                                data-settings-section="true"
                                aria-labelledby="twilio-notification-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="twilio-notification-settings-heading" className="sr-only">
                                    {translate('Twilio')}
                                </h2>

                                <TwilioNotificationSettings />
                            </section>
                        )}

                        {isOrganization && permissions.includes('manage-slack-notification-settings') && (
                            <section
                                id="slack-notification-settings"
                                data-settings-section="true"
                                aria-labelledby="slack-notification-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="slack-notification-settings-heading" className="sr-only">
                                    {translate('Slack')}
                                </h2>

                                <SlackNotificationSettings />
                            </section>
                        )}

                        {isOrganization && permissions.includes('manage-quotes-settings') && (
                            <section
                                id="quote-templates"
                                data-settings-section="true"
                                aria-labelledby="quote-templates-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="quote-templates-heading" className="sr-only">
                                    {translate('Quote templates')}
                                </h2>

                                <QuoteTemplateSettings />
                            </section>
                        )}

                        {isOrganization && permissions.includes('manage-sales-order-settings') && (
                            <section
                                id="sales-order-templates"
                                data-settings-section="true"
                                aria-labelledby="sales-order-templates-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="sales-order-templates-heading" className="sr-only">
                                    {translate('Sales order templates')}
                                </h2>

                                <SalesOrderTemplateSettings />
                            </section>
                        )}

                        {isOrganization && permissions.includes('manage-invoice-settings') && (
                            <section
                                id="invoice-templates"
                                data-settings-section="true"
                                aria-labelledby="invoice-templates-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="invoice-templates-heading" className="sr-only">
                                    {translate('Invoice templates')}
                                </h2>

                                <InvoiceTemplateSettings />
                            </section>
                        )}

                        {(permissions.includes('manage-payment-settings') || isSuperAdmin) && (
                            <section
                                id="payment-settings"
                                data-settings-section="true"
                                aria-labelledby="payment-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="payment-settings-heading" className="sr-only">
                                    {translate('Payment')}
                                </h2>

                                <PaymentSettings settings={paymentSettings} />
                            </section>
                        )}

                        {permissions.includes('manage-storage-settings') && isSuperAdmin && (
                            <section
                                id="storage-settings"
                                data-settings-section="true"
                                aria-labelledby="storage-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="storage-settings-heading" className="sr-only">
                                    {translate('Storage')}
                                </h2>

                                <StorageSettings settings={systemSettings} />
                            </section>
                        )}

                        {(permissions.includes('manage-recaptcha-settings') || isSuperAdmin) && (
                            <section
                                id="recaptcha-settings"
                                data-settings-section="true"
                                aria-labelledby="recaptcha-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="recaptcha-settings-heading" className="sr-only">
                                    {translate('Google reCAPTCHA')}
                                </h2>

                                <RecaptchaSettings settings={systemSettings} />
                            </section>
                        )}

                        {(permissions.includes('manage-kakbima-intelligence-settings') || isSuperAdmin) && (
                            <section
                                id="kakbima-intelligence-settings"
                                data-settings-section="true"
                                aria-labelledby="kakbima-intelligence-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="kakbima-intelligence-settings-heading" className="sr-only">
                                    {translate('Kakbima Intelligence')}
                                </h2>

                                <KakbimaIntelligenceSettings settings={systemSettings} />
                            </section>
                        )}

                        {(permissions.includes('manage-cookie-settings') || isSuperAdmin) && (
                            <section
                                id="cookie-settings"
                                data-settings-section="true"
                                aria-labelledby="cookie-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="cookie-settings-heading" className="sr-only">
                                    {translate('Cookie')}
                                </h2>

                                <CookieSettings settings={systemSettings} />
                            </section>
                        )}

                        {(permissions.includes('manage-cache-settings') || isSuperAdmin) && (
                            <section
                                id="cache-settings"
                                data-settings-section="true"
                                aria-labelledby="cache-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="cache-settings-heading" className="sr-only">
                                    {translate('Cache')}
                                </h2>

                                <CacheSettings cacheSize={cacheSize} />
                            </section>
                        )}

                        {isOrganization && permissions.includes('manage-webhook-settings') && (
                            <section
                                id="webhook-settings"
                                data-settings-section="true"
                                aria-labelledby="webhook-settings-heading"
                                className="scroll-mt-24"
                            >
                                <h2 id="webhook-settings-heading" className="sr-only">
                                    {translate('Webhook')}
                                </h2>

                                <WebhookSettings />
                            </section>
                        )}
                    </main>
                </div>
            </div>
            <Toaster />
        </PageTemplate>
    );
}
