import { Button } from '@components/UserInterface/Button';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, CreditCard, Lock, RotateCcw, Search, ShieldAlert } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the Error component.
 * @interface ErrorProps
 * @property {number} status - The HTTP status code (e.g., 404, 500).
 * @property {string} [message] - An optional custom error message from the server.
 */
interface ErrorProps {
    status: number;
    message?: string;
}

/**
 * A standalone Error page component used for structural HTTP errors.
 * Designed to work both via Inertia navigation and direct Blade entry.
 * * @component
 * @example
 * <Error status={404} message="Page not found" />
 */
export default function Error({ status, message }: ErrorProps) {
    const { t: translate } = useTranslation();

    /**
     * Configuration mapping for different HTTP status codes.
     * Centralizes icons, titles, and default translated descriptions.
     */
    const config: Record<number, { title: string; description: string; icon: React.ReactNode }> = {
        401: {
            title: translate('Unauthenticated'),
            description: translate(message) || translate('Please sign in to access this page.'),
            icon: <Lock className="h-12 w-12 text-neutral-500" />,
        },
        402: {
            title: translate('Payment required'),
            description: translate(message) || translate('A subscription is required to access this resource.'),
            icon: <CreditCard className="h-12 w-12 text-emerald-500" />,
        },
        403: {
            title: translate('Access denied'),
            description: translate(message) || translate('You don’t have permission to access this resource.'),
            icon: <ShieldAlert className="h-12 w-12 text-red-600" />,
        },
        404: {
            title: translate('Page not found'),
            description: translate(message) || translate('The page you are looking for doesn’t exist.'),
            icon: <Search className="h-12 w-12 text-blue-500" />,
        },
        500: {
            title: translate('Server error'),
            description: translate(message) || translate('Something went wrong on our end.'),
            icon: <AlertCircle className="h-12 w-12 text-green-500" />,
        },
        503: {
            title: translate('Service unavailable'),
            description: translate(message) || translate('We’re currently down for maintenance.'),
            icon: <RotateCcw className="h-12 w-12 text-neutral-500 dark:text-neutral-400" />,
        },
    };

    const currentConfig = config[status] || {
        title: translate('Unexpected error'),
        description: translate(message) || translate('An unknown error occurred.'),
        icon: <AlertCircle className="h-12 w-12 text-neutral-500 dark:text-neutral-400" />,
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-6 py-12">
            <Head title={`${status} ${currentConfig.title}`} />

            <div className="w-full max-w-md text-center">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full border border-neutral-100 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        {currentConfig.icon}
                    </div>
                </div>

                <h1 className="mb-2 text-6xl font-extrabold text-neutral-500 dark:text-neutral-400">{status}</h1>
                <h2 className="mb-4 text-2xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">{currentConfig.title}</h2>
                <p className="mb-8 leading-relaxed text-neutral-600 dark:text-neutral-400">{currentConfig.description}</p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link href="/">
                        <Button className="btn-primary hf-bg-primary h-12 w-full rounded-md py-2.5 font-medium text-white">
                            {translate('Go back home')}
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="lg"
                        type="button"
                        onClick={() => {
                            window.location.reload();
                        }}
                    >
                        {translate('Try again')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
