import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { useBrand } from '@/contexts/BrandContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useSidebarSettings } from '@/contexts/SidebarContext';
import { type NavItem } from '@/types';
import { useHasPermission } from '@/utils/Permissions';
import { getDisplayUrl } from '@/utils/helper';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Briefcase,
    Building2,
    Calendar,
    CalendarDays,
    ChevronRight,
    CreditCard,
    DollarSign,
    FileText,
    Folder,
    Gift,
    Image,
    LayoutGrid,
    LogOut,
    Mail,
    Megaphone,
    MegaphoneIcon,
    NotebookPen,
    Package,
    Phone,
    Search,
    Settings,
    ShoppingBag,
    Ticket,
    TicketPercent,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function AppSidebar() {
    const { t, i18n } = useTranslation();
    const { auth, globalSettings } = usePage().props;
    const userRole = auth.user?.type || auth.user?.role;
    const permissions = auth?.permissions || [];

    // Get current direction
    const isRtl = document.documentElement.dir === 'rtl';

    // Business switch handler removed

    const getSuperAdminNavItems = (): NavItem[] => [
        {
            title: translate('Dashboard'),
            href: route('dashboard'),
            icon: LayoutGrid,
            group: translate('Overview'),
        },

        {
            title: translate('Organizations'),
            href: route('organizations.index'),
            icon: Briefcase,
            group: translate('Management'),
        },
        {
            title: translate('Media Library'),
            href: route('media-library'),
            icon: Image,
            group: translate('Management'),
        },

        {
            title: translate('Plans'),
            icon: CreditCard,
            group: translate('Management'),
            children: [
                {
                    title: translate('Plans'),
                    href: route('plans.index'),
                },
                {
                    title: translate('Plan Request'),
                    href: route('plan-requests.index'),
                },
                {
                    title: translate('Plan Orders'),
                    href: route('plan-orders.index'),
                },
            ],
        },
        {
            title: translate('Coupons'),
            href: route('coupons.index'),
            icon: TicketPercent,
            group: translate('Management'),
        },

        {
            title: translate('Currency'),
            href: route('currencies.index'),
            icon: DollarSign,
            group: translate('Management'),
        },
        {
            title: translate('Referral Program'),
            href: route('referral.index'),
            icon: Gift,
            group: translate('Management'),
        },
        {
            title: translate('Email Templates'),
            href: route('email-templates.index'),
            icon: Mail,
            group: translate('System Control'),
        },
        {
            title: translate('Settings'),
            href: route('settings'),
            icon: Settings,
            group: translate('System Control'),
        },
    ];

    const getOrganizationNavItems = (): NavItem[] => {
        const items: NavItem[] = [];

        // ── 1. Overview ──────────────────────────────────────────────
        if (useHasPermission('manage-dashboard')) {
            items.push({
                title: translate('Dashboard'),
                href: route('dashboard'),
                icon: LayoutGrid,
                group: translate('Overview'),
            });
        }

        if (
            useHasPermission('manage-meetings') ||
            useHasPermission('manage-calls') ||
            useHasPermission('manage-project-tasks')
        ) {
            items.push({
                title: translate('Calendar'),
                href: route('calendar.index'),
                icon: Calendar,
                group: translate('Overview'),
            });
        }

        if (useHasPermission('manage-reports')) {
            items.push({
                title: translate('Reports'),
                icon: TrendingUp,
                group: translate('Overview'),
                children: [
                    { title: translate('Lead Reports'), href: route('reports.leads') },
                    { title: translate('Sales Reports'), href: route('reports.sales') },
                    { title: translate('Product Reports'), href: route('reports.product-reports') },
                    { title: translate('Contact Reports'), href: route('reports.customers') },
                    { title: translate('Project Reports'), href: route('reports.projects') },
                ],
            });
        }

        // ── 2. CRM ───────────────────────────────────────────────────
        const leadChildren = [];
        if (useHasPermission('manage-leads')) {
            leadChildren.push({ title: translate('Leads'), href: route('leads.index') });
        }
        if (useHasPermission('manage-lead-sources')) {
            leadChildren.push({ title: translate('Lead Sources'), href: route('lead-sources.index') });
        }
        if (useHasPermission('manage-lead-statuses')) {
            leadChildren.push({ title: translate('Lead Status'), href: route('lead-statuses.index') });
        }
        if (leadChildren.length > 0) {
            items.push({ title: translate('Lead Management'), icon: Users, group: translate('CRM'), children: leadChildren });
        }

        const opportunityChildren = [];
        if (useHasPermission('manage-opportunities')) {
            opportunityChildren.push({ title: translate('Opportunities'), href: route('opportunities.index') });
        }
        if (useHasPermission('manage-opportunity-sources')) {
            opportunityChildren.push({ title: translate('Opportunity Sources'), href: route('opportunity-sources.index') });
        }
        if (useHasPermission('manage-opportunity-stages')) {
            opportunityChildren.push({ title: translate('Opportunity Stages'), href: route('opportunity-stages.index') });
        }
        if (opportunityChildren.length > 0) {
            items.push({ title: translate('Opportunity Management'), icon: TrendingUp, group: translate('CRM'), children: opportunityChildren });
        }

        const accountChildren = [];
        if (useHasPermission('manage-accounts')) {
            accountChildren.push({ title: translate('Accounts'), href: route('accounts.index') });
        }
        if (useHasPermission('manage-account-types')) {
            accountChildren.push({ title: translate('Account Types'), href: route('account-types.index') });
        }
        if (useHasPermission('manage-account-industries')) {
            accountChildren.push({ title: translate('Account Industries'), href: route('account-industries.index') });
        }
        if (accountChildren.length > 0) {
            items.push({ title: translate('Account Management'), icon: Building2, group: translate('CRM'), children: accountChildren });
        }

        if (useHasPermission('manage-contacts')) {
            items.push({ title: translate('Contacts'), href: route('contacts.index'), icon: Users, group: translate('CRM') });
        }

        const campaignChildren = [];
        if (useHasPermission('manage-campaigns')) {
            campaignChildren.push({ title: translate('Campaigns'), href: route('campaigns.index') });
        }
        if (useHasPermission('manage-target-lists')) {
            campaignChildren.push({ title: translate('Target Lists'), href: route('target-lists.index') });
        }
        if (useHasPermission('manage-campaign-types')) {
            campaignChildren.push({ title: translate('Campaign Types'), href: route('campaign-types.index') });
        }
        if (campaignChildren.length > 0) {
            items.push({ title: translate('Campaign Management'), icon: Megaphone, group: translate('CRM'), children: campaignChildren });
        }

        if (useHasPermission('manage-cases')) {
            items.push({ title: translate('Cases'), href: route('cases.index'), icon: FileText, group: translate('CRM') });
        }

        // ── 3. Sales ─────────────────────────────────────────────────
        if (useHasPermission('manage-quotes')) {
            items.push({ title: translate('Quotes'), href: route('quotes.index'), icon: FileText, group: translate('Sales') });
        }

        if (useHasPermission('manage-sales-orders')) {
            items.push({ title: translate('Sales Orders'), href: route('sales-orders.index'), icon: ShoppingBag, group: translate('Sales') });
        }

        if (useHasPermission('manage-invoices')) {
            items.push({ title: translate('Invoices'), href: route('invoices.index'), icon: FileText, group: translate('Sales') });
        }

        if (useHasPermission('manage-receipt-orders')) {
            items.push({ title: translate('Receipt Orders'), href: route('receipt-orders.index'), icon: FileText, group: translate('Sales') });
        }

        // ── 4. Procurement & Fulfillment ─────────────────────────────
        if (useHasPermission('manage-purchase-orders')) {
            items.push({
                title: translate('Purchase Orders'),
                href: route('purchase-orders.index'),
                icon: ShoppingBag,
                group: translate('Procurement & Fulfillment'),
            });
        }

        if (useHasPermission('manage-delivery-orders')) {
            items.push({ title: translate('Delivery Orders'), href: route('delivery-orders.index'), icon: Ticket, group: translate('Procurement & Fulfillment') });
        }

        if (useHasPermission('manage-return-orders')) {
            items.push({ title: translate('Return Orders'), href: route('return-orders.index'), icon: FileText, group: translate('Procurement & Fulfillment') });
        }

        if (useHasPermission('manage-shipping-provider-types')) {
            items.push({
                title: translate('Shipping Provider Types'),
                href: route('shipping-provider-types.index'),
                icon: Ticket,
                group: translate('Procurement & Fulfillment'),
            });
        }

        // ── 5. Catalog ───────────────────────────────────────────────
        const productSetupChildren = [];
        if (useHasPermission('manage-taxes')) {
            productSetupChildren.push({ title: translate('Taxes'), href: route('taxes.index') });
        }
        if (useHasPermission('manage-brands')) {
            productSetupChildren.push({ title: translate('Brands'), href: route('brands.index') });
        }
        if (useHasPermission('manage-categories')) {
            productSetupChildren.push({ title: translate('Categories'), href: route('categories.index') });
        }
        if (useHasPermission('manage-products')) {
            items.push({ title: translate('Products'), href: route('products.index'), icon: ShoppingBag, group: translate('Catalog') });
        }
        if (productSetupChildren.length > 0) {
            items.push({ title: translate('Product Setup'), icon: Package, group: translate('Catalog'), children: productSetupChildren });
        }

        // ── 6. Collaboration ─────────────────────────────────────────
        if (useHasPermission('manage-meetings')) {
            items.push({ title: translate('Meetings'), href: route('meetings.index'), icon: CalendarDays, group: translate('Collaboration') });
        }

        if (useHasPermission('manage-calls')) {
            items.push({ title: translate('Calls'), href: route('calls.index'), icon: Phone, group: translate('Collaboration') });
        }

        if (useHasPermission('manage-stream')) {
            items.push({ title: translate('Streams'), href: route('stream.index'), icon: Activity, group: translate('Collaboration') });
        }

        if (useHasPermission('manage-notes')) {
            items.push({ title: translate('Notes'), href: route('notes.index'), icon: NotebookPen, group: translate('Collaboration') });
        }

        const announcementChildren = [];
        if (useHasPermission('manage-announcements')) {
            announcementChildren.push({ title: translate('Announcements'), href: route('announcements.index') });
        }
        if (useHasPermission('manage-announcement-categories')) {
            announcementChildren.push({ title: translate('Categories'), href: route('announcement-categories.index') });
        }
        if (announcementChildren.length > 0) {
            items.push({ title: translate('Announcements'), icon: MegaphoneIcon, group: translate('Collaboration'), children: announcementChildren });
        }

        // ── 7. Projects ──────────────────────────────────────────────
        const projectChildren = [];
        if (useHasPermission('manage-projects')) {
            projectChildren.push({ title: translate('Projects'), href: route('projects.index') });
        }
        if (useHasPermission('manage-project-tasks')) {
            projectChildren.push({ title: translate('Project Tasks'), href: route('project-tasks.index') });
        }
        if (useHasPermission('manage-task-statuses')) {
            projectChildren.push({ title: translate('Task Status'), href: route('task-statuses.index') });
        }
        if (projectChildren.length > 0) {
            items.push({ title: translate('Project Management'), icon: Briefcase, group: translate('Projects'), children: projectChildren });
        }

        // ── 8. Documents ─────────────────────────────────────────────
        const documentChildren = [];
        if (useHasPermission('manage-documents')) {
            documentChildren.push({ title: translate('Documents'), href: route('documents.index') });
        }
        if (useHasPermission('manage-document-types')) {
            documentChildren.push({ title: translate('Types'), href: route('document-types.index') });
        }
        if (documentChildren.length > 0) {
            items.push({ title: translate('Document Management'), icon: Folder, group: translate('Documents'), children: documentChildren });
        }

        if (useHasPermission('manage-media')) {
            items.push({ title: translate('Media Library'), href: route('media-library'), icon: Image, group: translate('Documents') });
        }

        // ── 9. System Control ────────────────────────────────────────
        const staffChildren = [];
        if (useHasPermission('manage-users')) {
            staffChildren.push({ title: translate('Users'), href: route('users.index') });
        }
        if (useHasPermission('manage-roles')) {
            staffChildren.push({ title: translate('Roles'), href: route('roles.index') });
        }
        if (staffChildren.length > 0) {
            items.push({ title: translate('Staff'), icon: Users, group: translate('System Control'), children: staffChildren });
        }

        const planChildren = [];
        if (useHasPermission('manage-plans')) {
            planChildren.push({ title: translate('Plans'), href: route('plans.index') });
        }
        if (useHasPermission('manage-plan-requests')) {
            planChildren.push({ title: translate('Plan Requests'), href: route('plan-requests.index') });
        }
        if (useHasPermission('manage-plan-orders')) {
            planChildren.push({ title: translate('Plan Orders'), href: route('plan-orders.index') });
        }
        if (planChildren.length > 0) {
            items.push({ title: translate('Plans'), icon: CreditCard, group: translate('System Control'), children: planChildren });
        }

        if (useHasPermission('manage-referral')) {
            items.push({ title: translate('Referral Program'), href: route('referral.index'), icon: Gift, group: translate('System Control') });
        }

        if (useHasPermission('manage-notification-templates')) {
            items.push({ title: translate('Notification Templates'), href: route('notification-templates.index'), icon: Mail, group: translate('System Control') });
        }

        if (useHasPermission('manage-settings')) {
            items.push({ title: translate('Settings'), href: route('settings'), icon: Settings, group: translate('System Control') });
        }

        return items;
    };

    const mainNavItems = userRole === 'super_admin' ? getSuperAdminNavItems() : getOrganizationNavItems();

    const { position, effectivePosition } = useLayout();
    const { variant, collapsible, style } = useSidebarSettings();
    const { logoLight, logoDark, favicon, updateBrandSettings } = useBrand();
    const [sidebarStyle, setSidebarStyle] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Apply styles based on sidebar style
        if (style === 'colored') {
            setSidebarStyle({ backgroundColor: 'var(--primary)', color: 'white' });
        } else if (style === 'gradient') {
            setSidebarStyle({
                background: 'linear-gradient(to bottom, var(--primary), color-mix(in srgb, var(--primary), transparent 20%))',
                color: 'white',
            });
        } else {
            setSidebarStyle({});
        }
    }, [style]);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handler);

        return () => {
            document.removeEventListener('mousedown', handler);
        };
    }, []);

    const filterNavItems = (items: NavItem[], query: string): NavItem[] => {
        if (!query.trim()) return items;
        const q = query.toLowerCase();
        const result: NavItem[] = [];
        items.forEach((item) => {
            if (item.children) {
                const matchedChildren = item.children.filter((child) => child.title.toLowerCase().includes(q));
                if (item.title.toLowerCase().includes(q)) {
                    result.push(item);
                } else if (matchedChildren.length > 0) {
                    result.push({ ...item, children: matchedChildren, defaultOpen: true });
                }
            } else {
                if (item.title.toLowerCase().includes(q)) {
                    result.push(item);
                }
            }
        });
        return result;
    };

    const filteredNavItems = filterNavItems(mainNavItems, searchQuery);

    // Get the first available menu item's href for logo link
    const getFirstAvailableHref = () => {
        if (filteredNavItems.length === 0) return route('dashboard');

        const firstItem = filteredNavItems[0];
        if (firstItem.href) {
            return firstItem.href;
        } else if (firstItem.children && firstItem.children.length > 0) {
            return firstItem.children[0].href || route('dashboard');
        }
        return route('dashboard');
    };

    return (
        <Sidebar side={effectivePosition} collapsible={collapsible} variant={variant} className={style !== 'plain' ? 'sidebar-custom-style' : ''}>
            <SidebarHeader className={style !== 'plain' ? 'sidebar-styled' : ''} style={sidebarStyle}>
                <div className="flex items-center justify-center p-2">
                    <Link href={getFirstAvailableHref()} prefetch className="flex items-center justify-center">
                        {/* Logo for expanded sidebar */}
                        <div className="flex items-center group-data-[collapsible=icon]:hidden">
                            {(() => {
                                const isDark = document.documentElement.classList.contains('dark');
                                const currentLogo = isDark ? logoLight : logoDark;
                                const displayUrl = getDisplayUrl(currentLogo) ?? currentLogo;

                                return displayUrl ? (
                                    <img
                                        key={`${currentLogo}-${Date.now()}`}
                                        src={displayUrl}
                                        alt="Logo"
                                        className="w-auto transition-all duration-200"
                                        onError={() => updateBrandSettings({ [isDark ? 'logoLight' : 'logoDark']: '' })}
                                    />
                                ) : (
                                    <div className="flex h-12 items-center text-lg font-semibold tracking-tight text-inherit">Kakbima</div>
                                );
                            })()}
                        </div>

                        {/* Icon for collapsed sidebar */}
                        <div className="hidden h-8 w-8 group-data-[collapsible=icon]:block">
                            {(() => {
                                const displayFavicon = favicon ? getDisplayUrl(favicon) : '';

                                return displayFavicon ? (
                                    <img
                                        key={`${favicon}-${Date.now()}`}
                                        src={displayFavicon}
                                        alt="Icon"
                                        className="h-8 w-8 transition-all duration-200"
                                        onError={() => updateBrandSettings({ favicon: '' })}
                                    />
                                ) : (
                                    <div className="bg-primary flex h-8 w-8 items-center justify-center rounded font-bold text-white shadow-sm">
                                        W
                                    </div>
                                );
                            })()}
                        </div>
                    </Link>
                </div>

                {/* Search Input */}
                <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
                    <div className="relative">
                        <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={translate('Search menu...')}
                            className="focus:border-primary focus:ring-primary w-full rounded-md border-1 border-gray-300 bg-gray-50 py-1.5 pr-7 pl-8 text-sm text-gray-700 placeholder-gray-400 transition-all outline-none focus:ring-1 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Business Switcher removed */}
            </SidebarHeader>

            <SidebarContent style={sidebarStyle} className={`h-full ${style !== 'plain' ? 'sidebar-styled' : ''}`}>
                <NavMain searchQuery={searchQuery} items={filteredNavItems} position={effectivePosition} />
            </SidebarContent>

            <SidebarFooter className={userRole === 'organization' ? 'border-t' : ''}>
                {userRole === 'organization' &&
                    (() => {
                        const user = auth.user;
                        const plan = user?.plan;

                        const isActive = user?.is_plan_active === 1;
                        const isTrial = user?.is_trial == 1;

                        const expiryDate = isTrial ? user?.trial_expiry_date : user?.plan_expiry_date || globalSettings?.planExirationDate;

                        const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

                        const isExpired = daysLeft == null || daysLeft <= 0;

                        let subText = '';

                        if (isExpired) {
                            subText = translate('Plan expired');
                        } else if (!plan) {
                            subText = translate('No Plan');
                        } else if (isTrial) {
                            subText = daysLeft !== null ? translate('Trial · {{n}} days left', { n: daysLeft }) : translate('Trial');
                        } else if (daysLeft !== null && daysLeft <= 7) {
                            subText = translate('Expires in {{n}} days', { n: daysLeft });
                        } else {
                            subText = plan.name;
                        }

                        return (
                            <div ref={userMenuRef} className="relative group-data-[collapsible=icon]:hidden">
                                {/* Popup panel — expands above */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 bottom-full left-0 z-50 mb-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                        {/* User info row */}
                                        <Link
                                            href={route('profile')}
                                            onClick={() => setUserMenuOpen(false)}
                                            className="flex items-center gap-3 border-b border-gray-100 px-3 py-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
                                        >
                                            <div className="relative shrink-0">
                                                {user?.avatar ? (
                                                    <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover" />
                                                ) : (
                                                    <div className="bg-primary line-clamp-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white">
                                                        {user?.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1 text-left">
                                                <p className="line-clamp-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                    {user?.name}
                                                </p>
                                                <p className="line-clamp-1 truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                                        </Link>

                                        {/* Actions */}
                                        <div className="py-1">
                                            <Link
                                                href={route('referral.index')}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <Gift className="h-4 w-4 text-gray-400" />
                                                {translate('Referral Program')}
                                            </Link>

                                            <Link
                                                href={route('plans.index')}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <CreditCard className="h-4 w-4 text-gray-400" />
                                                {translate('Plans')}
                                            </Link>

                                            <Link
                                                href={route('settings')}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <Settings className="h-4 w-4 text-gray-400" />
                                                {translate('Settings')}
                                            </Link>
                                        </div>

                                        <div className="border-t border-gray-100 py-1 dark:border-gray-800">
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <LogOut className="h-4 w-4 text-gray-400" />
                                                {translate('Log out')}
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Trigger card */}
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((v) => !v)}
                                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-black/10 px-3 py-2.5 transition-colors dark:bg-white/10"
                                >
                                    <div className="shrink-0">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white">
                                                {user?.name?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1 text-left">
                                        <p className="text-sidebar-foreground line-clamp-1 truncate text-sm font-medium">{user?.name}</p>

                                        <p
                                            className={`line-clamp-1 truncate text-xs ${
                                                isExpired
                                                    ? 'text-red-400'
                                                    : daysLeft !== null && daysLeft <= 7
                                                      ? 'text-orange-500'
                                                      : 'text-sidebar-foreground/60'
                                            }`}
                                        >
                                            {subText}
                                        </p>
                                    </div>

                                    <Link
                                        href={route('plans.index')}
                                        onClick={(e) => e.stopPropagation()}
                                        className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 hover:bg-gray-100 hover:!text-gray-900"
                                    >
                                        {isExpired || !isActive ? translate('Renew') : translate('Upgrade')}
                                    </Link>
                                </button>
                            </div>
                        );
                    })()}
            </SidebarFooter>
        </Sidebar>
    );
}
