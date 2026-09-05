/**
 * Pagination component with dark mode support
 */
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

interface PaginationProps {
    from?: number;
    to?: number;
    total?: number;
    links?: any[];
    currentPage?: number;
    lastPage?: number;
    entityName?: string;
    onPageChange?: (url: string) => void;
    className?: string;
    perPageOptions?: number[];
    currentPerPage: string;
    onPerPageChange: (value: string) => void;
    hidePerPage?: boolean;
}

export function Pagination({
    from = 0,
    to = 0,
    total = 0,
    links = [],
    currentPage,
    lastPage,
    entityName = 'results',
    perPageOptions = [10, 25, 50, 100],
    hidePerPage = false,
    currentPerPage,
    onPerPageChange,
    onPageChange,
    className = '',
}: PaginationProps) {
    const { t } = useTranslation();

    const handlePageChange = (url: string) => {
        if (onPageChange) {
            onPageChange(url);
        } else if (url) {
            window.location.href = url;
        }
    };

    return (
        <div className={cn('flex flex-wrap items-center justify-center gap-3 border-t p-4 md:justify-center lg:justify-between', className)}>
            <div className="text-muted-foreground text-sm dark:text-gray-300">
                {t('Showing')} <span className="font-medium dark:text-white">{from}</span> {t('to')}{' '}
                <span className="font-medium dark:text-white">{to}</span> {t('of')} <span className="font-medium dark:text-white">{total}</span>{' '}
                {t('results')}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
                {!hidePerPage && (
                    <>
                        <Label className="text-muted-foreground text-xs">{t('Raws per page:')}</Label>
                        <Select value={currentPerPage || '10'} onValueChange={onPerPageChange}>
                            <SelectTrigger className="h-8 w-16">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {perPageOptions.map((option) => (
                                    <SelectItem key={option} value={option.toString()}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </>
                )}
                {/* Desktop Pagination */}
                <div className="hidden flex-wrap items-center gap-1 min-[992px]:flex">
                    {links && links.length > 0
                        ? links.map((link: any, i: number) => {
                              const isTextLink = link.label === '&laquo; Previous' || link.label === 'Next &raquo;';
                              return (
                                  <Button
                                      key={`pagination-${i}-${link.label}`}
                                      variant={link.active ? 'default' : 'outline'}
                                      size={isTextLink ? 'sm' : 'icon'}
                                      className={isTextLink ? 'px-3' : 'h-8 w-8'}
                                      disabled={!link.url}
                                      onClick={() => link.url && handlePageChange(link.url)}
                                  >
                                      <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                  </Button>
                              );
                          })
                        : null}
                </div>

                {/* Mobile Pagination */}
                <div className="flex flex-wrap items-center gap-1 min-[992px]:hidden">
                    {links &&
                        links.length > 0 &&
                        (() => {
                            const activeIndex = links.findIndex((l: any) => l.active);
                            if (activeIndex === -1 || links.length < 3) return null;

                            const firstPageLink = links[1];
                            const lastPageLink = links[links.length - 2];
                            const prevLink = links[0];
                            const nextLink = links[links.length - 1];
                            const activeLink = links[activeIndex];

                            return (
                                <>
                                    {/* Prev (<) */}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={!prevLink?.url}
                                        onClick={() => prevLink?.url && handlePageChange(prevLink.url)}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: '&lsaquo;' }} />
                                    </Button>

                                    {(() => {
                                        if (links.length <= 2) return null;

                                        const items = [];
                                        const lastNumberIndex = links.length - 2;
                                        const isNearStart = activeIndex === 1 || activeIndex === 2;
                                        const isNearEnd = activeIndex === lastNumberIndex || activeIndex === lastNumberIndex - 1;

                                        if (isNearStart) {
                                            items.push(firstPageLink);
                                            if (links[2] && links[2].label && !isNaN(parseInt(links[2].label))) {
                                                items.push(links[2]);
                                            }
                                            if (links.length > 5) {
                                                items.push({ label: '...', url: null });
                                            }
                                        } else if (isNearEnd) {
                                            if (links.length > 5) {
                                                items.push({ label: '...', url: null });
                                            }
                                            const prevToLast = links[lastNumberIndex - 1];
                                            if (prevToLast && prevToLast.label && !isNaN(parseInt(prevToLast.label))) {
                                                items.push(prevToLast);
                                            }
                                            items.push(lastPageLink);
                                        } else {
                                            if (links.length > 5) {
                                                items.push({ label: '...', url: null });
                                            }
                                            items.push(activeLink);
                                            if (links.length > 5) {
                                                items.push({ label: '...', url: null });
                                            }
                                        }

                                        return items.map((l: any, i: number) => (
                                            <Button
                                                key={`m-page-${i}`}
                                                variant={l.active ? 'default' : 'outline'}
                                                size="icon"
                                                className={cn(
                                                    'h-8 w-8',
                                                    l.label === '...'
                                                        ? 'text-muted-foreground pointer-events-none border-transparent bg-transparent shadow-none'
                                                        : '',
                                                )}
                                                disabled={!l.url && l.label !== '...'}
                                                onClick={() => l.url && handlePageChange(l.url)}
                                            >
                                                <span dangerouslySetInnerHTML={{ __html: l.label }} />
                                            </Button>
                                        ));
                                    })()}

                                    {/* Next (>) */}
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        disabled={!nextLink?.url}
                                        onClick={() => nextLink?.url && handlePageChange(nextLink.url)}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: '&rsaquo;' }} />
                                    </Button>
                                </>
                            );
                        })()}
                </div>

                {/* Fallback simple pagination */}
                <div className="flex items-center gap-1">
                    {(!links || links.length === 0) && currentPage && lastPage && lastPage > 1 && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1}
                                onClick={() => handlePageChange(`?page=${currentPage - 1}`)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-1 dark:text-white">
                                {currentPage} of {lastPage}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= lastPage}
                                onClick={() => handlePageChange(`?page=${currentPage + 1}`)}
                            >
                                {t('Next')} <ChevronRight />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
