import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Columns, Filter, Grid3X3, LayoutGrid, List, RefreshCcw, Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ViewOption {
    value: string;
    label: string;
    icon: string;
}

interface FilterOption {
    name: string;
    label: string;
    type: 'select' | 'date';
    searchable?: boolean;
    options?: { value: string; label: string }[];
    value: string | Date | undefined;
    onChange: (value: any) => void;
}

interface SearchAndFiltersProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearch: (e: React.FormEvent) => void;
    searchPlaceholder?: string;
    filters?: FilterOption[];
    hasActiveFilters: () => boolean;
    activeFilterCount: () => number;
    onResetFilters: () => void;
    // View toggle props
    showViewToggle?: boolean;
    activeView?: string;
    onViewChange?: (view: string) => void;
    viewOptions?: ViewOption[];
}

export function SearchAndFilterBar({
    searchTerm,
    onSearchChange,
    onSearch,
    searchPlaceholder,
    filters = [],
    hasActiveFilters,
    activeFilterCount,
    onResetFilters,
    // View toggle props
    showViewToggle = false,
    activeView = 'list',
    onViewChange,
    viewOptions = [
        { value: 'list', label: 'List View', icon: 'List' },
        { value: 'grid', label: 'Grid View', icon: 'Grid3X3' },
    ],
}: SearchAndFiltersProps) {
    const { t: translate } = useTranslation();

    // Build active filter pills from non-empty filter values
    const activeFilters = filters.filter((f) => {
        if (!f.value) return false;
        if (typeof f.value === 'string' && (f.value === 'all' || f.value === '')) return false;
        return true;
    });

    const getFilterLabel = (filter: FilterOption) => {
        if (filter.type === 'select' && filter.options) {
            const opt = filter.options.find((o) => o.value === filter.value);
            return opt?.label ?? String(filter.value);
        }
        if (filter.value instanceof Date) {
            return window?.appSettings?.formatDateTime(filter.value || '-');
        }
        return String(filter.value);
    };

    const removeFilter = (filter: FilterOption) => {
        filter.onChange(filter.type === 'select' ? 'all' : undefined);
    };

    const formRef = useRef<HTMLFormElement>(null);
    const isInitialSearchMount = useRef(true);

    useEffect(() => {
        if (isInitialSearchMount.current) {
            isInitialSearchMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            formRef.current?.requestSubmit();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="w-full p-3">
            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <form ref={formRef} onSubmit={onSearch} className="flex w-full min-w-0 gap-2 sm:w-auto">
                        <div className="relative w-full min-w-0 sm:w-64">
                            <Search className="text-muted-foreground absolute top-2 left-2.5 h-4 w-4" />
                            <Input
                                placeholder={searchPlaceholder || translate('Search...')}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="h-8 w-full min-w-0 px-9"
                            />
                            {searchTerm && (
                                <X
                                    className="text-muted-foreground absolute top-2 right-2.5 h-4 w-4 cursor-pointer"
                                    onClick={(e) => onSearchChange('')}
                                />
                            )}
                        </div>
                    </form>

                    {filters.map((filter) => (
                        <div key={filter.name} className="space-y-2">
                            {filter.type === 'select' && filter.options && (
                                <Select value={filter.value as string} onValueChange={(value) => filter.onChange(value)}>
                                    <SelectTrigger className="h-9 w-auto gap-2">
                                        <SelectValue placeholder={t(`All ${filter.label}`)} />
                                    </SelectTrigger>
                                    <SelectContent searchable={filter.searchable}>
                                        {filter.options.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                            {filter.type === 'date' && (
                                <DatePicker
                                    selected={filter.value as Date | undefined}
                                    onSelect={(date) => filter.onChange(date)}
                                    onChange={(date) => filter.onChange(date)}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {filters.length > 0 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 bg-transparent text-gray-500 hover:bg-transparent hover:text-gray-500 dark:text-gray-700 dark:hover:text-gray-700"
                                onClick={onResetFilters}
                                hidden={!hasActiveFilters()}
                            >
                                <RefreshCcw />
                                {translate('Clear Filters')}
                            </Button>
                            <Button variant={hasActiveFilters() ? 'default' : 'outline'} size="sm" className="h-8 cursor-default px-2 py-1">
                                <Filter className="mr-1.5 h-4 w-4" />
                                {translate('Filters')}
                                {hasActiveFilters() && (
                                    <span className="bg-primary-foreground text-primary ml-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                                        {activeFilterCount()}
                                    </span>
                                )}
                            </Button>
                        </>
                    )}
                    {showViewToggle && onViewChange && (
                        <div className="mr-2 rounded-md border p-0.5">
                            {viewOptions.map((option) => {
                                const IconComponent =
                                    option.icon === 'List'
                                        ? List
                                        : option.icon === 'Grid3X3'
                                          ? Grid3X3
                                          : option.icon === 'Columns'
                                            ? Columns
                                            : LayoutGrid;
                                return (
                                    <Button
                                        key={option.value}
                                        size="sm"
                                        variant={activeView === option.value ? 'default' : 'ghost'}
                                        className="h-7 px-2"
                                        onClick={() => onViewChange(option.value)}
                                        title={option.label}
                                    >
                                        {option.text ? option.text : <IconComponent className="h-4 w-4" />}
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Active filter pills (always visible when filters applied) ── */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3">
                    {activeFilters.map((filter) => (
                        <span
                            key={filter.name}
                            className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-600/20 ring-inset"
                        >
                            <span>
                                {filter.label}: {getFilterLabel(filter)}
                            </span>
                            <button type="button" onClick={() => removeFilter(filter)} className="ml-0.5 cursor-pointer rounded-full p-0.5">
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
