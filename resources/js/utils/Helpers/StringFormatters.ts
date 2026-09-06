// resources/js/utils/Helpers/StringFormatters.ts

import { useTranslation } from 'react-i18next';

/**
 * Normalizes a string into sentence case.
 *
 * Intended for lightweight display formatting of identifiers coming from the backend
 * (e.g. enum values or snake_case keys). This is not locale-aware and should not be
 * used for user-facing copy that requires proper i18n rules.
 *
 * Behavior:
 * - Converts underscores to spaces
 * - Lowercases the entire string
 * - Uppercases only the first character
 */
export const formatSentenceCase = (str = '') =>
    str
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/^./, (c) => c.toUpperCase());

/**
 * Normalizes a string into title case.
 *
 * Used for presenting structured values (e.g. labels derived from API responses)
 * in a more readable format. Assumes simple word boundaries and does not handle
 * edge cases like acronyms or locale-specific casing rules.
 *
 * Behavior:
 * - Converts underscores to spaces
 * - Lowercases the entire string
 * - Uppercases the first character of each word
 */
export const formatTitleCase = (str = '') =>
    str
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Formats a numeric rating value to a fixed one-decimal-place string.
 *
 * Intended for consistent display of rating-like values (e.g. scores, averages)
 * that may arrive as either strings or numbers from external sources.
 * Invalid or non-numeric inputs are safely handled by returning an empty string.
 *
 * Behavior:
 * - Accepts both string and number inputs
 * - Attempts to coerce the value into a number
 * - Returns a string formatted to one decimal place if the value is finite
 * - Returns an empty string for non-numeric or invalid values
 */
export const formatRating = (value: unknown): string => {
    if (typeof value !== 'string' && typeof value !== 'number') return '';

    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(1) : '';
};

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

export const formatRelativeTime = (dateString: string) => {
    const { t: translate } = useTranslation();
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return translate('Just now');
    if (diffInMinutes < 60)
        return translate('{{count}} {{unit}} ago', {
            count: diffInMinutes,
            unit: diffInMinutes === 1 ? translate('minute') : translate('minutes'),
        });

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
        return translate('{{count}} {{unit}} ago', {
            count: diffInHours,
            unit: diffInHours === 1 ? translate('hour') : translate('hours'),
        });

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
        return translate('{{count}} {{unit}} ago', {
            count: diffInDays,
            unit: diffInDays === 1 ? translate('day') : translate('days'),
        });

    return window.appSettings?.formatDateTime(date, false);
};
