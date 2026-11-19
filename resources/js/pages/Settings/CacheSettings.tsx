import { toast } from '@components/CustomToast';
import SettingsSection from '@components/SettingsSection';
import { Button } from '@components/UserInterface/Button';
import { router } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CacheSettingsProps {
    cacheSize?: string;
}

/**
 * Displays the current application cache size and allows administrators
 * to clear cached application data through the existing Inertia endpoint.
 *
 * Prevents duplicate requests and provides success and validation feedback.
 */
export default function CacheSettings({ cacheSize = '0.00' }: CacheSettingsProps) {
    const { t: translate } = useTranslation();
    const [isClearing, setIsClearing] = useState(false);

    const handleClearCache = () => {
        if (isClearing) {
            return;
        }

        setIsClearing(true);

        const toastId = toast.loading(translate('Clearing cache...'));

        router.post(
            route('settings.cache.clear'),
            {},
            {
                preserveScroll: true,

                onSuccess: () => {
                    toast.dismiss(toastId);
                },

                onError: (errors) => {
                    Object.values(errors).forEach((message) => {
                        toast.error(translate(message));
                    });
                },

                onFinish: () => {
                    setIsClearing(false);
                    toast.dismiss(toastId);
                },
            },
        );
    };

    return (
        <SettingsSection title={translate('Cache')} description={translate('Manage application cache to improve performance.')}>
            <div className="border-border space-y-5 border-t pt-5">
                <p className="text-foreground/75 text-sm">
                    {translate('Clearing cache will remove application cache, route cache, view cache and configuration cache.')}
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h3 className="text-sm">{translate('Current cache size')}</h3>

                        <p className="text-foreground/75 text-sm">
                            {cacheSize} MB {translate('of cached data')}
                        </p>
                    </div>

                    <Button type="button" variant="destructive" size="lg" onClick={handleClearCache} disabled={isClearing}>
                        {isClearing ? translate('Clearing...') : translate('Clear cache')}
                    </Button>
                </div>
            </div>
        </SettingsSection>
    );
}
