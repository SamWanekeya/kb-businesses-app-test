import { useCallback } from 'react';

/**
 * Returns a stable function that derives initials from a full name.
 *
 * Used for avatar fallbacks where we only need a deterministic 1–2 character label.
 * Intentionally simple: we only consider the first and last tokens after splitting on
 * spaces. Middle names and multi-word surnames are collapsed.
 *
 * Assumptions / constraints:
 * - Input is a human name, not arbitrary text
 * - Words are space-delimited (no locale-aware parsing)
 * - Output is at most two uppercase characters
 *
 * Edge cases:
 * - Empty or whitespace-only input → ''
 * - Single word → first character only
 */
export default function useInitials() {
    return useCallback((name: string): string => {
        const names = name.trim().split(' ');

        if (names.length === 0) return '';
        if (names.length === 1) return names[0].charAt(0).toUpperCase();

        const firstInitial = names[0]?.charAt(0);
        const lastInitial = names[names.length - 1]?.charAt(0);

        return `${firstInitial}${lastInitial}`.toUpperCase();
    }, []);
}
