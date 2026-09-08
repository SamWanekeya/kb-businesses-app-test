import { storeCookie } from '@/utils/Helpers/Cookies';
import useIsMobile from '@hooks/useIsMobile';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SIDEBAR_KEYBOARD_SHORTCUT = '[';

/**
 * Shape of the sidebar state exposed via context.
 *
 * A few constraints worth calling out:
 * - `state` is derived from `open` and must not diverge. UI depends on this
 *   for attribute-based styling (not recomputed downstream).
 * - `open` (desktop) and `openMobile` (mobile) are intentionally separate.
 *   Treat them as different interaction models, not breakpoints of the same state.
 * - `variant` and `collapsible` are part of the layout contract, not just styling.
 *   Changing them at runtime is supported but will affect all consumers relying
 *   on `data-*` attributes.
 */
export type SidebarState = {
    // UI state
    open: boolean;
    openMobile: boolean;

    // derived state (REQUIRED by UI)
    state: 'expanded' | 'collapsed';
    isMobile: boolean;

    // layout config
    variant: 'sidebar' | 'floating' | 'inset';
    collapsible: 'offcanvas' | 'icon' | 'none';
    side: 'left' | 'right';

    // actions
    setOpen: (value: boolean) => void;
    setOpenMobile: (value: boolean) => void;
    setVariant: (value: SidebarState['variant']) => void;
    setCollapsible: (value: SidebarState['collapsible']) => void;
    toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarState | null>(null);

/**
 * Provides sidebar state and global behavior.
 *
 * This is the single source of truth for:
 * - layout configuration (`variant`, `collapsible`, `side`)
 * - visibility state (desktop + mobile)
 * - global interactions (keyboard shortcut)
 *
 * Keyboard shortcut (`⌘/Ctrl + [`) is registered at the window level and:
 * - ignored for input/textarea/contenteditable targets
 * - toggles `openMobile` on small screens and `open` otherwise
 *
 * Desktop `open` state is persisted via cookie to keep layout stable
 * across full reloads (including non-SPA navigation).
 *
 * `state` is derived here (not in consumers) to keep styling deterministic.
 */
export function SidebarProvider({
    children,
    defaultOpen = true,
    defaultVariant = 'inset',
    defaultCollapsible = 'icon',
    defaultSide = 'left',
}: {
    children: React.ReactNode;
    defaultOpen?: boolean;
    defaultVariant?: SidebarState['variant'];
    defaultCollapsible?: SidebarState['collapsible'];
    defaultSide?: SidebarState['side'];
}) {
    const isMobile = useIsMobile(); //  REQUIRED

    const [open, _setOpen] = useState(defaultOpen);
    const [openMobile, setOpenMobile] = useState(false);
    const [variant, setVariant] = useState(defaultVariant);
    const [collapsible, setCollapsible] = useState(defaultCollapsible);
    const [side] = useState(defaultSide);

    //  CRITICAL: restore derived state
    const state: 'expanded' | 'collapsed' = open ? 'expanded' : 'collapsed';

    const setOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
        _setOpen((prev) => {
            const next = typeof value === 'function' ? value(prev) : value;

            storeCookie('__hf_sidebar_st', next);

            return next;
        });
    }, []);

    const toggleSidebar = useCallback(() => {
        if (isMobile) {
            setOpenMobile((prev) => !prev);
        } else {
            setOpen((prev) => !prev);
        }
    }, [isMobile, setOpen, setOpenMobile]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;

            // Ignore typing contexts
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            if ((event.metaKey || event.ctrlKey) && (event.key === SIDEBAR_KEYBOARD_SHORTCUT || event.code === 'BracketLeft')) {
                event.preventDefault();

                if ((event.metaKey || event.ctrlKey) && (event.key === SIDEBAR_KEYBOARD_SHORTCUT || event.code === 'BracketLeft')) {
                    event.preventDefault();
                    toggleSidebar();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [toggleSidebar, setOpenMobile]);

    const value = useMemo<SidebarState>(
        () => ({
            open,
            openMobile,
            state,
            isMobile,
            variant,
            collapsible,
            side,
            setOpen,
            setOpenMobile,
            setVariant,
            setCollapsible,
            toggleSidebar,
        }),
        [open, openMobile, state, isMobile, variant, collapsible, side, setOpen, toggleSidebar],
    );

    return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

/**
 * Accessor for sidebar context.
 *
 * Throws immediately if used outside `SidebarProvider`.
 * This is intentional — sidebar state is considered required infrastructure
 * for any component that depends on it.
 */
export function useSidebar() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
    return ctx;
}
