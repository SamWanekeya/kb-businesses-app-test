import { SidebarInset } from '@components/UserInterface/Sidebar';
import React from 'react';

/**
 * Props for `AppContent`.
 *
 * - `variant` controls the layout wrapper: `"header"` uses a standard `<main>`, `"sidebar"` uses `SidebarInset`.
 * - Extends all native `<main>` props for flexibility (className, id, etc.).
 */
interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

/**
 * Wrapper for page content with layout-specific behavior.
 *
 * - `variant="header"` renders a standard `main` container.
 * - `variant="sidebar"` wraps content in `SidebarInset`, ensuring proper RTL/LTR direction.
 *
 * Uses document direction at mount to avoid repeated DOM access.
 * Intended as the primary container for top-level page sections.
 */
export default function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    const [dir] = React.useState(() => document.documentElement.dir);

    if (variant === 'sidebar') {
        return (
            <SidebarInset {...props}>
                <div dir={dir}>{children}</div>
            </SidebarInset>
        );
    }

    return (
        <main className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl" {...props}>
            <div dir={dir}>{children}</div>
        </main>
    );
}
