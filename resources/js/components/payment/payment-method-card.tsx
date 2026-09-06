import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { AlertCircle } from 'lucide-react';
import { ReactNode } from 'react';
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

export function PaymentMethodCard({ title, icon, enabled, onToggle, children, helpUrl, helpText }: PaymentMethodCardProps) {
    const { t: translate } = useTranslation();

    return (
        <div className="rounded-lg border">
            <div className="flex flex-row items-center justify-between gap-3 border-b p-4 max-[350px]:flex-col max-[350px]:items-start">
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="font-medium break-all">{title}</span>
                </div>
                <Switch checked={enabled} onCheckedChange={onToggle} className="max-[350px]:self-end" />
            </div>
            {enabled && (
                <div className="space-y-4 p-4">
                    {helpUrl && helpText && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {helpText}{' '}
                                <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="underline">
                                    {translate('Dashboard')}
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
