import { SidebarMenuSkeleton } from '@components/UserInterface/sidebar';
import { Skeleton } from '@components/UserInterface/skeleton';
import { useLogos } from '@contexts/LogoContext';
import { useThemePreview } from '@hooks/use-theme-preview';
import { resolveImageUrl } from '@utils/Helpers/Url';
import React from 'react';

export function ThemePreview() {
    const { appearance, themeColor, position, variant, collapsible, style } = useThemePreview();
    const { logoLight, logoDark } = useLogos();
    const [logoError, setLogoError] = React.useState(false);

    // Reset logo error when logo sources change
    React.useEffect(() => {
        setLogoError(false);
    }, [logoLight, logoDark, appearance]);

    // Determine sidebar style class
    const getSidebarStyleClass = () => {
        if (style === 'colored') return 'bg-primary text-white';
        if (style === 'gradient') return 'bg-gradient-to-b from-primary to-primary/80 text-white';
        return 'bg-sidebar text-sidebar-foreground';
    };

    // Logo preview based on appearance
    const getLogoSrc = () => {
        if (logoError) return '';

        if (appearance === 'dark') {
            return logoLight || 'logo/logo-light.png';
        } else {
            return logoDark || 'logo/logo-dark.png';
        }
    };

    // Get title text
    const getTitleText = () => {
        return 'Kakbima';
    };

    return (
        <div className="overflow-hidden rounded-lg border">
            <div className="flex items-center justify-between bg-neutral-100 p-2 text-xs font-medium dark:bg-neutral-800">
                <div>Theme Preview</div>
                <div className="flex gap-2">
                    <span className="bg-primary/10 text-primary rounded px-2 py-1">{appearance}</span>
                    <span className="bg-primary/10 text-primary rounded px-2 py-1">{themeColor}</span>
                    <span className="bg-primary/10 text-primary rounded px-2 py-1">{position}</span>
                </div>
            </div>

            <div className={`flex h-64 flex-row`} dir={position === 'right' ? 'rtl' : 'ltr'}>
                {/* Sidebar */}
                <div
                    className={`flex w-1/4 flex-col ${getSidebarStyleClass()} ${variant === 'floating' ? 'm-2 rounded-lg border shadow-sm' : ''} ${variant === 'inset' ? '' : ''} ${collapsible === 'icon' ? 'max-w-[3rem]' : ''} `}
                >
                    {/* Sidebar Header with Logo - using the same style as the sidebar */}
                    <div className={`border-sidebar-border flex items-center justify-center overflow-hidden border-b p-1 ${getSidebarStyleClass()}`}>
                        {!logoError && getLogoSrc() ? (
                            <img
                                key={`preview-${appearance}-${getLogoSrc()}`}
                                src={resolveImageUrl(getLogoSrc())}
                                alt={getTitleText()}
                                className="h-5 max-w-[60px] object-contain"
                                onError={() => setLogoError(true)}
                            />
                        ) : (
                            <div className="flex h-5 items-center text-xs font-semibold tracking-tight text-inherit">{getTitleText()}</div>
                        )}
                    </div>

                    {/* Sidebar Content */}
                    <div className="flex-1 space-y-1 overflow-hidden p-2">
                        <SidebarMenuSkeleton showIcon={true} active={true} />
                        <SidebarMenuSkeleton showIcon={true} />
                        <SidebarMenuSkeleton showIcon={true} />
                        <SidebarMenuSkeleton showIcon={true} />

                        {/* Nested menu */}
                        {collapsible !== 'icon' && (
                            <div className="border-sidebar-border mt-2 ml-4 space-y-1 border-l pl-2">
                                <SidebarMenuSkeleton showIcon={true} />
                                <SidebarMenuSkeleton showIcon={true} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className={`bg-background text-foreground flex-1 p-4 ${variant === 'inset' ? 'm-2 rounded-lg' : ''}`}>
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />

                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Skeleton className="bg-primary h-8 w-20 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-md" />
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <Skeleton className="h-20 rounded-md" />
                            <Skeleton className="h-20 rounded-md" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
