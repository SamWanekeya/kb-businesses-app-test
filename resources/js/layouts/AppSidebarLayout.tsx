import { PropsWithChildren } from 'react';

import AppContent from '@components/AppContent';
import AppShell from '@components/AppShell';
import AppSidebar from '@components/AppSidebar';
import AppSidebarHeader from '@components/AppSidebarHeader';

/**
 * A layout component that arranges the application shell in a sidebar configuration.
 *
 * Renders the `AppShell` with a persistent sidebar (`AppSidebar`) on the left
 * and the main content area (`AppContent`) on the right. The `AppSidebarHeader`
 * is displayed above any provided `children`.
 *
 * @component
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Content to be rendered inside the sidebar layout.
 * @returns {JSX.Element} The rendered sidebar layout.
 */
export default function AppSidebarLayout({ children }: PropsWithChildren<object>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader />
                {children}
            </AppContent>
        </AppShell>
    );
}
