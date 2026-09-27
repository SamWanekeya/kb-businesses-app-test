<?php

/**
 * Ziggy configuration for client-side Laravel route generation.
 *
 * Routes are exposed through authentication-aware groups so guests receive
 * only the routes required by the public application, while authenticated
 * users receive the routes required by the application interface.
 *
 * Route exposure through Ziggy is not an authorization mechanism. Access to
 * protected routes remains enforced by Laravel authentication and
 * authorization middleware.
 */

return [
    'groups' => [
        'public' => [
            'cookie.*',
            'csp.report',
            'customer-facing.*',
            'initial-locale',
            'storage.*',
            'translations',
            'verify-email-token',
        ],
        'auth' => [
            'account-industries.*',
            'account-types.*',
            'accounts.*',
            'announcement-categories.*',
            'announcements.*',
            'api.*',
            'authenticated.*',
            'brands.*',
            'calendar.*',
            'calls.*',
            'campaign-types.*',
            'campaigns.*',
            'cases.*',
            'categories.*',
            'contacts.*',
            'coupons.*',
            'currencies.*',
            'customer-facing.*',
            'dashboard.*',
            'delivery-orders.*',
            'document-types.*',
            'documents.*',
            'invoices.*',
            'kakbima-intelligence.generate',
            'lead-sources.*',
            'lead-statuses.*',
            'leads.*',
            'media-library.*',
            'meetings.*',
            'my-kakbima-account.*',
            'notes.*',
            'notification-templates.*',
            'on-behalf-of.*',
            'opportunities.*',
            'opportunity-sources.*',
            'opportunity-stages.*',
            'organizations.*',
            'payment.*',
            'permissions.*',
            'products.*',
            'project-tasks.*',
            'projects.*',
            'purchase-orders.*',
            'quotes.*',
            'receipt-orders.*',
            'referral-program.*',
            'reports.*',
            'return-orders.*',
            'sales-orders.*',
            'settings.*',
            'shipping-provider-types.*',
            'sign-in-history.*',
            'stream.*',
            'subscriptions.*',
            'target-lists.*',
            'task-statuses.*',
            'taxes.*',
            'users-permissions.*',
        ],
        'guest' => [
            'account-recovery-mail',
            'account-recovery-request',
            'account-recovery-save',
            'account-recovery-token',
            'sign-in',
            'sign-up',
        ],
    ],
];
