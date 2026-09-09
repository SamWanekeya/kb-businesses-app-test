import React from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@lib/utils';

/**
 * A styled checkbox component built on top of Radix UI's accessible
 * checkbox primitive.
 *
 * The component preserves the native Radix checkbox API while providing
 * semantic Tailwind/shadcn styling that works consistently across light
 * and dark themes.
 */
const Checkbox = React.forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>>(
    ({ className, ...props }, ref) => (
        <CheckboxPrimitive.Root
            ref={ref}
            className={cn(
                // Base
                'border-border bg-background h-4 w-4 shrink-0 cursor-pointer rounded-md border',

                // Layout
                'flex items-center justify-center',

                // Color
                'text-primary-foreground',

                // Interaction
                'transition-colors duration-150 ease-out',
                'hover:border-primary/70 hover:bg-primary/5',
                'active:scale-95',

                // Focus
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                'focus-visible:ring-offset-background focus-visible:ring-offset-2',

                // Checked state
                'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
                'data-[state=checked]:hover:bg-primary/90',

                // Indeterminate state
                'data-[state=indeterminate]:border-primary',
                'data-[state=indeterminate]:bg-primary',

                // Disabled state
                'disabled:cursor-not-allowed disabled:opacity-50',
                'disabled:hover:border-border disabled:hover:bg-background',
                'disabled:active:scale-100',

                className,
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                <Check aria-hidden="true" className="h-3.5 w-3.5 stroke-[2.5]" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    ),
);

Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
