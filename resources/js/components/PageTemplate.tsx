import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@components/UserInterface/Breadcrumb';
import { Head } from '@inertiajs/react';
import AppLayout from '@layouts/AppLayout';
import { JSX, ReactNode, useCallback, useMemo } from 'react';

import { BreadcrumbItemTypes } from '@/types';
import FloatingChatGpt from '@components/FloatingChatGpt';
import { Button } from '@components/UserInterface/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/UserInterface/Tooltip';
import { CircleQuestionMark } from 'lucide-react';

export interface PageAction {
    /** Label displayed on the action button */
    label?: string;
    /** Optional icon displayed before the label */
    icon?: ReactNode;
    /** Button variant */
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    /** Click handler for the button */
    onClick?: () => void;
    tooltip?: string;
}

export interface PageTemplateProps {
    /** Page title displayed as the main heading */
    title: string;
    /** Current page URL */
    url: string;
    /** Optional array of action buttons */
    actions?: PageAction[];
    /** Page content */
    children?: ReactNode;
    /** Optional breadcrumb items */
    breadcrumbs?: BreadcrumbItemTypes[];
    description: string | null;
}

/**
 * Renders breadcrumb navigation below the page title.
 *
 * @param items - Array of breadcrumb items to render
 */
function RenderBreadcrumbs({ items }: { items: BreadcrumbItemTypes[] }): JSX.Element {
    const breadcrumbNodes = useMemo(
        () =>
            items.map((bc, idx) => (
                <BreadcrumbItem key={idx}>
                    {idx < items.length - 1 ? (
                        <>
                            <BreadcrumbLink href={bc.href}>{bc.title}</BreadcrumbLink>
                            <BreadcrumbSeparator />
                        </>
                    ) : (
                        <BreadcrumbPage>{bc.title}</BreadcrumbPage>
                    )}
                </BreadcrumbItem>
            )),
        [items],
    );

    return (
        <Breadcrumb>
            <BreadcrumbList>{breadcrumbNodes}</BreadcrumbList>
        </Breadcrumb>
    );
}

/**
 * Page template component that renders a header with optional actions,
 * breadcrumbs, and page content.
 *
 * @param title - Page title
 * @param description - Page description
 * @param URL - Current page URL
 * @param actions - Optional array of action buttons
 * @param children - Page content
 * @param breadcrumbs - Optional breadcrumb items
 */
export default function PageTemplate({ title, description, url, actions, children, breadcrumbs }: PageTemplateProps) {
    const pageBreadcrumbs: BreadcrumbItemTypes[] = useMemo(
        () =>
            breadcrumbs ?? [
                {
                    title,
                    href: url,
                },
            ],
        [breadcrumbs, title, url],
    );

    /**
     * Renders a single action button.
     * Memoized to prevent unnecessary re-renders.
     */
    const renderAction = useCallback(
        (action: PageAction, index: number) => (
            <Button key={index} variant={action.variant ?? 'outline'} size="lg" onClick={action.onClick} className="cursor-pointer">
                {action.icon && <span className="mr-1">{action.icon}</span>}
                {action.label}
            </Button>
        ),
        [],
    );

    return (
        <AppLayout>
            <Head title={title} />

            <div className="flex flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold">{title}</h1>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" className="inline-flex">
                                        <CircleQuestionMark className="h-4 w-4" />
                                    </button>
                                </TooltipTrigger>

                                <TooltipContent>{description}</TooltipContent>
                            </Tooltip>
                        </div>

                        {actions?.length > 0 && <div className="flex items-center gap-2">{actions.map(renderAction)}</div>}
                    </div>

                    {/* Breadcrumbs */}
                    <RenderBreadcrumbs items={pageBreadcrumbs} />
                </div>

                {/* Content */}
                {children}
            </div>

            <FloatingChatGpt />
        </AppLayout>
    );
}
