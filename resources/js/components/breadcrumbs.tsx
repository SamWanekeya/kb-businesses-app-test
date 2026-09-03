import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
    return (
        <>
            {items && items.length > 0 && (
                <Breadcrumb>
                    {/* Desktop & Tablet View (>= 1300px) */}
                    <BreadcrumbList className="hidden flex-wrap items-center min-[1300px]:flex">
                        {items.map((item, index) => {
                            const isLast = index === items.length - 1;
                            return (
                                <Fragment key={`desktop-${index}`}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link href={item.href || '#'}>{item.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>

                    {/* Mobile View (< 1310px) */}
                    <BreadcrumbList className="flex flex-wrap items-center min-[1310px]:hidden">
                        {items.slice(-2).map((item, index, arr) => {
                            const isLast = index === arr.length - 1;
                            return (
                                <Fragment key={`mobile-${index}`}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link href={item.href || '#'}>{item.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && <BreadcrumbSeparator />}
                                </Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            )}
        </>
    );
}
