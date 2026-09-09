import { ThemeContext } from '@contexts/ThemeProviderContext';
import { useContext } from 'react';

/**
 * Access theme context
 *
 * Enforces provider usage.
 */
export default function useTheme() {
    const ctx = useContext(ThemeContext);

    if (!ctx) {
        throw new Error('useTheme must be used within ThemeProvider');
    }

    return ctx;
}
