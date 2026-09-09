import React from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';

import { cn } from '@lib/utils';

interface IndeterminateCheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
    indeterminate?: boolean;
}

/**
 * Checkbox component that supports checked, unchecked, and indeterminate
 * states while preserving the Radix UI checkbox API.
 *
 * The indeterminate state is reflected through Radix's data-state attribute
 * so that the component remains compatible with existing state-based styling.
 */
const IndeterminateCheckbox = React.forwardRef<React.ComponentRef<typeof CheckboxPrimitive.Root>, IndeterminateCheckboxProps>(
    ({ className, indeterminate, ...props }, ref) => {
        const checkboxRef = React.useRef<React.ComponentRef<typeof CheckboxPrimitive.Root>>(null);

        React.useImperativeHandle(ref, () => checkboxRef.current as React.ComponentRef<typeof CheckboxPrimitive.Root>);

        React.useEffect(() => {
            if (!checkboxRef.current) {
                return;
            }

            checkboxRef.current.dataset.state = indeterminate ? 'indeterminate' : props.checked ? 'checked' : 'unchecked';
        }, [indeterminate, props.checked]);

        return (
            <CheckboxPrimitive.Root
                ref={checkboxRef}
                className={cn(
                    // Base.
                    'peer h-4 w-4 shrink-0',

                    // Layout.
                    'flex items-center justify-center',

                    // Appearance.
                    'cursor-pointer rounded-md',
                    'border-border border',
                    'bg-background',
                    'text-primary-foreground',

                    // Interaction.
                    'transition-colors duration-150 ease-out',
                    'hover:border-primary/70',
                    'hover:bg-primary/5',

                    // Checked state.
                    'data-[state=checked]:border-primary',
                    'data-[state=checked]:bg-primary',
                    'data-[state=checked]:text-primary-foreground',

                    // Indeterminate state.
                    'data-[state=indeterminate]:border-primary',
                    'data-[state=indeterminate]:bg-primary',
                    'data-[state=indeterminate]:text-primary-foreground',

                    // Focus.
                    'focus-visible:outline-none',
                    'focus-visible:ring-2',
                    'focus-visible:ring-ring',
                    'focus-visible:ring-offset-2',
                    'focus-visible:ring-offset-background',

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
                <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
                    {indeterminate ? (
                        <Minus aria-hidden="true" className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                        <Check aria-hidden="true" className="h-3.5 w-3.5 stroke-[2.5]" />
                    )}
                </CheckboxPrimitive.Indicator>
            </CheckboxPrimitive.Root>
        );
    },
);

IndeterminateCheckbox.displayName = 'IndeterminateCheckbox';

export { IndeterminateCheckbox };
