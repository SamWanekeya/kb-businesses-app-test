import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

import { cn } from '@lib/utils';

/**
 * Props accepted by the Switch component.
 *
 * Includes all Radix Switch root props and React 19 ref support.
 */
type SwitchProps = React.ComponentPropsWithRef<typeof SwitchPrimitives.Root>;

/**
 * A polished, accessible switch component built on top of Radix UI.
 *
 * Uses semantic shadcn/ui design tokens and supports light mode,
 * dark mode, keyboard interaction, focus states, disabled states,
 * and right-to-left layouts.
 *
 * @param className
 * @param ref
 * @param props - Radix Switch properties, styling options, and ref.
 * @returns The rendered switch component.
 */
const Switch = ({ className, ref, ...props }: SwitchProps) => (
    <SwitchPrimitives.Root
        ref={ref}
        className={cn(
            // Base
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center',
            'rounded-full border-2 border-transparent',
            'bg-muted transition-all duration-200 ease-out',

            // Focus
            'focus-visible:outline-none',
            'focus-visible:ring-ring focus-visible:ring-2',
            'focus-visible:ring-offset-background focus-visible:ring-offset-2',

            // States
            'data-[state=checked]:bg-primary',
            'data-[state=unchecked]:bg-muted',

            // Hover
            'hover:data-[state=checked]:bg-primary/90',
            'hover:data-[state=unchecked]:bg-muted/80',

            // Disabled
            'disabled:cursor-not-allowed disabled:opacity-50',

            className,
        )}
        {...props}
    >
        <SwitchPrimitives.Thumb
            className={cn(
                'pointer-events-none block h-5 w-5 rounded-full',
                'bg-background ring-border/20 shadow-sm ring-1',
                'transition-transform duration-200 ease-out',
                'data-[state=checked]:translate-x-5',
                'data-[state=unchecked]:translate-x-0',
                'rtl:data-[state=checked]:-translate-x-5',
                'rtl:data-[state=unchecked]:translate-x-0',
            )}
        />
    </SwitchPrimitives.Root>
);

Switch.displayName = 'Switch';

export { Switch };
