import { useEffect, useState } from 'react';

import { toast } from '@components/CustomToast';
import { Button } from '@components/UserInterface/Button';
import { Card } from '@components/UserInterface/Card';
import { Switch } from '@components/UserInterface/Switch';
import { usePage } from '@inertiajs/react';
import { getFromLocalStorage, storeToLocalStorage } from '@utils/Helpers/Storage';
import { route } from '@utils/Routes';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function CookieConsentBanner() {
    const { t: translate } = useTranslation();

    const [isVisible, setIsVisible] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { csrfToken, globalSettings } = usePage().props;
    const settings = {
        cookie_title: globalSettings.cookie_title || 'Cookie Consent',
        cookie_description:
            globalSettings.cookie_description || 'We use cookies to enhance your browsing experience and provide personalized content.',
        strictly_cookie_title: globalSettings.strictly_cookie_title || 'Strictly Necessary Cookies',
        strictly_cookie_description:
            globalSettings.strictly_cookie_description || 'These cookies are essential for the website to function properly.',
        contact_us_description: globalSettings.contact_us_description || 'If you have any questions about our cookie policy, please contact us.',
        contact_us_url: globalSettings.contact_us_url || '#',
    };

    useEffect(() => {
        const enable_logging = globalSettings.enable_logging === '1' || globalSettings.enable_logging === 1 || globalSettings.enable_logging === true;

        if (enable_logging) {
            const consent = getFromLocalStorage('__kb_ck_cnst');
            if (!consent) {
                setIsVisible(true);
            }
        }
    }, []);

    const getLocationData = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, 5000); // 5 second timeout

            const response = await fetch('https://ipapi.co/json/', {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                },
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Validate essential data
            return {
                ip: data.ip || 'unknown',
                country: data.country_name || 'unknown',
                city: data.city || 'unknown',
                region: data.region || 'unknown',
                ...data,
            };
        } catch (error) {
            console.warn('Failed to get location data:', error.message);
            return {
                ip: 'unknown',
                country: 'unknown',
                city: 'unknown',
                region: 'unknown',
                error: error.message || 'Location fetch failed',
            };
        }
    };

    const saveCookieConsent = async (consentType: string, preferences: any) => {
        try {
            const locationData = await getLocationData();
            const consentData = {
                ...preferences,
                timestamp: new Date().toISOString(),
                consentType,
                userAgent: navigator.userAgent || 'unknown',
                language: navigator.language || 'unknown',
                url: window.location.href,
                ...locationData,
            };

            // Store in localStorage for frontend reference
            storeToLocalStorage('__kb_ck_cnst', { accepted: true, timestamp: Date.now() });

            // Send to backend to store in CSV
            if (!csrfToken) {
                console.warn('CSRF token not found');
                return;
            }

            const response = await fetch(route('cookie.consent.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify(consentData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error('Server returned error');
            }
        } catch (error) {
            console.error('Failed to save cookie consent:', error);
            // Still store locally even if server fails
            storeToLocalStorage('__kb_ck_cnst', { accepted: true, timestamp: Date.now() });
            throw error;
        }
    };

    const acceptAll = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const preferences = {
                necessary: true,
                analytics: true,
                marketing: true,
            };

            await saveCookieConsent('accept_all', preferences);
            setIsVisible(false);
        } catch (errors) {
            toast.dismiss(toastId);

            Object.values(errors).forEach((message) => {
                toast.error(translate(message));
            });
        } finally {
            setIsLoading(false);
        }
    };

    const acceptNecessary = async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const preferences = {
                necessary: true,
                analytics: false,
                marketing: false,
            };

            await saveCookieConsent('Necessary_only', preferences);
            setIsVisible(false);
        } catch (errors) {
            toast.dismiss(toastId);

            Object.values(errors).forEach((message) => {
                toast.error(translate(message));
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <>
            {/* Main Cookie Banner */}
            <div className="fixed bottom-4 left-1/2 z-50 mx-4 w-full max-w-md -translate-x-1/2 transform">
                <Card className="border p-4 shadow-lg">
                    <div className="mb-3 flex items-start justify-between">
                        <h3 className="text-sm font-semibold">{settings.cookie_title || translate('Cookie consent')}</h3>
                        <Button
                            variant="ghost"
                            size="lg"
                            onClick={() => {
                                setIsVisible(false);
                            }}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <p className="text-muted-foreground mb-4 text-sm">
                        {settings.cookie_description ||
                            translate('We use cookies to enhance your browsing experience and provide personalized content')}
                    </p>

                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                            <Button onClick={acceptAll} size="lg" className="flex-1 text-white hover:opacity-90" disabled={isLoading}>
                                {isLoading ? translate('Saving...') : translate('Accept all')}
                            </Button>
                            <Button onClick={acceptNecessary} variant="outline" size="lg" className="flex-1" disabled={isLoading}>
                                {isLoading ? translate('Saving...') : translate('Necessary only')}
                            </Button>
                        </div>
                        <Button
                            onClick={() => {
                                setShowModal(true);
                            }}
                            variant="ghost"
                            size="lg"
                            className="text-sm underline"
                        >
                            {translate('Let me choose')}
                        </Button>
                    </div>

                    {settings.contact_us_url && (
                        <p className="text-muted-foreground mt-2 text-xs">
                            {settings.contact_us_description || translate('Questions about our cookie policy?')}
                            <a href={settings.contact_us_url} className="underline">
                                {translate('Contact us')}
                            </a>
                        </p>
                    )}
                </Card>
            </div>

            {/* Cookie Preferences Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <Card className="max-h-[80vh] w-full max-w-md overflow-y-auto">
                        <div className="p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{settings.cookie_title || translate('Cookie preferences')}</h3>
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    onClick={() => {
                                        setShowModal(false);
                                    }}
                                    className="h-6 w-6 p-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {/* Strictly Necessary Cookies */}
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium">
                                            {settings.strictly_cookie_title || translate('Strictly necessary cookies')}
                                        </h4>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {settings.strictly_cookie_description ||
                                                translate('These cookies are essential for the website to function properly')}
                                        </p>
                                    </div>
                                    <Switch checked={true} disabled={true} />
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <Button
                                    onClick={async () => {
                                        await acceptNecessary();
                                        setShowModal(false);
                                    }}
                                    variant="outline"
                                    size="lg"
                                    className="flex-1"
                                    disabled={isLoading}
                                >
                                    {isLoading ? translate('Saving...') : translate('Save preferences')}
                                </Button>
                                <Button
                                    onClick={async () => {
                                        await acceptAll();
                                        setShowModal(false);
                                    }}
                                    size="lg"
                                    className="flex-1 text-white hover:opacity-90"
                                    disabled={isLoading}
                                >
                                    {isLoading ? translate('Saving...') : translate('Accept all')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}
