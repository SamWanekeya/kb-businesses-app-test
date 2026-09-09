import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/UserInterface/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/tooltip';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsSectionProps {
    title: string;
    description?: string;
    children: ReactNode;
    action?: ReactNode;
}

export function SettingsSection({ title, description, children, action }: SettingsSectionProps) {
    const { t: translate } = useTranslation();
    return (
        <Card className="mb-6">
            <CardHeader className="pb-3">
                <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                        <CardTitle className="truncate text-lg font-medium">{title}</CardTitle>
                        {description && <CardDescription className="mt-1.5 truncate">{description}</CardDescription>}
                    </div>
                    {action && (
                        <div className="shrink-0">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="max-[1300px]:[&_a]:px-2.5 max-[1300px]:[&_a]:text-[0px] max-[1300px]:[&_button]:px-2.5 max-[1300px]:[&_button]:text-[0px] max-[1300px]:[&_span]:hidden max-[1300px]:[&_svg]:mr-0">
                                            {action}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="min-[1300px]:hidden">
                                        <p>{translate('Save Changes')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}
