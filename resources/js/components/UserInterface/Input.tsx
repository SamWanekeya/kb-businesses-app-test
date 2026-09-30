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
 * @param className
 * @param inputIdentifier
 * @param inputType
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
    className,
    inputIdentifier,
    inputType = 'text',
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
                        message: translate('Passwords must have a minimum of 12 characters'),
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
            onValidate?.(result.valid, result.message);
            onBlur?.(event);
        },
        [inputType, onBlur, onValidate, runValidation],
    );

    const isInvalid = ariaInvalid === true || ariaInvalid === 'true' || Boolean(error) || hasValidationError;

    return (
        <input
            id={inputIdentifier}
            type={inputType}
            data-slot="input"
            aria-invalid={isInvalid}
            className={cn(
                'h-12 w-full rounded-md border px-3 py-2 shadow-xs outline-none md:text-sm',
                'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
                className,
            )}
            onChange={handleChange}
            onBlur={handleBlur}
            {...props}
        />
    );
}

export { Input };
