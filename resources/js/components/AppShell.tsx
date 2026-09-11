import CookieConsentBanner from '@components/CookieConsentBanner';
import FloatingChatGpt from '@components/FloatingChatGpt';
import { SidebarProvider } from '@components/UserInterface/Sidebar';
import { getFromLocalStorage } from '@utils/Helpers/Storage';
import { useState } from 'react';

/**
 * Props for `AppShell`.
 *
 * `children` is always rendered inside the shell.
 * `variant` selects the layout chrome:
 * - `header`: no sidebar context
 * - `sidebar`: controlled SidebarProvider with persisted open state
 */
interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

/**
 * Top-level layout for pages in the SPA.
 *
 * Sidebar variant persists open/closed state in localStorage (`__kb_sidebar`).
 * Only one shell should be mounted per SPA instance to avoid duplicated
 * global integrations and sidebar conflicts.
 *
 * `FloatingChatGpt` and `CookieConsentBanner` are mounted regardless of variant.
 *
 * Usage is limited to full-page layouts. Do not wrap feature-level components.
 */
export default function AppShell({ children, variant = 'header' }: AppShellProps) {
    /**
     * Sidebar open state.
     * Defaults to open unless localStorage explicitly stores "false".
     * Lazily initialized to avoid SSR mismatch.
     */
    const [isOpen, setIsOpen] = useState(() => (typeof window !== 'undefined' ? getFromLocalStorage('__kb_sidebar') !== 'false' : true));

    /**
     * Updates controlled sidebar state and persists preference.
     * Must be the single write path to `__kb_sidebar` to maintain consistency.
     */
    const handleSidebarChange = (open: boolean) => {
        setIsOpen(open);

        if (typeof window !== 'undefined') {
            localStorage.setItem('__kb_sidebar', String(open));
        }
    };

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">
                {children}
                <FloatingChatGpt />
                <CookieConsentBanner />
            </div>
        );
    }

    return (
        <SidebarProvider defaultOpen={isOpen} open={isOpen} onOpenChange={handleSidebarChange}>
            <div className="flex w-full">
                {children}
                <FloatingChatGpt />
                <CookieConsentBanner />
            </div>
        </SidebarProvider>
    );
}
