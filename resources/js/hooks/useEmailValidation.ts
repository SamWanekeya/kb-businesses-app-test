import { useCallback } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

/**
 * Result returned by the email validation function.
 */
interface EmailValidationResult {
    /** Whether the email is valid */
    valid: boolean;
    /** Localized validation error message, or null if valid */
    message: string | null;
}

/**
 * Provides a memoized email validation function with localized error messages.
 *
 * The validator allows empty values, enforces a maximum length,
 * and checks for a basic email format.
 *
 * @returns A function that validates an email string.
 */
export default function useEmailValidation() {
    const { t: translate } = useTranslation();

    /**
     * Validates an email address.
     *
     * @param value - The email string to validate.
     * @returns The validation result.
     */
    return useCallback(
        (value: string): EmailValidationResult => {
            if (!value) {
                return { valid: true, message: null };
            }

            if (value.length > 255) {
                return {
                    valid: false,
                    message: translate('Are you sure you entered the work email correctly?'),
                };
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(value)) {
                return {
                    valid: false,
                    message: translate('Please enter a valid work email address'),
                };
            }

            return { valid: true, message: null };
        },
        [translate],
    );
}
