import { ReactNode } from 'react';

import { Alert, AlertDescription } from '@components/UserInterface/Alert';
import { Switch } from '@components/UserInterface/Switch';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaymentMethodCardProps {
    title: string;
    icon: ReactNode;
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
    children?: ReactNode;
    helpUrl?: string;
    helpText?: string;
}

export default function PaymentMethodCard({ title, icon, enabled, onToggle, children, helpUrl, helpText }: PaymentMethodCardProps) {
    const { t: translate } = useTranslation();

    return (
        <div className="border-border bg-card overflow-hidden rounded-xl border transition-colors">
            {/* Gateway heading */}
            <div className="flex items-center justify-between gap-4 p-4 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="bg-muted flex size-11 shrink-0 items-center justify-center rounded-lg">{icon}</div>

                    <div className="min-w-0">
                        <h3 className="text-foreground truncate text-sm font-semibold sm:text-base">{title}</h3>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                            {enabled ? translate('Payment method enabled') : translate('Payment method disabled')}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <Switch checked={enabled} onCheckedChange={onToggle} />
                </div>
            </div>

            {/* Gateway configuration */}
            {enabled && (
                <div className="border-border bg-muted/20 space-y-5 border-t p-4 sm:p-5">
                    {helpUrl && helpText && (
                        <Alert className="border-border bg-background">
                            <AlertCircle className="text-muted-foreground size-4" />

                            <AlertDescription className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
                                <span>{helpText}</span>

                                <a
                                    href={helpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                                >
                                    {translate('Dashboard')}
                                    <ExternalLink aria-hidden="true" className="size-3" />
                                </a>
                            </AlertDescription>
                        </Alert>
                    )}

                    {children}
                </div>
            )}
        </div>
    );
}
