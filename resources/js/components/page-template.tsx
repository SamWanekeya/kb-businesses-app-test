import { FloatingChatGpt } from '@/components/FloatingChatGpt';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export interface PageAction {
    label: string;
    icon?: ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    onClick?: () => void;
    className?: string;
    tooltip?: string;
    labelClassName?: string;
    tooltipClassName?: string;
}

export interface PageTemplateProps {
    title: string;
    description?: string;
    url: string;
    actions?: PageAction[];
    children: ReactNode;
    noPadding?: boolean;
    breadcrumbs?: BreadcrumbItem[];
}

export function PageTemplate({ title, description, url, actions, children, noPadding = false, breadcrumbs }: PageTemplateProps) {
    // Default breadcrumbs if none provided
    const pageBreadcrumbs: BreadcrumbItem[] = breadcrumbs || [
        {
            title,
            href: url,
        },
    ];

    return (
        <AppLayout breadcrumbs={pageBreadcrumbs}>
            <Head title={`${title} - ${(usePage().props as any).globalSettings?.titleText || 'Kakbima'}`} />
            <div className="flex flex-1 flex-col gap-4 px-[10px] pt-4 pb-[50px] min-[992px]:px-[50px]">
                {/* <div className="flex h-full flex-1 flex-col gap-4 p-4"> */}
                {/* Header with action buttons */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">{title}</h1>
                        {description && <div className="text-muted-foreground text-xs">{description}</div>}
                    </div>
                    {actions && actions.length > 0 && (
                        <TooltipProvider>
                            <div className="flex items-center gap-2">
                                {actions.map((action, index) => {
                                    const hasLabel = action.label && action.label.trim() !== '';

                                    const buttonElement = (
                                        <Button
                                            variant={action.variant || 'outline'}
                                            size="sm"
                                            onClick={action.onClick}
                                            className={cn('cursor-pointer', action.className)}
                                        >
                                            {action.icon}
                                            {hasLabel && <span className={action.labelClassName}>{action.label}</span>}
                                        </Button>
                                    );

                                    if (action.tooltip && action.tooltip.trim() !== '') {
                                        return (
                                            <span key={index}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
                                                    <TooltipContent className={action.tooltipClassName}>
                                                        <p>{action.tooltip}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </span>
                                        );
                                    }

                                    return <span key={index}>{buttonElement}</span>;
                                })}
                            </div>
                        </TooltipProvider>
                    )}
                </div>

                {/* Content */}
                <div className={cn(noPadding ? '' : 'rounded-xl border p-6', 'max-w-full min-w-0 overflow-x-clip')}>{children}</div>
            </div>
            <FloatingChatGpt />
        </AppLayout>
    );
}
