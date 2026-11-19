import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';

type PaymentMode = 'sandbox' | 'live';

interface PaymentModeSelectorProps {
    value: PaymentMode;
    onChange: (mode: PaymentMode) => void;
    name: string;
}

/**
 * PaymentModeSelector
 *
 * Selects the gateway environment without changing the parent form contract.
 * The provider name is used to produce a distinct accessible label when a
 * page contains multiple environment selectors.
 */
export default function PaymentModeSelector({ value, onChange, name }: PaymentModeSelectorProps) {
    const { t: translate } = useTranslation();
    const label = translate('{{provider}} environment', {
        provider: name,
    });
    const handleValueChange = (nextValue: string) => {
        if (nextValue === 'sandbox' || nextValue === 'live') {
            onChange(nextValue);
        }
    };

    return (
        <div className="space-y-2">
            <span className="text-sm">{translate('Environment')}</span>
            <Select value={value} onValueChange={handleValueChange}>
                <SelectTrigger aria-label={label}>
                    <SelectValue placeholder={translate('Select...')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="sandbox">{translate('Sandbox')}</SelectItem>
                    <SelectItem value="live">{translate('Live')}</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
