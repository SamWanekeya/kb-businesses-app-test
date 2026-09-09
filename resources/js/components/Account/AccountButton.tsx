import { LoaderCircle } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface AccountButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /**
     * Shows a spinning loader and disables the button when true.
     */
    processing?: boolean;

    /**
     * Overrides the default tab index for keyboard navigation.
     */
    tabIndex?: number;

    /**
     * Button label or nested elements.
     */
    children: React.ReactNode;
}

/**
 * Renders a full-width authentication button with optional loading state.
 * Automatically disables itself during processing and falls back to
 * `type="submit"` unless another type is provided.
 *
 * @param processing
 * @param tabIndex
 * @param children
 * @param className
 * @param disabled
 * @param {AccountButtonProps} props - Button configuration and HTML attributes.
 * @returns {JSX.Element} The rendered button element.
 */
export default function AccountButton({ processing = false, tabIndex, children, className = '', disabled, ...props }: AccountButtonProps) {
    return (
        <button
            {...props}
            type={props.type || 'submit'}
            className={`btn-primary hf-bg-primary h-12 w-full rounded-md py-2.5 font-medium text-white ${className}`}
            tabIndex={tabIndex}
            disabled={processing || disabled}
        >
            {processing && <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
