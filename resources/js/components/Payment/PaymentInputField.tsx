import { useState } from 'react';

import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PaymentInputFieldProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'password';
    isSecret?: boolean;
    error?: string;
    className?: string;
}

export default function PaymentInputField({
    id,
    label,
    value,
    onChange,
    type = 'text',
    isSecret = false,
    error,
    className = '',
}: PaymentInputFieldProps) {
    const { t: translate } = useTranslation();
    const [showSecret, setShowSecret] = useState(false);

    // Show asterisks in demo mode for secret fields with values
    const displayValue = value;
    const inputType = isSecret ? (showSecret ? 'text' : 'password') : type;

    return (
        <div className="space-y-2">
            <div className="relative">
                <Input
                    inputIdentifier={id}
                    label={translate(label)}
                    type={inputType}
                    value={displayValue}
                    onChange={(e) => {
                        onChange(e.target.value);
                    }}
                    className={`text-sm ${isSecret ? 'pr-10' : ''} ${className}`}
                />
                {isSecret && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-foreground/75 absolute top-0 right-0 h-full px-3"
                        onClick={() => {
                            setShowSecret(!showSecret);
                        }}
                    >
                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                )}
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
    );
}
