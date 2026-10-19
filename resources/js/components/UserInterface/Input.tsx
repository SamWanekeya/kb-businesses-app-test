import useEmailValidation from '@hooks/useEmailValidation';
import { cn } from '@lib/utils';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Values supported by the component validation pipeline.
 *
 * Text-based inputs provide a string while file inputs provide a FileList.
 * `null` is included for defensive handling of cleared values.
 */
type InputValue = string | FileList | null;

/**
 * Result returned by the input validation pipeline.
 */
interface ValidationResult {
    valid: boolean;
    message: string | null;
}

/**
 * Props for the reusable Input component.
 *
 * Extends the native input attributes so standard HTML and accessibility
 * attributes can be passed directly to the underlying input element.
 */
export interface InputProps extends React.ComponentProps<'input'> {
    /** Optional floating label. */
    label?: string;

    /** Optional supporting text displayed below the input. */
    helperText?: string;

    /** Additional classes for the input wrapper. */
    wrapperClassName?: string;

    /**
     * Called whenever validation runs.
     *
     * @param valid Whether the current value passed validation.
     * @param message Human-readable validation feedback, when invalid.
     */
    onValidate?: (valid: boolean, message: string | null) => void;

    /** Maximum permitted file size in bytes. */
    maxFileSize?: number;

    /** MIME types accepted by file input validation. */
    acceptTypes?: string[];

    /**
     * Application-specific identifier used as the native input `id`.
     *
     * Kept for compatibility with the existing component API.
     */
    inputIdentifier?: string;

    /**
     * Overrides the native input type.
     *
     * Kept for compatibility with the existing component API.
     */
    inputType?: React.HTMLInputTypeAttribute;

    /**
     * Controls the virtual keyboard layout presented by supported devices.
     *
     * `none` suppresses the virtual keyboard entirely,
     * `text` presents a general text keyboard,
     * `decimal` presents a numeric keyboard suitable for decimal values,
     * `numeric` presents a digit-only keypad,
     * `tel` presents a telephone keypad layout,
     * `search` presents a text keyboard with an optimized search/go key,
     * `email` presents a keyboard optimized for entering email addresses,
     * `url` presents a keyboard optimized for web addresses.
     */
    inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';

    /**
     * External validation error supplied by the parent.
     *
     * A truthy value marks the input as invalid independently of the
     * component's internal validation result.
     */
    error?: string | boolean | null;
}

/**
 * Input
 *
 * Provides a reusable, accessible input control with application-level
 * validation for common input types.
 *
 * Responsibilities:
 * - Render a consistently styled native input.
 * - Validate required, text, email, password, URL, and file values.
 * - Report validation results to the parent component.
 * - Preserve native HTML input and accessibility behavior.
 *
 * Accessibility:
 * - Uses native input semantics.
 * - Forwards standard accessibility attributes such as `aria-describedby`.
 * - Reflects internal and external validation state through `aria-invalid`.
 * - Allows consumers to provide accessible labels and validation messages.
 *
 * Performance:
 * - Memoizes event handlers used by the native input.
 * - Avoids maintaining redundant required-field state.
 * - Keeps validation state local only where it is required to control
 *   the input's accessibility state.
 *
 * Extension points:
 * - Additional validation rules can be added to `runValidation`.
 * - Domain-specific validation should remain delegated to dedicated hooks,
 *   such as `useEmailValidation`.
 *
 * @param label
 * @param helperText
 * @param wrapperClassName
 * @param className
 * @param inputIdentifier
 * @param inputType
 * @param inputMode
 * @param required
 * @param maxFileSize
 * @param acceptTypes
 * @param error
 * @param onChange
 * @param onBlur
 * @param onValidate
 * @param ariaInvalid
 * @param props Input configuration and native HTML input attributes.
 */
export default function Input({
    label,
    helperText,
    wrapperClassName,
    className,
    inputIdentifier,
    inputType = 'text',
    inputMode,
    required = false,
    maxFileSize,
    acceptTypes,
    error,
    onChange,
    onBlur,
    onValidate,
    'aria-invalid': ariaInvalid,
    ...props
}: InputProps) {
    const { t: translate } = useTranslation();
    const validateEmail = useEmailValidation();

    const [hasValidationError, setHasValidationError] = useState(Boolean(error));
    const [validationMessage, setValidationMessage] = useState<string | null>(null);

    /**
     * Validates the supplied input value.
     *
     * Existing validation behavior is intentionally preserved so this
     * component refactor does not alter application business rules.
     */
    const runValidation = useCallback(
        (value: InputValue): ValidationResult => {
            if (required && (value === '' || value === null || (value instanceof FileList && value.length === 0))) {
                return {
                    valid: false,
                    message: translate('This field is required'),
                };
            }

            if (inputType === 'text' && typeof value === 'string' && value.length > 0) {
                if (value.length > 255) {
                    return {
                        valid: false,
                        message: translate('The maximum characters allowed for the name field is 255'),
                    };
                }

                if (value.length < 2) {
                    return {
                        valid: false,
                        message: translate('Are you sure you entered the name correctly?'),
                    };
                }
            }

            if (inputType === 'email' && typeof value === 'string' && value.length > 0) {
                return validateEmail(value);
            }

            if (inputType === 'password' && typeof value === 'string' && value.length > 0) {
                if (value.length > 128) {
                    return {
                        valid: false,
                        message: translate('Passwords must have a maximum of 128 characters'),
                    };
                }

                if (value.length < 12) {
                    return {
                        valid: false,
                        message: translate('Passwords must have a minimum of 12 characters.'),
                    };
                }

                if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,128}$/.test(value)) {
                    return {
                        valid: false,
                        message: translate(
                            'Password must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.',
                        ),
                    };
                }
            }

            if (inputType === 'url' && typeof value === 'string' && value.length > 0) {
                try {
                    new URL(value);
                } catch {
                    return {
                        valid: false,
                        message: translate('Please provide a valid URL'),
                    };
                }
            }

            if (inputType === 'file' && value instanceof FileList) {
                const file = value[0];

                if (!file) {
                    return {
                        valid: true,
                        message: null,
                    };
                }

                if (maxFileSize !== undefined && file.size > maxFileSize) {
                    const maximumSizeMB = Math.round(maxFileSize / (1024 * 1024));

                    return {
                        valid: false,
                        message: translate(`The selected file is too big it must be smaller than ${String(maximumSizeMB)}MB`),
                    };
                }

                if (acceptTypes?.length && !acceptTypes.includes(file.type)) {
                    return {
                        valid: false,
                        message: translate('Invalid file type'),
                    };
                }
            }

            return {
                valid: true,
                message: null,
            };
        },
        [acceptTypes, inputType, maxFileSize, required, translate, validateEmail],
    );

    /**
     * Processes an input change event.
     *
     * Validation state is maintained declaratively and exposed to the parent
     * through `onValidate`.
     */
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value: InputValue = inputType === 'file' ? event.target.files : event.target.value;

            const result = runValidation(value);

            setHasValidationError(!result.valid);
            setValidationMessage(result.message);
            onValidate?.(result.valid, result.message);
            onChange?.(event);
        },
        [inputType, onChange, onValidate, runValidation],
    );

    /**
     * Processes an input blur event using the same validation pipeline as
     * change events.
     */
    const handleBlur = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            const value: InputValue = inputType === 'file' ? event.target.files : event.target.value;

            const result = runValidation(value);

            setHasValidationError(!result.valid);
            setValidationMessage(result.message);
            onValidate?.(result.valid, result.message);
            onBlur?.(event);
        },
        [inputType, onBlur, onValidate, runValidation],
    );

    const isInvalid = ariaInvalid === true || ariaInvalid === 'true' || Boolean(error) || hasValidationError;

    const errorMessage = typeof error === 'string' && error.length > 0 ? error : validationMessage;

    const helperId = inputIdentifier ? `${inputIdentifier}-description` : undefined;

    const describedBy =
        [props['aria-describedby'], isInvalid && errorMessage ? helperId : undefined, !isInvalid && helperText ? helperId : undefined]
            .filter(Boolean)
            .join(' ') || undefined;

    return (
        <div className={cn('w-full min-w-0', wrapperClassName)}>
            <div className="relative">
                <input
                    id={inputIdentifier}
                    type={inputType}
                    inputMode={inputMode}
                    data-slot="input"
                    aria-invalid={isInvalid}
                    aria-describedby={describedBy}
                    placeholder={label ? ' ' : props.placeholder}

                    className={cn(
                        // Base field
                        'peer block h-14 w-full min-w-0 rounded-md border',
                        'border-input bg-background px-3.5 pt-3 pb-2',
                        'text-foreground text-base font-normal',
                        'shadow-none ring-0 outline-none',

                        // Placeholder
                        label && 'placeholder:text-transparent',

                        // Focus: border only, no outer ring or shadow
                        'transition-colors duration-150',
                        'focus:border-primary focus:border-2',
                        'focus:!shadow-none focus:!ring-0 focus:!outline-none',
                        'focus-visible:!ring-0 focus-visible:!outline-none',
                        'focus-visible:!shadow-none',

                        // Invalid: red border takes priority, even when focused
                        'aria-invalid:!border-destructive',
                        'aria-invalid:focus:!border-destructive',
                        'aria-invalid:focus:!ring-0',
                        'aria-invalid:focus:!shadow-none',
                        'aria-invalid:focus-visible:!ring-0',
                        'aria-invalid:focus-visible:!shadow-none',

                        // Disabled
                        'disabled:cursor-not-allowed disabled:opacity-60',

                        // Reduced motion
                        'motion-reduce:transition-none',

                        className,
                    )}

                    onChange={handleChange}
                    onBlur={handleBlur}
                    {...props}
                />

                {label && (
                    <label
                        htmlFor={inputIdentifier}

                        className={cn(
                            // Position and appearance
                            'pointer-events-none absolute start-3.5 z-10',
                            'origin-start bg-background px-1',
                            'text-foreground/75 text-sm',

                            // Default: floated label
                            'top-0 -translate-y-1/2',

                            // Empty and unfocused: center the label
                            'peer-placeholder-shown:top-1/2',
                            'peer-placeholder-shown:-translate-y-1/2',
                            'peer-placeholder-shown:text-base',
                            'peer-placeholder-shown:font-normal',

                            // Focus: float immediately and use brand color
                            'peer-focus:top-0',
                            'peer-focus:-translate-y-1/2',
                            'peer-focus:text-sm',
                            'peer-focus:font-medium',
                            'peer-focus:text-primary',

                            // Invalid: keep label visible and red
                            'peer-aria-invalid:top-0',
                            'peer-aria-invalid:-translate-y-1/2',
                            'peer-aria-invalid:text-sm',
                            'peer-aria-invalid:font-medium',
                            'peer-aria-invalid:text-destructive',

                            // Smooth movement
                            'transition-[top,transform,color,font-size] duration-150',
                            'motion-reduce:transition-none',

                            // Error takes priority over focus
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
                <p id={helperId} className={cn('mt-1.5 px-1 text-xs leading-5', isInvalid ? 'text-destructive' : 'text-foreground/75')}>
                    {isInvalid ? errorMessage : helperText}
                </p>
            ) : null}
        </div>
    );
}

export { Input };
