import { CrudDeleteModal } from '@components/CrudDeleteModal';
import { toast } from '@components/CustomToast';
import { PageTemplate } from '@components/page-template';
import { Button } from '@components/UserInterface/button';
import { Input } from '@components/UserInterface/input';
import { Label } from '@components/UserInterface/label';
import { Pagination } from '@components/UserInterface/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/UserInterface/select';
import { Textarea } from '@components/UserInterface/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@components/UserInterface/tooltip';
import { router, usePage } from '@inertiajs/react';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { Bookmark, ChevronDown, ChevronUp, Edit, Lock, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Brands() {
    const { t: translate } = useTranslation();
    const { auth, brands, filters: pageFilters = {} } = usePage().props;
    const permissions = auth?.permissions || [];

    const [searchTerm, setSearchTerm] = useState(pageFilters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(pageFilters.status || 'all');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<any>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [expandedDescriptions, setExpandedDescriptions] = useState<Set<number>>(new Set());
    const [overflowingDescriptions, setOverflowingDescriptions] = useState<Set<number>>(new Set());
    const descriptionRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const descriptionRefsMobile = useRef<Map<number, HTMLDivElement>>(new Map());

    const checkOverflow = useCallback(() => {
        const next = new Set<number>();
        descriptionRefs.current.forEach((el, id) => {
            if (el && el.scrollHeight > el.clientHeight) next.add(id);
        });
        descriptionRefsMobile.current.forEach((el, id) => {
            if (el && el.scrollHeight > el.clientHeight) next.add(id);
        });
        setOverflowingDescriptions(next);
    }, []);

    useEffect(() => {
        checkOverflow();
        const observer = new ResizeObserver(checkOverflow);
        descriptionRefs.current.forEach((el) => {
            if (el) observer.observe(el);
        });
        descriptionRefsMobile.current.forEach((el) => {
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [checkOverflow, brands?.data]);

    const [formData, setFormData] = useState({ name: '', website: '', description: '', status: 'active' });
    const [formErrors, setFormErrors] = useState<any>({});

    const resetForm = () => {
        setFormData({ name: '', website: '', description: '', status: 'active' });
        setFormErrors({});
        setFormMode('create');
        setCurrentItem(null);
    };

    const loadItemForEdit = (item: any) => {
        setFormData({ name: item.name || '', website: item.website || '', description: item.description || '', status: item.status || 'active' });
        setFormMode('edit');
        setCurrentItem(item);
        setFormErrors({});
    };

    const hasActiveFilters = () => searchTerm !== '' || selectedStatus !== 'all';

    const applyFilters = (status = selectedStatus, search = searchTerm) => {
        router.get(
            route('brands.index'),
            {
                page: 1,
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
                sort_field: pageFilters.sort_field,
                sort_direction: pageFilters.sort_direction,
                per_page: pageFilters.per_page || 10,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e?.preventDefault) e.preventDefault();
        applyFilters();
    };

    const handleSort = (field: string) => {
        const direction = pageFilters.sort_field === field && pageFilters.sort_direction === 'asc' ? 'desc' : 'asc';
        router.get(
            route('brands.index'),
            {
                sort_field: field,
                sort_direction: direction,
                page: 1,
                search: searchTerm || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
                per_page: pageFilters.per_page || 10,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        router.get(route('brands.index'), {}, { preserveState: true, preserveScroll: true });
    };

    const handleAction = (action: string, item: any) => {
        setCurrentItem(item);
        switch (action) {
            case 'edit':
                loadItemForEdit(item);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
            case 'delete':
                setIsDeleteModalOpen(true);
                break;
            case 'toggle-status':
                handleToggleStatus(item);
                break;
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        if (formMode === 'create') {
            router.post(route('brands.store'), formData, {
                onSuccess: (page) => {
                    if (page.props.flash.success) {
                        toast.success(page.props.flash.success);
                        resetForm();
                    } else if (page.props.flash.error) toast.error(page.props.flash.error);
                },
                onError: (errors) => {
                    setFormErrors(errors);
                    toast.error(translate('Failed to create brand.'));
                },
            });
        } else {
            router.put(route('brands.update', currentItem.id), formData, {
                onSuccess: (page) => {
                    if (page.props.flash.success) {
                        toast.success(page.props.flash.success);
                        resetForm();
                    } else if (page.props.flash.error) toast.error(page.props.flash.error);
                },
                onError: (errors) => {
                    setFormErrors(errors);
                    toast.error(translate('Failed to update brand.'));
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        router.delete(route('brands.destroy', currentItem.id), {
            onSuccess: (page) => {
                setIsDeleteModalOpen(false);
                if (page.props.flash.success) {
                    toast.success(page.props.flash.success);
                    if (formMode === 'edit') resetForm();
                } else if (page.props.flash.error) toast.error(page.props.flash.error);
            },
            onError: (errors) => {
                setIsDeleteModalOpen(false);
                toast.error(`${translate('Failed to delete brand')}: ${Object.values(errors).join(', ')}`);
            },
        });
    };

    const handleToggleStatus = (item: any) => {
        router.put(
            route('brands.toggle-status', item.id),
            {},
            {
                onSuccess: (page) => {
                    if (page.props.flash.success) {
                        toast.success(page.props.flash.success);
                        if (formMode === 'edit' && currentItem?.id === item.id)
                            setFormData((prev) => ({ ...prev, status: item.status === 'active' ? 'inactive' : 'active' }));
                    } else if (page.props.flash.error) toast.error(page.props.flash.error);
                },
                onError: (errors) => toast.error(`${translate('Failed to update brand')}: ${Object.values(errors).join(', ')}`),
            },
        );
    };

    const toggleDescription = (id: number) => {
        const next = new Set(expandedDescriptions);
        next.has(id) ? next.delete(id) : next.add(id);
        setExpandedDescriptions(next);
    };

    const canCreate = useHasPermission('create-brands');
    const canEdit = useHasPermission('edit-brands');
    const canDelete = useHasPermission('delete-brands');
    const canToggleStatus = useHasPermission('toggle-status-brands');

    const breadcrumbs = [
        { title: translate('Dashboard'), href: route('dashboard') },
        { title: translate('Product Setup') },
        { title: translate('Brands') },
    ];

    return (
        <PageTemplate
            title={translate('Brands')}
            description={translate('Manage brands associated with your products.')}
            url="/brands"
            breadcrumbs={breadcrumbs}
            noPadding
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left — Form */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {formMode === 'create' ? translate('Add New Brand') : translate('Edit Brand')}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {formMode === 'create'
                                    ? translate('Fill in the details to create a new brand')
                                    : translate('Update the brand details below')}
                            </p>
                        </div>
                        <form onSubmit={handleFormSubmit} className="space-y-4 p-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" required>
                                    {translate('Brand Name')}
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={translate('e.g. Nike, Apple, Samsung')}
                                    className={formErrors.name ? 'border-red-500' : ''}
                                    disabled={!canCreate && !canEdit}
                                    required
                                />
                                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">{translate('Website')}</Label>
                                <Input
                                    id="website"
                                    type="text"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="e.g. https://www.kakbima.dev"
                                    className={formErrors.website ? 'border-red-500' : ''}
                                    disabled={!canCreate && !canEdit}
                                />
                                {formErrors.website && <p className="text-sm text-red-500">{formErrors.website}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">{translate('Description')}</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder={translate('Enter brand description...')}
                                    rows={3}
                                    className={formErrors.description ? 'border-red-500' : ''}
                                    disabled={!canCreate && !canEdit}
                                />
                                {formErrors.description && <p className="text-sm text-red-500">{formErrors.description}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">{translate('Status')}</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    disabled={!canCreate && !canEdit}
                                >
                                    <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">{translate('Active')}</SelectItem>
                                        <SelectItem value="inactive">{translate('Inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                                {(canCreate || canEdit) && (
                                    <Button type="submit" className="flex-1">
                                        {formMode === 'create' ? translate('Add Brand') : translate('Update Brand')}
                                    </Button>
                                )}
                                {formMode === 'edit' && (
                                    <Button type="button" variant="outline" onClick={resetForm}>
                                        {translate('Cancel')}
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right — List */}
                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder={translate('Search brands...')}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button onClick={handleSearch} variant="default">
                                    {translate('Search')}
                                </Button>
                                {hasActiveFilters() && (
                                    <Button onClick={handleResetFilters} variant="outline">
                                        <X className="mr-2 h-4 w-4" />
                                        {translate('Reset')}
                                    </Button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(value) => {
                                        setSelectedStatus(value);
                                        applyFilters(value, searchTerm);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={translate('All Statuses')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{translate('All Statuses')}</SelectItem>
                                        <SelectItem value="active">{translate('Active')}</SelectItem>
                                        <SelectItem value="inactive">{translate('Inactive')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        {(brands?.data || []).length > 0 ? (
                            <>
                                {/* <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{translate('Brands')}</h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{translate('Manage brands for your products.')}</p>
                                </div> */}
                                {/* Desktop Table */}
                                <div className="hidden overflow-x-auto lg:block">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr className="border-t bg-[#F0F0F1] hover:bg-[#F0F0F1] dark:border-gray-900 dark:bg-gray-900">
                                                <th
                                                    className="cursor-pointer px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 select-none dark:text-gray-300"
                                                    onClick={() => handleSortranslate('name')}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {translate('Brand')}
                                                        {pageFilters.sort_field === 'name' ? (
                                                            pageFilters.sort_direction === 'asc' ? (
                                                                ' ↑'
                                                            ) : (
                                                                ' ↓'
                                                            )
                                                        ) : (
                                                            <span className="opacity-40">↕</span>
                                                        )}
                                                    </div>
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-300">
                                                    {translate('Website')}
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium tracking-wider text-gray-500 dark:text-gray-300">
                                                    {translate('Status')}
                                                </th>
                                                <th className="px-4 py-3 pr-[50px] text-right text-xs font-medium tracking-wider text-gray-500 dark:text-gray-300">
                                                    {translate('Actions')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {brands.data.map((item: any) => (
                                                <tr key={item.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center">
                                                            <div className="bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                                                <Bookmark className="h-5 w-5" />
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                                                                {item.description && (
                                                                    <div className="mt-0.5 max-w-xs text-sm text-gray-500 dark:text-gray-400">
                                                                        <div
                                                                            ref={(el) => {
                                                                                if (el) descriptionRefs.current.set(item.id, el);
                                                                                else descriptionRefs.current.delete(item.id);
                                                                            }}
                                                                            className={expandedDescriptions.has(item.id) ? '' : 'line-clamp-2'}
                                                                        >
                                                                            {item.description}
                                                                        </div>
                                                                        {(overflowingDescriptions.has(item.id) ||
                                                                            expandedDescriptions.has(item.id)) && (
                                                                            <button
                                                                                onClick={() => toggleDescription(item.id)}
                                                                                className="mt-1 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                                            >
                                                                                {expandedDescriptions.has(item.id) ? (
                                                                                    <>
                                                                                        <ChevronUp className="mr-1 h-3 w-3" />
                                                                                        {translate('Show less')}
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <ChevronDown className="mr-1 h-3 w-3" />
                                                                                        {translate('Show more')}
                                                                                    </>
                                                                                )}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                                                        {item.website ? (
                                                            <a
                                                                href={item.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline dark:text-blue-400"
                                                            >
                                                                {item.website}
                                                            </a>
                                                        ) : (
                                                            '-'
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}
                                                        >
                                                            {item.status === 'active' ? translate('Active') : translate('Inactive')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {canEdit && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleAction('edit', item)}
                                                                                className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                                                                            >
                                                                                <Edit className="h-4 w-4 text-gray-500" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{translate('Edit')}</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                            {canToggleStatus && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleAction('toggle-status', item)}
                                                                                className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                                                                            >
                                                                                <Lock className="h-4 w-4 text-gray-500" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            {item.status === 'active'
                                                                                ? translate('Deactivate')
                                                                                : translate('Activate')}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                            {canDelete && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleAction('delete', item)}
                                                                                className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 text-gray-500" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{translate('Delete')}</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile Cards */}
                                <div className="space-y-4 p-4 lg:hidden">
                                    {brands.data.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                                        >
                                            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                                                <div className="flex gap-3">
                                                    <div className="bg-primary/10 text-primary flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                                        <Bookmark className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                                                        {item.description && (
                                                            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                <div
                                                                    ref={(el) => {
                                                                        if (el) descriptionRefsMobile.current.set(item.id, el);
                                                                        else descriptionRefsMobile.current.delete(item.id);
                                                                    }}
                                                                    className={expandedDescriptions.has(item.id) ? '' : 'line-clamp-2'}
                                                                >
                                                                    {item.description}
                                                                </div>
                                                                {(overflowingDescriptions.has(item.id) || expandedDescriptions.has(item.id)) && (
                                                                    <button
                                                                        onClick={() => toggleDescription(item.id)}
                                                                        className="mt-1 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                                                    >
                                                                        {expandedDescriptions.has(item.id) ? (
                                                                            <>
                                                                                <ChevronUp className="mr-1 h-3 w-3" />
                                                                                {translate('Show less')}
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <ChevronDown className="mr-1 h-3 w-3" />
                                                                                {translate('Show more')}
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 justify-end gap-1">
                                                    {canEdit && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleAction('edit', item)}
                                                                        className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                                                                    >
                                                                        <Edit className="h-4 w-4 text-gray-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{translate('Edit')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {canToggleStatus && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleAction('toggle-status', item)}
                                                                        className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                                                                    >
                                                                        <Lock className="h-4 w-4 text-gray-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {item.status === 'active' ? translate('Deactivate') : translate('Activate')}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                    {canDelete && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleAction('delete', item)}
                                                                        className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-gray-500" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>{translate('Delete')}</TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 dark:border-gray-700">
                                                <div>
                                                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{translate('Website')}</p>
                                                    {item.website ? (
                                                        <a
                                                            href={item.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs break-all text-blue-600 hover:underline dark:text-blue-400"
                                                        >
                                                            {item.website}
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">-</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">{translate('Status')}</p>
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.status === 'active' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}
                                                    >
                                                        {item.status === 'active' ? translate('Active') : translate('Inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {brands?.total > (brands?.per_page || 10) && (
                                    <div className="border-t border-gray-200 dark:border-gray-700">
                                        <Pagination
                                            from={brands?.from || 0}
                                            to={brands?.to || 0}
                                            total={brands?.total || 0}
                                            links={brands?.links}
                                            entityName={translate('brands')}
                                            hidePerPage={true}
                                            onPageChange={(url) => router.get(url, {}, { preserveState: true, preserveScroll: true })}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                    <Bookmark className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">{translate('No brands found')}</h3>
                                <p className="mx-auto mb-6 max-w-sm text-gray-500 dark:text-gray-400">
                                    {hasActiveFilters()
                                        ? translate('No brands match your search criteria. Try adjusting your filters.')
                                        : translate('Create brands to associate with your products.')}
                                </p>
                                {!hasActiveFilters() && canCreate && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {translate('Use the form on the left to add your first brand.')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <CrudDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                itemName={currentItem?.name || ''}
                entityName={translate('brand')}
            />
        </PageTemplate>
    );
}
