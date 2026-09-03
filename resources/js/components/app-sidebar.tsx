import { NavMain } from '@/components/nav-main';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { useBrand } from '@/contexts/BrandContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useSidebarSettings } from '@/contexts/SidebarContext';
import { type NavItem } from '@/types';
import { hasPermission } from '@/utils/authorization';
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
    Palette,
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
    const { auth, globalSettings } = usePage().props as any;
    const userRole = auth.user?.type || auth.user?.role;
    const permissions = auth?.permissions || [];

    // Get current direction
    const isRtl = document.documentElement.dir === 'rtl';

    // Business switch handler removed

    const getSuperAdminNavItems = (): NavItem[] => [
        {
            title: t('Dashboard'),
            href: route('dashboard'),
            icon: LayoutGrid,
            group: t('Overview'),
        },

        {
            title: t('Organizations'),
            href: route('organizations.index'),
            icon: Briefcase,
            group: t('Management'),
        },
        {
            title: t('Media Library'),
            href: route('media-library'),
            icon: Image,
            group: t('Management'),
        },

        {
            title: t('Plans'),
            icon: CreditCard,
            group: t('Management'),
            children: [
                {
                    title: t('Plans'),
                    href: route('plans.index'),
                },
                {
                    title: t('Plan Request'),
                    href: route('plan-requests.index'),
                },
                {
                    title: t('Plan Orders'),
                    href: route('plan-orders.index'),
                },
            ],
        },
        {
            title: t('Coupons'),
            href: route('coupons.index'),
            icon: TicketPercent,
            group: t('Management'),
        },

        {
            title: t('Currency'),
            href: route('currencies.index'),
            icon: DollarSign,
            group: t('Management'),
        },
        {
            title: t('Referral Program'),
            href: route('referral.index'),
            icon: Gift,
            group: t('Management'),
        },
        {
            title: t('Landing Page'),
            icon: Palette,
            group: t('Management'),
            children: [
                {
                    title: t('Landing Page'),
                    href: route('landing-page'),
                },
                {
                    title: t('Custom Pages'),
                    href: route('landing-page.custom-pages.index'),
                },
                {
                    title: t('Contact Inquiries'),
                    href: route('contact-messages.index'),
                },
                {
                    title: t('Newsletters'),
                    href: route('newsletters.index'),
                },
            ],
        },
        {
            title: t('Email Templates'),
            href: route('email-templates.index'),
            icon: Mail,
            group: t('System Control'),
        },
        {
            title: t('Settings'),
            href: route('settings'),
            icon: Settings,
            group: t('System Control'),
        },
    ];

    const getOrganizationNavItems = (): NavItem[] => {
        const items: NavItem[] = [];

        // ── 1. Overview ──────────────────────────────────────────────
        if (hasPermission(permissions, 'manage-dashboard')) {
            items.push({
                title: t('Dashboard'),
                href: route('dashboard'),
                icon: LayoutGrid,
                group: t('Overview'),
            });
        }

        if (
            hasPermission(permissions, 'manage-meetings') ||
            hasPermission(permissions, 'manage-calls') ||
            hasPermission(permissions, 'manage-project-tasks')
        ) {
            items.push({
                title: t('Calendar'),
                href: route('calendar.index'),
                icon: Calendar,
                group: t('Overview'),
            });
        }

        if (hasPermission(permissions, 'manage-reports')) {
            items.push({
                title: t('Reports'),
                icon: TrendingUp,
                group: t('Overview'),
                children: [
                    { title: t('Lead Reports'), href: route('reports.leads') },
                    { title: t('Sales Reports'), href: route('reports.sales') },
                    { title: t('Product Reports'), href: route('reports.product-reports') },
                    { title: t('Contact Reports'), href: route('reports.customers') },
                    { title: t('Project Reports'), href: route('reports.projects') },
                ],
            });
        }

        // ── 2. CRM ───────────────────────────────────────────────────
        const leadChildren = [];
        if (hasPermission(permissions, 'manage-leads')) {
            leadChildren.push({ title: t('Leads'), href: route('leads.index') });
        }
        if (hasPermission(permissions, 'manage-lead-sources')) {
            leadChildren.push({ title: t('Lead Sources'), href: route('lead-sources.index') });
        }
        if (hasPermission(permissions, 'manage-lead-statuses')) {
            leadChildren.push({ title: t('Lead Status'), href: route('lead-statuses.index') });
        }
        if (leadChildren.length > 0) {
            items.push({ title: t('Lead Management'), icon: Users, group: t('CRM'), children: leadChildren });
        }

        const opportunityChildren = [];
        if (hasPermission(permissions, 'manage-opportunities')) {
            opportunityChildren.push({ title: t('Opportunities'), href: route('opportunities.index') });
        }
        if (hasPermission(permissions, 'manage-opportunity-sources')) {
            opportunityChildren.push({ title: t('Opportunity Sources'), href: route('opportunity-sources.index') });
        }
        if (hasPermission(permissions, 'manage-opportunity-stages')) {
            opportunityChildren.push({ title: t('Opportunity Stages'), href: route('opportunity-stages.index') });
        }
        if (opportunityChildren.length > 0) {
            items.push({ title: t('Opportunity Management'), icon: TrendingUp, group: t('CRM'), children: opportunityChildren });
        }

        const accountChildren = [];
        if (hasPermission(permissions, 'manage-accounts')) {
            accountChildren.push({ title: t('Accounts'), href: route('accounts.index') });
        }
        if (hasPermission(permissions, 'manage-account-types')) {
            accountChildren.push({ title: t('Account Types'), href: route('account-types.index') });
        }
        if (hasPermission(permissions, 'manage-account-industries')) {
            accountChildren.push({ title: t('Account Industries'), href: route('account-industries.index') });
        }
        if (accountChildren.length > 0) {
            items.push({ title: t('Account Management'), icon: Building2, group: t('CRM'), children: accountChildren });
        }

        if (hasPermission(permissions, 'manage-contacts')) {
            items.push({ title: t('Contacts'), href: route('contacts.index'), icon: Users, group: t('CRM') });
        }

        const campaignChildren = [];
        if (hasPermission(permissions, 'manage-campaigns')) {
            campaignChildren.push({ title: t('Campaigns'), href: route('campaigns.index') });
        }
        if (hasPermission(permissions, 'manage-target-lists')) {
            campaignChildren.push({ title: t('Target Lists'), href: route('target-lists.index') });
        }
        if (hasPermission(permissions, 'manage-campaign-types')) {
            campaignChildren.push({ title: t('Campaign Types'), href: route('campaign-types.index') });
        }
        if (campaignChildren.length > 0) {
            items.push({ title: t('Campaign Management'), icon: Megaphone, group: t('CRM'), children: campaignChildren });
        }

        if (hasPermission(permissions, 'manage-cases')) {
            items.push({ title: t('Cases'), href: route('cases.index'), icon: FileText, group: t('CRM') });
        }

        // ── 3. Sales ─────────────────────────────────────────────────
        if (hasPermission(permissions, 'manage-quotes')) {
            items.push({ title: t('Quotes'), href: route('quotes.index'), icon: FileText, group: t('Sales') });
        }

        if (hasPermission(permissions, 'manage-sales-orders')) {
            items.push({ title: t('Sales Orders'), href: route('sales-orders.index'), icon: ShoppingBag, group: t('Sales') });
        }

        if (hasPermission(permissions, 'manage-invoices')) {
            items.push({ title: t('Invoices'), href: route('invoices.index'), icon: FileText, group: t('Sales') });
        }

        if (hasPermission(permissions, 'manage-receipt-orders')) {
            items.push({ title: t('Receipt Orders'), href: route('receipt-orders.index'), icon: FileText, group: t('Sales') });
        }

        // ── 4. Procurement & Fulfillment ─────────────────────────────
        if (hasPermission(permissions, 'manage-purchase-orders')) {
            items.push({
                title: t('Purchase Orders'),
                href: route('purchase-orders.index'),
                icon: ShoppingBag,
                group: t('Procurement & Fulfillment'),
            });
        }

        if (hasPermission(permissions, 'manage-delivery-orders')) {
            items.push({ title: t('Delivery Orders'), href: route('delivery-orders.index'), icon: Ticket, group: t('Procurement & Fulfillment') });
        }

        if (hasPermission(permissions, 'manage-return-orders')) {
            items.push({ title: t('Return Orders'), href: route('return-orders.index'), icon: FileText, group: t('Procurement & Fulfillment') });
        }

        if (hasPermission(permissions, 'manage-shipping-provider-types')) {
            items.push({
                title: t('Shipping Provider Types'),
                href: route('shipping-provider-types.index'),
                icon: Ticket,
                group: t('Procurement & Fulfillment'),
            });
        }

        // ── 5. Catalog ───────────────────────────────────────────────
        const productSetupChildren = [];
        if (hasPermission(permissions, 'manage-taxes')) {
            productSetupChildren.push({ title: t('Taxes'), href: route('taxes.index') });
        }
        if (hasPermission(permissions, 'manage-brands')) {
            productSetupChildren.push({ title: t('Brands'), href: route('brands.index') });
        }
        if (hasPermission(permissions, 'manage-categories')) {
            productSetupChildren.push({ title: t('Categories'), href: route('categories.index') });
        }
        if (hasPermission(permissions, 'manage-products')) {
            items.push({ title: t('Products'), href: route('products.index'), icon: ShoppingBag, group: t('Catalog') });
        }
        if (productSetupChildren.length > 0) {
            items.push({ title: t('Product Setup'), icon: Package, group: t('Catalog'), children: productSetupChildren });
        }

        // ── 6. Collaboration ─────────────────────────────────────────
        if (hasPermission(permissions, 'manage-meetings')) {
            items.push({ title: t('Meetings'), href: route('meetings.index'), icon: CalendarDays, group: t('Collaboration') });
        }

        if (hasPermission(permissions, 'manage-calls')) {
            items.push({ title: t('Calls'), href: route('calls.index'), icon: Phone, group: t('Collaboration') });
        }

        if (hasPermission(permissions, 'manage-stream')) {
            items.push({ title: t('Streams'), href: route('stream.index'), icon: Activity, group: t('Collaboration') });
        }

        if (hasPermission(permissions, 'manage-notes')) {
            items.push({ title: t('Notes'), href: route('notes.index'), icon: NotebookPen, group: t('Collaboration') });
        }

        const announcementChildren = [];
        if (hasPermission(permissions, 'manage-announcements')) {
            announcementChildren.push({ title: t('Announcements'), href: route('announcements.index') });
        }
        if (hasPermission(permissions, 'manage-announcement-categories')) {
            announcementChildren.push({ title: t('Categories'), href: route('announcement-categories.index') });
        }
        if (announcementChildren.length > 0) {
            items.push({ title: t('Announcements'), icon: MegaphoneIcon, group: t('Collaboration'), children: announcementChildren });
        }

        // ── 7. Projects ──────────────────────────────────────────────
        const projectChildren = [];
        if (hasPermission(permissions, 'manage-projects')) {
            projectChildren.push({ title: t('Projects'), href: route('projects.index') });
        }
        if (hasPermission(permissions, 'manage-project-tasks')) {
            projectChildren.push({ title: t('Project Tasks'), href: route('project-tasks.index') });
        }
        if (hasPermission(permissions, 'manage-task-statuses')) {
            projectChildren.push({ title: t('Task Status'), href: route('task-statuses.index') });
        }
        if (projectChildren.length > 0) {
            items.push({ title: t('Project Management'), icon: Briefcase, group: t('Projects'), children: projectChildren });
        }

        // ── 8. Documents ─────────────────────────────────────────────
        const documentChildren = [];
        if (hasPermission(permissions, 'manage-documents')) {
            documentChildren.push({ title: t('Documents'), href: route('documents.index') });
        }
        if (hasPermission(permissions, 'manage-document-types')) {
            documentChildren.push({ title: t('Types'), href: route('document-types.index') });
        }
        if (documentChildren.length > 0) {
            items.push({ title: t('Document Management'), icon: Folder, group: t('Documents'), children: documentChildren });
        }

        if (hasPermission(permissions, 'manage-media')) {
            items.push({ title: t('Media Library'), href: route('media-library'), icon: Image, group: t('Documents') });
        }

        // ── 9. System Control ────────────────────────────────────────
        const staffChildren = [];
        if (hasPermission(permissions, 'manage-users')) {
            staffChildren.push({ title: t('Users'), href: route('users.index') });
        }
        if (hasPermission(permissions, 'manage-roles')) {
            staffChildren.push({ title: t('Roles'), href: route('roles.index') });
        }
        if (staffChildren.length > 0) {
            items.push({ title: t('Staff'), icon: Users, group: t('System Control'), children: staffChildren });
        }

        const planChildren = [];
        if (hasPermission(permissions, 'manage-plans')) {
            planChildren.push({ title: t('Plans'), href: route('plans.index') });
        }
        if (hasPermission(permissions, 'manage-plan-requests')) {
            planChildren.push({ title: t('Plan Requests'), href: route('plan-requests.index') });
        }
        if (hasPermission(permissions, 'manage-plan-orders')) {
            planChildren.push({ title: t('Plan Orders'), href: route('plan-orders.index') });
        }
        if (planChildren.length > 0) {
            items.push({ title: t('Plans'), icon: CreditCard, group: t('System Control'), children: planChildren });
        }

        if (hasPermission(permissions, 'manage-referral')) {
            items.push({ title: t('Referral Program'), href: route('referral.index'), icon: Gift, group: t('System Control') });
        }

        if (hasPermission(permissions, 'manage-notification-templates')) {
            items.push({ title: t('Notification Templates'), href: route('notification-templates.index'), icon: Mail, group: t('System Control') });
        }

        if (hasPermission(permissions, 'manage-settings')) {
            items.push({ title: t('Settings'), href: route('settings'), icon: Settings, group: t('System Control') });
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
                            placeholder={t('Search menu...')}
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
                            subText = t('Plan expired');
                        } else if (!plan) {
                            subText = t('No Plan');
                        } else if (isTrial) {
                            subText = daysLeft !== null ? t('Trial · {{n}} days left', { n: daysLeft }) : t('Trial');
                        } else if (daysLeft !== null && daysLeft <= 7) {
                            subText = t('Expires in {{n}} days', { n: daysLeft });
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
                                                {t('Referral Program')}
                                            </Link>

                                            <Link
                                                href={route('plans.index')}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <CreditCard className="h-4 w-4 text-gray-400" />
                                                {t('Plans')}
                                            </Link>

                                            <Link
                                                href={route('settings')}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                                            >
                                                <Settings className="h-4 w-4 text-gray-400" />
                                                {t('Settings')}
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
                                                {t('Log out')}
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
                                        {isExpired || !isActive ? t('Renew') : t('Upgrade')}
                                    </Link>
                                </button>
                            </div>
                        );
                    })()}
            </SidebarFooter>
        </Sidebar>
    );
}
