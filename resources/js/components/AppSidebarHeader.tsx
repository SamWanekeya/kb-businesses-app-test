import { LanguageSelector } from '@components/LanguageSelector';
import ProfileMenu from '@components/ProfileMenu';
import { SidebarTrigger } from '@components/UserInterface/Sidebar';
import { useLayout } from '@contexts/LayoutContext';
import { router, usePage } from '@inertiajs/react';
import { route } from '@utils/Routes';
import { useTranslation } from 'react-i18next';

/**
 * Header section rendered at the top of the application sidebar layout.
 *
 * Reads layout positioning from `LayoutContext` to correctly align the
 * `SidebarTrigger` based on the effective sidebar side. This keeps the
 * trigger visually anchored to the edge of the viewport even when the
 * sidebar position is flipped at runtime.
 *
 * Displays:
 * - An impersonation exit action when `isOnBehalfOf` is present in
 *   Inertia page props. This relies on the backend consistently exposing
 *   the flag when impersonation middleware is active.
 * - `LanguageSelector` for runtime locale switching.
 * - `ProfileMenu` for authenticated user actions.
 *
 * The impersonation exit action performs a POST to the
 * `on-behalf-of.leave` route via Inertia. This must remain a POST to
 * preserve server-side audit and middleware expectations.
 */
export default function AppSidebarHeader() {
    const { t: translate } = useTranslation();
    const { effectivePosition } = useLayout();
    const { props } = usePage<{ isOnBehalfOf?: boolean }>();

    const triggerAlignment = effectivePosition === 'left' ? 'mr-auto -ml-1' : 'ml-auto -mr-1';

    return (
        <header className="border-sidebar-border/50 flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-3">
            <div className="flex w-full items-center justify-between">
                <SidebarTrigger className={triggerAlignment} />

                <div className="flex items-center gap-2">
                    {props.isOnBehalfOf && (
                        <button
                            onClick={() => {
                                router.post(route('on-behalf-of.leave'));
                            }}
                            className="cursor-pointer rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        >
                            {translate('Stop impersonating')}
                        </button>
                    )}
                    <LanguageSelector />
                    <ProfileMenu />
                </div>
            </div>
        </header>
    );
}
