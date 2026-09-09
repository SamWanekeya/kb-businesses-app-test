import React from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { useModalStack } from '@contexts/ModalStackContext';
import { cn } from '@lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

/**
 * Dialog overlay responsible for rendering the backdrop behind a dialog.
 *
 * The overlay integrates with the modal stack to ensure nested dialogs
 * receive the correct z-index while preserving interaction with elements
 * that intentionally exist above the modal layer.
 */
const DialogOverlay = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
        modalId?: string;
    }
>(({ className, modalId, ...props }, ref) => {
    const { getZIndex, modalStack } = useModalStack();

    const zIndex = modalId ? getZIndex(modalId) : 50;
    const modalIndex = modalStack.indexOf(modalId || '');
    const isFirstModal = modalIndex <= 0;

    return (
        <DialogPrimitive.Overlay
            ref={ref}
            className={cn(
                'fixed inset-0',
                'data-[state=open]:animate-in',
                'data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-0',
                'data-[state=open]:fade-in-0',
                isFirstModal ? 'bg-black/50' : 'bg-black/25',
                className,
            )}
            style={{ zIndex }}
            onPointerDown={(e) => {
                // Allow clicks on elements with higher z-index.
                const target = e.target as HTMLElement;
                const targetZIndex = parseInt(window.getComputedStyle(target).zIndex) || 0;

                if (targetZIndex > zIndex) {
                    return;
                }

                // Allow ChatGPT button clicks.
                if (target.closest('[data-kakbima-intelligence-button]')) {
                    e.stopPropagation();
                    return;
                }
            }}
            {...props}
        />
    );
});

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * Dialog content component that integrates with the modal stack to support
 * nested dialogs while ensuring only the topmost dialog responds to Escape.
 */
const DialogContent = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
        modalId?: string;
    }
>(({ className, children, modalId, ...props }, ref) => {
    const { registerModal, unregisterModal, getZIndex, modalStack } = useModalStack();

    const [currentModalId] = React.useState<string>(() => modalId || `modal-${String(Date.now())}-${String(Math.random())}`);

    React.useEffect(() => {
        registerModal(currentModalId);

        return () => {
            unregisterModal(currentModalId);
        };
    }, [currentModalId, registerModal, unregisterModal]);

    const zIndex = getZIndex(currentModalId);
    const isTopModal = modalStack[modalStack.length - 1] === currentModalId;

    return (
        <DialogPortal>
            <DialogOverlay modalId={currentModalId} />

            <DialogPrimitive.Content
                ref={ref}
                className={cn(
                    // Positioning.
                    'fixed top-[50%] left-[50%]',
                    'w-full max-w-lg',
                    'translate-x-[-50%] translate-y-[-50%]',

                    // Layout.
                    'grid gap-4',

                    // Surface.
                    'border-border border',
                    'bg-background',

                    // Shape.
                    'rounded-xl',

                    // Spacing.
                    'p-6',

                    // Depth.
                    'shadow-lg',

                    // Interaction.
                    'pointer-events-auto',

                    // Animations.
                    'duration-200',
                    'data-[state=open]:animate-in',
                    'data-[state=closed]:animate-out',
                    'data-[state=closed]:fade-out-0',
                    'data-[state=open]:fade-in-0',
                    'data-[state=closed]:zoom-out-95',
                    'data-[state=open]:zoom-in-95',
                    'data-[state=closed]:slide-out-to-left-1/2',
                    'data-[state=closed]:slide-out-to-top-[48%]',
                    'data-[state=open]:slide-in-from-left-1/2',
                    'data-[state=open]:slide-in-from-top-[48%]',

                    className,
                )}
                style={{ zIndex: zIndex + 1 }}
                onPointerDownOutside={(e) => {
                    const target = e.target as Element;

                    if (target.closest('[data-kakbima-intelligence-button]') || target.closest('[data-kakbima-intelligence-modal]')) {
                        e.preventDefault();
                        return;
                    }

                    // Prevent closing when clicking outside.
                    e.preventDefault();
                }}
                onInteractOutside={(e) => {
                    const target = e.target as Element;

                    if (target.closest('[data-kakbima-intelligence-button]') || target.closest('[data-kakbima-intelligence-modal]')) {
                        e.preventDefault();
                        return;
                    }

                    // Prevent closing when clicking outside.
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    // Only close if this is the topmost modal.
                    if (!isTopModal) {
                        e.preventDefault();
                    }
                }}
                {...props}
            >
                {children}

                <DialogPrimitive.Close
                    className={cn(
                        // Positioning.
                        'absolute top-4 right-4',

                        // Layout.
                        'flex h-8 w-8 items-center justify-center',

                        // Appearance.
                        'cursor-pointer rounded-lg',
                        'text-muted-foreground',
                        'opacity-70',

                        // Interaction.
                        'transition-all duration-150',
                        'hover:bg-muted',
                        'hover:text-foreground',
                        'hover:opacity-100',

                        // Focus.
                        'focus:outline-none',
                        'focus:ring-2',
                        'focus:ring-ring',
                        'focus:ring-offset-2',
                        'focus:ring-offset-background',

                        // Disabled.
                        'disabled:pointer-events-none',
                        'disabled:opacity-50',
                    )}
                >
                    <X aria-hidden="true" className="h-4 w-4" />

                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
});

DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * Container for dialog header content.
 */
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5', 'text-center sm:text-left', className)} {...props} />
);

DialogHeader.displayName = 'DialogHeader';

/**
 * Container for dialog footer actions.
 */
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col-reverse gap-2', 'sm:flex-row sm:justify-end', className)} {...props} />
);

DialogFooter.displayName = 'DialogFooter';

/**
 * Accessible dialog title.
 */
const DialogTitle = React.forwardRef<React.ComponentRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(
    ({ className, ...props }, ref) => (
        <DialogPrimitive.Title
            ref={ref}
            className={cn('text-lg leading-none font-semibold', 'text-foreground tracking-tight', className)}
            {...props}
        />
    ),
);

DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * Accessible supporting description for a dialog.
 */
const DialogDescription = React.forwardRef<
    React.ComponentRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => <DialogPrimitive.Description ref={ref} className={cn('text-muted-foreground text-sm', className)} {...props} />);

DialogDescription.displayName = DialogPrimitive.Description.displayName;

export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger };
