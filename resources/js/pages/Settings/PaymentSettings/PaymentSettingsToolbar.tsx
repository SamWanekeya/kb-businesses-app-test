import { Search, X } from 'lucide-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { PaymentStatusFilter } from '@/types/payment-settings';
import { Badge } from '@components/UserInterface/Badge';
import { Button } from '@components/UserInterface/Button';
import { Input } from '@components/UserInterface/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';

interface PaymentSettingsToolbarProps {
    searchTerm: string;
    statusFilter: PaymentStatusFilter;
    resultCount: number;
    totalCount: number;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: PaymentStatusFilter) => void;
    onClearAll: () => void;
}

/**
 * PaymentSettingsToolbar
 *
 * Provides searchable, status-filtered navigation across payment gateways.
 * Filter state is controlled by the parent so the visible gateway list and
 * toolbar remain synchronized with the Inertia form data.
 *
 * Accessibility: labels the search and status controls, exposes result
 * changes through a polite live region, and provides keyboard-focusable
 * filter-removal controls.
 */
export default function PaymentSettingsToolbar({
    searchTerm,
    statusFilter,
    resultCount,
    totalCount,
    onSearchChange,
    onStatusChange,
    onClearAll,
}: PaymentSettingsToolbarProps) {
    const { t: translate } = useTranslation();

    const hasFilters = searchTerm.length > 0 || statusFilter !== 'all';

    const handleSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => onSearchChange(event.currentTarget.value),
        [onSearchChange],
    );

    const clearSearch = useCallback(() => onSearchChange(''), [onSearchChange]);

    const clearStatus = useCallback(() => onStatusChange('all'), [onStatusChange]);

    const handleStatusChange = useCallback(
        (value: string) => {
            if (value === 'all' || value === 'enabled' || value === 'disabled') {
                onStatusChange(value);
            }
        },
        [onStatusChange],
    );

    return (
        <section aria-label={translate('Payment method filters')} className="space-y-4">
            {/* Search and status filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search
                        aria-hidden="true"
                        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2"
                    />

                    <Input
                        inputIdentifier="payment-method-search"
                        label={translate('Search payment methods')}
                        type="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder={translate('Search payment methods...')}
                        autoComplete="off"
                        className="pr-10 pl-9"
                    />

                    {searchTerm && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 right-1 z-10 size-8 -translate-y-1/2"
                            onClick={clearSearch}
                            aria-label={translate('Clear search')}
                        >
                            <X aria-hidden="true" className="size-4" />
                        </Button>
                    )}
                </div>

                <div className="w-full sm:w-48 sm:shrink-0">
                    <Select value={statusFilter} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-full" label={translate('Status')}>
                            <SelectValue placeholder={translate('All methods')} />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">{translate('All methods')}</SelectItem>
                            <SelectItem value="enabled">{translate('Enabled only')}</SelectItem>
                            <SelectItem value="disabled">{translate('Disabled only')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Active filters */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-sm">{translate('Active filters')}:</span>

                    {searchTerm && (
                        <Badge variant="secondary" className="gap-1 py-1">
                            <span className="max-w-48 truncate">
                                {translate('Search:')} {searchTerm}
                            </span>

                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label={translate('Remove search filter')}
                                className="hover:bg-muted focus-visible:ring-ring rounded-sm p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                            >
                                <X aria-hidden="true" className="size-3" />
                            </button>
                        </Badge>
                    )}

                    {statusFilter !== 'all' && (
                        <Badge variant="secondary" className="gap-1 py-1">
                            {translate('Status:')} {statusFilter === 'enabled' ? translate('Enabled') : translate('Disabled')}
                            <button
                                type="button"
                                onClick={clearStatus}
                                aria-label={translate('Remove status filter')}
                                className="hover:bg-muted focus-visible:ring-ring rounded-sm p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                            >
                                <X aria-hidden="true" className="size-3" />
                            </button>
                        </Badge>
                    )}

                    <Button type="button" variant="ghost" size="sm" onClick={onClearAll} className="h-7 px-2 text-xs">
                        {translate('Clear all')}
                    </Button>
                </div>
            )}

            {/* Result count */}
            <p role="status" aria-live="polite" aria-atomic="true" className="text-muted-foreground text-sm">
                {translate('Showing {{count}} of {{total}} payment methods', {
                    count: resultCount,
                    total: totalCount,
                })}
            </p>

            {/* Empty search results */}
            {hasFilters && resultCount === 0 && (
                <div className="border-border rounded-xl border border-dashed px-6 py-10 text-center sm:py-12">
                    <div className="bg-muted mx-auto mb-4 flex size-11 items-center justify-center rounded-full">
                        <Search aria-hidden="true" className="text-muted-foreground size-5" />
                    </div>

                    <h3 className="text-foreground font-semibold">{translate('No payment methods found')}</h3>

                    <p className="text-muted-foreground mt-1 text-sm">{translate('Try adjusting your search or filter criteria')}</p>

                    <Button type="button" variant="outline" className="mt-4" onClick={onClearAll}>
                        {translate('Clear filters')}
                    </Button>
                </div>
            )}
        </section>
    );
}
