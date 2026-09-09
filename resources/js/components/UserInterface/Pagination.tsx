/**
 * Pagination component with dark mode support
 */
import { Button } from '@components/UserInterface/Button';
import { cn } from '@lib/utils';
import { useTranslation } from 'react-i18next';

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
}

export default function Pagination({
    from = 0,
    to = 0,
    total = 0,
    links = [],
    currentPage,
    lastPage,
    entityName = 'items',
    onPageChange,
    className = '',
}: PaginationProps) {
    const { t: translate } = useTranslation();

    const handlePageChange = (url: string) => {
        if (onPageChange) {
            onPageChange(url);
        } else if (url) {
            window.location.href = url;
        }
    };

    return (
        <div className={cn('flex items-center justify-between border-t p-4', className)}>
            <div className="text-muted-foreground text-sm dark:text-neutral-300">
                {translate('Showing')} <span className="font-medium dark:text-neutral-400">{from}</span> {translate('To')}{' '}
                <span className="font-medium dark:text-neutral-400">{to}</span> {translate('Of')}{' '}
                <span className="font-medium dark:text-neutral-400">{total}</span> {entityName}
            </div>

            <div className="flex gap-1">
                {links && links.length > 0
                    ? links.map((link: any, i: number) => {
                          // Check if the link is "Next" or "Previous" to use text instead of icon
                          const isTextLink = link.label === '&laquo; Previous' || link.label === 'Next &raquo;';
                          const label = link.label?.replace('&laquo; ', '')?.replace(' &raquo;', '');

                          return (
                              <Button
                                  key={`pagination-${i}-${link.label}`}
                                  variant={link.active ? 'default' : 'outline'}
                                  size={isTextLink ? 'sm' : 'icon'}
                                  className={isTextLink ? 'px-3' : 'h-8 w-8'}
                                  disabled={!link.url}
                                  onClick={() => link.url && handlePageChange(link.url)}
                              >
                                  {isTextLink ? label : <span dangerouslySetInnerHTML={{ __html: link.label }} />}
                              </Button>
                          );
                      })
                    : // Simple pagination if links are not available
                      currentPage &&
                      lastPage &&
                      lastPage > 1 && (
                          <>
                              <Button
                                  variant="outline"
                                  size="lg"
                                  disabled={currentPage <= 1}
                                  onClick={() => {
                                      handlePageChange(`?page=${currentPage - 1}`);
                                  }}
                              >
                                  {translate('Previous')}
                              </Button>
                              <span className="px-3 py-1 dark:text-neutral-400">
                                  {currentPage} of {lastPage}
                              </span>
                              <Button
                                  variant="outline"
                                  size="lg"
                                  disabled={currentPage >= lastPage}
                                  onClick={() => {
                                      handlePageChange(`?page=${currentPage + 1}`);
                                  }}
                              >
                                  {translate('Next')}
                              </Button>
                          </>
                      )}
            </div>
        </div>
    );
}
