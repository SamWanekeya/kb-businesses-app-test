import { Label } from '@components/UserInterface/Label';
import { RadioGroup, RadioGroupItem } from '@components/UserInterface/RadioGroup';
import { useTranslation } from 'react-i18next';

interface PaymentModeSelectorProps {
    value: 'sandbox' | 'live';
    onChange: (mode: 'sandbox' | 'live') => void;
    name: string;
    error?: string;
}

export function PaymentModeSelector({ value, onChange, name, error }: PaymentModeSelectorProps) {
    const { t: translate } = useTranslation();

    return (
        <div className="space-y-2">
            <Label>{translate('Mode')}</Label>
            <RadioGroup value={value} onValueChange={onChange} className="flex flex-row gap-4 max-[340px]:flex-col max-[340px]:gap-2">
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sandbox" id={`${name}_sandbox`} />
                    <Label htmlFor={`${name}_sandbox`} className="font-normal">
                        {translate('Sandbox')}
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="live" id={`${name}_live`} />
                    <Label htmlFor={`${name}_live`} className="font-normal">
                        {translate('Live')}
                    </Label>
                </div>
            </RadioGroup>
            {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
    );
}
