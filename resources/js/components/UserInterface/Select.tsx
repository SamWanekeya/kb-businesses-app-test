import { Input } from '@components/UserInterface/Input';
import { cn } from '@lib/utils';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import React from 'react';

const Select = SelectPrimitive.Root;

const SelectValue = SelectPrimitive.Value;

/**
 * Recursively extracts searchable text from a React node.
 *
 * React children can contain strings, numbers, arrays, nested elements,
 * fragments, or non-rendering values. This helper intentionally extracts
 * only actual textual content and avoids relying on Object.prototype's
 * default stringification.
 *
 * @param node React node from which text should be extracted.
 * @returns The textual content represented by the React node.
 */
const getReactNodeText = (node: React.ReactNode): string => {
    if (node === null || node === undefined || typeof node === 'boolean') {
        return '';
    }

    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }

    if (Array.isArray(node)) {
        return node.map(getReactNodeText).join('');
    }

    if (
        React.isValidElement<{
            children?: React.ReactNode;
        }>(node)
    ) {
        return getReactNodeText(node.props.children);
    }

    return '';
};

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
    /** Optional floating label. */
    label?: string;

    /** External validation error. */
    error?: string | boolean | null;

    /** Supporting text displayed below the field. */
    helperText?: string;

    /** Additional classes for the outer wrapper. */
    wrapperClassName?: string;
}

/**
 * Select trigger button.
 *
 * Provides the primary interactive control for opening the Select dropdown
 * while preserving Radix UI's accessible Select behavior.
 */
const SelectTrigger = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Trigger>, SelectTriggerProps>(
    (
        {
            className,
            wrapperClassName,
            children,
            label,
            error,
            helperText,
            id,
            'aria-invalid': ariaInvalid,
            'aria-describedby': ariaDescribedBy,
            ...props
        },
        ref,
    ) => {
        const isInvalid = ariaInvalid === true || ariaInvalid === 'true' || Boolean(error);

        const errorMessage = typeof error === 'string' && error.length > 0 ? error : undefined;

        const helperId = id ? `${id}-description` : undefined;

        const describedBy =
            [ariaDescribedBy, (isInvalid && errorMessage) || (!isInvalid && helperText) ? helperId : undefined].filter(Boolean).join(' ') ||
            undefined;

        return (
            <div className={cn('w-full min-w-0', wrapperClassName)}>
                <div className="relative">
                    <SelectPrimitive.Trigger
                        ref={ref}
                        id={id}
                        data-slot="select-trigger"
                        aria-invalid={isInvalid}
                        aria-describedby={describedBy}
                        className={cn(
                            // Layout
                            'peer group flex w-full items-center justify-between',
                            label ? 'h-14' : 'h-12',

                            // Spacing
                            'px-3.5 py-2',

                            // Appearance
                            'border-input rounded-md border',
                            'bg-background text-foreground',
                            'text-base font-normal',
                            'shadow-none ring-0 outline-none',

                            // Selected value
                            '[&>span]:line-clamp-1',

                            // Interaction
                            'cursor-pointer transition-[border-color,border-width] duration-150',

                            // Hover
                            'hover:border-foreground/40',

                            // Focus and open state
                            'focus:border-primary focus:border-2',
                            'focus:ring-0 focus:outline-none',
                            'data-[state=open]:border-2',
                            'data-[state=open]:border-primary',

                            // Invalid state takes priority
                            'aria-invalid:!border-destructive',
                            'aria-invalid:focus:!border-destructive',
                            'aria-invalid:data-[state=open]:!border-destructive',
                            'aria-invalid:focus:!ring-0',

                            // Disabled
                            'disabled:cursor-not-allowed',
                            'disabled:opacity-60',

                            // Reduced motion
                            'motion-reduce:transition-none',

                            className,
                        )}
                        {...props}
                    >
                        {children}

                        <SelectPrimitive.Icon asChild>
                            <ChevronDown
                                aria-hidden="true"
                                className={cn(
                                    'h-4 w-4 shrink-0',
                                    'text-foreground/75',
                                    'transition-transform duration-150',
                                    'group-data-[state=open]:text-primary',
                                    isInvalid && 'text-destructive',
                                )}
                            />
                        </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>

                    {label && (
                        <label
                            htmlFor={id}
                            className={cn(
                                // Position and appearance
                                'pointer-events-none absolute start-3.5 z-10',
                                'origin-start bg-background px-1',
                                'text-foreground/75 text-sm font-medium',

                                // Default: floated label
                                'top-0 -translate-y-1/2',

                                // No selection: center the label
                                'peer-data-[placeholder]:top-1/2',
                                'peer-data-[placeholder]:-translate-y-1/2',
                                'peer-data-[placeholder]:text-base',
                                'peer-data-[placeholder]:font-normal',

                                // Open: always float the label
                                'peer-data-[state=open]:top-0',
                                'peer-data-[state=open]:-translate-y-1/2',
                                'peer-data-[state=open]:text-sm',
                                'peer-data-[state=open]:font-medium',
                                'peer-data-[state=open]:text-primary',

                                // Smooth movement
                                'transition-[top,transform,color,font-size] duration-150',
                                'motion-reduce:transition-none',

                                // Invalid state
                                isInvalid && 'text-destructive',
                                isInvalid && 'peer-data-[state=open]:text-destructive',

                                // Disabled
                                'peer-data-[disabled]:opacity-60',
                            )}
                        >
                            {label}
                            {props.required && (
                                <span aria-hidden="true" className="ms-1">
                                    *
                                </span>
                            )}
                        </label>
                    )}
                </div>

                {(isInvalid && errorMessage) || (!isInvalid && helperText) ? (
                    <p id={helperId} className={cn('mt-1.5 px-1 text-xs leading-5', isInvalid ? 'text-destructive' : 'text-muted-foreground')}>
                        {isInvalid ? errorMessage : helperText}
                    </p>
                ) : null}
            </div>
        );
    },
);

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/**
 * Scroll-up control displayed when additional Select options are available
 * above the visible viewport.
 */
const SelectScrollUpButton = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn(
            'flex cursor-pointer items-center justify-center',
            'py-1.5',
            'text-foreground/75',
            'transition-colors duration-150',
            'hover:text-foreground',
            className,
        )}
        {...props}
    >
        <ChevronUp aria-hidden="true" className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
));

SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/**
 * Scroll-down control displayed when additional Select options are available
 * below the visible viewport.
 */
const SelectScrollDownButton = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn(
            'flex cursor-pointer items-center justify-center',
            'py-1.5',
            'text-foreground/75',
            'transition-colors duration-150',
            'hover:text-foreground',
            className,
        )}
        {...props}
    >
        <ChevronDown aria-hidden="true" className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
));

SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/**
 * Select dropdown content with optional client-side searching.
 *
 * When `searchable` is enabled, the textual content of each Select option
 * is matched against the current search term.
 */
const SelectContent = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
        searchable?: boolean;
    }
>(({ className, children, position = 'popper', searchable, ...props }, ref) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredChildren = React.useMemo(() => {
        if (!searchable || !searchTerm) {
            return children;
        }

        const normalizedSearchTerm = searchTerm.toLowerCase();

        return React.Children.toArray(children).filter((child) => {
            const childText = getReactNodeText(child).toLowerCase();

            return childText.includes(normalizedSearchTerm);
        });
    }, [children, searchTerm, searchable]);

    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                ref={ref}
                position={position}
                className={cn(
                    // Positioning.
                    'relative z-50',

                    // Dimensions.
                    'max-h-96 min-w-[8rem]',
                    'overflow-hidden',

                    // Surface.
                    'border-border border',
                    'bg-popover',
                    'text-popover-foreground',

                    // Shape.
                    'rounded-xl',

                    // Depth.
                    'shadow-lg',

                    // Open/close animations.
                    'data-[state=open]:animate-in',
                    'data-[state=closed]:animate-out',
                    'data-[state=closed]:fade-out-0',
                    'data-[state=open]:fade-in-0',
                    'data-[state=closed]:zoom-out-95',
                    'data-[state=open]:zoom-in-95',
                    'data-[side=bottom]:slide-in-from-top-2',
                    'data-[side=left]:slide-in-from-right-2',
                    'data-[side=right]:slide-in-from-left-2',
                    'data-[side=top]:slide-in-from-bottom-2',

                    // Popper positioning.
                    position === 'popper' && [
                        'data-[side=bottom]:translate-y-1',
                        'data-[side=left]:-translate-x-1',
                        'data-[side=right]:translate-x-1',
                        'data-[side=top]:-translate-y-1',
                    ],

                    className,
                )}
                {...props}
            >
                {searchable && (
                    <div className="border-border border-b p-2">
                        <div className="relative">
                            <Search
                                aria-hidden="true"
                                className={cn('absolute top-1/2 left-2', 'h-4 w-4', '-translate-y-1/2', 'text-foreground/75')}
                            />

                            <Input
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                }}
                                className="h-8 pl-8"
                                onKeyDown={(e) => {
                                    e.stopPropagation();
                                }}
                            />
                        </div>
                    </div>
                )}

                <SelectScrollUpButton />

                <SelectPrimitive.Viewport
                    className={cn(
                        'p-1',
                        position === 'popper' && ['h-[var(--radix-select-trigger-height)]', 'w-full', 'min-w-[var(--radix-select-trigger-width)]'],
                    )}
                >
                    {searchable ? filteredChildren : children}
                </SelectPrimitive.Viewport>

                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
});

SelectContent.displayName = SelectPrimitive.Content.displayName;

/**
 * Select dropdown label.
 */
const SelectLabel = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Label>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>>(
    ({ className, ...props }, ref) => (
        <SelectPrimitive.Label ref={ref} className={cn('py-1.5 pr-2 pl-8', 'text-sm font-bold', 'text-foreground', className)} {...props} />
    ),
);

SelectLabel.displayName = SelectPrimitive.Label.displayName;

/**
 * Individual selectable option within the Select dropdown.
 */
const SelectItem = React.forwardRef<React.ComponentRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(
    ({ className, children, ...props }, ref) => (
        <SelectPrimitive.Item
            ref={ref}
            className={cn(
                // Layout.
                'relative flex w-full items-center',

                // Spacing.
                'py-1.5 pr-2 pl-8',

                // Typography.
                'text-popover-foreground text-sm',

                // Shape.
                'rounded-md',

                // Interaction.
                'cursor-pointer select-none',
                'outline-none',
                'transition-colors duration-100',

                // Focus.
                'focus:bg-accent',
                'focus:text-accent-foreground',

                // Disabled.
                'data-[disabled]:pointer-events-none',
                'data-[disabled]:opacity-50',

                className,
            )}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                    <Check aria-hidden="true" className="text-primary h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
            </span>

            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    ),
);

SelectItem.displayName = SelectPrimitive.Item.displayName;

/**
 * Visual separator between groups of Select options.
 */
const SelectSeparator = React.forwardRef<
    React.ComponentRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => <SelectPrimitive.Separator ref={ref} className={cn('-mx-1 my-1 h-px', 'bg-border', className)} {...props} />);

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export { Select, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, SelectValue };
