import useEmailValidation from '@hooks/useEmailValidation';
import { cn } from '@lib/utils';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props for the reusable Input component.
 */
export interface InputProps extends React.ComponentProps<'input'> {
    /**
     * Triggered whenever validation runs.
     * - `valid = true` -> no error
     * - `valid = false` -> error occurred
     * - `message` -> human-readable error text
     */
    onValidate?: (valid: boolean, message: string | null) => void;

    /**
     * Notifies parent when a required field becomes empty (`true`) or non-empty (`false`)
     */
    onRequiredStateChange?: (isEmpty: boolean) => void;

    /** Maximum file size in bytes for file input validation */
    maxFileSize?: number;

    /** Allowed MIME types for file input validation */
    acceptTypes?: string[];

    /**
     * Identifier for the input field, also used as `id` attribute
     */
    inputIdentifier?: string;

    /** Overrides the default input type (default is 'text') */
    inputType?: React.HTMLInputTypeAttribute;

    /** Error state passed from parent */
    error?: string | boolean | null;
}

/**
 * Reusable Input component supporting:
 * - Text, email, password, URL, and file inputs
 * - Validation for required fields, emails, passwords, URLs, and files
 * - Blocked domains and keywords for email validation
 * - Callback hooks for validation results and required state changes
 * - Accessibility attributes (`aria-invalid`) updated automatically
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
 * @param onRequiredStateChange
 * @param {InputProps} props - Props for configuring the input behavior and validation
 */
export default function Input({
    className,
    inputIdentifier,
    inputType = 'text',
    required,
    maxFileSize,
    acceptTypes,
    error,
    onChange,
    onBlur,
    onValidate,
    onRequiredStateChange,
    ...props
}: InputProps) {
    const { t: translate } = useTranslation();

    const validateEmail = useEmailValidation();

    /**
     * Run validation for the input value.
     *
     * Validations include:
     * - Required fields
     * - Email format & blocked domains/keywords
     * - Password complexity
     * - URL format
     * - File size and type
     *
     * @param value - Current input value (string or FileList)
     * @returns { valid: boolean; message: string | null } Validation result
     */
    const runValidation = useCallback(
        (value: any) => {
            //  Required field validation
            if (required && (value === '' || value === null || (value instanceof FileList && value.length === 0))) {
                return { valid: false, message: translate('This field is required') };
            }

            //  Text field validation
            if (inputType === 'text' && value) {
                //  Maximum length (255)
                if (value && value.length > 255) {
                    return {
                        valid: false,
                        message: translate('The maximum characters allowed for the name field is 255'),
                    };
                }
                //  Minimum length (2)
                if (value && value.length < 2) {
                    return {
                        valid: false,
                        message: translate('Are you sure you entered the name correctly?'),
                    };
                }
            }

            //  Email validation
            if (inputType === 'email' && value) {
                return validateEmail(value);
            }

            //  Password validation
            if (inputType === 'password' && value) {
                //  Maximum length (128)
                if (value && value.length > 128) {
                    return {
                        valid: false,
                        message: translate('Passwords must have a maximum of 128 characters'),
                    };
                }
                //  Minimum length (12)
                if (value && value.length < 12) {
                    return {
                        valid: false,
                        message: translate('Passwords must have a minimum of 12 characters'),
                    };
                }
                /**
                 * Password regex rules:
                 * - Minimum 12 characters
                 * - At least 1 lowercase letter
                 * - At least 1 uppercase letter
                 * - At least 1 digit
                 * - At least 1 special character
                 */
                const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,128}$/;
                if (!pattern.test(value)) {
                    return {
                        valid: false,
                        message: translate(
                            'Password must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.',
                        ),
                    };
                }
            }

            //  URL validation
            if (inputType === 'url' && value) {
                try {
                    new URL(value); // Throws if invalid
                } catch {
                    return { valid: false, message: translate('Please provide a valid URL') };
                }
            }

            //  File input validation
            if (inputType === 'file' && value instanceof FileList) {
                const file = value[0];
                if (file) {
                    // Check file size
                    if (maxFileSize && file.size > maxFileSize) {
                        const maximumSizeMB = Math.round(maxFileSize / (1024 * 1024));
                        return {
                            valid: false,
                            message: translate(`The selected file is too big it must be smaller than ${maximumSizeMB}MB`),
                        };
                    }

                    // Check MIME type
                    if (acceptTypes && !acceptTypes.includes(file.type)) {
                        return { valid: false, message: translate('Invalid file type') };
                    }
                }
            }

            return { valid: true, message: null };
        },
        [required, inputType, translate, validateEmail, maxFileSize, acceptTypes],
    );

    /**
     * Notify parent component if a required field is empty.
     *
     * @param value - Current input value
     */
    const notifyRequiredState = useCallback(
        (value: any) => {
            if (!onRequiredStateChange) return;
            const isEmpty = value === '' || value === null || (value instanceof FileList && value.length === 0);
            onRequiredStateChange(isEmpty);
        },
        [onRequiredStateChange],
    );

    /**
     * Handle `onChange` events with validation and required state notifications.
     *
     * @param e - Input change event
     */
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = inputType === 'file' ? e.target.files : e.target.value;

            if (required) notifyRequiredState(value);

            const result = runValidation(value);

            e.target.setAttribute('aria-invalid', result.valid ? 'false' : 'true');
            onValidate?.(result.valid, result.message);
            onChange?.(e);
        },
        [onChange, onValidate, runValidation, inputType, required, notifyRequiredState],
    );

    /**
     * Handle `onBlur` events with validation and required state notifications.
     *
     * @param e - Input blur event
     */
    const handleBlur = useCallback(
        (e: React.FocusEvent<HTMLInputElement>) => {
            const value = inputType === 'file' ? e.target.files : e.target.value;

            if (required) notifyRequiredState(value);

            const result = runValidation(value);

            e.target.setAttribute('aria-invalid', result.valid ? 'false' : 'true');
            onValidate?.(result.valid, result.message);
            onBlur?.(e);
        },
        [onBlur, onValidate, runValidation, inputType, required, notifyRequiredState],
    );

    return (
        <input
            id={inputIdentifier}
            type={inputType}
            data-slot="input"
            aria-invalid={error ? 'true' : 'false'}
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
