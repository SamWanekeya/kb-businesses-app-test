import React from 'react';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

import { cn } from '@lib/utils';

/**
 * A styled scroll area built on top of the Radix UI Scroll Area primitive.
 *
 * Provides a consistent, theme-aware scrolling surface while preserving
 * Radix's accessible scrollbar and viewport behavior.
 */
const ScrollArea = React.forwardRef<
    React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">{children}</ScrollAreaPrimitive.Viewport>

        <ScrollBar />

        <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
));

ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/**
 * Styled scrollbar used by the ScrollArea component.
 *
 * Supports both vertical and horizontal orientations while using semantic
 * theme tokens for consistent light and dark mode rendering.
 */
const ScrollBar = React.forwardRef<
    React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
            // Base.
            'flex touch-none select-none',

            // Interaction.
            'transition-colors duration-150 ease-out',

            // Vertical scrollbar.
            orientation === 'vertical' && ['h-full w-2.5', 'border-l border-l-transparent', 'p-[2px]'],

            // Horizontal scrollbar.
            orientation === 'horizontal' && ['h-2.5', 'border-t border-t-transparent', 'p-[2px]'],

            className,
        )}
        {...props}
    >
        <ScrollAreaPrimitive.ScrollAreaThumb
            className={cn(
                // Base.
                'relative flex-1 rounded-full',

                // Surface.
                'bg-border',

                // Interaction.
                'transition-colors duration-150 ease-out',
                'hover:bg-muted-foreground/50',
            )}
        />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
));

ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
