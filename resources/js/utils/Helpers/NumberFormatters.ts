// resources/js/utils/Helpers/NumberFormatters.ts

/**
 * Formats a numeric value as a localized currency string.
 *
 * Intended for consistent display of monetary values originating from APIs,
 * databases, or user input. Uses the native Intl.NumberFormat API for
 * locale-aware formatting, including currency symbols and digit grouping.
 *
 * Behavior:
 * - Accepts both string and number inputs
 * - Attempts to coerce the value into a number
 * - Formats values using the provided locale and currency code
 * - Removes decimal places by default for cleaner UI display
 * - Returns an empty string for non-numeric or invalid values
 */
export const formatCurrencySimple = (value: unknown, currency: string = 'USD', locale: string = 'en-US'): string => {
    if (typeof value !== 'string' && typeof value !== 'number') return '';

    const amount = Number(value);

    if (!Number.isFinite(amount)) return '';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Formats a numeric value for use in a monetary or number form field.
 *
 * Normalizes values to two decimal places while preserving the underlying
 * numeric value. Trailing zeros are retained so existing monetary/number values
 * have a consistent presentation in the input.
 *
 * @param value Numeric value returned by the backend or an empty value.
 * @returns The value formatted to exactly two decimal places, or an empty
 * string when no value is provided.
 *
 * @example
 * formatNumberInput('249.0000000'); // '249.00'
 * formatNumberInput('249.5000000'); // '249.50'
 * formatNumberInput('249.75');       // '249.75'
 * formatNumberInput(null);           // ''
 */
export function formatNumberInput(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '';
}
