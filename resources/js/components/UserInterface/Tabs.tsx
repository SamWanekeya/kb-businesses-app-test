import React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@lib/utils';

const Tabs = TabsPrimitive.Root;

/**
 * Container for a group of tabs.
 *
 * Provides the shared visual surface for tab triggers while preserving
 * Radix UI's accessible tab navigation behavior.
 */
const TabsList = React.forwardRef<React.ComponentRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(
    ({ className, ...props }, ref) => (
        <TabsPrimitive.List
            ref={ref}
            className={cn(
                // Layout.
                'inline-flex h-11 items-center',

                // Spacing.
                'gap-0.5 p-1',

                // Surface.
                'bg-muted',
                'text-muted-foreground',

                // Shape.
                'rounded-md',

                className,
            )}
            {...props}
        />
    ),
);

TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * Individual tab trigger.
 *
 * Provides the interactive control used to switch between tab panels.
 * Active, hover, focus, and disabled states use semantic theme tokens so
 * the component works consistently across light and dark themes.
 */
const TabsTrigger = React.forwardRef<React.ComponentRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(
    ({ className, ...props }, ref) => (
        <TabsPrimitive.Trigger
            ref={ref}
            className={cn(
                // Layout.
                'inline-flex items-center justify-center',

                // Sizing.
                'min-h-9 px-3 py-1.5',

                // Typography.
                'text-sm font-medium',
                'whitespace-nowrap',

                // Shape.
                'rounded-md',

                // Default state.
                'text-muted-foreground',

                // Interaction.
                'cursor-pointer',
                'transition-all duration-150 ease-out',
                'hover:bg-background/60',
                'hover:text-foreground',

                // Active state.
                'data-[state=active]:bg-background',
                'data-[state=active]:text-foreground',
                'data-[state=active]:shadow-sm',

                // Focus.
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-ring',
                'focus-visible:ring-offset-2',
                'focus-visible:ring-offset-background',

                // Disabled.
                'disabled:pointer-events-none',
                'disabled:opacity-50',

                className,
            )}
            {...props}
        />
    ),
);

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * Content panel associated with a tab trigger.
 *
 * Provides accessible focus styling while maintaining a clean separation
 * between the tab navigation and its corresponding content.
 */
const TabsContent = React.forwardRef<React.ComponentRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
    ({ className, ...props }, ref) => (
        <TabsPrimitive.Content
            ref={ref}
            className={cn(
                // Layout.
                'mt-3',

                // Focus.
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-ring',
                'focus-visible:ring-offset-2',
                'focus-visible:ring-offset-background',

                className,
            )}
            {...props}
        />
    ),
);

TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
