import React from 'react';

import { cn } from '@lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Optional floating label. */
    label?: string;

    /** External validation error. */
    error?: string | boolean | null;

    /** Supporting text displayed below the field. */
    helperText?: string;

    /** Additional classes for the outer wrapper. */
    wrapperClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    (
        {
            className,
            wrapperClassName,
            label,
            error,
            helperText,
            id,
            required,
            'aria-invalid': ariaInvalid,
            'aria-describedby': ariaDescribedBy,
            placeholder,
            ...props
        },
        ref,
    ) => {
        const isInvalid = ariaInvalid === true || ariaInvalid === 'true' || Boolean(error);

        const errorMessage = typeof error === 'string' && error.length > 0 ? error : undefined;

        const helperId = id ? `${id}-description` : undefined;

        const describedBy =
            [ariaDescribedBy, (isInvalid && errorMessage) || (!isInvalid && helperText) ? helperId : undefined].filter(Boolean).join(' ') ||
            undefined;

        return (
            <div className={cn('w-full min-w-0', wrapperClassName)}>
                <div className="relative">
                    <textarea
                        ref={ref}
                        id={id}
                        required={required}
                        data-slot="textarea"
                        aria-invalid={isInvalid}
                        aria-describedby={describedBy}
                        placeholder={label ? ' ' : placeholder}
                        className={cn(
                            // Layout
                            'peer block w-full min-w-0',
                            'min-h-28 rounded-md border',

                            // Spacing
                            'px-3.5 pt-6 pb-3',

                            // Appearance
                            'border-input bg-background',
                            'text-foreground text-base font-normal',
                            'shadow-none ring-0 outline-none',

                            // Placeholder
                            label && 'placeholder:text-transparent',
                            !label && 'placeholder:text-muted-foreground',

                            // Focus: brand border without an outer ring
                            'transition-[border-color,border-width] duration-150',
                            'focus:border-primary focus:border-2',
                            'focus:ring-0 focus:outline-none',

                            // Validation: destructive border takes priority
                            'aria-invalid:!border-destructive',
                            'aria-invalid:focus:!border-destructive',
                            'aria-invalid:focus:!ring-0',

                            // Disabled
                            'disabled:cursor-not-allowed',
                            'disabled:opacity-60',

                            // Reduced motion
                            'motion-reduce:transition-none',

                            className,
                        )}
                        {...props}
                    />

                    {label && (
                        <label
                            htmlFor={id}
                            className={cn(
                                // Position and appearance
                                'pointer-events-none absolute start-3.5 z-10',
                                'origin-start bg-background px-1',
                                'text-foreground/75 text-sm font-medium',

                                // Default: float when focused or when populated
                                'top-0 -translate-y-1/2',

                                // Empty and unfocused: position near the top
                                'peer-placeholder-shown:top-5',
                                'peer-placeholder-shown:translate-y-0',
                                'peer-placeholder-shown:text-base',
                                'peer-placeholder-shown:font-normal',

                                // Focus: float immediately
                                'peer-focus:top-0',
                                'peer-focus:-translate-y-1/2',
                                'peer-focus:text-sm',
                                'peer-focus:font-medium',
                                'peer-focus:text-primary',

                                // Smooth movement
                                'transition-[top,transform,color,font-size] duration-150',
                                'motion-reduce:transition-none',

                                // Invalid: keep label red
                                isInvalid && 'text-destructive peer-focus:text-destructive',

                                // Disabled
                                'peer-disabled:opacity-60',
                            )}
                        >
                            {label}
                            {required && (
                                <span aria-hidden="true" className="ms-1">
                                    *
                                </span>
                            )}
                        </label>
                    )}
                </div>

                {(isInvalid && errorMessage) || (!isInvalid && helperText) ? (
                    <p id={helperId} className={cn('mt-1.5 px-1 text-xs leading-5', isInvalid ? 'text-destructive' : 'text-muted-foreground')}>
                        {isInvalid ? errorMessage : helperText}
                    </p>
                ) : null}
            </div>
        );
    },
);

Textarea.displayName = 'Textarea';

export { Textarea };
