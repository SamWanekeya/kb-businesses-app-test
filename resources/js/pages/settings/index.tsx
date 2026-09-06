import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    Bell,
    Bot,
    Calendar,
    Cookie,
    CreditCard,
    DollarSign,
    FileText,
    HardDrive,
    Mail,
    MessageSquare,
    Palette,
    Search,
    Settings as SettingsIcon,
    Shield,
    ShoppingBag,
    Slack,
    Webhook,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import OrganizationSystemSettings from '@pages/settings/components/organization-system-settings';
import SystemSettings from '@pages/settings/components/system-settings';

import CurrencySettings from '@pages/settings/components/currency-settings';
import EmailNotificationSettings from '@pages/settings/components/email-notification-settings';
import SlackNotificationSettings from '@pages/settings/components/slack-notification-settings';
import TwilioNotificationSettings from '@pages/settings/components/twilio-notification-settings';

import BrandSettings from '@pages/settings/components/brand-settings';
import EmailSettings from '@pages/settings/components/email-settings';
import PaymentSettings from '@pages/settings/components/payment-settings';

import CacheSettings from '@pages/settings/components/cache-settings';
import ChatGptSettings from '@pages/settings/components/chatgpt-settings';
import CookieSettings from '@pages/settings/components/cookie-settings';
import GoogleCalendarSettings from '@pages/settings/components/google-calendar-settings';
import InvoiceTemplateSettings from '@pages/settings/components/invoice-template-settings';
import QuoteTemplateSettings from '@pages/settings/components/quote-template-settings';
import RecaptchaSettings from '@pages/settings/components/recaptcha-settings';
import SalesOrderTemplateSettings from '@pages/settings/components/sales-order-template-settings';
import SeoSettings from '@pages/settings/components/seo-settings';
import WebhookSettings from '@pages/settings/components/webhook-settings';

import { Toaster } from '@/components/ui/toaster';
import { useLayout } from '@/contexts/LayoutContext';
import { useHasPermission } from '@/utils/Permissions';
import { useTranslation } from 'react-i18next';
import StorageSettings from '@pages/settings/components/storage-settings';

export default function Settings() {
    const { t: translate } = useTranslation();
    const { position } = useLayout();
    const {
        systemSettings = {},
        cacheSize = '0.00',
        timezones = {},
        dateFormats = {},
        timeFormats = {},
        paymentSettings = {},
        webhooks = [],
        auth = {},
    } = usePage().props;
    const [activeSection, setActiveSection] = useState('system-settings');

    // Define all possible sidebar navigation items
    const allSidebarNavItems: (NavItem & { permission?: string; role?: string })[] = [
        {
            title: translate('System Settings'),
            href: '#system-settings',
            icon: <SettingsIcon className="mr-2 h-4 w-4" />,
            permission: 'manage-system-settings',
        },
        {
            title: translate('Brand Settings'),
            href: '#brand-settings',
            icon: <Palette className="mr-2 h-4 w-4" />,
            permission: 'manage-brand-settings',
        },
        {
            title: translate('Currency Settings'),
            href: '#currency-settings',
            icon: <DollarSign className="mr-2 h-4 w-4" />,
            permission: 'manage-currency-settings',
        },
        {
            title: translate('Email Settings'),
            href: '#email-settings',
            icon: <Mail className="mr-2 h-4 w-4" />,
            permission: 'manage-email-settings',
        },
        {
            title: translate('Email Notification Settings'),
            href: '#email-notification-settings',
            icon: <Bell className="mr-2 h-4 w-4" />,
            permission: 'manage-email-notifications',
        },
        {
            title: translate('Twilio Settings'),
            href: '#twilio-notification-settings',
            icon: <MessageSquare className="mr-2 h-4 w-4" />,
            permission: 'manage-twilio-notifications',
        },
        {
            title: translate('Slack Settings'),
            href: '#slack-notification-settings',
            icon: <Slack className="mr-2 h-4 w-4" />,
            permission: 'manage-twilio-notifications',
        },
        {
            title: translate('Payment Settings'),
            href: '#payment-settings',
            icon: <CreditCard className="mr-2 h-4 w-4" />,
            permission: 'manage-payment-settings',
        },
        {
            title: translate('Payment Settings'),
            href: '#organization-payment-settings',
            icon: <CreditCard className="mr-2 h-4 w-4" />,
            permission: 'settings',
        },
        {
            title: translate('Quote Templates'),
            href: '#quote-templates',
            icon: <FileText className="mr-2 h-4 w-4" />,
            role: 'organization',
            permission: 'manage-quotes-settings',
        },
        {
            title: translate('Sales Order Templates'),
            href: '#sales-order-templates',
            icon: <ShoppingBag className="mr-2 h-4 w-4" />,
            role: 'organization',
            permission: 'manage-sales-orders-settings',
        },
        {
            title: translate('Invoice Templates'),
            href: '#invoice-templates',
            icon: <FileText className="mr-2 h-4 w-4" />,
            role: 'organization',
            permission: 'manage-invoices-settings',
        },

        {
            title: translate('ReCaptcha Settings'),
            href: '#recaptcha-settings',
            icon: <Shield className="mr-2 h-4 w-4" />,
            permission: 'manage-recaptcha-settings',
        },
        {
            title: translate('Chat GPT Settings'),
            href: '#chatgpt-settings',
            icon: <Bot className="mr-2 h-4 w-4" />,
            permission: 'manage-chatgpt-settings',
        },
        {
            title: translate('Cookie Settings'),
            href: '#cookie-settings',
            icon: <Cookie className="mr-2 h-4 w-4" />,
            permission: 'manage-cookie-settings',
        },
        {
            title: translate('SEO Settings'),
            href: '#seo-settings',
            icon: <Search className="mr-2 h-4 w-4" />,
            permission: 'manage-seo-settings',
        },
        {
            title: translate('Storage Settings'),
            href: '#storage-settings',
            icon: <HardDrive className="mr-2 h-4 w-4" />,
            permission: 'manage-storage-settings',
        },
        {
            title: translate('Cache Settings'),
            href: '#cache-settings',
            icon: <HardDrive className="mr-2 h-4 w-4" />,
            permission: 'manage-cache-settings',
        },
        {
            title: translate('Google Calendar Settings'),
            href: '#google-calendar-settings',
            icon: <Calendar className="mr-2 h-4 w-4" />,
            permission: 'settings',
        },
    ];

    if (auth?.user?.type !== 'super_admin') {
        allSidebarNavItems.push({
            title: translate('Webhook Settings'),
            href: '#webhook-settings',
            icon: <Webhook className="mr-2 h-4 w-4" />,
            permission: 'manage-webhook-settings',
        });
    }
    // Filter sidebar items based on user permissions
    const sidebarNavItems = allSidebarNavItems.filter((item) => {
        // If no permission is required or user has the permission
        if (!item.permission || useHasPermission(item.permission)) {
            return true;
        }
        // For organization users, only show specific settings
        if (auth?.user?.type === 'organization') {
            // Only allow system settings, email settings, brand settings, currency settings, webhook settings, email notifications, and settings
            return [
                'manage-system-settings',
                'manage-email-settings',
                'manage-brand-settings',
                'manage-currency-settings',
                'manage-webhook-settings',
                'manage-email-notifications',
                'manage-twilio-notifications',
                'manage-quotes-settings',
                'manage-sales-orders-settings',
                'manage-invoices-settings',
                'settings',
            ].includes(item.permission);
        }
        return false;
    });

    // Refs for each section
    const systemSettingsRef = useRef<HTMLDivElement>(null);
    const organizationSystemSettingsRef = useRef<HTMLDivElement>(null);
    const brandSettingsRef = useRef<HTMLDivElement>(null);

    const currencySettingsRef = useRef<HTMLDivElement>(null);
    const emailSettingsRef = useRef<HTMLDivElement>(null);
    const paymentSettingsRef = useRef<HTMLDivElement>(null);
    const organizationPaymentSettingsRef = useRef<HTMLDivElement>(null);
    const quoteTemplatesRef = useRef<HTMLDivElement>(null);
    const salesOrderTemplatesRef = useRef<HTMLDivElement>(null);
    const invoiceTemplatesRef = useRef<HTMLDivElement>(null);
    const emailNotificationSettingsRef = useRef<HTMLDivElement>(null);
    const twilioNotificationSettingsRef = useRef<HTMLDivElement>(null);
    const slackNotificationSettingsRef = useRef<HTMLDivElement>(null);

    const recaptchaSettingsRef = useRef<HTMLDivElement>(null);
    const chatgptSettingsRef = useRef<HTMLDivElement>(null);
    const cookieSettingsRef = useRef<HTMLDivElement>(null);
    const seoSettingsRef = useRef<HTMLDivElement>(null);
    const cacheSettingsRef = useRef<HTMLDivElement>(null);
    const webhookSettingsRef = useRef<HTMLDivElement>(null);
    const googleCalendarSettingsRef = useRef<HTMLDivElement>(null);

    const storageSettingsRef = useRef<HTMLDivElement>(null);

    // Smart scroll functionality
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100; // Add offset for better UX

            // Get positions of each section
            const systemSettingsPosition = systemSettingsRef.current?.offsetTop || 0;
            const organizationSystemSettingsPosition = organizationSystemSettingsRef.current?.offsetTop || 0;
            const brandSettingsPosition = brandSettingsRef.current?.offsetTop || 0;

            const currencySettingsPosition = currencySettingsRef.current?.offsetTop || 0;
            const emailSettingsPosition = emailSettingsRef.current?.offsetTop || 0;
            const paymentSettingsPosition = paymentSettingsRef.current?.offsetTop || 0;
            const organizationPaymentSettingsPosition = organizationPaymentSettingsRef.current?.offsetTop || 0;
            const quoteTemplatesPosition = quoteTemplatesRef.current?.offsetTop || 0;
            const salesOrderTemplatesPosition = salesOrderTemplatesRef.current?.offsetTop || 0;
            const invoiceTemplatesPosition = invoiceTemplatesRef.current?.offsetTop || 0;
            const emailNotificationSettingsPosition = emailNotificationSettingsRef.current?.offsetTop || 0;
            const twilioNotificationSettingsPosition = twilioNotificationSettingsRef.current?.offsetTop || 0;
            const slackNotificationSettingsPosition = slackNotificationSettingsRef.current?.offsetTop || 0;

            const recaptchaSettingsPosition = recaptchaSettingsRef.current?.offsetTop || 0;
            const chatgptSettingsPosition = chatgptSettingsRef.current?.offsetTop || 0;
            const cookieSettingsPosition = cookieSettingsRef.current?.offsetTop || 0;
            const seoSettingsPosition = seoSettingsRef.current?.offsetTop || 0;
            const cacheSettingsPosition = cacheSettingsRef.current?.offsetTop || 0;
            const webhookSettingsPosition = webhookSettingsRef.current?.offsetTop || 0;
            const googleCalendarSettingsPosition = googleCalendarSettingsRef.current?.offsetTop || 0;

            const storageSettingsPosition = storageSettingsRef.current?.offsetTop || 0;

            // Determine active section based on scroll position
            if (scrollPosition >= webhookSettingsPosition && webhookSettingsPosition > 0) {
                setActiveSection('webhook-settings');
            } else if (scrollPosition >= googleCalendarSettingsPosition && googleCalendarSettingsPosition > 0) {
                setActiveSection('google-calendar-settings');
            } else if (scrollPosition >= cacheSettingsPosition && cacheSettingsPosition > 0) {
                setActiveSection('cache-settings');
            } else if (scrollPosition >= storageSettingsPosition && storageSettingsPosition > 0) {
                setActiveSection('storage-settings');
            } else if (scrollPosition >= seoSettingsPosition && seoSettingsPosition > 0) {
                setActiveSection('seo-settings');
            } else if (scrollPosition >= cookieSettingsPosition && cookieSettingsPosition > 0) {
                setActiveSection('cookie-settings');
            } else if (scrollPosition >= chatgptSettingsPosition && chatgptSettingsPosition > 0) {
                setActiveSection('chatgpt-settings');
            } else if (scrollPosition >= recaptchaSettingsPosition && recaptchaSettingsPosition > 0) {
                setActiveSection('recaptcha-settings');
            } else if (scrollPosition >= invoiceTemplatesPosition && invoiceTemplatesPosition > 0) {
                setActiveSection('invoice-templates');
            } else if (scrollPosition >= salesOrderTemplatesPosition && salesOrderTemplatesPosition > 0) {
                setActiveSection('sales-order-templates');
            } else if (scrollPosition >= quoteTemplatesPosition && quoteTemplatesPosition > 0) {
                setActiveSection('quote-templates');
            } else if (scrollPosition >= organizationPaymentSettingsPosition && organizationPaymentSettingsPosition > 0) {
                setActiveSection('organization-payment-settings');
            } else if (scrollPosition >= slackNotificationSettingsPosition && slackNotificationSettingsPosition > 0) {
                setActiveSection('slack-notification-settings');
            } else if (scrollPosition >= twilioNotificationSettingsPosition && twilioNotificationSettingsPosition > 0) {
                setActiveSection('twilio-notification-settings');
            } else if (scrollPosition >= emailNotificationSettingsPosition && emailNotificationSettingsPosition > 0) {
                setActiveSection('email-notification-settings');
            } else if (scrollPosition >= paymentSettingsPosition && paymentSettingsPosition > 0) {
                setActiveSection('payment-settings');
            } else if (scrollPosition >= emailSettingsPosition && emailSettingsPosition > 0) {
                setActiveSection('email-settings');
            } else if (scrollPosition >= currencySettingsPosition && currencySettingsPosition > 0) {
                setActiveSection('currency-settings');
            } else if (scrollPosition >= brandSettingsPosition && brandSettingsPosition > 0) {
                setActiveSection('brand-settings');
            } else {
                setActiveSection('system-settings');
            }
        };

        // Add scroll event listener
        window.addEventListener('scroll', handleScroll);

        // Initial check for hash in URL
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            const targetId = hash === 'system-settings' && !document.getElementById('system-settings') ? 'organization-system-settings' : hash;
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                setActiveSection(hash);
            }
        }

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Force layout recalculation on mount to fix issues where layout is stuck
    useEffect(() => {
        const triggerResize = () => {
            window.dispatchEvent(new Eventranslate('resize'));
        };

        const timers = [setTimeout(triggerResize, 0), setTimeout(triggerResize, 100), setTimeout(triggerResize, 300)];

        return () => {
            timers.forEach(clearTimeout);
        };
    }, []);

    // Handle navigation click
    const handleNavClick = (href: string) => {
        const id = href.replace('#', '');
        const targetId = id === 'system-settings' && !document.getElementById('system-settings') ? 'organization-system-settings' : id;
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    const breadcrumbs = [{ title: translate('Dashboard'), href: route('dashboard') }, { title: translate('Settings') }];

    return (
        <PageTemplate title={translate('Settings')} description={translate('Manage system settings.')} url="/settings" breadcrumbs={breadcrumbs}>
            <style>{`
                @media (min-width: 1024px) {
                    [data-slot="sidebar-inset"] {
                        overflow-x: clip !important;
                    }
                }
            `}</style>
            <div className="flex w-full max-w-full min-w-0 flex-col gap-8 lg:flex-row" dir={position === 'right' ? 'rtl' : 'ltr'}>
                {/* Sidebar Navigation */}
                <div className="w-full flex-shrink-0 lg:sticky lg:top-20 lg:w-64 lg:self-start">
                    <ScrollArea className="h-auto lg:h-[calc(100vh-5rem)]">
                        <div className="bg-card rounded-xl border p-2 shadow-sm">
                            <div className="flex flex-col gap-2">
                                {sidebarNavItems.map((item) => (
                                    <Button
                                        key={item.href}
                                        variant="ghost"
                                        className={cn(
                                            'text-card-foreground hover:bg-muted w-full justify-start gap-3 rounded-lg text-sm font-normal hover:font-normal',
                                            {
                                                'bg-muted text-card-foreground font-medium': activeSection === item.href.replace('#', ''),
                                            },
                                        )}
                                        onClick={() => handleNavClick(item.href)}
                                    >
                                        {item.icon}
                                        {item.title}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* Main Content */}
                <div className="w-full max-w-full min-w-0 flex-1 overflow-x-hidden">
                    {/* System Settings Section */}
                    {(useHasPermission('manage-system-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="system-settings" ref={systemSettingsRef} className="mb-8">
                            <SystemSettings settings={systemSettings} timezones={timezones} dateFormats={dateFormats} timeFormats={timeFormats} />
                        </section>
                    )}

                    {/* Organization System Settings Section */}
                    {auth?.user?.type === 'organization' && (
                        <section id="organization-system-settings" ref={organizationSystemSettingsRef} className="mb-8">
                            <OrganizationSystemSettings
                                settings={systemSettings}
                                timezones={timezones}
                                dateFormats={dateFormats}
                                timeFormats={timeFormats}
                            />
                        </section>
                    )}

                    {/* Brand Settings Section */}
                    {(useHasPermission('manage-brand-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="brand-settings" ref={brandSettingsRef} className="mb-8">
                            <BrandSettings />
                        </section>
                    )}

                    {/* Currency Settings Section */}
                    {(useHasPermission('manage-currency-settings')) && (
                        <section id="currency-settings" ref={currencySettingsRef} className="mb-8">
                            <CurrencySettings />
                        </section>
                    )}

                    {/* Email Settings Section */}
                    {(useHasPermission('manage-email-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="email-settings" ref={emailSettingsRef} className="mb-8">
                            <EmailSettings />
                        </section>
                    )}
                    {/* Email Notification Settings Section */}
                    {(useHasPermission('manage-email-notifications')) && (
                        <section id="email-notification-settings" ref={emailNotificationSettingsRef} className="mb-8">
                            <EmailNotificationSettings />
                        </section>
                    )}
                    {/* Twilio Notification Settings Section */}
                    {(useHasPermission('manage-twilio-notifications')) && (
                        <section id="twilio-notification-settings" ref={twilioNotificationSettingsRef} className="mb-8">
                            <TwilioNotificationSettings />
                        </section>
                    )}
                    {/* Slack Notification Settings Section */}
                    {(useHasPermission('manage-slack-notifications')) && (
                        <section id="slack-notification-settings" ref={slackNotificationSettingsRef} className="mb-8">
                            <SlackNotificationSettings />
                        </section>
                    )}

                    {/* Payment Settings Section */}
                    {(useHasPermission('manage-payment-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="payment-settings" ref={paymentSettingsRef} className="mb-8">
                            <PaymentSettings settings={paymentSettings} />
                        </section>
                    )}

                    {/* Organization Payment Settings Section */}
                    {(useHasPermission('settings')) && (
                        <section id="organization-payment-settings" ref={organizationPaymentSettingsRef} className="mb-8">
                            <PaymentSettings settings={paymentSettings} />
                        </section>
                    )}

                    {/* Quote Templates Section */}
                    {auth?.user?.type === 'organization' && useHasPermission('manage-quotes-settings') && (
                        <section id="quote-templates" ref={quoteTemplatesRef} className="mb-8">
                            <QuoteTemplateSettings />
                        </section>
                    )}

                    {/* Sales Order Templates Section */}
                    {auth?.user?.type === 'organization' && useHasPermission('manage-sales-orders-settings') && (
                        <section id="sales-order-templates" ref={salesOrderTemplatesRef} className="mb-8">
                            <SalesOrderTemplateSettings />
                        </section>
                    )}

                    {/* Invoice Templates Section */}
                    {auth?.user?.type === 'organization' && useHasPermission('manage-invoices-settings') && (
                        <section id="invoice-templates" ref={invoiceTemplatesRef} className="mb-8">
                            <InvoiceTemplateSettings />
                        </section>
                    )}

                    {/* ReCaptcha Settings Section */}
                    {(useHasPermission('manage-recaptcha-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="recaptcha-settings" ref={recaptchaSettingsRef} className="mb-8">
                            <RecaptchaSettings settings={systemSettings} />
                        </section>
                    )}

                    {/* Chat GPT Settings Section */}
                    {(useHasPermission('manage-chatgpt-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="chatgpt-settings" ref={chatgptSettingsRef} className="mb-8">
                            <ChatGptSettings settings={systemSettings} />
                        </section>
                    )}

                    {/* Cookie Settings Section */}
                    {(useHasPermission('manage-cookie-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="cookie-settings" ref={cookieSettingsRef} className="mb-8">
                            <CookieSettings settings={systemSettings} />
                        </section>
                    )}

                    {/* SEO Settings Section */}
                    {(useHasPermission('manage-seo-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="seo-settings" ref={seoSettingsRef} className="mb-8">
                            <SeoSettings settings={systemSettings} />
                        </section>
                    )}

                    {/* Storage Settings Section */}
                    {(useHasPermission('manage-storage-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="storage-settings" ref={storageSettingsRef} className="mb-8">
                            <StorageSettings settings={systemSettings} />
                        </section>
                    )}

                    {/* Cache Settings Section */}
                    {(useHasPermission('manage-cache-settings') || auth?.user?.type === 'super_admin') && (
                        <section id="cache-settings" ref={cacheSettingsRef} className="mb-8">
                            <CacheSettings cacheSize={cacheSize} />
                        </section>
                    )}

                    {/* Google Calendar Settings Section */}
                    {(useHasPermission('settings')) && (
                        <section id="google-calendar-settings" ref={googleCalendarSettingsRef} className="mb-8">
                            <GoogleCalendarSettings settings={systemSettings} />
                        </section>
                    )}

                    {/* Webhook Settings Section */}
                    {(useHasPermission('manage-webhook-settings')) && (
                        <section id="webhook-settings" ref={webhookSettingsRef} className="mb-8">
                            <WebhookSettings webhooks={webhooks} />
                        </section>
                    )}
                </div>
            </div>
            <Toaster />
        </PageTemplate>
    );
}
