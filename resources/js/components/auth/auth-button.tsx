import { useBrand } from '@/contexts/BrandContext';
import { THEME_COLORS } from '@/hooks/use-appearance';
import { LoaderCircle } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    processing?: boolean;
    tabIndex?: number;
    children: React.ReactNode;
}

export default function AuthButton({ processing = false, tabIndex, children, className = '', disabled, ...props }: AuthButtonProps) {
    const { themeColor, customColor } = useBrand();
    const primaryColor = themeColor === 'custom' ? customColor : THEME_COLORS[themeColor as keyof typeof THEME_COLORS];
    return (
        <button
            {...props}
            type={props.type || 'submit'}
            className={`w-full transform cursor-pointer rounded-lg py-2.5 font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${className}`}
            tabIndex={tabIndex}
            disabled={processing || disabled}
            style={{ backgroundColor: primaryColor }}
        >
            {processing && <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
