import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';

import { cn } from '@lib/utils';

/**
 * Props accepted by the Progress component.
 *
 * Includes all Radix Progress root props and React 19 ref support.
 */
type ProgressProps = React.ComponentPropsWithRef<typeof ProgressPrimitive.Root>;

/**
 * A polished, accessible progress indicator built on top of Radix UI.
 *
 * Uses semantic shadcn/ui design tokens and supports light mode,
 * dark mode, accessibility, responsive layouts, and dynamic progress
 * values without relying on inline CSS.
 *
 * @param className
 * @param value
 * @param ref
 * @param props - Radix Progress properties, styling options, and ref.
 * @returns The rendered progress component.
 */
const Progress = ({ className, value, ref, ...props }: ProgressProps) => {
    const progressValue = Math.min(Math.max(value ?? 0, 0), 100);

    return (
        <ProgressPrimitive.Root
            ref={ref}
            value={progressValue}
            className={cn('relative h-2 w-full overflow-hidden rounded-full', 'bg-muted', className)}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className={cn(
                    'h-full w-full flex-1',
                    'bg-primary',
                    'transition-transform duration-300 ease-out',
                    'translate-x-[calc(-100%+var(--progress-value))]',
                )}
                style={
                    {
                        '--progress-value': `${progressValue.toString()}%`,
                    } as React.CSSProperties
                }
            />
        </ProgressPrimitive.Root>
    );
};

Progress.displayName = 'Progress';

export default Progress;
