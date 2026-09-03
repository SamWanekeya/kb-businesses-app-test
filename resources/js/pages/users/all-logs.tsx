import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { SearchAndFilterBar } from '@/components/ui/search-and-filter-bar';
import { router, usePage } from '@inertiajs/react';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    loginHistories: {
        data: any[];
        from: number;
        to: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        search?: string;
        sort_field?: string;
        sort_direction?: string;
        per_page?: number;
    };
}

export default function AllUserLogs({ loginHistories, filters: pageFilters = {} }: Props) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedLogDetails, setSelectedLogDetails] = useState<any>(null);
    const { auth } = usePage().props as any;

    const breadcrumbs = [
        { title: t('Dashboard'), href: route('dashboard') },
        auth?.user?.type === 'super_admin' || auth?.user?.type === 'super admin'
            ? { title: t('Organizations'), href: route('organizations.index') }
            : { title: t('User'), href: route('users.index') },
        { title: t('User Logs') },
    ];

    // Check if any filters are active
    const hasActiveFilters = () => {
        return searchTerm !== '';
    };

    // Count active filters
    const activeFilterCount = () => {
        return searchTerm ? 1 : 0;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        const params: any = { page: 1 };

        if (searchTerm) {
            params.search = searchTerm;
        }

        // Add per_page if it exists
        if (pageFilters.per_page) {
            params.per_page = pageFilters.per_page;
        }

        router.get(route('users.all-logs'), params, { preserveState: true, preserveScroll: true });
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setShowFilters(false);

        router.get(
            route('users.all-logs'),
            {
                page: 1,
                per_page: pageFilters.per_page,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const formatLocationAndDevice = (details: any) => {
        if (!details) return { location: '-', device: '-' };

        let parsedDetails = details;
        if (typeof details === 'string') {
            try {
                parsedDetails = JSON.parse(details);
            } catch (e) {
                return { location: '-', device: '-' };
            }
        }

        // Format location
        const locationParts = [];
        if (parsedDetails.city) locationParts.push(parsedDetails.city);
        if (parsedDetails.regionName) locationParts.push(parsedDetails.regionName);
        if (parsedDetails.country) locationParts.push(parsedDetails.country);
        const location = locationParts.length > 0 ? locationParts.join(', ') : parsedDetails.query || '-';

        // Format device info
        const browser = parsedDetails.browser_name || '';
        const os = parsedDetails.os_name || '';
        const deviceType = parsedDetails.device_type || '';

        let device = '';
        if (browser && os) {
            device = `${browser} on ${os}`;
            if (deviceType) device += ` (${deviceType})`;
        } else if (browser) {
            device = browser;
        } else if (os) {
            device = os;
        } else {
            device = '-';
        }

        return { location, device };
    };

    const handleViewDetails = (log: any) => {
        setSelectedLogDetails(log.details);
        setIsDetailsModalOpen(true);
    };

    const formatDetailsForDisplay = (details: any) => {
        if (!details) return {};

        let parsedDetails = details;
        if (typeof details === 'string') {
            try {
                parsedDetails = JSON.parse(details);
            } catch (e) {
                return {};
            }
        }

        return parsedDetails;
    };

    return (
        <PageTemplate title={t('User Logs')} url="/users-logs" breadcrumbs={breadcrumbs} noPadding>
            {/* Search and filters section */}
            <div className="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-900">
                <SearchAndFilterBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onSearch={handleSearch}
                    filters={[]}
                    showFilters={false}
                    setShowFilters={() => {}}
                    hasActiveFilters={() => false}
                    activeFilterCount={() => 0}
                    onResetFilters={() => {}}
                    currentPerPage={pageFilters.per_page?.toString() || '10'}
                    onPerPageChange={(value) => {
                        const params: any = { page: 1, per_page: parseInt(value) };

                        if (searchTerm) {
                            params.search = searchTerm;
                        }

                        router.get(route('users.all-logs'), params, { preserveState: true, preserveScroll: true });
                    }}
                />
            </div>

            <div className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-900">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                    {t('User')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                    {t('IP Address')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                    {t('Location & Device')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                    {t('Role')}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                    {t('Time')}
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-300">
                                    {t('Actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                            {loginHistories?.data?.map((log: any) => {
                                const { location, device } = formatLocationAndDevice(log.details);
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {log.user?.name || 'Unknown User'}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{log.user?.email || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">{log.ip}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{location}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{device}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                            {log.user?.roles?.[0]?.name || log.type || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900 dark:text-white">
                                            {window.appSettings?.formatDateTime(log.created_at, false) || new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetails(log)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {loginHistories?.data?.length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400">{t('No user logs found.')}</p>
                    </div>
                )}

                {/* Pagination section */}
                <Pagination
                    from={loginHistories?.from || 0}
                    to={loginHistories?.to || 0}
                    total={loginHistories?.total || 0}
                    links={loginHistories?.links}
                    entityName={t('logs')}
                    onPageChange={(url) => router.get(url)}
                />
            </div>

            {/* Details Modal */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{t('Sign in Details')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedLogDetails &&
                            Object.entries(formatDetailsForDisplay(selectedLogDetails)).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 gap-4 border-b border-gray-200 py-2 dark:border-gray-700">
                                    <div className="font-medium text-gray-700 capitalize dark:text-gray-300">{key.replace(/_/g, ' ')}</div>
                                    <div className="col-span-2 break-all text-gray-900 dark:text-white">
                                        {value !== null && value !== undefined ? String(value) : '-'}
                                    </div>
                                </div>
                            ))}
                    </div>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
