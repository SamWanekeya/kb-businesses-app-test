import { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Breadcrumbs } from '@components/breadcrumbs';
import { LanguageSwitcher } from '@components/language-switcher';
import { ProfileMenu } from '@components/profile-menu';
import { Button } from '@components/UserInterface/button';
import { SidebarTrigger } from '@components/UserInterface/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/tooltip';
import { useLayout } from '@contexts/LayoutContext';
import { router, usePage } from '@inertiajs/react';
import { getCookie, storeCookie } from '@utils/Helpers/Cookies';
import { route } from '@utils/Routes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { t: translate } = useTranslation();
    const { position } = useLayout();
    const { globalSettings } = usePage().props;
    const isDemo = globalSettings?.is_demo || false;
    // Determine current mode from DB (non-demo) or cookie (demo)
    const getCurrentMode = (): 'light' | 'dark' => {
        if (isDemo) {
            try {
                const cookie = getCookie('themeSettings');
                if (cookie) {
                    const parsed = JSON.parse(cookie);
                    return parsed.appearance === 'dark' ? 'dark' : 'light';
                }
            } catch {}
            return 'light';
        }
        return globalSettings?.themeMode === 'dark' ? 'dark' : 'light';
    };

    const [isDark, setIsDark] = useState(() => getCurrentMode() === 'dark');

    // Sync with globalSettings changes (main version)
    useEffect(() => {
        setIsDark(getCurrentMode() === 'dark');
    }, [globalSettings?.themeMode]);

    // Sync with DOM dark class changes (demo version — settings page updates DOM directly)
    useEffect(() => {
        if (!isDemo) return;
        const observer = new MutationObserver(() => {
            const domIsDark = document.documentElement.classList.contains('dark');
            setIsDark(domIsDark);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [isDemo]);

    const handleToggle = () => {
        const newMode = isDark ? 'light' : 'dark';
        setIsDark(!isDark);

        // Apply theme directly to DOM
        document.documentElement.classList.toggle('dark', newMode === 'dark');
        document.body.classList.toggle('dark', newMode === 'dark');

        if (isDemo) {
            // Demo: save to cookie directly with new mode value — no router call
            try {
                const existing = getCookie('themeSettings');
                const parsed = existing ? JSON.parse(existing) : {};
                const updated = { ...parsed, appearance: newMode };
                storeCookie('themeSettings', updated);
            } catch {
                storeCookie('themeSettings', { appearance: newMode });
            }
        } else {
            // Main: save to database
            router.post(
                route('settings.brand.update'),
                {
                    settings: {
                        themeMode: newMode,
                    },
                },
                { preserveScroll: true, preserveState: true },
            );
        }
    };

    return (
        <>
            <header className="border-sidebar-border/50 flex h-14 shrink-0 items-center gap-2 border-b px-[10px] transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 min-[992px]:px-[50px]">
                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                        {position === 'left' && <SidebarTrigger className="-ml-1" />}
                        {position === 'right' && <SidebarTrigger className="-mr-1" />}
                        <Breadcrumbs items={breadcrumbs.map((b) => ({ label: b.title, href: b.href }))} />
                    </div>
                    <div className="flex items-center gap-2">
                        {(usePage().props as any).isImpersonating && (
                            <button
                                onClick={() => router.post(route('impersonate.leave'))}
                                className="cursor-pointer rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                            >
                                {translate('Return Back')}
                            </button>
                        )}
                        {/* Dark/Light Mode Toggle */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button size={'icon'} variant={'outline'} onClick={handleToggle} className="border shadow-sm">
                                        {isDark ? (
                                            <Sun className="h-4 w-4 text-yellow-500" />
                                        ) : (
                                            <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isDark ? translate('Switch to Light Mode') : translate('Switch to Dark Mode')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <LanguageSwitcher />
                        <ProfileMenu />
                    </div>
                </div>
            </header>
        </>
    );
}
