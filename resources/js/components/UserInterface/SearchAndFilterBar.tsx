import { Button } from '@components/UserInterface/Button';
import DatePicker from '@components/UserInterface/DatePicker';
import { Input } from '@components/UserInterface/Input';
import { Label } from '@components/UserInterface/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/Select';
import { Filter, LayoutGrid, List, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type SelectFilterOption = {
    name: string;
    label: string;
    type: 'select';
    options: SelectOption[];
    value: string | undefined;
    onChange: (value: string | undefined) => void;
    searchable?: boolean;
};

type DateFilterOption = {
    name: string;
    label: string;
    type: 'date';
    value: Date | undefined;
    onChange: (value: Date | undefined) => void;
};

type FilterOption = SelectFilterOption | DateFilterOption;

interface SearchAndFilterBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onSearch: (e: React.FormEvent) => void;
    filters?: FilterOption[];
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    hasActiveFilters: () => boolean;
    activeFilterCount: () => number;
    onResetFilters: () => void;
    onApplyFilters?: () => void;
    perPageOptions?: number[];
    currentPerPage: string;
    onPerPageChange: (value: string) => void;
    showViewToggle?: boolean;
    activeView?: 'list' | 'grid';
    onViewChange?: (view: 'list' | 'grid') => void;
}

export default function SearchAndFilterBar({
    searchTerm,
    onSearchChange,
    onSearch,
    filters = [],
    showFilters,
    setShowFilters,
    hasActiveFilters,
    activeFilterCount,
    onResetFilters,
    onApplyFilters,
    perPageOptions = [10, 25, 50, 100],
    currentPerPage,
    onPerPageChange,
    // View toggle props
    showViewToggle = false,
    activeView = 'list',
    onViewChange,
}: SearchAndFilterBarProps) {
    const { t: translate } = useTranslation();

    return (
        <div className="w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <form autoComplete="off" onSubmit={onSearch} className="flex gap-2">
                        <div className="relative w-64">
                            <Input
                                value={searchTerm}
                                onChange={(e) => {
                                    onSearchChange(e.target.value);
                                }}
                                className="bg-background w-full"
                            />
                        </div>
                        <Button type="submit" size="lg">
                            <Search className="mr-1.5 h-4 w-4" />
                            {translate('Search')}
                        </Button>
                    </form>

                    {filters.length > 0 && (
                        <div className="ml-2">
                            <Button
                                variant={hasActiveFilters() ? 'default' : 'outline'}
                                size="lg"
                                onClick={() => {
                                    setShowFilters(!showFilters);
                                }}
                            >
                                <Filter className="mr-1.5 h-3.5 w-3.5" />
                                {showFilters ? translate('Hide filters') : translate('Show filters')}
                                {hasActiveFilters() && (
                                    <span className="bg-primary-foreground text-primary ml-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                                        {activeFilterCount()}
                                    </span>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {showViewToggle && onViewChange && (
                        <div className="mr-2 rounded-md border p-0.5">
                            <Button
                                size="lg"
                                variant={activeView === 'list' ? 'default' : 'ghost'}
                                className="h-7 px-2"
                                onClick={() => {
                                    onViewChange('list');
                                }}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant={activeView === 'grid' ? 'default' : 'ghost'}
                                className="h-7 px-2"
                                onClick={() => {
                                    onViewChange('grid');
                                }}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <Label className="text-muted-foreground text-xs">{translate('Per page:')}</Label>
                    <Select value={currentPerPage} onValueChange={onPerPageChange}>
                        <SelectTrigger className="h-8 w-16">
                            <SelectValue placeholder={translate('Select...')} />
                        </SelectTrigger>
                        <SelectContent>
                            {perPageOptions.map((option) => (
                                <SelectItem key={option} value={option.toString()}>
                                    {option}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {showFilters && filters.length > 0 && (
                <div className="mt-3 w-full rounded-md border bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="flex flex-wrap items-end gap-4">
                        {filters.map((filter) => (
                            <div key={filter.name} className="space-y-2">
                                <Label>{filter.label}</Label>
                                {filter.type === 'select' && filter.options && (
                                    <Select value={filter.value ?? ''} onValueChange={filter.onChange}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder={filter.label} />
                                        </SelectTrigger>
                                        <SelectContent searchable={filter.searchable}>
                                            {filter.options.map((option) => (
                                                <SelectItem
                                                    key={option.value || 'empty'}
                                                    value={option.value || '_empty_'}
                                                    disabled={option.disabled}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                {filter.type === 'date' && (
                                    <DatePicker selected={filter.value} onSelect={filter.onChange} onChange={filter.onChange} />
                                )}
                            </div>
                        ))}

                        <div className="flex gap-2">
                            {onApplyFilters && (
                                <Button variant="default" size="lg" onClick={onApplyFilters}>
                                    {translate('Apply filters')}
                                </Button>
                            )}

                            <Button variant="outline" size="lg" onClick={onResetFilters} disabled={!hasActiveFilters()}>
                                {translate('Reset filters')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
