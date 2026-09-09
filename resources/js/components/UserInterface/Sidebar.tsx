// resources/js/components/UserInterface/Sidebar.tsx
import React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva, VariantProps } from 'class-variance-authority';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';

import { Button } from '@components/UserInterface/Button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@components/UserInterface/Sheet';
import Skeleton from '@components/UserInterface/Skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { useSidebar } from '@contexts/SidebarContext';
import useIsMobile from '@hooks/useIsMobile';
import { cn } from '@lib/utils';
import { storeCookie } from '@utils/Helpers/Cookies';
import { useTranslation } from 'react-i18next';

const SIDEBAR_COOKIE_NAME = '__kb_sidebar_st';
const SIDEBAR_KEYBOARD_SHORTCUT = '[';

type SidebarContext = {
    state: 'expanded' | 'collapsed';
    open: boolean;
    side: 'left' | 'right';
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

/**
 * Provides sidebar state to descendants.
 *
 * Supports controlled (`open` + `onOpenChange`) and uncontrolled usage.
 * Desktop state is persisted via cookie to survive full page reloads.
 *
 * Mobile and desktop states are intentionally separate:
 * - `open` drives desktop layout
 * - `openMobile` drives the Sheet
 *
 * Consumers should not mix the two.
 */
function SidebarProvider({
    defaultOpen = true,
    open: openProp,
    onOpenChange: setOpenProp,
    className,
    children,
    ...props
}: React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
        (value: boolean | ((value: undefined | boolean) => boolean)) => {
            const openState = typeof value === 'function' ? value(open) : value;
            if (setOpenProp) {
                setOpenProp(openState);
            } else {
                _setOpen(openState);
            }

            // This sets the cookie to keep the sidebar state.
            storeCookie(SIDEBAR_COOKIE_NAME, openState);
        },
        [setOpenProp, open],
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
        isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo<SidebarContext>(
        () => ({
            state,
            open,
            setOpen,
            isMobile,
            openMobile,
            setOpenMobile,
            toggleSidebar,
        }),
        [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
    );

    return (
        <SidebarContext.Provider value={contextValue}>
            <TooltipProvider delayDuration={0}>
                <div
                    data-slot="sidebar-wrapper"
                    className={cn(
                        'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
                        '[--sidebar-width:16rem]',
                        '[--sidebar-width-icon:3rem]',
                        className,
                    )}
                    {...props}
                >
                    {children}
                </div>
            </TooltipProvider>
        </SidebarContext.Provider>
    );
}

/**
 * Root container that defines sidebar layout behavior.
 *
 * This component establishes the contract for all sidebar styling via
 * `data-*` attributes. Downstream components rely on these attributes
 * for layout, transitions, and visibility rules.
 *
 * `collapsible` directly affects layout semantics:
 * - `offcanvas`: sidebar leaves the viewport
 * - `icon`: collapses to icon rail
 * - `none`: fully static layout (no responsiveness logic applied)
 *
 * Mobile rendering is delegated to `Sheet`. Desktop is CSS-driven.
 */
function Sidebar({
    side,
    variant,
    collapsible,
    className,
    children,
    ...props
}: React.ComponentProps<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
    const { t: translate } = useTranslation();

    if (collapsible === 'none') {
        return (
            <div
                data-slot="sidebar"
                className={cn('bg-sidebar text-sidebar-foreground flex h-full w-[var(--sidebar-width)] flex-col', className)}
                {...props}
            >
                {children}
            </div>
        );
    }

    if (isMobile) {
        return (
            <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
                <SheetHeader className="sr-only">
                    <SheetTitle>Sidebar</SheetTitle>
                    <SheetDescription>{translate('Displays the mobile sidebar.')}</SheetDescription>
                </SheetHeader>
                <SheetContent
                    data-side={side}
                    data-sidebar="sidebar"
                    data-slot="sidebar"
                    data-mobile="true"
                    className={cn('bg-sidebar text-sidebar-foreground w-[var(--sidebar-width)] p-0 [&>button]:hidden', '[--sidebar-width:18rem]')}
                    side={side}
                >
                    <div className="flex h-full w-full flex-col">{children}</div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <div
            className="group peer text-sidebar-foreground hidden md:block"
            data-state={state} // expanded | collapsed
            data-collapsible={state === 'collapsed' ? collapsible : ''} // offcanvas | icon | none
            data-variant={variant === 'sidebar' ? 'inset' : variant} // inset/floating
            data-side={side} // left | right
            data-slot="sidebar"
        >
            {/* This is what handles the sidebar gap on desktop */}
            <div
                className={cn(
                    'relative h-svh w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear',
                    'group-data-[collapsible=offcanvas]:w-0',
                    'group-data-[side=right]:rotate-180',

                    // collapsed width
                    variant === 'floating' || variant === 'inset'
                        ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1rem)]'
                        : 'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]',
                )}
            />

            <div
                className={cn(
                    'fixed inset-y-0 z-10 hidden md:flex',
                    'h-svh w-[var(--sidebar-width)]',

                    // smoother animation
                    'transition-[left,right,width,padding] duration-200 ease-linear',

                    // floating spacing from viewport
                    'p-2',

                    side === 'left'
                        ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
                        : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',

                    // collapsed width handling
                    variant === 'floating' || variant === 'inset'
                        ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+1.5rem)]'
                        : 'group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]',

                    className,
                )}
                {...props}
            >
                <div
                    data-sidebar="sidebar"
                    className={cn(
                        'flex h-full w-full flex-col overflow-hidden',

                        // surfaces
                        'bg-white dark:bg-zinc-950',

                        // borders
                        'border border-zinc-200/80 dark:border-zinc-800',

                        // floating card
                        'rounded-xl',

                        // softer premium shadow
                        'shadow-[0_8px_30px_rgb(0,0,0,0.06)]',
                        'dark:shadow-[0_8px_30px_rgb(0,0,0,0.35)]',

                        // subtle edge definition
                        // 'ring-1 ring-black/5 dark:ring-white/10',

                        // modern glass effect
                        'supports-[backdrop-filter]:bg-white/95',
                        'dark:supports-[backdrop-filter]:bg-zinc-950/90',
                        'backdrop-blur-xl',

                        // smooth theme transitions
                        'transition-colors duration-200',
                    )}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * Toggle control for sidebar visibility.
 *
 * Uses context state to determine directionality so the icon reflects
 * the *result* of the action, not the current state.
 *
 * Always triggers `toggleSidebar` even if a custom `onClick` is provided.
 * Consumers should not attempt to manage state manually here.
 */
function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
    const { toggleSidebar, open, side, isMobile } = useSidebar();
    const { t: translate } = useTranslation();

    const isLeft = side === 'left';

    const Icon = open
        ? isLeft
            ? PanelLeftOpen // collapse toward left
            : PanelRightOpen // collapse toward right
        : isLeft
          ? PanelRightOpen // expand toward right
          : PanelLeftOpen; // expand toward left

    const isMac = React.useMemo(() => {
        if (typeof navigator === 'undefined') return false;

        if (navigator.userAgentData?.brands) {
            return navigator.userAgentData.platform.toLowerCase()?.includes('mac');
        }

        return navigator.userAgent.toLowerCase().includes('mac');
    }, []);

    const shortcutLabel = isMobile ? null : `${isMac ? '⌘' : 'Ctrl'} + ${SIDEBAR_KEYBOARD_SHORTCUT}`;

    const actionText = open ? translate('Collapse sidebar') : translate('Expand sidebar');

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    data-sidebar="trigger"
                    data-slot="sidebar-trigger"
                    variant="ghost"
                    size="icon"
                    className={cn(
                        'text-muted-foreground size-8 rounded-md border border-transparent transition-all duration-200',
                        'hover:border-border hover:bg-muted hover:text-foreground',
                        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2',
                        'active:scale-[0.98]',
                        className,
                    )}
                    onClick={(event) => {
                        onClick?.(event);
                        toggleSidebar();
                    }}
                    {...props}
                >
                    <Icon className="size-4" />
                </Button>
            </TooltipTrigger>

            <TooltipContent side="bottom" align="center">
                <span className="flex items-center gap-2">
                    {actionText}

                    {shortcutLabel && (
                        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center rounded border px-1.5 font-mono text-[10px] font-medium select-none">
                            {shortcutLabel}
                        </kbd>
                    )}
                </span>
            </TooltipContent>
        </Tooltip>
    );
}

/**
 * Main content surface adjacent to the sidebar.
 *
 * Relies on `peer` selectors from `Sidebar`. Must be rendered as a sibling
 * (not nested) to ensure layout rules apply correctly.
 *
 * In `inset` mode this element visually detaches from the viewport.
 */
function SidebarInset({ ...props }: React.ComponentProps<'main'>) {
    return (
        <main
            data-slot="sidebar-inset"
            className={cn(
                'relative flex min-h-svh flex-1 flex-col',

                // inset layout spacing
                'peer-data-[variant=inset]:min-h-[calc(100svh-var(--spacing-4))]',
                'md:peer-data-[variant=inset]:m-2',
                'md:peer-data-[variant=inset]:ml-0',

                // inset card styling
                'peer-data-[variant=inset]:rounded-xl',

                // surfaces
                'peer-data-[variant=inset]:bg-white',
                'dark:peer-data-[variant=inset]:bg-zinc-950',

                // borders
                'peer-data-[variant=inset]:border',
                'peer-data-[variant=inset]:border-zinc-200/80',
                'dark:peer-data-[variant=inset]:border-zinc-800',

                // shadows
                'peer-data-[variant=inset]:shadow-[0_8px_30px_rgb(0,0,0,0.06)]',
                'dark:peer-data-[variant=inset]:shadow-[0_8px_30px_rgb(0,0,0,0.35)]',

                // edge definition
                // 'peer-data-[variant=inset]:ring-1',
                // 'peer-data-[variant=inset]:ring-black/5',
                // 'dark:peer-data-[variant=inset]:ring-white/10',

                // glass effect
                'supports-[backdrop-filter]:peer-data-[variant=inset]:bg-white/95',
                'dark:supports-[backdrop-filter]:peer-data-[variant=inset]:bg-zinc-950/90',
                'peer-data-[variant=inset]:backdrop-blur-xl',

                // transitions
                'transition-[background-color,box-shadow,border-color] duration-200',
            )}
            {...props}
        />
    );
}

/**
 * Top section container.
 *
 * Exists primarily for styling hooks (`data-sidebar="header"`).
 */
function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="sidebar-header" data-sidebar="header" className={cn('flex flex-col gap-2 p-2 pb-4', className)} {...props} />;
}

/**
 * Bottom section container.
 *
 * Exists primarily for styling hooks (`data-sidebar="footer"`).
 */
function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="sidebar-footer" data-sidebar="footer" className={cn('flex flex-col gap-2 p-2', className)} {...props} />;
}

/**
 * Scrollable body container.
 *
 * Centralizes overflow + scrollbar styling to keep behavior consistent
 * across all sidebar implementations.
 */
function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sidebar-content"
            data-sidebar="content"
            className={cn('flex-1 overflow-y-auto', 'scrollbar-thumb-border scrollbar-thin scrollbar-track-transparent', className)}
            {...props}
        />
    );
}

/**
 * Groups related sidebar elements.
 *
 * Purely structural, but important for spacing and section-level styling.
 */
function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="sidebar-group"
            data-sidebar="group"
            className={cn('relative flex min-w-0 flex-col gap-1.5 px-1 py-2', className)}
            {...props}
        />
    );
}

/**
 * Root list for primary navigation.
 *
 * Does not impose semantics beyond vertical stacking.
 */
function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
    return <ul data-slot="sidebar-menu" data-sidebar="menu" className={cn('flex w-full min-w-0 flex-col gap-1.5', className)} {...props} />;
}

/**
 * Wrapper for a single menu item.
 *
 * Establishes positioning context for:
 * - action buttons
 * - tooltips
 * - nested menus
 */
function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
    return <li data-slot="sidebar-menu-item" data-sidebar="menu-item" className={cn('group/menu-item relative', className)} {...props} />;
}

const sidebarMenuButtonVariants = cva(
    cn(
        'peer/menu-button group relative flex w-full items-center gap-3 overflow-hidden rounded-md',
        'border border-transparent px-2 py-2 text-left text-sm',
        'transition-all duration-200 ease-out',
        'ring-ring outline-none',
        'hover:border-border/60 hover:bg-muted/70 hover:text-foreground',
        'focus-visible:ring-2 focus-visible:ring-offset-2',
        'active:scale-[0.995]',
        'disabled:pointer-events-none disabled:opacity-50',
        'aria-disabled:pointer-events-none aria-disabled:opacity-50',
        'group-has-data-[sidebar=menu-action]/menu-item:pr-8',
        'data-[active=true]:border-primary/20',
        'data-[active=true]:bg-primary/10',
        'data-[active=true]:text-primary dark:data-[active=true]:text-green-300',
        'data-[active=true]:shadow-sm',
        'data-[state=open]:bg-muted/70',
        '[&>span:last-child]:truncate',
        '[&>svg]:size-4 [&>svg]:shrink-0',
        'group-data-[collapsible=icon]:size-10!',
        'group-data-[collapsible=icon]:justify-center',
        'group-data-[collapsible=icon]:p-0!',
    ),
    {
        variants: {
            variant: {
                default: '',
                outline: cn('border-border/70 bg-background/80', 'hover:bg-muted', 'data-[active=true]:border-primary/30'),
            },
            size: {
                default: 'h-10',
                sm: 'h-8 rounded-lg px-2.5 text-xs',
                lg: 'h-12 text-sm',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

/**
 * Primary interactive element within a menu item.
 *
 * Key behaviors:
 * - `asChild` enables composition with links without losing styling
 * - `isActive` is purely visual (routing logic stays outside)
 * - tooltips only render when collapsed on desktop
 *
 * Width/spacing collapse is driven by parent `data-collapsible`.
 */
function SidebarMenuButton({
    asChild = false,
    isActive = false,
    variant = 'default',
    size = 'default',
    tooltip,
    className,
    ...props
}: React.ComponentProps<'button'> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
    const Comp = asChild ? Slot : 'button';
    const { isMobile, state } = useSidebar();

    const button = (
        <Comp
            data-slot="sidebar-menu-button"
            data-sidebar="menu-button"
            data-size={size}
            data-active={isActive}
            className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
            {...props}
        />
    );

    if (!tooltip) {
        return button;
    }

    if (typeof tooltip === 'string') {
        tooltip = {
            children: tooltip,
        };
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side="right" align="center" hidden={state !== 'collapsed' || isMobile} {...tooltip} />
        </Tooltip>
    );
}

/**
 * Skeleton placeholder for menu items.
 *
 * Randomized width avoids visual repetition during loading states.
 * Should be used instead of static skeleton rows for better perceived UX.
 */
function SidebarMenuSkeleton({
    className,
    showIcon = false,
    active = false,
    ...props
}: React.ComponentProps<'div'> & {
    showIcon?: boolean;
    active?: boolean;
}) {
    const widths = ['w-1/2', 'w-3/5', 'w-2/3', 'w-3/4', 'w-4/5', 'w-[90%]'];
    const widthClass = widths[Math.floor(Math.random() * widths.length)];

    return (
        <div
            data-slot="sidebar-menu-skeleton"
            data-sidebar="menu-skeleton"
            className={cn(
                'flex h-10 items-center gap-3 rounded-xl border border-transparent px-3',
                active && 'border-primary/20 bg-primary/10',
                className,
            )}
            {...props}
        >
            {showIcon && (
                <Skeleton
                    className={cn('size-4 rounded-md', active ? 'bg-primary/40' : 'bg-muted-foreground/20')}
                    data-sidebar="menu-skeleton-icon"
                />
            )}

            <Skeleton className={cn('h-4 rounded-md', widthClass)} />
        </div>
    );
}

/**
 * Container for nested navigation.
 *
 * Automatically hidden in `icon` collapsed mode to prevent unusable UI.
 */
function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
    return (
        <ul
            data-slot="sidebar-menu-sub"
            data-sidebar="menu-sub"
            className={cn('mx-4 mt-1 flex min-w-0 translate-x-px flex-col gap-1 py-1', 'group-data-[collapsible=icon]:hidden', className)}
            {...props}
        />
    );
}

/**
 * Wrapper for nested menu items.
 */
function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<'li'>) {
    return <li data-slot="sidebar-menu-sub-item" data-sidebar="menu-sub-item" className={cn('group/menu-sub-item relative', className)} {...props} />;
}

/**
 * Interactive control for nested entries.
 *
 * Hidden when sidebar is collapsed to icon mode.
 * `isActive` affects styling only.
 */
function SidebarMenuSubButton({
    asChild = false,
    size = 'md',
    isActive = false,
    className,
    ...props
}: React.ComponentProps<'a'> & {
    asChild?: boolean;
    size?: 'sm' | 'md';
    isActive?: boolean;
}) {
    const Comp = asChild ? Slot : 'a';

    return (
        <Comp
            data-slot="sidebar-menu-sub-button"
            data-sidebar="menu-sub-button"
            data-size={size}
            data-active={isActive}
            className={cn(
                'flex h-8 min-w-0 items-center gap-2 overflow-hidden rounded-md border border-transparent',
                'px-2.5 transition-all duration-200',
                'ring-ring outline-none',
                'hover:border-border/50 hover:bg-muted/60 hover:text-foreground',
                'focus-visible:ring-2 focus-visible:ring-offset-2',
                'active:scale-[0.995]',
                'disabled:pointer-events-none disabled:opacity-50',
                'aria-disabled:pointer-events-none aria-disabled:opacity-50',
                'data-[active=true]:border-primary/20',
                'data-[active=true]:bg-primary/10',
                'data-[active=true]:text-primary dark:data-[active=true]:text-green-300',
                '[&>span:last-child]:truncate',
                '[&>svg]:size-4 [&>svg]:shrink-0',
                size === 'sm' && 'h-7 text-xs',
                size === 'md' && 'text-sm',
                'group-data-[collapsible=icon]:hidden',
                className,
            )}
            {...props}
        />
    );
}

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarTrigger,
};
