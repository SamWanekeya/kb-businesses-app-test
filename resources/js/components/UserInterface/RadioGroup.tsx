import React from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';

import { cn } from '@lib/utils';

/**
 * A group of radio buttons built on top of the Radix UI radio group
 * primitive.
 *
 * Provides an accessible container for mutually exclusive radio options
 * while allowing consumers to extend the default styling through
 * `className`.
 */
const RadioGroup = React.forwardRef<
    React.ComponentRef<typeof RadioGroupPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
    return <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...props} />;
});

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

/**
 * A single selectable radio option within a RadioGroup.
 *
 * The component uses semantic shadcn theme tokens so its appearance
 * automatically adapts to light and dark themes.
 */
const RadioGroupItem = React.forwardRef<
    React.ComponentRef<typeof RadioGroupPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
    return (
        <RadioGroupPrimitive.Item
            ref={ref}
            className={cn(
                // Base.
                'peer aspect-square h-4 w-4 shrink-0',

                // Appearance.
                'cursor-pointer rounded-full',
                'border-border border',
                'bg-background',
                'text-primary',

                // Interaction.
                'transition-all duration-150 ease-out',
                'hover:border-primary/70',
                'hover:bg-primary/5',

                // Focus.
                'focus-visible:outline-none',
                'focus-visible:ring-2',
                'focus-visible:ring-ring',
                'focus-visible:ring-offset-2',
                'focus-visible:ring-offset-background',

                // Checked state.
                'data-[state=checked]:border-primary',

                // Active.
                'active:scale-95',

                // Disabled.
                'disabled:cursor-not-allowed',
                'disabled:opacity-50',
                'disabled:hover:border-border',
                'disabled:hover:bg-background',
                'disabled:active:scale-100',

                className,
            )}
            {...props}
        >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                <Circle aria-hidden="true" className="fill-primary text-primary h-2.5 w-2.5" />
            </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
    );
});

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };
