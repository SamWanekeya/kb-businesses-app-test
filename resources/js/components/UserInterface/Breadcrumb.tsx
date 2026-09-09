import React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@lib/utils';
import { useTranslation } from 'react-i18next';

/**
 * Renders a navigation landmark for breadcrumb structures.
 *
 * @param props - Standard `<nav>` element props.
 */
function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
    return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

/**
 * Renders a list container for breadcrumb items.
 *
 * @param className - Additional CSS classes applied to the element.
 * @param props - Standard `<ol>` element props.
 */
function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
    return (
        <ol
            data-slot="breadcrumb-list"
            className={cn('text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5', className)}
            {...props}
        />
    );
}

/**
 * Renders a single breadcrumb list item.
 *
 * @param className - Additional CSS classes applied to the element.
 * @param props - Standard `<li>` element props.
 */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
    return <li data-slot="breadcrumb-item" className={cn('inline-flex items-center gap-1.5', className)} {...props} />;
}

/**
 * Renders a breadcrumb link. Can optionally render child components via Radix Slot.
 *
 * @param asChild - When true, renders children using `<Slot>` instead of an `<a>` tag.
 * @param className - Additional CSS classes applied to the element.
 * @param props - Standard `<a>` element props.
 */
function BreadcrumbLink({ asChild, className, ...props }: React.ComponentProps<'a'> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : 'a';

    return <Comp data-slot="breadcrumb-link" className={cn('hover:text-foreground cursor-pointer transition-colors', className)} {...props} />;
}

/**
 * Renders the current page indicator within the breadcrumb.
 * This element is not interactive and is announced as the active page.
 *
 * @param className - Additional CSS classes applied to the element.
 * @param props - Standard `<span>` element props.
 */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
    return (
        <span
            data-slot="breadcrumb-page"
            role="link"
            aria-disabled="true"
            aria-current="page"
            className={cn('text-foreground font-normal', className)}
            {...props}
        />
    );
}

/**
 * Renders a visual separator between breadcrumb items.
 * Defaults to a chevron icon if no children are provided.
 *
 * @param children - Custom separator content.
 * @param className - Additional CSS classes applied to the element.
 * @param props - Standard `<span>` element props.
 */
function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'span'>) {
    return (
        <span
            data-slot="breadcrumb-separator"
            role="presentation"
            aria-hidden="true"
            className={cn('mx-1 inline-flex items-center [&>svg]:size-3.5', className)}
            {...props}
        >
            {children ?? <ChevronRight />}
        </span>
    );
}

/**
 * Renders an ellipsis icon to indicate truncated breadcrumb items.
 * Includes localized hidden text for screen readers.
 *
 * @param className - Additional CSS classes applied to the element.
 * @param props - Standard `<span>` element props.
 */
function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
    const { t: translate } = useTranslation();
    return (
        <span
            data-slot="breadcrumb-ellipsis"
            role="presentation"
            aria-hidden="true"
            className={cn('flex size-9 items-center justify-center', className)}
            {...props}
        >
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{translate('More')}</span>
        </span>
    );
}

export { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator };
