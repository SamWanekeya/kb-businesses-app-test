import { CheckCircle2, CircleOff, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaymentSettingsSummaryProps {
    totalCount: number;
    enabledCount: number;
    disabledCount: number;
}

/**
 * PaymentSettingsSummary
 *
 * Shows a compact overview of configured gateway availability. Counts are
 * derived by the parent from the same form state used by status filtering.
 */
export default function PaymentSettingsSummary({ totalCount, enabledCount, disabledCount }: PaymentSettingsSummaryProps) {
    const { t: translate } = useTranslation();

    const metrics = [
        {
            label: translate('Available methods'),
            value: totalCount,
            icon: CreditCard,
        },
        {
            label: translate('Enabled'),
            value: enabledCount,
            icon: CheckCircle2,
        },
        {
            label: translate('Disabled'),
            value: disabledCount,
            icon: CircleOff,
        },
    ];

    return (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {metrics.map(({ label, value, icon: Icon }) => (
                <div key={label} className="border-border bg-card rounded-xl border p-4 transition-colors sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground text-sm font-medium">{label}</dt>

                        <div className="bg-muted flex size-9 items-center justify-center rounded-lg">
                            <Icon aria-hidden="true" className="text-muted-foreground size-4" />
                        </div>
                    </div>

                    <dd className="text-foreground mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</dd>
                </div>
            ))}
        </dl>
    );
}
