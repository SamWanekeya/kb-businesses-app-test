import { toast } from '@/components/CustomToast';
import { SettingsSection } from '@/components/settings-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import { HardDrive, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface CacheSettingsProps {
    cacheSize?: string;
}

export default function CacheSettings({ cacheSize = '0.00' }: CacheSettingsProps) {
    const { t: translate } = useTranslation();
    const [isClearing, setIsClearing] = useState(false);

    // Handle cache clear
    const handleClearCache = () => {
        setIsClearing(true);

        router.post(
            route('settings.cache.clear'),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const successMessage = page.props.flash?.success;
                    const errorMessage = page.props.flash?.error;

                    if (successMessage) {
                        toast.success(successMessage);
                    } else if (errorMessage) {
                        toast.error(errorMessage);
                    }
                },
                onError: (errors) => {
                    const errorMessage = errors.error || Object.values(errors).join(', ') || translate('Failed to clear cache');
                    toast.error(errorMessage);
                },
                onFinish: () => {
                    setIsClearing(false);
                },
            },
        );
    };

    return (
        <SettingsSection title={translate('Cache Settings')} description={translate('Manage application cache to improve performance')}>
            <Card>
                <CardContent className="mt-6">
                    <div className="space-y-6">
                        <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-muted-foreground text-sm">
                                {translate("This is a page meant for more advanced users, simply ignore it if you don't understand what cache is.")}
                            </p>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex items-center space-x-3">
                                <HardDrive className="text-muted-foreground h-5 w-5" />
                                <div>
                                    <h4 className="font-medium">{translate('Current Cache Size')}</h4>
                                    <p className="text-muted-foreground text-sm">
                                        {cacheSize} MB {translate('of cached data')}
                                    </p>
                                </div>
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            onClick={handleClearCache}
                                            disabled={isClearing}
                                            variant="destructive"
                                            size="sm"
                                            className="max-[1300px]:px-2.5"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4 max-[1300px]:mr-0" />
                                            <span className="max-[1300px]:hidden">
                                                {isClearing ? translate('Clearing...') : translate('Clear Cache')}
                                            </span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{translate('Clear Cache')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <div className="text-muted-foreground text-sm">
                            <p>{translate('Clearing cache will remove')}:</p>
                            <ul className="mt-2 list-inside list-disc space-y-1">
                                <li>{translate('Application cache')}</li>
                                <li>{translate('Route cache')}</li>
                                <li>{translate('View cache')}</li>
                                <li>{translate('Configuration cache')}</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </SettingsSection>
    );
}
