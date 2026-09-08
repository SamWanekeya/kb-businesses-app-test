import useTheme from '@/hooks/useTheme';
import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Resets ephemeral theme preview on every Inertia page navigation.
 * Keeps DOM in sync with user's saved theme.
 */
export function ThemeEffect() {
    const { resetPreview } = useTheme();

    useEffect(() => {
        const unsubscribe = router.on('navigate', () => {
            resetPreview();
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [resetPreview]);

    return null;
}
