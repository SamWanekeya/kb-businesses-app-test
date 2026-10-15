// resources/js/utils/Helpers/StringFormatters.ts

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
