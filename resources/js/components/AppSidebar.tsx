import kakbimaIcon from '@images/logos/kakbima_icon.png';
import kakbimaLogoLight from '@images/logos/kakbima_logo.png';
import kakbimaLogoDark from '@images/logos/kakbima_logo_dark.png';

import { type NavItem } from '@/types';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@components/UserInterface/Sidebar';
import { useBrand } from '@contexts/BrandContext';
import { useLayout } from '@contexts/LayoutContext';
import { useSidebar } from '@contexts/SidebarContext';
import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Briefcase,
    Building2,
    Calendar,
    CalendarDays,
    CreditCard,
    CurrencyIcon,
    FileText,
    Folder,
    Gift,
    HandCoins,
    Image,
    LayoutGrid,
    Mail,
    Megaphone,
    NotebookPen,
    Package,
    Phone,
    Settings,
    ShoppingBag,
    TrendingUp,
    Truck,
    Users
} from 'lucide-react';

import NavMain from '@components/NavMain';
import { resolveImageUrl } from '@utils/Helpers/Url';
import { useHasPermission } from '@utils/Permissions';
import { route } from '@utils/Routes';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Application-level sidebar.
 *
 * Navigation is derived entirely from the authenticated user's role and
 * permission set coming from Inertia page props. The structure here is the
 * canonical source of truth for sidebar visibility — if an item is not
 * included here, it is not reachable via primary navigation.
 *
 * Role handling:
 * - `super_admin` receives a fixed, unrestricted navigation tree.
 * - All other roles are permission-driven and composed incrementally.
 *
 * Important invariants:
 * - Sections are only rendered if they contain at least one visible child.
 * - Every permission gate maps directly to a backend permission string.
 *   Changing permission names server-side requires updating them here.
 * - The first visible nav item determines the logo link target.
 *   If no items are available, we fall back to `dashboard`.
 *
 * Branding behavior:
 * - Logo and favicon come from BrandContext with static fallbacks.
 * - Theme (light/dark) is resolved from the `<html>` class.
 * - A MutationObserver keeps branding in sync with runtime theme changes.
 * - On image load failure, we proactively clear the corresponding brand
 *   setting to prevent repeated broken requests across renders.
 *
 * Architectural notes:
 * - This component intentionally centralizes navigation composition instead
 *   of distributing it across feature modules to keep permission reasoning
 *   and ordering deterministic.
 * - `NavMain` receives already-filtered items. It should not perform
 *   permission logic.
 */
export default function AppSidebar() {
    const { t: translate } = useTranslation();
    const { auth } = usePage().props;

    const userRole = auth?.user?.type || auth?.user?.role;

// Permission hooks: keep these at the top level of the component/custom hook.
    const canManageDashboard = useHasPermission('manage-dashboard');
    const canManageUsers = useHasPermission('manage-users');
    const canManageRoles = useHasPermission('manage-roles');
    const canManageMedia = useHasPermission('manage-media');
    const canManagePlans = useHasPermission('manage-plans');
    const canManageSettings = useHasPermission('manage-settings');
    const canManageMeetings = useHasPermission('manage-meetings');
    const canManageCalls = useHasPermission('manage-calls');
    const canManageProjectTasks = useHasPermission('manage-project-tasks');
    const canManageReports = useHasPermission('manage-reports');
    const canManageLeads = useHasPermission('manage-leads');
    const canManageLeadSources = useHasPermission('manage-lead-sources');
    const canManageLeadStatuses = useHasPermission('manage-lead-statuses');
    const canManageContacts = useHasPermission('manage-contacts');
    const canManageAccounts = useHasPermission('manage-accounts');
    const canManageAccountTypes = useHasPermission('manage-account-types');
    const canManageAccountIndustries = useHasPermission('manage-account-industries');
    const canManageCampaigns = useHasPermission('manage-campaigns');
    const canManageTargetLists = useHasPermission('manage-target-lists');
    const canManageCampaignTypes = useHasPermission('manage-campaign-types');
    const canManageCases = useHasPermission('manage-cases');
    const canManageOpportunities = useHasPermission('manage-opportunities');
    const canManageOpportunitySources = useHasPermission('manage-opportunity-sources');
    const canManageOpportunityStages = useHasPermission('manage-opportunity-stages');
    const canManageQuotes = useHasPermission('manage-quotes');
    const canManageSalesOrders = useHasPermission('manage-sales-orders');
    const canManageInvoices = useHasPermission('manage-invoices');
    const canManageReceiptOrders = useHasPermission('manage-receipt-orders');
    const canManageProducts = useHasPermission('manage-products');
    const canManageTaxes = useHasPermission('manage-taxes');
    const canManageBrands = useHasPermission('manage-brands');
    const canManageCategories = useHasPermission('manage-categories');
    const canManagePurchaseOrders = useHasPermission('manage-purchase-orders');
    const canManageDeliveryOrders = useHasPermission('manage-delivery-orders');
    const canManageReturnOrders = useHasPermission('manage-return-orders');
    const canManageShippingProviderTypes = useHasPermission('manage-shipping-provider-types');
    const canManageStream = useHasPermission('manage-stream');
    const canManageNotes = useHasPermission('manage-notes');
    const canManageAnnouncements = useHasPermission('manage-announcements');
    const canManageAnnouncementCategories = useHasPermission('manage-announcement-categories');
    const canManageProjects = useHasPermission('manage-projects');
    const canManageTaskStatuses = useHasPermission('manage-task-statuses');
    const canManageDocuments = useHasPermission('manage-documents');
    const canManageDocumentTypes = useHasPermission('manage-document-types');
    const canManagePlanRequests = useHasPermission('manage-plan-requests');
    const canManagePlanOrders = useHasPermission('manage-plan-orders');
    const canManageReferral = useHasPermission('manage-referral');
    const canManageNotificationTemplates = useHasPermission('manage-notification-templates');

    const getSuperAdminNavItems = (): NavItem[] => [
        {
            title: translate('Dashboard'),
            href: route('dashboard.index'),
            icon: LayoutGrid
        },
        {
            title: translate('Organizations'),
            href: route('organizations.index'),
            icon: Building2
        },
        {
            title: translate('Subscriptions'),
            icon: CreditCard,
            children: [
                {
                    title: translate('Plans'),
                    href: route('subscriptions.plans.index')
                },
                {
                    title: translate('Requests'),
                    href: route('subscriptions.plan-requests.index')
                },
                {
                    title: translate('Orders'),
                    href: route('subscriptions.plan-orders.index')
                }
            ]
        },
        {
            title: translate('Referral program'),
            href: route('referral-program.index'),
            icon: Gift
        },
        {
            title: translate('Discounts'),
            href: route('discounts.index'),
            icon: HandCoins
        },
        {
            title: translate('Currencies'),
            href: route('currencies.index'),
            icon: CurrencyIcon
        },
        // {
        //     title: translate('Email templates'),
        //     href: route('email-templates.index'),
        //     icon: Mail,
        // },
        {
            title: translate('Media'),
            href: route('media-library.media.index'),
            icon: Image
        },
        {
            title: translate('Settings'),
            href: route('settings.index'),
            icon: Settings
        }
    ];


    const getOrganizationNavItems = (): NavItem[] => {
        const items: NavItem[] = [];

// 1. Overview
        if (canManageDashboard) {
            items.push({
                title: translate('Dashboard'),
                href: route('dashboard.index'),
                icon: LayoutGrid,
                group: translate('Overview')
            });
        }

        if (
            canManageMeetings ||
            canManageCalls ||
            canManageProjectTasks
        ) {
            items.push({
                title: translate('Calendar'),
                href: route('calendar.index'),
                icon: Calendar,
                group: translate('Overview')
            });
        }

        if (canManageReports) {
            items.push({
                title: translate('Reports & Analytics'),
                icon: TrendingUp,
                group: translate('Overview'),
                children: [
                    { title: translate('Lead Reports'), href: route('reports.leads') },
                    { title: translate('Sales Reports'), href: route('reports.sales') },
                    { title: translate('Product Reports'), href: route('reports.product-reports') },
                    { title: translate('Contact Reports'), href: route('reports.customers') },
                    { title: translate('Project Reports'), href: route('reports.projects') }
                ]
            });
        }

// 2. Customers & Relationships

// Leads
        const leadChildren = [];

        if (canManageLeads) {
            leadChildren.push({
                title: translate('Leads'),
                href: route('leads.index')
            });
        }

        if (canManageLeadSources) {
            leadChildren.push({
                title: translate('Lead Sources'),
                href: route('lead-sources.index')
            });
        }

        if (canManageLeadStatuses) {
            leadChildren.push({
                title: translate('Lead Statuses'),
                href: route('lead-statuses.index')
            });
        }

        if (leadChildren.length > 0) {
            items.push({
                title: translate('Leads'),
                icon: Users,
                group: translate('Customers & Relationships'),
                children: leadChildren
            });
        }

// Contacts
        if (canManageContacts) {
            items.push({
                title: translate('Contacts'),
                href: route('contacts.index'),
                icon: Users,
                group: translate('Customers & Relationships')
            });
        }

// Accounts
        const accountChildren = [];

        if (canManageAccounts) {
            accountChildren.push({
                title: translate('Accounts'),
                href: route('accounts.index')
            });
        }

        if (canManageAccountTypes) {
            accountChildren.push({
                title: translate('Account Types'),
                href: route('account-types.index')
            });
        }

        if (canManageAccountIndustries) {
            accountChildren.push({
                title: translate('Account Industries'),
                href: route('account-industries.index')
            });
        }

        if (accountChildren.length > 0) {
            items.push({
                title: translate('Accounts'),
                icon: Building2,
                group: translate('Customers & Relationships'),
                children: accountChildren
            });
        }

// Campaigns
        const campaignChildren = [];

        if (canManageCampaigns) {
            campaignChildren.push({
                title: translate('Campaigns'),
                href: route('campaigns.index')
            });
        }

        if (canManageTargetLists) {
            campaignChildren.push({
                title: translate('Target Lists'),
                href: route('target-lists.index')
            });
        }

        if (canManageCampaignTypes) {
            campaignChildren.push({
                title: translate('Campaign Types'),
                href: route('campaign-types.index')
            });
        }

        if (campaignChildren.length > 0) {
            items.push({
                title: translate('Campaigns'),
                icon: Megaphone,
                group: translate('Customers & Relationships'),
                children: campaignChildren
            });
        }

// Customer cases
        if (canManageCases) {
            items.push({
                title: translate('Cases & Support'),
                href: route('cases.index'),
                icon: FileText,
                group: translate('Customers & Relationships')
            });
        }

// 3. Sales & Quotations

// Opportunities
        const opportunityChildren = [];

        if (canManageOpportunities) {
            opportunityChildren.push({
                title: translate('Opportunities'),
                href: route('opportunities.index')
            });
        }

        if (canManageOpportunitySources) {
            opportunityChildren.push({
                title: translate('Opportunity Sources'),
                href: route('opportunity-sources.index')
            });
        }

        if (canManageOpportunityStages) {
            opportunityChildren.push({
                title: translate('Opportunity Stages'),
                href: route('opportunity-stages.index')
            });
        }

        if (opportunityChildren.length > 0) {
            items.push({
                title: translate('Opportunities'),
                icon: TrendingUp,
                group: translate('Sales'),
                children: opportunityChildren
            });
        }

// Quotations
        if (canManageQuotes) {
            items.push({
                title: translate('Quotations'),
                href: route('quotes.index'),
                icon: FileText,
                group: translate('Sales')
            });
        }

// Sales orders
        if (canManageSalesOrders) {
            items.push({
                title: translate('Sales Orders'),
                href: route('sales-orders.index'),
                icon: ShoppingBag,
                group: translate('Sales')
            });
        }

// Invoices
        if (canManageInvoices) {
            items.push({
                title: translate('Invoices'),
                href: route('invoices.index'),
                icon: FileText,
                group: translate('Sales')
            });
        }

// Payments and receipts
        if (canManageReceiptOrders) {
            items.push({
                title: translate('Receipts'),
                href: route('receipt-orders.index'),
                icon: FileText,
                group: translate('Sales')
            });
        }

// Insurance Operations: Policies
//
// FUTURE MODULES — enable these when the screens, routes, and permissions exist.
// Keep these as comments for now so the navigation does not point to unavailable routes.
//
// Policies:
// if (canManagePolicies) {
//     items.push({
//         title: translate('Policies'),
//         href: route('policies.index'),
//         icon: ShieldCheck,
//         group: translate('Insurance Operations')
//     });
// }
//
// Policy issuance:
// if (canManagePolicyIssuance) {
//     items.push({
//         title: translate('Policy Issuance'),
//         href: route('policy-issuance.index'),
//         icon: FileCheck,
//         group: translate('Insurance Operations')
//     });
// }
//
// Renewals:
// if (canManageRenewals) {
//     items.push({
//         title: translate('Renewals'),
//         href: route('renewals.index'),
//         icon: RefreshCw,
//         group: translate('Insurance Operations')
//     });
// }
//
// Endorsements and amendments:
// if (canManagePolicyEndorsements) {
//     items.push({
//         title: translate('Endorsements & Amendments'),
//         href: route('policy-endorsements.index'),
//         icon: FileEdit,
//         group: translate('Insurance Operations')
//     });
// }
//
// Cancellations:
// if (canManagePolicyCancellations) {
//     items.push({
//         title: translate('Cancellations'),
//         href: route('policy-cancellations.index'),
//         icon: FileX,
//         group: translate('Insurance Operations')
//     });
// }

// Insurance Operations: Claims
//
// FUTURE MODULE — uncomment when the claims screen, route, and permission exist.
//
// if (canManageClaims) {
//     items.push({
//         title: translate('Claims'),
//         href: route('claims.index'),
//         icon: ClipboardList,
//         group: translate('Insurance Operations')
//     });
// }

// 6. Insurance Products & Distribution

// Insurance product catalogue
        if (canManageProducts) {
            items.push({
                title: translate('Product Catalogue'),
                href: route('products.index'),
                icon: Package,
                group: translate('Insurance Operations')
            });
        }

// Product configuration
        const productSetupChildren = [];

        if (canManageTaxes) {
            productSetupChildren.push({
                title: translate('Taxes'),
                href: route('taxes.index')
            });
        }

        if (canManageBrands) {
            productSetupChildren.push({
                title: translate('Brands'),
                href: route('brands.index')
            });
        }

        if (canManageCategories) {
            productSetupChildren.push({
                title: translate('Product Categories'),
                href: route('categories.index')
            });
        }

        if (productSetupChildren.length > 0) {
            items.push({
                title: translate('Product Setup'),
                icon: Settings,
                group: translate('Insurance Operations'),
                children: productSetupChildren
            });
        }

// FUTURE MODULES — add each entry when its screen, route, and permission exist.
//
// Insurance Providers:
// if (canManageInsuranceProviders) {
//     items.push({
//         title: translate('Insurance Providers'),
//         href: route('insurance-providers.index'),
//         icon: Building2,
//         group: translate('Insurance Operations')
//     });
// }
//
// Product Listings & Availability:
// if (canManageProductListings) {
//     items.push({
//         title: translate('Product Listings & Availability'),
//         href: route('product-listings.index'),
//         icon: Package,
//         group: translate('Insurance Operations')
//     });
// }
//
// Distribution Channels:
// if (canManageDistributionChannels) {
//     items.push({
//         title: translate('Distribution Channels'),
//         href: route('distribution-channels.index'),
//         icon: Network,
//         group: translate('Insurance Operations')
//     });
// }
//
// Partners & Integrations:
// if (canManagePartnersIntegrations) {
//     items.push({
//         title: translate('Partners & Integrations'),
//         href: route('partners-integrations.index'),
//         icon: Plug,
//         group: translate('Insurance Operations')
//     });
// }

// 7. Fulfillment & Document Delivery

// Existing purchase orders retained for physical fulfillment.
        if (canManagePurchaseOrders) {
            items.push({
                title: translate('Fulfillment Orders'),
                href: route('purchase-orders.index'),
                icon: ShoppingBag,
                group: translate('Fulfillment & Document Delivery')
            });
        }

        if (canManageDeliveryOrders) {
            items.push({
                title: translate('Delivery Orders'),
                href: route('delivery-orders.index'),
                icon: Truck,
                group: translate('Fulfillment & Document Delivery')
            });
        }

        if (canManageReturnOrders) {
            items.push({
                title: translate('Returns & Undelivered Items'),
                href: route('return-orders.index'),
                icon: Package,
                group: translate('Fulfillment & Document Delivery')
            });
        }

        if (canManageShippingProviderTypes) {
            items.push({
                title: translate('Shipping Providers'),
                href: route('shipping-provider-types.index'),
                icon: Truck,
                group: translate('Fulfillment & Document Delivery')
            });
        }

// FUTURE MODULES — these can initially be views within Delivery Orders,
// or become separate navigation entries if they need their own screens.
//
// Document Dispatch:
// if (canManageDocumentDispatch) {
//     items.push({
//         title: translate('Document Dispatch'),
//         href: route('document-dispatch.index'),
//         icon: FileCheck,
//         group: translate('Fulfillment & Document Delivery')
//     });
// }
//
// Delivery Tracking:
// if (canManageDeliveryTracking) {
//     items.push({
//         title: translate('Delivery Tracking'),
//         href: route('delivery-tracking.index'),
//         icon: Truck,
//         group: translate('Fulfillment & Document Delivery')
//     });
// }

// Insurance Operations: Commissions
//
// FUTURE MODULES — uncomment each entry when its screen, route, and permission exist.
//
// Commissions:
// if (canManageCommissions) {
//     items.push({
//         title: translate('Commissions'),
//         href: route('commissions.index'),
//         icon: Wallet,
//         group: translate('Insurance Operations')
//     });
// }
//
// Commission Rules:
// if (canManageCommissionRules) {
//     items.push({
//         title: translate('Commission Rules'),
//         href: route('commission-rules.index'),
//         icon: Settings,
//         group: translate('Insurance Operations')
//     });
// }
//
// Commission Statements:
// if (canManageCommissionStatements) {
//     items.push({
//         title: translate('Commission Statements'),
//         href: route('commission-statements.index'),
//         icon: FileText,
//         group: translate('Insurance Operations')
//     });
// }
//
// Reconciliation:
// if (canManageCommissionReconciliation) {
//     items.push({
//         title: translate('Reconciliation'),
//         href: route('commission-reconciliation.index'),
//         icon: ClipboardList,
//         group: translate('Insurance Operations')
//     });
// }
//
// Add the matching useHasPermission(...) calls at the top level of the component
// when enabling any future entry. Confirm the route names against your actual routes.

// 9. Team & Collaboration

// Meetings
        if (canManageMeetings) {
            items.push({
                title: translate('Meetings'),
                href: route('meetings.index'),
                icon: CalendarDays,
                group: translate('Team & Collaboration')
            });
        }

// Calls
        if (canManageCalls) {
            items.push({
                title: translate('Calls'),
                href: route('calls.index'),
                icon: Phone,
                group: translate('Team & Collaboration')
            });
        }

// Team activity stream
        if (canManageStream) {
            items.push({
                title: translate('Streams'),
                href: route('stream.index'),
                icon: Activity,
                group: translate('Team & Collaboration')
            });
        }

// Notes
        if (canManageNotes) {
            items.push({
                title: translate('Notes'),
                href: route('notes.index'),
                icon: NotebookPen,
                group: translate('Team & Collaboration')
            });
        }

// Announcements
        const announcementChildren = [];

        if (canManageAnnouncements) {
            announcementChildren.push({
                title: translate('Announcements'),
                href: route('announcements.index')
            });
        }

        if (canManageAnnouncementCategories) {
            announcementChildren.push({
                title: translate('Categories'),
                href: route('announcement-categories.index')
            });
        }

        if (announcementChildren.length > 0) {
            items.push({
                title: translate('Announcements'),
                icon: Megaphone,
                group: translate('Team & Collaboration'),
                children: announcementChildren
            });
        }

// Tasks and projects
        const projectChildren = [];

        if (canManageProjects) {
            projectChildren.push({
                title: translate('Projects'),
                href: route('projects.index')
            });
        }

        if (canManageProjectTasks) {
            projectChildren.push({
                title: translate('Tasks'),
                href: route('project-tasks.index')
            });
        }

        if (canManageTaskStatuses) {
            projectChildren.push({
                title: translate('Task Statuses'),
                href: route('task-statuses.index')
            });
        }

        if (projectChildren.length > 0) {
            items.push({
                title: translate('Tasks & Projects'),
                icon: Briefcase,
                group: translate('Team & Collaboration'),
                children: projectChildren
            });
        }

// Documents
        const documentChildren = [];

        if (canManageDocuments) {
            documentChildren.push({
                title: translate('Documents'),
                href: route('documents.index')
            });
        }

        if (canManageDocumentTypes) {
            documentChildren.push({
                title: translate('Document Types'),
                href: route('document-types.index')
            });
        }

        if (documentChildren.length > 0) {
            items.push({
                title: translate('Documents'),
                icon: Folder,
                group: translate('Team & Collaboration'),
                children: documentChildren
            });
        }

        if (canManageMedia) {
            items.push({
                title: translate('Media Library'),
                href: route('media-library.media.index'),
                icon: Image,
                group: translate('Team & Collaboration')
            });
        }

// 10. Administration

// Users and roles
        const staffChildren = [];

        if (canManageUsers) {
            staffChildren.push({
                title: translate('Users'),
                href: route('users-permissions.users.index')
            });
        }

        if (canManageRoles) {
            staffChildren.push({
                title: translate('Roles & Permissions'),
                href: route('users-permissions.roles.index')
            });
        }

        if (staffChildren.length > 0) {
            items.push({
                title: translate('Users & Access'),
                icon: Users,
                group: translate('Administration'),
                children: staffChildren
            });
        }

// Platform subscription plans
        const planChildren = [];

        if (canManagePlans) {
            planChildren.push({
                title: translate('Subscription Plans'),
                href: route('subscriptions.plans.index')
            });
        }

        if (canManagePlanRequests) {
            planChildren.push({
                title: translate('Plan Requests'),
                href: route('subscriptions.plan-requests.index')
            });
        }

        if (canManagePlanOrders) {
            planChildren.push({
                title: translate('Plan Orders'),
                href: route('subscriptions.plan-orders.index')
            });
        }

        if (planChildren.length > 0) {
            items.push({
                title: translate('Subscription Plans'),
                icon: CreditCard,
                group: translate('Administration'),
                children: planChildren
            });
        }

// Referral programme
        if (canManageReferral) {
            items.push({
                title: translate('Referral Programme'),
                href: route('referral.index'),
                icon: Gift,
                group: translate('Administration')
            });
        }

// Notification templates
        if (canManageNotificationTemplates) {
            items.push({
                title: translate('Notification Templates'),
                href: route('notification-templates.index'),
                icon: Mail,
                group: translate('Administration')
            });
        }

// General settings
        if (canManageSettings) {
            items.push({
                title: translate('Settings'),
                href: route('settings.index'),
                icon: Settings,
                group: translate('Administration')
            });
        }

        // Turn the existing flat, permission-filtered items into focused submenus.
        // Keep `group` as the visual section heading rendered by NavMain.
        const wrapItems = (
            source: NavItem[],
            section: string,
            parentTitle: string,
            childTitles: string[],
            icon: NavItem['icon']
        ): NavItem[] => {
            const matching = source.filter((item) => item.group === section && childTitles.includes(item.title));

            // Avoid adding a submenu for a single item; direct links are quicker to reach.
            if (matching.length < 2) return source;

            const firstIndex = source.findIndex((item) => matching.includes(item));
            const remaining = source.filter((item) => !matching.includes(item));
            const insertIndex = source.slice(0, firstIndex).filter((item) => !matching.includes(item)).length;
            remaining.splice(insertIndex, 0, {
                title: parentTitle,
                icon,
                group: section,
                children: matching.map(({ group: _group, ...item }) => item)
            });

            return remaining;
        };

        let navigation = [...items];

        // Sales: group order and billing records together.
        navigation = wrapItems(
            navigation,
            translate('Sales'),
            translate('Order & Billing Management'),
            [translate('Sales Orders'), translate('Invoices'), translate('Receipts')],
            FileText
        );

        // Insurance: keep product setup separate from policy lifecycle and commissions.
        navigation = wrapItems(
            navigation,
            translate('Insurance Operations'),
            translate('Products & Distribution'),
            [
                translate('Product Catalogue'),
                translate('Product Setup'),
                translate('Insurance Providers'),
                translate('Product Listings & Availability'),
                translate('Distribution Channels'),
                translate('Partners & Integrations')
            ],
            Package
        );
        navigation = wrapItems(
            navigation,
            translate('Insurance Operations'),
            translate('Policy Management'),
            [
                translate('Policies'),
                translate('Policy Issuance'),
                translate('Renewals'),
                translate('Endorsements & Amendments'),
                translate('Cancellations')
            ],
            FileText
        );
        navigation = wrapItems(
            navigation,
            translate('Insurance Operations'),
            translate('Commissions'),
            [
                translate('Commissions'),
                translate('Commission Rules'),
                translate('Commission Statements'),
                translate('Reconciliation')
            ],
            Settings
        );

        // Fulfillment: group delivery exceptions and provider configuration.
        navigation = wrapItems(
            navigation,
            translate('Fulfillment & Document Delivery'),
            translate('Delivery Management'),
            [
                translate('Returns & Undelivered Items'),
                translate('Shipping Providers'),
                translate('Delivery Tracking')
            ],
            Truck
        );

        return navigation;
    };


    const mainNavItems = userRole === 'super_admin' ? getSuperAdminNavItems() : getOrganizationNavItems();

    const { effectivePosition } = useLayout();
    const { variant, collapsible } = useSidebar();
    const { logo_light: logoLight, logo_dark: logoDark, favicon, updateBrandSettings } = useBrand();

    const filteredNavItems = mainNavItems;

    // Get the first available menu item's href for logo link
    const getFirstAvailableHref = () => {
        if (filteredNavItems.length === 0) return route('dashboard.index');

        const firstItem = filteredNavItems[0];
        if (firstItem.href) {
            return firstItem.href;
        } else if (firstItem.children && firstItem.children.length > 0) {
            return firstItem.children[0].href || route('dashboard.index');
        }
        return route('dashboard.index');
    };

    // Determine current theme
    const getCurrentTheme = useCallback(() => {
        if (document.documentElement.classList.contains('dark')) return 'dark';
        return 'light';
    }, []);

    // Resolve logo and favicon based on theme & availability
    const resolveLogo = useCallback(() => {
        const theme = getCurrentTheme();
        if (theme === 'dark') return logoDark || kakbimaLogoDark;
        return logoLight || kakbimaLogoLight;
    }, [logoLight, logoDark, getCurrentTheme]);

    const resolveFavicon = useCallback(() => favicon || kakbimaIcon, [favicon]);

    // Sidebar state
    const [currentLogo, setCurrentLogo] = useState(resolveLogo);
    const [currentFavicon, setCurrentFavicon] = useState(resolveFavicon);

    // Update on theme changes
    useEffect(() => {
        const onThemeChange = () => {
            setCurrentLogo(resolveLogo());
            setCurrentFavicon(resolveFavicon());
        };

        // Observe changes to the <html> class
        const observer = new MutationObserver(onThemeChange);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => {
            observer.disconnect();
        };
    }, [resolveLogo, resolveFavicon]);

    const handleLogoError = useCallback(() => {
        updateBrandSettings({
            [getCurrentTheme() === 'dark' ? 'logoDark' : 'logoLight']: ''
        });
    }, [updateBrandSettings, getCurrentTheme]);

    const handleFaviconError = useCallback(() => {
        updateBrandSettings({ favicon: '' });
    }, [updateBrandSettings]);

    return (
        <Sidebar side={effectivePosition} collapsible={collapsible} variant={variant}>
            <SidebarHeader>
                <div className="flex items-center px-2">
                    <Link href={getFirstAvailableHref()} prefetch>
                        {/* Expanded Sidebar Logo */}
                        <div className="flex h-12 items-center group-data-[collapsible=icon]:hidden">
                            <img
                                src={resolveImageUrl(currentLogo)}
                                alt="Kakbima"
                                className="h-11 w-auto max-w-[180px] transition-all duration-200"
                                onError={handleLogoError}
                            />
                        </div>

                        {/* Collapsed Sidebar Favicon */}
                        <div className="hidden h-8 w-8 group-data-[collapsible=icon]:block">
                            <img
                                src={resolveImageUrl(currentFavicon)}
                                alt="Icon"
                                className="h-8 w-8 transition-all duration-200"
                                onError={handleFaviconError}
                            />
                        </div>
                    </Link>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} position={effectivePosition} />
            </SidebarContent>

            <SidebarFooter />
        </Sidebar>
    );
}
