import { toast } from '@components/CustomToast';
import { usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import AppLayoutTemplate from '@layouts/AppSidebarLayout';
import { JSX, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Props accepted by {@link AppLayout}.
 */
interface AppLayoutProps {
    /**
     * Rendered inside the application shell.
     */
    children?: JSX.Element | JSX.Element[];

    /**
     * Forwarded directly to {@link AppLayoutTemplate}.
     * Keep usage minimal—layout styling should live in the template.
     */
    className?: string;

    /**
     * Forwarded directly to {@link AppLayoutTemplate}.
     * Primarily useful for integration points (e.g. testing, anchors).
     */
    id?: string;
}

/**
 * Shape of flash messages shared via Inertia.
 *
 * Must remain aligned with the backend flash structure.
 */
interface FlashMessages {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
}

/**
 * Root layout for authenticated areas.
 *
 * - Wraps content with {@link AppLayoutTemplate} (sidebar, navigation, etc.)
 * - Handles flash message delivery via toasts at a single integration point
 *
 * Notes:
 * - Flash handling is intentionally centralized here to avoid inconsistent
 *   UX across pages and duplicated logic.
 * - Unlike the auth layout, this does not handle validation errors—those are
 *   expected to be rendered inline within forms in the main app.
 * - Toasts fire on every Inertia page change; backend should not persist
 *   flash messages longer than intended.
 */
const AppLayout = (props: AppLayoutProps): JSX.Element => {
    const { children, className, id } = props;

    const { t: translate } = useTranslation();

    /**
     * Tracks the last displayed flash message signature to prevent duplicate toasts.
     *
     * This guards against:
     * - React 19 strict mode double-invocation
     * - Fast Inertia redirects
     * - Re-renders caused by shared prop updates
     */

    const page = usePage();

    useEffect(() => {
        const { flash } = page.props as { flash?: FlashMessages };

        if (!flash) return;

        const entries = Object.entries(flash) as [keyof FlashMessages, string][];

        for (const [type, message] of entries) {
            if (!message) continue;

            switch (type) {
                case 'success':
                    toast.success(translate(message));
                    break;

                case 'error':
                    toast.error(translate(message));
                    break;

                case 'warning':
                    toast.warning(translate(message));
                    break;

                case 'info':
                    toast.info(translate(message));
                    break;
            }
        }
    }, [page, translate]);

    return (
        <AppLayoutTemplate className={className} id={id}>
            {children}
        </AppLayoutTemplate>
    );
};

export default AppLayout;
