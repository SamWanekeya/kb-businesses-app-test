import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/utils/Routes';
import { useTranslation } from 'react-i18next';

interface ReportFiltersProps {
    filters: {
        dateFrom: string;
        dateTo: string;
        [key: string]: any;
    };
    additionalFilters?: ReactNode;
}

import { ReactNode } from 'react';

export function ReportFilters({ filters, additionalFilters }: ReportFiltersProps) {
    const { t: translate } = useTranslation();
    const [dateFrom, setDateFrom] = useState(filters.dateFrom);
    const [dateTo, setDateTo] = useState(filters.dateTo);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(window.location.pathname, {
            date_from: dateFrom,
            date_to: dateTo,
        });
    };

    const handleClearFilters = () => {
        const defaultDateFrom = new Date();
        defaultDateFrom.setMonth(defaultDateFrom.getMonth() - 1);
        const defaultDateTo = new Date();

        setDateFrom(defaultDateFrom.toISOString().split('T')[0]);
        setDateTo(defaultDateTo.toISOString().split('T')[0]);

        router.get(window.location.pathname);
    };

    return (
        <div className="mb-4 rounded-lg border bg-white shadow dark:bg-gray-900">
            <form onSubmit={handleFilterSubmit} className="flex flex-col items-stretch gap-3 p-3 min-[1070px]:flex-row min-[1070px]:items-center">
                <div className="flex w-full flex-1 flex-col items-stretch gap-3 min-[1070px]:flex-row min-[1070px]:items-center">
                    <div className="flex flex-1 items-center gap-2">
                        <p className="w-20 shrink-0 text-sm font-medium min-[1070px]:w-auto">{translate('From Date :')}</p>
                        <div className="flex-1" style={{ minWidth: 0 }}>
                            <DatePicker
                                id="date_from"
                                selected={dateFrom}
                                onChange={(e) => setDateFrom(e)}
                                placeholder={translate('From Date')}
                                className="!w-full"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-1 items-center gap-2">
                        <p className="w-20 shrink-0 text-sm font-medium min-[1070px]:w-auto">{translate('To Date :')}</p>
                        <div className="flex-1" style={{ minWidth: 0 }}>
                            <DatePicker
                                id="date_to"
                                selected={dateTo}
                                onChange={(e) => setDateTo(e)}
                                placeholder={translate('To Date')}
                                className="!w-full"
                                required
                            />
                        </div>
                    </div>
                    {additionalFilters}
                </div>
                <div className="mt-2 flex shrink-0 items-center justify-end gap-2 min-[1070px]:mt-0">
                    <Button type="submit" size="sm" className="h-9 w-full min-[1070px]:w-auto">
                        {translate('Apply Filters')}
                    </Button>
                    <Button type="button" size="sm" className="h-9 w-full min-[1070px]:w-auto" variant="outline" onClick={handleClearFilters}>
                        {translate('Clear Filters')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
