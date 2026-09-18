<?php

use App\Http\Controllers\AccountCommentController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AccountIndustryController;
use App\Http\Controllers\AccountTypeController;
use App\Http\Controllers\AnnouncementCategoryController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\BankPaymentController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CallController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\CampaignTypeController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CookieConsentController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeliveryOrderController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DocumentFolderController;
use App\Http\Controllers\DocumentTypeController;
use App\Http\Controllers\GoogleCalendarController;
use App\Http\Controllers\ImpersonateController;
use App\Http\Controllers\InvoiceBankPaymentController;
use App\Http\Controllers\InvoiceCommentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoicePaystackPaymentController;
use App\Http\Controllers\InvoiceReminderController;
use App\Http\Controllers\KakbimaIntelligenceController;
use App\Http\Controllers\LeadCommentController;
use App\Http\Controllers\LeadController;
use App\Http\Controllers\LeadSourceController;
use App\Http\Controllers\LeadStatusController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\MeetingController;
use App\Http\Controllers\NoteController;
use App\Http\Controllers\NotificationTemplateController;
use App\Http\Controllers\OpportunityCommentController;
use App\Http\Controllers\OpportunityController;
use App\Http\Controllers\OpportunitySourceController;
use App\Http\Controllers\OpportunityStageController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PaystackPaymentController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanOrderController;
use App\Http\Controllers\PlanRequestController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectTaskController;
use App\Http\Controllers\PurchaseOrderCommentController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\QuoteCommentController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\ReceiptOrderController;
use App\Http\Controllers\ReferralController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ReturnOrderController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SalesOrderCommentController;
use App\Http\Controllers\SalesOrderController;
use App\Http\Controllers\Settings\SystemSettingsController;
use App\Http\Controllers\ShippingProviderTypeController;
use App\Http\Controllers\SignInHistoryController;
use App\Http\Controllers\StreamController;
use App\Http\Controllers\TargetListController;
use App\Http\Controllers\TaskStatusController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\TranslationController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Temporary solution to run migrations in production
//Route::get('/update-database', function () {
//    Artisan::call('migrate', ['--force' => true]);
//
//    return 'Database migrations updated!';
//});

// Temporary solution update permissions based on new features in production
//Route::get('/update-permissions', function () {
//    Artisan::call('db:seed', ['--class' => 'PermissionSeeder', '--force' => true,]);
//
//    return 'PermissionSeeder executed!';
//});

// Temporary solution to run RoleSeeder
//Route::get('/seed-roles', function () {
//    Artisan::call('db:seed', ['--class' => 'RoleSeeder', '--force' => true,]);
//
//    return 'RoleSeeder executed!';
//});

// Temporary solution to clear and rebuild the cache for permissions and roles
//Route::get('/reset-permission-cache', function () {
//    app()->make(PermissionRegistrar::class)->forgetCachedPermissions();
//
//    return 'Permission cache reset!';
//});

Route::get('/', function () {
    return redirect()->route('dashboard.index');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

// Public payment provider webhooks and callbacks.
// These endpoints remain outside the authenticated application boundary for external provider notifications.
//Route::post('cashfree/webhook', [CashfreeController::class, 'webhook'])->name('cashfree.webhook');
//
// Public payment provider webhooks and callbacks.
//Route::post('benefit/webhook', [BenefitPaymentController::class, 'webhook'])->name('benefit.webhook');
//Route::get('subscriptions/payments/benefit/success', [BenefitPaymentController::class, 'success'])->name('benefit.success');
//Route::post('subscriptions/payments/benefit/callback', [BenefitPaymentController::class, 'callback'])->name('benefit.callback');
//
// Public payment provider webhooks and callbacks.
//Route::match(['GET', 'POST'], 'subscriptions/payments/fedapay/callback', [FedaPayPaymentController::class, 'callback'])->name('fedapay.callback');
//
// Public payment provider webhooks and callbacks.
//Route::get('subscriptions/payments/yookassa/success', [YooKassaPaymentController::class, 'success'])->name('yookassa.success');
//Route::post('subscriptions/payments/yookassa/callback', [YooKassaPaymentController::class, 'callback'])->name('yookassa.callback');
//
// Public payment provider webhooks and callbacks.
//Route::get('subscriptions/payments/nepalste/success', [NepalstePaymentController::class, 'success'])->name('nepalste.success');
//Route::post('subscriptions/payments/nepalste/callback', [NepalstePaymentController::class, 'callback'])->name('nepalste.callback');
//
// Public payment provider webhooks and callbacks.
//Route::post('subscriptions/payments/paytr/callback', [PayTRPaymentController::class, 'callback'])->name('paytr.callback');
//
// Public payment provider webhooks and callbacks.
//Route::match(['GET', 'POST'], 'subscriptions/payments/paytabs/callback', [PayTabsPaymentController::class, 'callback'])->name('paytabs.callback');
//Route::get('subscriptions/payments/paytabs/success', [PayTabsPaymentController::class, 'success'])->name('paytabs.success');
//
// Public payment provider webhooks and callbacks.
//Route::get('subscriptions/payments/tap/success', [TapPaymentController::class, 'success'])->name('tap.success');
//Route::post('subscriptions/payments/tap/callback', [TapPaymentController::class, 'callback'])->name('tap.callback');
//
// Public payment provider webhooks and callbacks.
//Route::match(['GET', 'POST'], 'subscriptions/payments/aamarpay/success', [AamarpayPaymentController::class, 'success'])->name('aamarpay.success');
//Route::post('subscriptions/payments/aamarpay/callback', [AamarpayPaymentController::class, 'callback'])->name('aamarpay.callback');
//
// Public payment provider webhooks and callbacks.
//Route::post('subscriptions/payments/iyzipay/callback', [IyzipayPaymentController::class, 'callback'])->name('iyzipay.callback');
//Route::match(['GET', 'POST'], 'subscriptions/payments/iyzipay/success', [IyzipayPaymentController::class, 'success'])->name('iyzipay.success');
//
// Public invoice payment provider callbacks.
//Route::match(['GET', 'POST'], 'invoices/payment/iyzipay/callback', [InvoiceIyzipayPaymentController::class, 'callback'])->name('customer-facing.invoice.iyzipay.callback')->withoutMiddleware(VerifyCsrfToken::class);
//
// Public payment provider webhooks and callbacks.
//Route::get('subscriptions/payments/payfast/success', [PayfastPaymentController::class, 'success'])->name('payfast.success');
//Route::post('subscriptions/payments/payfast/callback', [PayfastPaymentController::class, 'callback'])->name('payfast.callback');
//
// Public payment provider webhooks and callbacks.
//Route::match(['GET', 'POST'], 'subscriptions/payments/coingate/callback', [CoinGatePaymentController::class, 'callback'])->name('coingate.callback');
//
// Public payment provider webhooks and callbacks.
//Route::get('subscriptions/payments/xendit/success', [XenditPaymentController::class, 'success'])->name('xendit.success');
//Route::post('subscriptions/payments/xendit/callback', [XenditPaymentController::class, 'callback'])->name('xendit.callback');

Route::get('/translations/{locale?}', [TranslationController::class, 'getTranslations'])->name('translations');
Route::get('/initial-locale', [TranslationController::class, 'getInitialLocale'])->name('initial-locale');
Route::get('/clear-translations-cache', [TranslationController::class, 'clearTranslationsCache'])->middleware('auth');

// Email template routes retained without authentication while the feature is under development and testing.
//Route::get('email-templates', [EmailTemplateController::class, 'index'])->name('email-templates.index');
//Route::get('email-templates/{emailTemplate}', [EmailTemplateController::class, 'show'])->name('email-templates.show');
//Route::put('email-templates/{emailTemplate}/settings', [EmailTemplateController::class, 'updateSettings'])->name('email-templates.update-settings');
//Route::put('email-templates/{emailTemplate}/content', [EmailTemplateController::class, 'updateContent'])->name('email-templates.update-content');

// Authenticated application routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Subscription plan discovery, trial, subscription, and coupon validation remain available to authenticated users without plan gating.
    Route::get('subscriptions/plans', [PlanController::class, 'index'])->name('subscriptions.plans.index');
    Route::post('subscriptions/plans/request', [PlanController::class, 'requestPlan'])->name('subscriptions.plans.request');
    Route::post('subscriptions/plans/trial', [PlanController::class, 'startTrial'])->name('subscriptions.plans.trial');
    Route::post('subscriptions/plans/subscribe', [PlanController::class, 'subscribe'])->name('subscriptions.plans.subscribe');
    Route::post('subscriptions/plans/coupons/validate', [CouponController::class, 'validate'])->name('subscriptions.coupons.validate');

    // Subscription payment processing routes remain outside the subscription access check so users can establish or change plan access.
    //    Route::post('subscriptions/payments/zero', [ZeroPaymentController::class, 'processPayment'])->name('subscriptions.zero.payment');
    //    Route::post('subscriptions/payments/stripe', [StripePaymentController::class, 'processPayment'])->name('subscriptions.stripe.payment');
    //    Route::post('subscriptions/payments/paypal', [PayPalPaymentController::class, 'processPayment'])->name('subscriptions.paypal.payment');
    Route::post('subscriptions/payments/bank', [BankPaymentController::class, 'processPayment'])->name('subscriptions.bank.payment');
    Route::post('subscriptions/payments/paystack', [PaystackPaymentController::class, 'processPayment'])->name('subscriptions.paystack.payment');
    //    Route::post('subscriptions/payments/flutterwave', [FlutterwavePaymentController::class, 'processPayment'])->name('subscriptions.flutterwave.payment');
    //    Route::post('subscriptions/payments/paytabs', [PayTabsPaymentController::class, 'processPayment'])->name('subscriptions.paytabs.payment');
    //    Route::post('subscriptions/payments/skrill', [SkrillPaymentController::class, 'processPayment'])->name('subscriptions.skrill.payment');
    //    Route::post('subscriptions/payments/coingate', [CoinGatePaymentController::class, 'processPayment'])->name('subscriptions.coingate.payment');
    //    Route::post('subscriptions/payments/payfast', [PayfastPaymentController::class, 'processPayment'])->name('subscriptions.payfast.payment');
    //    Route::post('subscriptions/payments/mollie', [MolliePaymentController::class, 'processPayment'])->name('subscriptions.mollie.payment');
    //    Route::post('subscriptions/payments/toyyibpay', [ToyyibPayPaymentController::class, 'processPayment'])->name('subscriptions.toyyibpay.payment');
    //    Route::post('subscriptions/payments/iyzipay', [IyzipayPaymentController::class, 'processPayment'])->name('subscriptions.iyzipay.payment');
    //    Route::post('subscriptions/payments/benefit', [BenefitPaymentController::class, 'processPayment'])->name('subscriptions.benefit.payment');
    //    Route::post('subscriptions/payments/ozow', [OzowPaymentController::class, 'processPayment'])->name('subscriptions.ozow.payment');
    //    Route::post('subscriptions/payments/easebuzz', [EasebuzzPaymentController::class, 'processPayment'])->name('subscriptions.easebuzz.payment');
    //    Route::post('subscriptions/payments/khalti', [KhaltiPaymentController::class, 'processPayment'])->name('subscriptions.khalti.payment');
    //    Route::post('subscriptions/payments/authorizenet', [AuthorizeNetPaymentController::class, 'processPayment'])->name('subscriptions.authorizenet.payment');
    //    Route::post('subscriptions/payments/fedapay', [FedaPayPaymentController::class, 'processPayment'])->name('subscriptions.fedapay.payment');
    //    Route::post('subscriptions/payments/payhere', [PayHerePaymentController::class, 'processPayment'])->name('subscriptions.payhere.payment');
    //    Route::post('subscriptions/payments/cinetpay', [CinetPayPaymentController::class, 'processPayment'])->name('subscriptions.cinetpay.payment');
    //    Route::post('subscriptions/payments/paiement', [PaiementPaymentController::class, 'processPayment'])->name('subscriptions.paiement.payment');
    //    Route::post('subscriptions/payments/nepalste', [NepalstePaymentController::class, 'processPayment'])->name('subscriptions.nepalste.payment');
    //    Route::post('subscriptions/payments/yookassa', [YooKassaPaymentController::class, 'processPayment'])->name('subscriptions.yookassa.payment');
    //    Route::post('subscriptions/payments/aamarpay', [AamarpayPaymentController::class, 'processPayment'])->name('subscriptions.aamarpay.payment');
    //    Route::post('subscriptions/payments/midtrans', [MidtransPaymentController::class, 'processPayment'])->name('subscriptions.midtrans.payment');

    // Provider-specific payment initialization and verification endpoints retained for gateway integrations under development or testing.
    //    Route::post('subscriptions/razorpay/create-order', [RazorpayController::class, 'createOrder'])->name('razorpay.create-order');
    //    Route::post('subscriptions/razorpay/verify-payment', [RazorpayController::class, 'verifyPayment'])->name('razorpay.verify-payment');
    //    Route::post('subscriptions/cashfree/create-session', [CashfreeController::class, 'createPaymentSession'])->name('cashfree.create-session');
    //    Route::post('subscriptions/cashfree/verify-payment', [CashfreeController::class, 'verifyPayment'])->name('cashfree.verify-payment');
    //    Route::post('subscriptions/mercadopago/create-preference', [MercadoPagoController::class, 'createPreference'])->name('mercadopago.create-preference');
    //    Route::post('subscriptions/mercadopago/process-payment', [MercadoPagoController::class, 'processPayment'])->name('mercadopago.process-payment');

    // Additional payment creation endpoints retained for supported and in-progress payment gateway integrations.
    //    Route::post('subscriptions/tap/create-payment', [TapPaymentController::class, 'createPayment'])->name('tap.create-payment');
    //    Route::post('subscriptions/xendit/create-payment', [XenditPaymentController::class, 'createPayment'])->name('xendit.create-payment');
    //    Route::post('subscriptions/payments/paytr/create-token', [PayTRPaymentController::class, 'createPaymentToken'])->name('paytr.create-token');
    //    Route::post('subscriptions/iyzipay/create-form', [IyzipayPaymentController::class, 'createPaymentForm'])->name('iyzipay.create-form');
    //    Route::post('subscriptions/benefit/create-session', [BenefitPaymentController::class, 'createPaymentSession'])->name('benefit.create-session');
    //    Route::post('subscriptions/ozow/create-payment', [OzowPaymentController::class, 'createPayment'])->name('ozow.create-payment');
    //    Route::post('subscriptions/easebuzz/create-payment', [EasebuzzPaymentController::class, 'createPayment'])->name('easebuzz.create-payment');
    //    Route::post('subscriptions/khalti/create-payment', [KhaltiPaymentController::class, 'createPayment'])->name('khalti.create-payment');
    //    Route::post('subscriptions/authorizenet/create-form', [AuthorizeNetPaymentController::class, 'createPaymentForm'])->name('authorizenet.create-form');
    //    Route::post('subscriptions/fedapay/create-payment', [FedaPayPaymentController::class, 'createPayment'])->name('fedapay.create-payment');
    //    Route::post('subscriptions/payhere/create-payment', [PayHerePaymentController::class, 'createPayment'])->name('payhere.create-payment');
    //    Route::post('subscriptions/cinetpay/create-payment', [CinetPayPaymentController::class, 'createPayment'])->name('cinetpay.create-payment');
    //    Route::post('subscriptions/paiement/create-payment', [PaiementPaymentController::class, 'createPayment'])->name('paiement.create-payment');
    //    Route::post('subscriptions/nepalste/create-payment', [NepalstePaymentController::class, 'createPayment'])->name('nepalste.create-payment');
    //    Route::post('subscriptions/yookassa/create-payment', [YooKassaPaymentController::class, 'createPayment'])->name('yookassa.create-payment');
    //    Route::post('subscriptions/aamarpay/create-payment', [AamarpayPaymentController::class, 'createPayment'])->name('aamarpay.create-payment');
    //    Route::post('subscriptions/midtrans/create-payment', [MidtransPaymentController::class, 'createPayment'])->name('midtrans.create-payment');

    // Payment completion, failure, callback, and webhook endpoints retained for gateway integrations under development or testing.
    //    Route::post('subscriptions/payments/skrill/callback', [SkrillPaymentController::class, 'callback'])->name('skrill.callback');
    //    Route::get('subscriptions/payments/paytr/success', [PayTRPaymentController::class, 'success'])->name('paytr.success');
    //    Route::get('subscriptions/payments/paytr/failure', [PayTRPaymentController::class, 'failure'])->name('paytr.failure');
    //    Route::get('subscriptions/payments/mollie/success', [MolliePaymentController::class, 'success'])->name('mollie.success');
    //    Route::post('subscriptions/payments/mollie/callback', [MolliePaymentController::class, 'callback'])->name('mollie.callback');
    //    Route::match(['GET', 'POST'], 'subscriptions/payments/toyyibpay/success', [ToyyibPayPaymentController::class, 'success'])->name('toyyibpay.success');
    //    Route::post('subscriptions/payments/toyyibpay/callback', [ToyyibPayPaymentController::class, 'callback'])->name('toyyibpay.callback');
    //
    //    Route::get('subscriptions/payments/ozow/success', [OzowPaymentController::class, 'success'])->name('ozow.success');
    //    Route::post('subscriptions/payments/ozow/callback', [OzowPaymentController::class, 'callback'])->name('ozow.callback');
    //    Route::get('subscriptions/payments/payhere/success', [PayHerePaymentController::class, 'success'])->name('payhere.success');
    //    Route::post('subscriptions/payments/payhere/callback', [PayHerePaymentController::class, 'callback'])->name('payhere.callback');
    //    Route::get('subscriptions/payments/cinetpay/success', [CinetPayPaymentController::class, 'success'])->name('cinetpay.success');
    //    Route::post('subscriptions/payments/cinetpay/callback', [CinetPayPaymentController::class, 'callback'])->name('cinetpay.callback');
    //    Route::get('subscriptions/payments/paiement/success', [PaiementPaymentController::class, 'success'])->name('paiement.success');
    //    Route::post('subscriptions/payments/paiement/callback', [PaiementPaymentController::class, 'callback'])->name('paiement.callback');
    //    Route::post('subscriptions/payments/midtrans/callback', [MidtransPaymentController::class, 'callback'])->name('midtrans.callback');
    //    Route::get('subscriptions/mercadopago/success', [MercadoPagoController::class, 'success'])->name('mercadopago.success');
    //    Route::get('subscriptions/mercadopago/failure', [MercadoPagoController::class, 'failure'])->name('mercadopago.failure');
    //    Route::get('subscriptions/mercadopago/pending', [MercadoPagoController::class, 'pending'])->name('mercadopago.pending');
    //    Route::post('subscriptions/mercadopago/webhook', [MercadoPagoController::class, 'webhook'])->name('mercadopago.webhook');
    //    Route::post('subscriptions/authorizenet/test-connection', [AuthorizeNetPaymentController::class, 'testConnection'])->name('authorizenet.test-connection');

    // Access to the core application is enforced by the check.subscription middleware.
    Route::middleware('check.subscription')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard.index');
        Route::get('dashboard/redirect', [DashboardController::class, 'redirectToFirstAvailablePage'])->name('dashboard.redirect');

        // Media library operations and storage configuration endpoints.
        Route::get('media-library', [MediaController::class, 'mediaLibrary'])
            ->middleware('permission:manage-media')
            ->name('media-library.media-library');
        Route::get('media-library/media', [MediaController::class, 'index'])->middleware('permission:manage-media')->name('media-library.media.index');
        Route::post('media-library/media/batch', [MediaController::class, 'batchStore'])->middleware('permission:create-media')->name('media-library.media.batch');
        Route::get('media-library/media/{id}/download', [MediaController::class, 'download'])->middleware('permission:download-media')->name('media-library.media.download');
        Route::delete('media-library/media/{id}', [MediaController::class, 'destroy'])->middleware('permission:delete-media')->name('media-library.media.destroy');
        Route::get('media-library/storage-settings', [SystemSettingsController::class, 'getStorageSettings'])->name('media-library.storage-settings');

        // Notification template management is restricted to users with the required template management permission.
        Route::middleware('permission:manage-notification-templates')->group(function () {
            Route::get('notification-templates', [NotificationTemplateController::class, 'index'])->name('notification-templates.index');
            Route::get('notification-templates/{notificationTemplate}', [NotificationTemplateController::class, 'show'])->name('notification-templates.show');
            Route::put('notification-templates/{notificationTemplate}/content', [NotificationTemplateController::class, 'updateContent'])->name('notification-templates.update-content');
        });

        // Permission administration is protected by management access, with action-level permissions enforced within the group.
        Route::middleware('permission:manage-permissions')->group(function () {
            Route::get('permissions', [PermissionController::class, 'index'])->middleware('permission:manage-permissions')->name('permissions.index');
            Route::get('permissions/create', [PermissionController::class, 'create'])->middleware('permission:create-permissions')->name('permissions.create');
            Route::post('permissions', [PermissionController::class, 'store'])->middleware('permission:create-permissions')->name('permissions.store');
            Route::get('permissions/{permission}', [PermissionController::class, 'show'])->middleware('permission:view-permissions')->name('permissions.show');
            Route::get('permissions/{permission}/edit', [PermissionController::class, 'edit'])->middleware('permission:edit-permissions')->name('permissions.edit');
            Route::put('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions')->name('permissions.update');
            Route::patch('permissions/{permission}', [PermissionController::class, 'update'])->middleware('permission:edit-permissions');
            Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->middleware('permission:delete-permissions')->name('permissions.destroy');
        });

        // Role administration is protected by management access, with action-level permissions enforced within the group.
        Route::middleware('permission:manage-roles')->group(function () {
            Route::get('users-permissions/roles', [RoleController::class, 'index'])->middleware('permission:manage-roles')->name('users-permissions.roles.index');
            Route::get('users-permissions/roles/create', [RoleController::class, 'create'])->middleware('permission:create-roles')->name('users-permissions.roles.create');
            Route::post('users-permissions/roles', [RoleController::class, 'store'])->middleware('permission:create-roles')->name('users-permissions.roles.store');
            Route::get('users-permissions/roles/{role}', [RoleController::class, 'show'])->middleware('permission:view-roles')->name('users-permissions.roles.show');
            Route::get('users-permissions/roles/{role}/edit', [RoleController::class, 'edit'])->middleware('permission:edit-roles')->name('users-permissions.roles.edit');
            Route::put('users-permissions/roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles')->name('users-permissions.roles.update');
            Route::patch('users-permissions/roles/{role}', [RoleController::class, 'update'])->middleware('permission:edit-roles');
            Route::delete('users-permissions/roles/{role}', [RoleController::class, 'destroy'])->middleware('permission:delete-roles')->name('users-permissions.roles.destroy');
        });

        // User administration is protected by management access, with action-level permissions enforced within the group.
        Route::middleware('permission:manage-users')->group(function () {
            Route::get('users-permissions/users', [UserController::class, 'index'])->middleware('permission:manage-users')->name('users-permissions.users.index');
            Route::post('users-permissions/users', [UserController::class, 'store'])->middleware('permission:create-users')->name('users-permissions.users.store');
            Route::get('users-permissions/users/{user}', [UserController::class, 'show'])->middleware('permission:view-users')->name('users-permissions.users.show');
            Route::put('users-permissions/users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users')->name('users-permissions.users.update');
            Route::patch('users-permissions/users/{user}', [UserController::class, 'update'])->middleware('permission:edit-users');
            Route::delete('users-permissions/users/{user}', [UserController::class, 'destroy'])->middleware('permission:delete-users')->name('users-permissions.users.destroy');
            Route::put('users-permissions/users/{user}/reset-password', [UserController::class, 'resetPassword'])->middleware('permission:reset-password-users')->name('users-permissions.users.reset-password');
            Route::put('users-permissions/users/{user}/toggle-status', [UserController::class, 'toggleStatus'])->middleware('permission:toggle-status-users')->name('users-permissions.users.toggle-status');
            Route::get('users-logs', [UserController::class, 'allUserLogs'])->middleware('permission:view-users')->name('users-permissions.users.all-logs');
        });

        // Subscription plan administration and status management.
        Route::middleware('permission:manage-plans')->group(function () {
            Route::get('subscriptions/plans/create', [PlanController::class, 'create'])->middleware('permission:create-plans')->name('subscriptions.plans.create');
            Route::post('subscriptions/plans', [PlanController::class, 'store'])->middleware('permission:create-plans')->name('subscriptions.plans.store');
            Route::get('subscriptions/plans/{plan}/edit', [PlanController::class, 'edit'])->middleware('permission:edit-plans')->name('subscriptions.plans.edit');
            Route::put('subscriptions/plans/{plan}', [PlanController::class, 'update'])->middleware('permission:edit-plans')->name('subscriptions.plans.update');
            Route::delete('subscriptions/plans/{plan}', [PlanController::class, 'destroy'])->middleware('permission:delete-plans')->name('subscriptions.plans.destroy');
            Route::post('subscriptions/plans/{plan}/toggle-status', [PlanController::class, 'toggleStatus'])->name('subscriptions.plans.toggle-status');
        });

        // Subscription plan order review and approval workflow.
        Route::middleware('permission:manage-plan-orders')->group(function () {
            Route::get('subscriptions/plan-orders', [PlanOrderController::class, 'index'])->middleware('permission:manage-plan-orders')->name('subscriptions.plan-orders.index');
            Route::post('subscriptions/plan-orders/{planOrder}/approve', [PlanOrderController::class, 'approve'])->middleware('permission:approve-plan-orders')->name('subscriptions.plan-orders.approve');
            Route::post('subscriptions/plan-orders/{planOrder}/reject', [PlanOrderController::class, 'reject'])->middleware('permission:reject-plan-orders')->name('subscriptions.plan-orders.reject');
        });

        // Organization administration, account access, and subscription management.
        Route::middleware('permission:manage-organizations')->group(function () {
            Route::get('organizations', [OrganizationController::class, 'index'])->middleware('permission:manage-organizations')->name('organizations.index');
            Route::post('organizations', [OrganizationController::class, 'store'])->middleware('permission:create-organizations')->name('organizations.store');
            Route::put('organizations/{organization}', [OrganizationController::class, 'update'])->middleware('permission:edit-organizations')->name('organizations.update');
            Route::delete('organizations/{organization}', [OrganizationController::class, 'destroy'])->middleware('permission:delete-organizations')->name('organizations.destroy');
            Route::put('organizations/{organization}/reset-password', [OrganizationController::class, 'resetPassword'])->middleware('permission:reset-password-organizations')->name('organizations.reset-password');
            Route::put('organizations/{organization}/toggle-status', [OrganizationController::class, 'toggleStatus'])->middleware('permission:toggle-status-organizations')->name('organizations.toggle-status');
            Route::get('organizations/{organization}/plans', [OrganizationController::class, 'getPlans'])->middleware('permission:manage-plans-organizations')->name('organizations.plans');
            Route::put('organizations/{organization}/upgrade-plan', [OrganizationController::class, 'upgradePlan'])->middleware('permission:upgrade-plan-organizations')->name('organizations.upgrade-plan');
        });

        // Coupon creation, maintenance, validation, and status management.
        Route::middleware('permission:manage-coupons')->group(function () {
            Route::get('coupons', [CouponController::class, 'index'])->middleware('permission:manage-coupons')->name('coupons.index');
            Route::get('coupons/{coupon}', [CouponController::class, 'show'])->middleware('permission:view-coupons')->name('coupons.show');
            Route::post('coupons', [CouponController::class, 'store'])->middleware('permission:create-coupons')->name('coupons.store');
            Route::put('coupons/{coupon}', [CouponController::class, 'update'])->middleware('permission:edit-coupons')->name('coupons.update');
            Route::put('coupons/{coupon}/toggle-status', [CouponController::class, 'toggleStatus'])->middleware('permission:toggle-status-coupons')->name('coupons.toggle-status');
            Route::delete('coupons/{coupon}', [CouponController::class, 'destroy'])->middleware('permission:delete-coupons')->name('coupons.destroy');
        });

        // Subscription plan request review and approval workflow.
        Route::middleware('permission:manage-plan-requests')->group(function () {
            Route::get('subscriptions/plan-requests', [PlanRequestController::class, 'index'])->middleware('permission:manage-plan-requests')->name('subscriptions.plan-requests.index');
            Route::post('subscriptions/plan-requests/{planRequest}/approve', [PlanRequestController::class, 'approve'])->middleware('permission:approve-plan-requests')->name('subscriptions.plan-requests.approve');
            Route::post('subscriptions/plan-requests/{planRequest}/reject', [PlanRequestController::class, 'reject'])->middleware('permission:reject-plan-requests')->name('subscriptions.plan-requests.reject');
        });

        // Referral program configuration, referred-user access, and payout management.
        Route::middleware('permission:manage-referral')->group(function () {
            Route::get('referral-program', [ReferralController::class, 'index'])->middleware('permission:manage-referral')->name('referral-program.index');
            Route::get('referral-program/referred-users', [ReferralController::class, 'getReferredUsers'])->middleware('permission:manage-users-referral')->name('referral-program.referred-users');
            Route::post('referral-program/settings', [ReferralController::class, 'updateSettings'])->middleware('permission:manage-setting-referral')->name('referral-program.settings.update');
            Route::post('referral-program/payout-request', [ReferralController::class, 'createPayoutRequest'])->middleware('permission:manage-payout-referral')->name('referral-program.payout-request.create');
            Route::post('referral-program/payout-request/{payoutRequest}/approve', [ReferralController::class, 'approvePayoutRequest'])->middleware('permission:approve-payout-referral')->name('referral-program.payout-request.approve');
            Route::post('referral-program/payout-request/{payoutRequest}/reject', [ReferralController::class, 'rejectPayoutRequest'])->middleware('permission:reject-payout-referral')->name('referral-program.payout-request.reject');
        });

        // Currency configuration and maintenance.
        Route::middleware('permission:manage-currencies')->group(function () {
            Route::get('currencies', [CurrencyController::class, 'index'])->middleware('permission:manage-currencies')->name('currencies.index');
            Route::post('currencies', [CurrencyController::class, 'store'])->middleware('permission:create-currencies')->name('currencies.store');
            Route::put('currencies/{currency}', [CurrencyController::class, 'update'])->middleware('permission:edit-currencies')->name('currencies.update');
            Route::delete('currencies/{currency}', [CurrencyController::class, 'destroy'])->middleware('permission:delete-currencies')->name('currencies.destroy');
        });

        // Tax configuration and status management.
        Route::middleware('permission:manage-taxes')->group(function () {
            Route::get('taxes', [TaxController::class, 'index'])->middleware('permission:manage-taxes')->name('taxes.index');
            Route::post('taxes', [TaxController::class, 'store'])->middleware('permission:create-taxes')->name('taxes.store');
            Route::put('taxes/{tax}', [TaxController::class, 'update'])->middleware('permission:edit-taxes')->name('taxes.update');
            Route::delete('taxes/{tax}', [TaxController::class, 'destroy'])->middleware('permission:delete-taxes')->name('taxes.destroy');
            Route::put('taxes/{tax}/toggle-status', [TaxController::class, 'toggleStatus'])->middleware('permission:toggle-status-taxes')->name('taxes.toggle-status');
        });

        // Brand configuration and status management.
        Route::middleware('permission:manage-brands')->group(function () {
            Route::get('brands', [BrandController::class, 'index'])->middleware('permission:manage-brands')->name('brands.index');
            Route::post('brands', [BrandController::class, 'store'])->middleware('permission:create-brands')->name('brands.store');
            Route::put('brands/{brand}', [BrandController::class, 'update'])->middleware('permission:edit-brands')->name('brands.update');
            Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->middleware('permission:delete-brands')->name('brands.destroy');
            Route::put('brands/{brand}/toggle-status', [BrandController::class, 'toggleStatus'])->middleware('permission:toggle-status-brands')->name('brands.toggle-status');
        });

        // Product category configuration and status management.
        Route::middleware('permission:manage-categories')->group(function () {
            Route::get('categories', [CategoryController::class, 'index'])->middleware('permission:manage-categories')->name('categories.index');
            Route::post('categories', [CategoryController::class, 'store'])->middleware('permission:create-categories')->name('categories.store');
            Route::put('categories/{category}', [CategoryController::class, 'update'])->middleware('permission:edit-categories')->name('categories.update');
            Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:delete-categories')->name('categories.destroy');
            Route::put('categories/{category}/toggle-status', [CategoryController::class, 'toggleStatus'])->middleware('permission:toggle-status-categories')->name('categories.toggle-status');
        });

        // Product catalog management, status changes, and bulk import/export operations.
        Route::middleware('permission:manage-products')->group(function () {
            Route::get('products', [ProductController::class, 'index'])->middleware('permission:manage-products')->name('products.index');
            Route::get('products/create', [ProductController::class, 'create'])->middleware('permission:create-products')->name('products.create');
            Route::get('products/{product}', [ProductController::class, 'show'])->middleware('permission:view-products')->name('products.show');
            Route::get('products/{product}/edit', [ProductController::class, 'edit'])->middleware('permission:edit-products')->name('products.edit');
            Route::post('products', [ProductController::class, 'store'])->middleware('permission:create-products')->name('products.store');
            Route::put('products/{product}', [ProductController::class, 'update'])->middleware('permission:edit-products')->name('products.update');
            Route::delete('products/{product}/', [ProductController::class, 'destroy'])->middleware('permission:delete-products')->name('products.destroy');
            Route::put('products/{product}/toggle-status', [ProductController::class, 'toggleStatus'])->middleware('permission:toggle-status-products')->name('products.toggle-status');

            // Product import, export, and template download operations.
            Route::get('products/file/export/', [ProductController::class, 'fileExport'])->middleware('permission:export-products')->name('products.export');
            Route::post('products/file/parse', [ProductController::class, 'parseFile'])->middleware('permission:import-products')->name('products.parse');
            Route::post('products/file/import', [ProductController::class, 'fileImport'])->middleware('permission:import-products')->name('products.import');
            Route::get('products/download/template', [ProductController::class, 'downloadTemplate'])->name('products.download.template');
        });

        // CRM reporting endpoints covering leads, sales, products, customers, and projects.
        Route::middleware('permission:manage-reports')->group(function () {
            Route::get('reports/leads', [ReportsController::class, 'leads'])->name('reports.leads');
            Route::get('reports/sales', [ReportsController::class, 'sales'])->name('reports.sales');
            Route::get('reports/product-reports', [ReportsController::class, 'products'])->name('reports.product-reports');
            Route::get('reports/customers', [ReportsController::class, 'customers'])->name('reports.customers');
            Route::get('reports/projects', [ReportsController::class, 'projects'])->name('reports.projects');
        });

        // Account type configuration and status management.
        Route::middleware('permission:manage-account-types')->group(function () {
            // CRM configuration and sales operations
            Route::get('account-types', [AccountTypeController::class, 'index'])->middleware('permission:manage-account-types')->name('account-types.index');
            Route::post('account-types', [AccountTypeController::class, 'store'])->middleware('permission:create-account-types')->name('account-types.store');
            Route::put('account-types/{accountType}', [AccountTypeController::class, 'update'])->middleware('permission:edit-account-types')->name('account-types.update');
            Route::delete('account-types/{accountType}', [AccountTypeController::class, 'destroy'])->middleware('permission:delete-account-types')->name('account-types.destroy');
            Route::put('account-types/{accountType}/toggle-status', [AccountTypeController::class, 'toggleStatus'])->middleware('permission:toggle-status-account-types')->name('account-types.toggle-status');
        });

        // Account industry configuration and status management.
        Route::middleware('permission:manage-account-industries')->group(function () {
            Route::get('account-industries', [AccountIndustryController::class, 'index'])->middleware('permission:manage-account-industries')->name('account-industries.index');
            Route::post('account-industries', [AccountIndustryController::class, 'store'])->middleware('permission:create-account-industries')->name('account-industries.store');
            Route::put('account-industries/{accountIndustry}', [AccountIndustryController::class, 'update'])->middleware('permission:edit-account-industries')->name('account-industries.update');
            Route::delete('account-industries/{accountIndustry}', [AccountIndustryController::class, 'destroy'])->middleware('permission:delete-account-industries')->name('account-industries.destroy');
            Route::put('account-industries/{accountIndustry}/toggle-status', [AccountIndustryController::class, 'toggleStatus'])->middleware('permission:toggle-status-account-industries')->name('account-industries.toggle-status');
        });

        // Customer account management, lifecycle actions, activity history, comments, and data export.
        Route::middleware('permission:manage-accounts')->group(function () {
            Route::get('accounts', [AccountController::class, 'index'])->middleware('permission:manage-accounts')->name('accounts.index');
            Route::get('accounts/create', [AccountController::class, 'create'])->middleware('permission:create-accounts')->name('accounts.create');
            Route::get('accounts/{account}/edit', [AccountController::class, 'edit'])->middleware('permission:edit-accounts')->name('accounts.edit');
            Route::get('accounts/{account}', [AccountController::class, 'show'])->middleware('permission:view-accounts')->name('accounts.show');
            Route::post('accounts', [AccountController::class, 'store'])->middleware('permission:create-accounts')->name('accounts.store');
            Route::put('accounts/{account}', [AccountController::class, 'update'])->middleware('permission:edit-accounts')->name('accounts.update');
            Route::delete('accounts/{account}', [AccountController::class, 'destroy'])->middleware('permission:delete-accounts')->name('accounts.destroy');
            Route::put('accounts/{account}/toggle-status', [AccountController::class, 'toggleStatus'])->middleware('permission:toggle-status-accounts')->name('accounts.toggle-status');
            Route::delete('accounts/{account}/activities', [AccountController::class, 'deleteActivities'])->middleware('permission:delete-accounts')->name('accounts.delete-activities');
            Route::delete('accounts/{account}/activities/{activity}', [AccountController::class, 'deleteActivity'])->middleware('permission:delete-accounts')->name('accounts.delete-activity');

            // Account data export.
            Route::get('accounts/file/export/', [AccountController::class, 'fileExport'])->middleware('permission:export-accounts')->name('accounts.export');

            // Account comments and activity comment management.
            Route::post('accounts/{account}/comments', [AccountCommentController::class, 'store'])->middleware('permission:create-accounts')->name('accounts.comments.store');
            Route::put('accounts/{account}/activities/{activity}/comment', [AccountCommentController::class, 'updateActivity'])->middleware('permission:edit-accounts')->name('accounts.comments.update-activity');
        });

        // Contact management, status changes, and data export.
        Route::middleware('permission:manage-contacts')->group(function () {
            Route::get('contacts', [ContactController::class, 'index'])->middleware('permission:manage-contacts')->name('contacts.index');
            Route::get('contacts/{contact}', [ContactController::class, 'show'])->middleware('permission:view-contacts')->name('contacts.show');
            Route::post('contacts', [ContactController::class, 'store'])->middleware('permission:create-contacts')->name('contacts.store');
            Route::put('contacts/{contact}', [ContactController::class, 'update'])->middleware('permission:edit-contacts')->name('contacts.update');
            Route::delete('contacts/{contact}', [ContactController::class, 'destroy'])->middleware('permission:delete-contacts')->name('contacts.destroy');
            Route::put('contacts/{contact}/toggle-status', [ContactController::class, 'toggleStatus'])->middleware('permission:toggle-status-contacts')->name('contacts.toggle-status');

            // Contact data export.
            Route::get('contacts/file/export/', [ContactController::class, 'fileExport'])->middleware('permission:export-contacts')->name('contacts.export');
        });

        // Lead status configuration and status management.
        Route::middleware('permission:manage-lead-statuses')->group(function () {
            Route::get('lead-statuses', [LeadStatusController::class, 'index'])->middleware('permission:manage-lead-statuses')->name('lead-statuses.index');
            Route::post('lead-statuses', [LeadStatusController::class, 'store'])->middleware('permission:create-lead-statuses')->name('lead-statuses.store');
            Route::put('lead-statuses/{leadStatus}', [LeadStatusController::class, 'update'])->middleware('permission:edit-lead-statuses')->name('lead-statuses.update');
            Route::delete('lead-statuses/{leadStatus}', [LeadStatusController::class, 'destroy'])->middleware('permission:delete-lead-statuses')->name('lead-statuses.destroy');
            Route::put('lead-statuses/{leadStatus}/toggle-status', [LeadStatusController::class, 'toggleStatus'])->middleware('permission:toggle-status-lead-statuses')->name('lead-statuses.toggle-status');
        });

        // Lead source configuration and status management.
        Route::middleware('permission:manage-lead-sources')->group(function () {
            Route::get('lead-sources', [LeadSourceController::class, 'index'])->middleware('permission:manage-lead-sources')->name('lead-sources.index');
            Route::post('lead-sources', [LeadSourceController::class, 'store'])->middleware('permission:create-lead-sources')->name('lead-sources.store');
            Route::put('lead-sources/{leadSource}', [LeadSourceController::class, 'update'])->middleware('permission:edit-lead-sources')->name('lead-sources.update');
            Route::delete('lead-sources/{leadSource}', [LeadSourceController::class, 'destroy'])->middleware('permission:delete-lead-sources')->name('lead-sources.destroy');
            Route::put('lead-sources/{leadSource}/toggle-status', [LeadSourceController::class, 'toggleStatus'])->middleware('permission:toggle-status-lead-sources')->name('lead-sources.toggle-status');
        });

        // Lead management, lifecycle conversion, activity history, comments, and data import/export.
        Route::middleware('permission:manage-leads')->group(function () {
            Route::get('leads', [LeadController::class, 'index'])->middleware('permission:manage-leads')->name('leads.index');
            Route::get('leads/create', [LeadController::class, 'create'])->middleware('permission:create-leads')->name('leads.create');
            Route::get('leads/{lead}/edit', [LeadController::class, 'edit'])->middleware('permission:edit-leads')->name('leads.edit');
            Route::get('leads/{lead}', [LeadController::class, 'show'])->middleware('permission:view-leads')->name('leads.show');
            Route::post('leads', [LeadController::class, 'store'])->middleware('permission:create-leads')->name('leads.store');
            Route::put('leads/{lead}', [LeadController::class, 'update'])->middleware('permission:edit-leads')->name('leads.update');
            Route::delete('leads/{lead}', [LeadController::class, 'destroy'])->middleware('permission:delete-leads')->name('leads.destroy');
            Route::put('leads/{lead}/toggle-status', [LeadController::class, 'toggleStatus'])->middleware('permission:toggle-status-leads')->name('leads.toggle-status');
            Route::put('leads/{lead}/convert-to-account', [LeadController::class, 'convertToAccount'])->middleware('permission:convert-leads')->name('leads.convert-to-account');
            Route::put('leads/{lead}/convert-to-contact', [LeadController::class, 'convertToContact'])->middleware('permission:convert-leads')->name('leads.convert-to-contact');

            Route::put('leads/{lead}/update-status', [LeadController::class, 'updateStatus'])->middleware('permission:edit-leads')->name('leads.update-status');
            Route::delete('leads/{lead}/activities', [LeadController::class, 'deleteActivities'])->middleware('permission:delete-leads')->name('leads.delete-activities');
            Route::delete('leads/{lead}/activities/{activity}', [LeadController::class, 'deleteActivity'])->middleware('permission:delete-leads')->name('leads.delete-activity');

            // Lead import, export, and template download operations.
            Route::get('leads/file/export/', [LeadController::class, 'fileExport'])->middleware('permission:export-leads')->name('leads.export');
            Route::post('leads/file/parse', [LeadController::class, 'parseFile'])->middleware('permission:import-leads')->name('leads.parse');
            Route::post('leads/file/import', [LeadController::class, 'fileImport'])->middleware('permission:import-leads')->name('leads.import');
            Route::get('leads/download/template', [LeadController::class, 'downloadTemplate'])->name('leads.download.template');

            // Lead comment and activity comment management.
            Route::post('leads/{lead}/comments', [LeadCommentController::class, 'store'])->middleware('permission:create-leads')->name('leads.comments.store');
            Route::put('leads/{lead}/comments/{comment}', [LeadCommentController::class, 'update'])->middleware('permission:edit-leads')->name('leads.comments.update');
            Route::put('leads/{lead}/activities/{activity}/comment', [LeadCommentController::class, 'updateActivity'])->middleware('permission:edit-leads')->name('leads.comments.update-activity');
            Route::delete('leads/{lead}/comments/{comment}', [LeadCommentController::class, 'destroy'])->middleware('permission:delete-leads')->name('leads.comments.destroy');
        });

        // Opportunity stage configuration and status management.
        Route::middleware('permission:manage-opportunity-stages')->group(function () {
            Route::get('opportunity-stages', [OpportunityStageController::class, 'index'])->middleware('permission:manage-opportunity-stages')->name('opportunity-stages.index');
            Route::post('opportunity-stages', [OpportunityStageController::class, 'store'])->middleware('permission:create-opportunity-stages')->name('opportunity-stages.store');
            Route::put('opportunity-stages/{opportunityStage}', [OpportunityStageController::class, 'update'])->middleware('permission:edit-opportunity-stages')->name('opportunity-stages.update');
            Route::delete('opportunity-stages/{opportunityStage}', [OpportunityStageController::class, 'destroy'])->middleware('permission:delete-opportunity-stages')->name('opportunity-stages.destroy');
            Route::put('opportunity-stages/{opportunityStage}/toggle-status', [OpportunityStageController::class, 'toggleStatus'])->middleware('permission:toggle-status-opportunity-stages')->name('opportunity-stages.toggle-status');
        });

        // Opportunity source configuration and status management.
        Route::middleware('permission:manage-opportunity-sources')->group(function () {
            Route::get('opportunity-sources', [OpportunitySourceController::class, 'index'])->middleware('permission:manage-opportunity-sources')->name('opportunity-sources.index');
            Route::post('opportunity-sources', [OpportunitySourceController::class, 'store'])->middleware('permission:create-opportunity-sources')->name('opportunity-sources.store');
            Route::put('opportunity-sources/{opportunitySource}', [OpportunitySourceController::class, 'update'])->middleware('permission:edit-opportunity-sources')->name('opportunity-sources.update');
            Route::delete('opportunity-sources/{opportunitySource}', [OpportunitySourceController::class, 'destroy'])->middleware('permission:delete-opportunity-sources')->name('opportunity-sources.destroy');
            Route::put('opportunity-sources/{opportunitySource}/toggle-status', [OpportunitySourceController::class, 'toggleStatus'])->middleware('permission:toggle-status-opportunity-sources')->name('opportunity-sources.toggle-status');
        });

        // Opportunity management, pipeline status changes, activity history, comments, and data export.
        Route::middleware('permission:manage-opportunities')->group(function () {
            Route::get('opportunities', [OpportunityController::class, 'index'])->middleware('permission:manage-opportunities')->name('opportunities.index');
            Route::get('opportunities/create', [OpportunityController::class, 'create'])->middleware('permission:create-opportunities')->name('opportunities.create');
            Route::get('opportunities/{opportunity}/edit', [OpportunityController::class, 'edit'])->middleware('permission:edit-opportunities')->name('opportunities.edit');
            Route::get('opportunities/{opportunity}', [OpportunityController::class, 'show'])->middleware('permission:view-opportunities')->name('opportunities.show');
            Route::post('opportunities', [OpportunityController::class, 'store'])->middleware('permission:create-opportunities')->name('opportunities.store');
            Route::put('opportunities/{opportunity}', [OpportunityController::class, 'update'])->middleware('permission:edit-opportunities')->name('opportunities.update');
            Route::delete('opportunities/{opportunity}', [OpportunityController::class, 'destroy'])->middleware('permission:delete-opportunities')->name('opportunities.destroy');
            Route::put('opportunities/{opportunity}/toggle-status', [OpportunityController::class, 'toggleStatus'])->middleware('permission:toggle-status-opportunities')->name('opportunities.toggle-status');
            Route::put('opportunities/{opportunity}/update-status', [OpportunityController::class, 'updateStatus'])->middleware('permission:edit-opportunities')->name('opportunities.update-status');
            Route::delete('opportunities/{opportunity}/activities', [OpportunityController::class, 'deleteActivities'])->middleware('permission:delete-opportunities')->name('opportunities.delete-activities');
            Route::delete('opportunities/{opportunity}/activities/{activity}', [OpportunityController::class, 'deleteActivity'])->middleware('permission:delete-opportunities')->name('opportunities.delete-activity');

            // Opportunity data export.
            Route::get('opportunities/file/export/', [OpportunityController::class, 'fileExport'])->middleware('permission:export-opportunities')->name('opportunities.export');

            // Opportunity comments and activity comment management.
            Route::post('opportunities/{opportunity}/comments', [OpportunityCommentController::class, 'store'])->middleware('permission:create-opportunities')->name('opportunities.comments.store');
            Route::put('opportunities/{opportunity}/activities/{activity}/comment', [OpportunityCommentController::class, 'updateActivity'])->middleware('permission:edit-opportunities')->name('opportunities.comments.update-activity');
        });

        // Campaign type configuration and status management.
        Route::middleware('permission:manage-campaign-types')->group(function () {
            Route::get('campaign-types', [CampaignTypeController::class, 'index'])->middleware('permission:manage-campaign-types')->name('campaign-types.index');
            Route::post('campaign-types', [CampaignTypeController::class, 'store'])->middleware('permission:create-campaign-types')->name('campaign-types.store');
            Route::put('campaign-types/{campaignType}', [CampaignTypeController::class, 'update'])->middleware('permission:edit-campaign-types')->name('campaign-types.update');
            Route::delete('campaign-types/{campaignType}', [CampaignTypeController::class, 'destroy'])->middleware('permission:delete-campaign-types')->name('campaign-types.destroy');
            Route::put('campaign-types/{campaignType}/toggle-status', [CampaignTypeController::class, 'toggleStatus'])->middleware('permission:toggle-status-campaign-types')->name('campaign-types.toggle-status');
        });

        // Target list management and status changes.
        Route::middleware('permission:manage-target-lists')->group(function () {
            Route::get('target-lists', [TargetListController::class, 'index'])->middleware('permission:manage-target-lists')->name('target-lists.index');
            Route::post('target-lists', [TargetListController::class, 'store'])->middleware('permission:create-target-lists')->name('target-lists.store');
            Route::put('target-lists/{targetList}', [TargetListController::class, 'update'])->middleware('permission:edit-target-lists')->name('target-lists.update');
            Route::delete('target-lists/{targetList}', [TargetListController::class, 'destroy'])->middleware('permission:delete-target-lists')->name('target-lists.destroy');
            Route::put('target-lists/{targetList}/toggle-status', [TargetListController::class, 'toggleStatus'])->middleware('permission:toggle-status-target-lists')->name('target-lists.toggle-status');
        });

        // Campaign management, status changes, and campaign record access.
        Route::middleware('permission:manage-campaigns')->group(function () {
            Route::get('campaigns', [CampaignController::class, 'index'])->middleware('permission:manage-campaigns')->name('campaigns.index');
            Route::get('campaigns/create', [CampaignController::class, 'create'])->middleware('permission:create-campaigns')->name('campaigns.create');
            Route::get('campaigns/{campaign}/edit', [CampaignController::class, 'edit'])->middleware('permission:edit-campaigns')->name('campaigns.edit');
            Route::post('campaigns', [CampaignController::class, 'store'])->middleware('permission:create-campaigns')->name('campaigns.store');
            Route::put('campaigns/{campaign}', [CampaignController::class, 'update'])->middleware('permission:edit-campaigns')->name('campaigns.update');
            Route::delete('campaigns/{campaign}', [CampaignController::class, 'destroy'])->middleware('permission:delete-campaigns')->name('campaigns.destroy');
            Route::get('campaigns/{campaign}', [CampaignController::class, 'show'])->middleware('permission:view-campaigns')->name('campaigns.show');
            Route::put('campaigns/{campaign}/toggle-status', [CampaignController::class, 'toggleStatus'])->middleware('permission:toggle-status-campaigns')->name('campaigns.toggle-status');
        });

        // Shipping provider type configuration and status management.
        Route::middleware('permission:manage-shipping-provider-types')->group(function () {
            Route::get('shipping-provider-types', [ShippingProviderTypeController::class, 'index'])->middleware('permission:manage-shipping-provider-types')->name('shipping-provider-types.index');
            Route::get('shipping-provider-types/{id}', [ShippingProviderTypeController::class, 'show'])->middleware('permission:view-shipping-provider-types')->name('shipping-provider-types.show');
            Route::post('shipping-provider-types', [ShippingProviderTypeController::class, 'store'])->middleware('permission:create-shipping-provider-types')->name('shipping-provider-types.store');
            Route::put('shipping-provider-types/{shippingProviderType}', [ShippingProviderTypeController::class, 'update'])->middleware('permission:edit-shipping-provider-types')->name('shipping-provider-types.update');
            Route::delete('shipping-provider-types/{shippingProviderType}', [ShippingProviderTypeController::class, 'destroy'])->middleware('permission:delete-shipping-provider-types')->name('shipping-provider-types.destroy');
            Route::put('shipping-provider-types/{shippingProviderType}/toggle-status', [ShippingProviderTypeController::class, 'toggleStatus'])->middleware('permission:toggle-status-shipping-provider-types')->name('shipping-provider-types.toggle-status');
        });

        // Case management, status changes, and data export.
        Route::middleware('permission:manage-cases')->group(function () {
            Route::get('cases', [CaseController::class, 'index'])->middleware('permission:manage-cases')->name('cases.index');
            Route::get('cases/create', [CaseController::class, 'create'])->middleware('permission:create-cases')->name('cases.create');
            Route::get('cases/{case}', [CaseController::class, 'show'])->middleware('permission:view-cases')->name('cases.show');
            Route::get('cases/{case}/edit', [CaseController::class, 'edit'])->middleware('permission:edit-cases')->name('cases.edit');
            Route::post('cases', [CaseController::class, 'store'])->middleware('permission:create-cases')->name('cases.store');
            Route::put('cases/{case}', [CaseController::class, 'update'])->middleware('permission:edit-cases')->name('cases.update');
            Route::delete('cases/{case}', [CaseController::class, 'destroy'])->middleware('permission:delete-cases')->name('cases.destroy');
            Route::put('cases/{case}/toggle-status', [CaseController::class, 'toggleStatus'])->middleware('permission:toggle-status-cases')->name('cases.toggle-status');

            // Case data export.
            Route::get('cases/file/export/', [CaseController::class, 'fileExport'])->middleware('permission:export-cases')->name('cases.export');
        });

        // Quote management, opportunity association, user assignment, activity history, comments, and data export.
        Route::middleware('permission:manage-quotes')->group(function () {
            Route::get('quotes', [QuoteController::class, 'index'])->middleware('permission:manage-quotes')->name('quotes.index');
            Route::get('quotes/create', [QuoteController::class, 'create'])->middleware('permission:create-quotes')->name('quotes.create');
            Route::get('quotes/{quote}/edit', [QuoteController::class, 'edit'])->middleware('permission:edit-quotes')->name('quotes.edit');
            Route::get('quotes/{quote}', [QuoteController::class, 'show'])->middleware('permission:view-quotes')->name('quotes.show');
            Route::post('quotes', [QuoteController::class, 'store'])->middleware('permission:create-quotes')->name('quotes.store');
            Route::put('quotes/{quote}', [QuoteController::class, 'update'])->middleware('permission:edit-quotes')->name('quotes.update');
            Route::delete('quotes/{quote}', [QuoteController::class, 'destroy'])->middleware('permission:delete-quotes')->name('quotes.destroy');
            Route::put('quotes/{quote}/toggle-status', [QuoteController::class, 'toggleStatus'])->middleware('permission:toggle-status-quotes')->name('quotes.toggle-status');
            Route::put('quotes/{quote}/assign-user', [QuoteController::class, 'assignUser'])->middleware('permission:edit-quotes')->name('quotes.assign-user');
            Route::put('quotes/{quote}/add-opportunity', [QuoteController::class, 'addOpportunity'])->middleware('permission:edit-quotes')->name('quotes.add-opportunity');

            // Quote data export.
            Route::get('quotes/file/export/', [QuoteController::class, 'fileExport'])->middleware('permission:export-quotes')->name('quotes.export');

            // Quote comments and activity comment management.
            Route::post('quotes/{quote}/comments', [QuoteCommentController::class, 'store'])->middleware('permission:create-quotes')->name('quotes.comments.store');
            Route::put('quotes/{quote}/activities/{activity}/comment', [QuoteCommentController::class, 'updateActivity'])->middleware('permission:edit-quotes')->name('quotes.comments.update-activity');

            // Quote activity history cleanup.
            Route::delete('quotes/{quote}/activities', [QuoteController::class, 'deleteActivities'])->middleware('permission:delete-quotes')->name('quotes.delete-activities');
            Route::delete('quotes/{quote}/activities/{activity}', [QuoteController::class, 'deleteActivity'])->middleware('permission:delete-quotes')->name('quotes.delete-activity');
            Route::get('api/opportunities/{opportunity}/details', [QuoteController::class, 'getOpportunityDetails'])->name('api.opportunities.details');
        });

        // Sales order management, user assignment, activity history, comments, and data export.
        Route::middleware('permission:manage-sales-orders')->group(function () {
            Route::get('sales-orders', [SalesOrderController::class, 'index'])->middleware('permission:manage-sales-orders')->name('sales-orders.index');
            Route::get('sales-orders/create', [SalesOrderController::class, 'create'])->middleware('permission:create-sales-orders')->name('sales-orders.create');
            Route::get('sales-orders/{salesOrder}/edit', [SalesOrderController::class, 'edit'])->middleware('permission:edit-sales-orders')->name('sales-orders.edit');
            Route::get('sales-orders/{salesOrder}', [SalesOrderController::class, 'show'])->middleware('permission:view-sales-orders')->name('sales-orders.show');
            Route::post('sales-orders', [SalesOrderController::class, 'store'])->middleware('permission:create-sales-orders')->name('sales-orders.store');
            Route::put('sales-orders/{salesOrder}', [SalesOrderController::class, 'update'])->middleware('permission:edit-sales-orders')->name('sales-orders.update');
            Route::delete('sales-orders/{salesOrder}', [SalesOrderController::class, 'destroy'])->middleware('permission:delete-sales-orders')->name('sales-orders.destroy');
            Route::put('sales-orders/{salesOrder}/toggle-status', [SalesOrderController::class, 'toggleStatus'])->middleware('permission:toggle-status-sales-orders')->name('sales-orders.toggle-status');

            Route::put('sales-orders/{salesOrder}/assign-user', [SalesOrderController::class, 'assignUser'])->middleware('permission:edit-sales-orders')->name('sales-orders.assign-user');

            // Sales order data export.
            Route::get('sales-orders/file/export/', [SalesOrderController::class, 'fileExport'])->middleware('permission:export-sales-orders')->name('sales-orders.export');

            // Sales order comments and activity comment management.
            Route::post('sales-orders/{salesOrder}/comments', [SalesOrderCommentController::class, 'store'])->middleware('permission:create-sales-orders')->name('sales-orders.comments.store');
            Route::put('sales-orders/{salesOrder}/activities/{activity}/comment', [SalesOrderCommentController::class, 'updateActivity'])->middleware('permission:edit-sales-orders')->name('sales-orders.comments.update-activity');

            // Sales order activity history cleanup.
            Route::delete('sales-orders/{salesOrder}/activities', [SalesOrderController::class, 'deleteActivities'])->middleware('permission:delete-sales-orders')->name('sales-orders.delete-activities');
            Route::delete('sales-orders/{salesOrder}/activities/{activity}', [SalesOrderController::class, 'deleteActivity'])->middleware('permission:delete-sales-orders')->name('sales-orders.delete-activity');
        });

        Route::get('api/quotes/{quote}/details', [SalesOrderController::class, 'getQuoteDetails'])->name('api.quotes.details');
        Route::get('api/sales-orders/{salesOrder}/details', [PurchaseOrderController::class, 'getSalesOrderDetails'])->name('api.sales-orders.details');
        Route::get('api/invoices/sales-orders/{salesOrder}/details', [InvoiceController::class, 'getSalesOrderDetails'])->name('api.invoices.sales-orders.details');
        Route::get('api/invoices/quotes/{quote}/details', [InvoiceController::class, 'getQuoteDetails'])->name('api.invoices.quotes.details');
        Route::get('api/invoices/opportunities/{opportunity}/details', [InvoiceController::class, 'getOpportunityDetails'])->name('api.invoices.opportunities.details');

        Route::get('api/return-orders/sales-orders/{salesOrder}/details', [ReturnOrderController::class, 'getSalesOrderDetails'])->name('api.return-orders.sales-orders.details');
        Route::get('api/delivery-orders/sales-orders/{salesOrder}/details', [DeliveryOrderController::class, 'getSalesOrderDetails'])->name('api.delivery-orders.sales-orders.details');

        Route::get('api/receipt-orders/purchase-orders/{purchaseOrder}/details', [ReceiptOrderController::class, 'getPurchaseOrderDetails'])->name('api.receipt-orders.purchase-orders.details');
        Route::get('api/receipt-orders/return-orders/{returnOrder}/details', [ReceiptOrderController::class, 'getReturnOrderDetails'])->name('api.receipt-orders.return-orders.details');

        // Invoice management, reminders, user assignment, activity history, comments, and data export.
        Route::middleware('permission:manage-invoices')->group(function () {
            Route::get('invoices', [InvoiceController::class, 'index'])->middleware('permission:manage-invoices')->name('invoices.index');
            Route::get('invoices/create', [InvoiceController::class, 'create'])->middleware('permission:create-invoices')->name('invoices.create');
            Route::get('invoices/{invoice}/edit', [InvoiceController::class, 'edit'])->middleware('permission:edit-invoices')->name('invoices.edit');
            Route::get('invoices/{invoice}', [InvoiceController::class, 'show'])->middleware('permission:view-invoices')->name('invoices.show');
            Route::post('invoices', [InvoiceController::class, 'store'])->middleware('permission:create-invoices')->name('invoices.store');
            Route::put('invoices/{invoice}', [InvoiceController::class, 'update'])->middleware('permission:edit-invoices')->name('invoices.update');
            Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->middleware('permission:delete-invoices')->name('invoices.destroy');
            Route::put('invoices/{invoice}/toggle-status', [InvoiceController::class, 'toggleStatus'])->middleware('permission:toggle-status-invoices')->name('invoices.toggle-status');
            Route::post('invoices/{invoice}/send-reminder', [InvoiceReminderController::class, 'sendReminder'])->middleware('permission:send-reminder-invoices')->name('invoices.send-reminder');
            Route::get('invoices/{invoice}/reminder-history', [InvoiceController::class, 'getReminderHistory'])->middleware('permission:view-invoices')->name('invoices.reminder-history');

            Route::put('invoices/{invoice}/assign-user', [InvoiceController::class, 'assignUser'])->middleware('permission:edit-invoices')->name('invoices.assign-user');

            // Invoice data export.
            Route::get('invoices/file/export/', [InvoiceController::class, 'fileExport'])->middleware('permission:export-invoices')->name('invoices.export');

            // Invoice comments and activity comment management.
            Route::post('invoices/{invoice}/comments', [InvoiceCommentController::class, 'store'])->middleware('permission:create-invoices')->name('invoices.comments.store');
            Route::put('invoices/{invoice}/activities/{activity}/comment', [InvoiceCommentController::class, 'updateActivity'])->middleware('permission:edit-invoices')->name('invoices.comments.update-activity');

            // Invoice activity history cleanup.
            Route::delete('invoices/{invoice}/activities', [InvoiceController::class, 'deleteActivities'])->middleware('permission:delete-invoices')->name('invoices.delete-activities');
            Route::delete('invoices/{invoice}/activities/{activity}', [InvoiceController::class, 'deleteActivity'])->middleware('permission:delete-invoices')->name('invoices.delete-activity');
        });

        // Delivery order management, user assignment, status changes, and data export.
        Route::middleware('permission:manage-delivery-orders')->group(function () {
            Route::get('delivery-orders', [DeliveryOrderController::class, 'index'])->middleware('permission:manage-delivery-orders')->name('delivery-orders.index');
            Route::get('delivery-orders/create', [DeliveryOrderController::class, 'create'])->middleware('permission:create-delivery-orders')->name('delivery-orders.create');
            Route::get('delivery-orders/{deliveryOrder}/edit', [DeliveryOrderController::class, 'edit'])->middleware('permission:edit-delivery-orders')->name('delivery-orders.edit');
            Route::get('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'show'])->middleware('permission:view-delivery-orders')->name('delivery-orders.show');
            Route::post('delivery-orders', [DeliveryOrderController::class, 'store'])->middleware('permission:create-delivery-orders')->name('delivery-orders.store');
            Route::put('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'update'])->middleware('permission:edit-delivery-orders')->name('delivery-orders.update');
            Route::delete('delivery-orders/{deliveryOrder}', [DeliveryOrderController::class, 'destroy'])->middleware('permission:delete-delivery-orders')->name('delivery-orders.destroy');
            Route::put('delivery-orders/{deliveryOrder}/toggle-status', [DeliveryOrderController::class, 'toggleStatus'])->middleware('permission:toggle-status-delivery-orders')->name('delivery-orders.toggle-status');

            Route::put('delivery-orders/{deliveryOrder}/assign-user', [DeliveryOrderController::class, 'assignUser'])->middleware('permission:edit-delivery-orders')->name('delivery-orders.assign-user');

            // Delivery order data export.
            Route::get('delivery-orders/file/export/', [DeliveryOrderController::class, 'fileExport'])->middleware('permission:export-delivery-orders')->name('delivery-orders.export');
        });

        // Return order management, status changes, and data export.
        Route::middleware('permission:manage-return-orders')->group(function () {
            Route::get('return-orders', [ReturnOrderController::class, 'index'])->middleware('permission:manage-return-orders')->name('return-orders.index');
            Route::get('return-orders/create', [ReturnOrderController::class, 'create'])->middleware('permission:create-return-orders')->name('return-orders.create');
            Route::get('return-orders/{returnOrder}/edit', [ReturnOrderController::class, 'edit'])->middleware('permission:edit-return-orders')->name('return-orders.edit');
            Route::get('return-orders/{returnOrder}', [ReturnOrderController::class, 'show'])->middleware('permission:view-return-orders')->name('return-orders.show');
            Route::post('return-orders', [ReturnOrderController::class, 'store'])->middleware('permission:create-return-orders')->name('return-orders.store');
            Route::put('return-orders/{returnOrder}', [ReturnOrderController::class, 'update'])->middleware('permission:edit-return-orders')->name('return-orders.update');
            Route::delete('return-orders/{returnOrder}', [ReturnOrderController::class, 'destroy'])->middleware('permission:delete-return-orders')->name('return-orders.destroy');

            // Return order data export.
            Route::get('return-orders/file/export/', [ReturnOrderController::class, 'fileExport'])->middleware('permission:export-return-orders')->name('return-orders.export');
        });

        // Purchase order management, sales order association, user assignment, activity history, comments, and data export.
        Route::middleware('permission:manage-purchase-orders')->group(function () {
            Route::get('purchase-orders', [PurchaseOrderController::class, 'index'])->middleware('permission:manage-purchase-orders')->name('purchase-orders.index');
            Route::get('purchase-orders/create', [PurchaseOrderController::class, 'create'])->middleware('permission:create-purchase-orders')->name('purchase-orders.create');
            Route::get('purchase-orders/{purchaseOrder}/edit', [PurchaseOrderController::class, 'edit'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.edit');
            Route::get('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->middleware('permission:view-purchase-orders')->name('purchase-orders.show');
            Route::post('purchase-orders', [PurchaseOrderController::class, 'store'])->middleware('permission:create-purchase-orders')->name('purchase-orders.store');
            Route::put('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.update');
            Route::delete('purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->middleware('permission:delete-purchase-orders')->name('purchase-orders.destroy');
            Route::put('purchase-orders/{purchaseOrder}/toggle-status', [PurchaseOrderController::class, 'toggleStatus'])->middleware('permission:toggle-status-purchase-orders')->name('purchase-orders.toggle-status');
            Route::put('purchase-orders/{purchaseOrder}/add-sales-order', [PurchaseOrderController::class, 'addSalesOrder'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.add-sales-order');
            Route::put('purchase-orders/{purchaseOrder}/assign-user', [PurchaseOrderController::class, 'assignUser'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.assign-user');
            Route::post('purchase-orders/{purchaseOrder}/comments', [PurchaseOrderCommentController::class, 'store'])->middleware('permission:create-purchase-orders')->name('purchase-orders.comments.store');
            Route::put('purchase-orders/{purchaseOrder}/activities/{activity}/comment', [PurchaseOrderCommentController::class, 'updateActivity'])->middleware('permission:edit-purchase-orders')->name('purchase-orders.comments.update-activity');
            Route::delete('purchase-orders/{purchaseOrder}/activities', [PurchaseOrderController::class, 'deleteActivities'])->middleware('permission:delete-purchase-orders')->name('purchase-orders.delete-activities');
            Route::delete('purchase-orders/{purchaseOrder}/activities/{activity}', [PurchaseOrderController::class, 'deleteActivity'])->middleware('permission:delete-purchase-orders')->name('purchase-orders.delete-activity');

            // Purchase order data export.
            Route::get('purchase-orders/file/export/', [PurchaseOrderController::class, 'fileExport'])->middleware('permission:export-purchase-orders')->name('purchase-orders.export');
        });

        // Receipt order management, user assignment, status changes, and data export.
        Route::middleware('permission:manage-receipt-orders')->group(function () {
            Route::get('receipt-orders', [ReceiptOrderController::class, 'index'])->middleware('permission:manage-receipt-orders')->name('receipt-orders.index');
            Route::get('receipt-orders/create', [ReceiptOrderController::class, 'create'])->middleware('permission:create-receipt-orders')->name('receipt-orders.create');
            Route::get('receipt-orders/{receiptOrder}/edit', [ReceiptOrderController::class, 'edit'])->middleware('permission:edit-receipt-orders')->name('receipt-orders.edit');
            Route::get('receipt-orders/{receiptOrder}', [ReceiptOrderController::class, 'show'])->middleware('permission:view-receipt-orders')->name('receipt-orders.show');
            Route::post('receipt-orders', [ReceiptOrderController::class, 'store'])->middleware('permission:create-receipt-orders')->name('receipt-orders.store');
            Route::put('receipt-orders/{receiptOrder}', [ReceiptOrderController::class, 'update'])->middleware('permission:edit-receipt-orders')->name('receipt-orders.update');
            Route::delete('receipt-orders/{receiptOrder}', [ReceiptOrderController::class, 'destroy'])->middleware('permission:delete-receipt-orders')->name('receipt-orders.destroy');
            Route::put('receipt-orders/{receiptOrder}/toggle-status', [ReceiptOrderController::class, 'toggleStatus'])->middleware('permission:toggle-status-receipt-orders')->name('receipt-orders.toggle-status');

            Route::put('receipt-orders/{receiptOrder}/assign-user', [ReceiptOrderController::class, 'assignUser'])->middleware('permission:edit-receipt-orders')->name('receipt-orders.assign-user');

            // Receipt order data export.
            Route::get('receipt-orders/file/export/', [ReceiptOrderController::class, 'fileExport'])->middleware('permission:export-receipt-orders')->name('receipt-orders.export');
        });

        // Project management, status changes, and data export.
        Route::middleware('permission:manage-projects')->group(function () {
            Route::get('projects', [ProjectController::class, 'index'])->middleware('permission:manage-projects')->name('projects.index');
            Route::get('projects/{project}', [ProjectController::class, 'show'])->middleware('permission:view-projects')->name('projects.show');
            Route::post('projects', [ProjectController::class, 'store'])->middleware('permission:create-projects')->name('projects.store');
            Route::put('projects/{project}', [ProjectController::class, 'update'])->middleware('permission:edit-projects')->name('projects.update');
            Route::delete('projects/{project}', [ProjectController::class, 'destroy'])->middleware('permission:delete-projects')->name('projects.destroy');
            Route::put('projects/{project}/toggle-status', [ProjectController::class, 'toggleStatus'])->middleware('permission:toggle-status-projects')->name('projects.toggle-status');

            // Project data export.
            Route::get('projects/file/export/', [ProjectController::class, 'fileExport'])->middleware('permission:export-projects')->name('projects.export');
        });

        // Project task management, status changes, project views, task relationships, and data export.
        Route::middleware('permission:manage-project-tasks')->group(function () {
            Route::get('project-tasks', [ProjectTaskController::class, 'index'])->middleware('permission:manage-project-tasks')->name('project-tasks.index');
            Route::get('project-tasks/{task}', [ProjectTaskController::class, 'show'])->middleware('permission:view-project-tasks')->name('project-tasks.show');
            Route::post('project-tasks', [ProjectTaskController::class, 'store'])->middleware('permission:create-project-tasks')->name('project-tasks.store');
            Route::put('project-tasks/{task}', [ProjectTaskController::class, 'update'])->middleware('permission:edit-project-tasks')->name('project-tasks.update');
            Route::delete('project-tasks/{task}', [ProjectTaskController::class, 'destroy'])->middleware('permission:delete-project-tasks')->name('project-tasks.destroy');
            Route::put('project-tasks/{task}/toggle-status', [ProjectTaskController::class, 'toggleStatus'])->middleware('permission:move-project-task')->name('project-tasks.toggle-status');
            Route::get('projects/{project}/kanban', [ProjectTaskController::class, 'kanban'])->middleware('permission:view-project-tasks')->name('projects.kanban');
            Route::get('projects/{project}/gantt', [ProjectTaskController::class, 'gantt'])->middleware('permission:view-project-tasks')->name('projects.gantt');
            Route::put('project-tasks/{task}/update-status', [ProjectTaskController::class, 'updateStatus'])->middleware('permission:move-project-task')->name('project-tasks.update-status');
            Route::get('api/project-tasks/parent-tasks/{projectId}', [ProjectTaskController::class, 'getParentTasks'])->name('api.project-tasks.parent-tasks');
            Route::get('api/projects/{projectId}/details', [ProjectTaskController::class, 'getProjectDetails'])->name('api.projects.details');

            // Project task data export.
            Route::get('project-tasks/file/export/', [ProjectTaskController::class, 'fileExport'])->middleware('permission:export-project-tasks')->name('project-tasks.export');
        });

        // Project task status configuration and status management.
        Route::middleware('permission:manage-task-statuses')->group(function () {
            Route::get('task-statuses', [TaskStatusController::class, 'index'])->middleware('permission:manage-task-statuses')->name('task-statuses.index');
            Route::post('task-statuses', [TaskStatusController::class, 'store'])->middleware('permission:create-task-statuses')->name('task-statuses.store');
            Route::put('task-statuses/{taskStatus}', [TaskStatusController::class, 'update'])->middleware('permission:edit-task-statuses')->name('task-statuses.update');
            Route::delete('task-statuses/{taskStatus}', [TaskStatusController::class, 'destroy'])->middleware('permission:delete-task-statuses')->name('task-statuses.destroy');
            Route::put('task-statuses/{taskStatus}/toggle-status', [TaskStatusController::class, 'toggleStatus'])->middleware('permission:toggle-status-task-statuses')->name('task-statuses.toggle-status');
        });

        // Meeting management and supporting endpoints for parent records and attendee selection.
        Route::middleware('permission:manage-meetings')->group(function () {
            Route::get('meetings', [MeetingController::class, 'index'])->middleware('permission:manage-meetings')->name('meetings.index');
            Route::get('meetings/{meeting}', [MeetingController::class, 'show'])->middleware('permission:view-meetings')->name('meetings.show');
            Route::post('meetings', [MeetingController::class, 'store'])->middleware('permission:create-meetings')->name('meetings.store');
            Route::put('meetings/{meeting}', [MeetingController::class, 'update'])->middleware('permission:edit-meetings')->name('meetings.update');
            Route::delete('meetings/{meeting}', [MeetingController::class, 'destroy'])->middleware('permission:delete-meetings')->name('meetings.destroy');
            Route::put('meetings/{meeting}/toggle-status', [MeetingController::class, 'toggleStatus'])->middleware('permission:toggle-status-meetings')->name('meetings.toggle-status');
            Route::get('api/parent-module/{module}', [MeetingController::class, 'getParentModuleRecords'])->name('api.parent-module.records');
            Route::get('api/attendee-types/{type}', [MeetingController::class, 'getAttendeeRecords'])->name('api.attendee-types.records');
        });

        // Call management and supporting endpoints for parent records and attendee selection.
        Route::middleware('permission:manage-calls')->group(function () {
            Route::get('calls', [CallController::class, 'index'])->middleware('permission:manage-calls')->name('calls.index');
            Route::get('calls/{call}', [CallController::class, 'show'])->middleware('permission:view-calls')->name('calls.show');
            Route::post('calls', [CallController::class, 'store'])->middleware('permission:create-calls')->name('calls.store');
            Route::put('calls/{call}', [CallController::class, 'update'])->middleware('permission:edit-calls')->name('calls.update');
            Route::delete('calls/{call}', [CallController::class, 'destroy'])->middleware('permission:delete-calls')->name('calls.destroy');
            Route::put('calls/{call}/toggle-status', [CallController::class, 'toggleStatus'])->middleware('permission:toggle-status-calls')->name('calls.toggle-status');
            Route::get('api/calls/parent-module/{module}', [CallController::class, 'getParentModuleRecords'])->name('api.calls.parent-module.records');
            Route::get('api/calls/attendee-types/{type}', [CallController::class, 'getAttendeeRecords'])->name('api.calls.attendee-types.records');
        });

        // Calendar access for scheduled intermediary/underwriter activities.
        Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');

        // Google Calendar synchronization and connection status endpoints.
        Route::get('calendar/google-calendar/events', [GoogleCalendarController::class, 'getEvents'])->name('calendar.google-calendar.events');
        Route::post('calendar/google-calendar/sync', [GoogleCalendarController::class, 'syncEvents'])->name('calendar.google-calendar.sync');
        Route::get('calendar/google-calendar/status', [GoogleCalendarController::class, 'checkStatus'])->name('calendar.google-calendar.status');

        // Document folder management and status controls.
        Route::middleware('permission:manage-document-folders')->group(function () {
            Route::get('document-folders', [DocumentFolderController::class, 'index'])->middleware('permission:manage-document-folders')->name('documents.document-folders.index');
            Route::get('document-folders/{documentFolder}', [DocumentFolderController::class, 'show'])->middleware('permission:view-document-folders')->name('documents.document-folders.show');
            Route::put('document-folders/{documentFolder}/toggle-status', [DocumentFolderController::class, 'toggleStatus'])->middleware('permission:toggle-status-document-folders')->name('documents.document-folders.toggle-status');
        });

        // Activity stream access and cleanup across CRM records.
        Route::middleware('permission:manage-stream')->group(function () {
            Route::get('stream', [StreamController::class, 'index'])->middleware('permission:manage-stream')->name('stream.index');

            // Account activity stream access and cleanup.
            Route::get('stream/account-activities', [StreamController::class, 'accountActivities'])->middleware('permission:view-stream')->name('stream.account-activities');
            Route::delete('stream/account-activities/{id}', [StreamController::class, 'deleteAccountActivity'])->middleware('permission:delete-stream')->name('stream.delete-account-activities');

            // Invoice activity stream access and cleanup.
            Route::get('stream/invoice-activities', [StreamController::class, 'invoiceActivities'])->middleware('permission:view-stream')->name('stream.invoice-activities');
            Route::delete('stream/invoice-activities/{id}', [StreamController::class, 'deleteInvoiceActivity'])->middleware('permission:delete-stream')->name('stream.delete-invoice-activities');

            // Lead activity stream access and cleanup.
            Route::get('stream/lead-activities', [StreamController::class, 'leadActivities'])->middleware('permission:view-stream')->name('stream.lead-activities');
            Route::delete('stream/lead-activities/{id}', [StreamController::class, 'deleteLeadActivity'])->middleware('permission:delete-stream')->name('stream.delete-lead-activities');

            // Opportunity activity stream access and cleanup.
            Route::get('stream/opportunity-activities', [StreamController::class, 'opportunityActivities'])->middleware('permission:view-stream')->name('stream.opportunity-activities');
            Route::delete('stream/opportunity-activities/{id}', [StreamController::class, 'deleteOpportunityActivity'])->middleware('permission:delete-stream')->name('stream.delete-opportunity-activities');

            // Purchase order activity stream access and cleanup.
            Route::get('stream/purchase-order-activities', [StreamController::class, 'purchaseOrderActivities'])->middleware('permission:view-stream')->name('stream.purchase-order-activities');
            Route::delete('stream/purchase-order-activities/{id}', [StreamController::class, 'deletePurchaseOrderActivity'])->middleware('permission:delete-stream')->name('stream.delete-purchase-order-activities');

            // Quote activity stream access and cleanup.
            Route::get('stream/quote-activities', [StreamController::class, 'quoteActivities'])->middleware('permission:view-stream')->name('stream.quote-activities');
            Route::delete('stream/quote-activities/{id}', [StreamController::class, 'deleteQuoteActivity'])->middleware('permission:delete-stream')->name('stream.delete-quote-activities');

            // Sales order activity stream access and cleanup.
            Route::get('stream/sales-order-activities', [StreamController::class, 'salesOrderActivities'])->middleware('permission:view-stream')->name('stream.sales-order-activities');
            Route::delete('stream/sales-order-activities/{id}', [StreamController::class, 'deleteSalesOrderActivity'])->middleware('permission:delete-stream')->name('stream.delete-sales-order-activities');
        });

        // Shared note management.
        Route::middleware('permission:manage-notes')->group(function () {
            Route::get('notes', [NoteController::class, 'index'])->middleware('permission:manage-notes')->name('notes.index');
            Route::post('notes', [NoteController::class, 'store'])->middleware('permission:create-notes')->name('notes.store');
            Route::put('notes/{note}', [NoteController::class, 'update'])->middleware('permission:edit-notes')->name('notes.update');
            Route::delete('notes/{note}', [NoteController::class, 'destroy'])->middleware('permission:delete-notes')->name('notes.destroy');
        });

        // Announcement category configuration and status management.
        Route::middleware('permission:manage-announcement-categories')->group(function () {
            Route::get('announcement-categories', [AnnouncementCategoryController::class, 'index'])->middleware('permission:manage-announcement-categories')->name('announcement-categories.index');
            Route::post('announcement-categories', [AnnouncementCategoryController::class, 'store'])->middleware('permission:create-announcement-categories')->name('announcement-categories.store');
            Route::put('announcement-categories/{category}', [AnnouncementCategoryController::class, 'update'])->middleware('permission:edit-announcement-categories')->name('announcement-categories.update');
            Route::delete('announcement-categories/{category}', [AnnouncementCategoryController::class, 'destroy'])->middleware('permission:delete-announcement-categories')->name('announcement-categories.destroy');
            Route::put('announcement-categories/{category}/toggle-status', [AnnouncementCategoryController::class, 'toggleStatus'])->middleware('permission:toggle-status-announcement-categories')->name('announcement-categories.toggle-status');
        });

        // Announcement publishing, maintenance, status management, and dashboard access.
        Route::middleware('permission:manage-announcements')->group(function () {
            Route::get('announcements/dashboard', [AnnouncementController::class, 'dashboard'])->middleware('permission:manage-announcements')->name('announcements.dashboard');
            Route::get('announcements', [AnnouncementController::class, 'index'])->middleware('permission:manage-announcements')->name('announcements.index');
            Route::get('announcements/{announcement}', [AnnouncementController::class, 'show'])->middleware('permission:view-announcements')->name('announcements.show');
            Route::post('announcements', [AnnouncementController::class, 'store'])->middleware('permission:create-announcements')->name('announcements.store');
            Route::put('announcements/{announcement}', [AnnouncementController::class, 'update'])->middleware('permission:edit-announcements')->name('announcements.update');
            Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy'])->middleware('permission:delete-announcements')->name('announcements.destroy');
            Route::put('announcements/{announcement}/toggle-status', [AnnouncementController::class, 'toggleStatus'])->middleware('permission:toggle-status-announcements')->name('announcements.toggle-status');
        });

        // Document type configuration and status management.
        Route::middleware('permission:manage-document-types')->group(function () {
            Route::get('document-types', [DocumentTypeController::class, 'index'])->middleware('permission:manage-document-types')->name('document-types.index');
            Route::get('document-types/{documentType}', [DocumentTypeController::class, 'show'])->middleware('permission:view-document-types')->name('document-types.show');
            Route::post('document-types', [DocumentTypeController::class, 'store'])->middleware('permission:create-document-types')->name('document-types.store');
            Route::put('document-types/{documentType}', [DocumentTypeController::class, 'update'])->middleware('permission:edit-document-types')->name('document-types.update');
            Route::delete('document-types/{documentType}', [DocumentTypeController::class, 'destroy'])->middleware('permission:delete-document-types')->name('document-types.destroy');
            Route::put('document-types/{documentType}/toggle-status', [DocumentTypeController::class, 'toggleStatus'])->middleware('permission:toggle-status-document-types')->name('document-types.toggle-status');
        });

        // Document and folder management, downloads, and status controls.
        Route::middleware('permission:manage-documents')->group(function () {
            Route::get('documents', [DocumentController::class, 'index'])->middleware('permission:manage-documents')->name('documents.index');
            Route::get('documents/{document}', [DocumentController::class, 'show'])->middleware('permission:view-documents')->name('documents.show');
            Route::get('documents/{document}/download', [DocumentController::class, 'download'])->middleware('permission:view-documents')->name('documents.download');
            Route::post('documents', [DocumentController::class, 'store'])->middleware('permission:create-documents')->name('documents.store');
            Route::put('documents/{document}', [DocumentController::class, 'update'])->middleware('permission:edit-documents')->name('documents.update');
            Route::delete('documents/{document}', [DocumentController::class, 'destroy'])->middleware('permission:delete-documents')->name('documents.destroy');
            Route::put('documents/{document}/toggle-status', [DocumentController::class, 'toggleStatus'])->middleware('permission:toggle-status-documents')->name('documents.toggle-status');
            Route::post('document-folders', [DocumentFolderController::class, 'store'])->middleware('permission:create-document-folders')->name('documents.document-folders.store');
            Route::put('document-folders/{documentFolder}', [DocumentFolderController::class, 'update'])->middleware('permission:edit-document-folders')->name('documents.document-folders.update');
            Route::delete('document-folders/{documentFolder}', [DocumentFolderController::class, 'destroy'])->middleware('permission:delete-document-folders')->name('documents.document-folders.destroy');
            Route::get('documents/folder/{folder}', [DocumentFolderController::class, 'show'])->middleware('permission:view-documents')->name('documents.folder');
        });

        // Internal intelligence generation endpoint.
        Route::post('api/kakbima-intelligence/generate', [KakbimaIntelligenceController::class, 'generate'])->name('kakbima-intelligence.generate');

        // Sign-in history access and retention management.
        Route::middleware('permission:manage-sign-in-history')->group(function () {
            Route::get('sign-in-history', [SignInHistoryController::class, 'index'])->middleware('permission:show-sign-in-history')->name('sign-in-history.index');
            Route::delete('sign-in-history/{signInDetails}', [SignInHistoryController::class, 'destroy'])->middleware('permission:delete-sign-in-history')->name('sign-in-history.destroy');
        });

        // Super-admin impersonation controls and session entry.
        Route::middleware(['ensure_super_admin'])->group(function () {
            Route::get('on-behalf-of/{userId}', [ImpersonateController::class, 'start'])->name('on-behalf-of.start');
        });
    }); // End check.subscription middleware group
    Route::post('on-behalf-of/leave', [ImpersonateController::class, 'leave'])->name('on-behalf-of.leave');
});

//Route::match(['GET', 'POST'], 'subscriptions/payments/easebuzz/success', [EasebuzzPaymentController::class, 'success'])->name('easebuzz.success');
//Route::post('subscriptions/payments/easebuzz/callback', [EasebuzzPaymentController::class, 'callback'])->name('easebuzz.callback');

// Public invoice access and customer-facing payment page endpoints.
Route::get('invoices/public/{invoice}', [InvoiceController::class, 'publicView'])->name('customer-facing.invoices.public');
Route::get('invoice-payment/{method}', [InvoiceController::class, 'showPaymentPage'])->name('customer-facing.invoice.payment.page');

// Public quote and sales order access for customer-facing workflows.
Route::get('quotes/public/{quote}', [QuoteController::class, 'publicView'])->name('customer-facing.quotes.public');
Route::get('sales-orders/public/{salesOrder}', [SalesOrderController::class, 'publicView'])->name('customer-facing.sales-orders.public');
//Route::post('invoices/payment/stripe', [InvoiceStripePaymentController::class, 'processPayment'])->name('customer-facing.invoice.stripe.payment');
//Route::post('invoices/payment/stripe/confirm', [InvoiceStripePaymentController::class, 'confirmPayment'])->name('customer-facing.invoice.stripe.confirm');
//Route::post('invoices/payment/paypal', [InvoicePayPalPaymentController::class, 'processPayment'])->name('customer-facing.invoice.paypal.payment');
//Route::post('invoices/payment/razorpay/create-order', [InvoiceRazorpayPaymentController::class, 'createOrder'])->name('customer-facing.invoice.razorpay.create-order');
//Route::post('invoices/payment/razorpay', [InvoiceRazorpayPaymentController::class, 'processPayment'])->name('customer-facing.invoice.razorpay.payment');
//Route::post('invoices/payment/mercadopago/create-preference', [InvoiceMercadoPagoPaymentController::class, 'createPreference'])->name('customer-facing.invoice.mercadopago.create-preference');
//Route::get('invoices/payment/mercadopago/success', [InvoiceMercadoPagoPaymentController::class, 'success'])->name('customer-facing.invoice.mercadopago.success');
//Route::get('invoices/payment/mercadopago/failure', [InvoiceMercadoPagoPaymentController::class, 'failure'])->name('customer-facing.invoice.mercadopago.failure');
//Route::get('invoices/payment/mercadopago/pending', [InvoiceMercadoPagoPaymentController::class, 'pending'])->name('customer-facing.invoice.mercadopago.pending');
Route::post('invoices/payment/paystack', [InvoicePaystackPaymentController::class, 'processPayment'])->name('customer-facing.invoice.paystack.payment');
//Route::post('invoices/payment/flutterwave', [InvoiceFlutterwavePaymentController::class, 'processPayment'])->name('customer-facing.invoice.flutterwave.payment');
//Route::post('invoices/payment/paytabs', [InvoicePayTabsPaymentController::class, 'processPayment'])->name('customer-facing.invoice.paytabs.payment');
//Route::get('invoices/payment/paytabs/success', [InvoicePayTabsPaymentController::class, 'success'])->name('customer-facing.invoice.paytabs.success');
//Route::match(['GET', 'POST'], 'invoices/payment/paytabs/callback', [InvoicePayTabsPaymentController::class, 'callback'])->name('customer-facing.invoice.paytabs.callback');
//Route::post('invoices/payment/skrill', [InvoiceSkrillPaymentController::class, 'processPayment'])->name('customer-facing.invoice.skrill.payment');
//Route::post('invoices/payment/skrill/callback', [InvoiceSkrillPaymentController::class, 'callback'])->name('customer-facing.invoice.skrill.callback');
//Route::post('invoices/payment/coingate', [InvoiceCoingatePaymentController::class, 'processPayment'])->name('customer-facing.invoice.coingate.payment');
//Route::match(['GET', 'POST'], 'invoices/payment/coingate/callback', [InvoiceCoingatePaymentController::class, 'callback'])->name('customer-facing.invoice.coingate.callback');
Route::post('invoices/payment/bank', [InvoiceBankPaymentController::class, 'processPayment'])->name('customer-facing.invoice.bank.payment');
//Route::post('invoices/payment/benefit', [InvoiceBenefitPaymentController::class, 'processPayment'])->name('customer-facing.invoice.benefit.payment');
//Route::get('invoices/payment/benefit/success', [InvoiceBenefitPaymentController::class, 'success'])->name('customer-facing.invoice.benefit.success');
//Route::post('invoices/payment/benefit/callback', [InvoiceBenefitPaymentController::class, 'callback'])->name('customer-facing.invoice.benefit.callback');
//Route::post('invoices/payment/payfast', [InvoicePayfastPaymentController::class, 'processPayment'])->name('customer-facing.invoice.payfast.payment');
//Route::get('invoices/payment/payfast/success', [InvoicePayfastPaymentController::class, 'success'])->name('customer-facing.invoice.payfast.success');
//Route::post('invoices/payment/payfast/callback', [InvoicePayfastPaymentController::class, 'callback'])->name('customer-facing.invoice.payfast.callback');
//Route::post('invoices/payment/tap', [InvoiceTapPaymentController::class, 'processPayment'])->name('customer-facing.invoice.tap.payment');
//Route::get('invoices/payment/tap/success', [InvoiceTapPaymentController::class, 'success'])->name('customer-facing.invoice.tap.success');
//Route::post('invoices/payment/tap/callback', [InvoiceTapPaymentController::class, 'callback'])->name('customer-facing.invoice.tap.callback');
//Route::post('invoices/payment/xendit', [InvoiceXenditPaymentController::class, 'createPayment'])->name('customer-facing.invoice.xendit.payment');
//Route::get('invoices/payment/xendit/success', [InvoiceXenditPaymentController::class, 'success'])->name('customer-facing.invoice.xendit.success');
//Route::post('invoices/payment/xendit/callback', [InvoiceXenditPaymentController::class, 'callback'])->name('customer-facing.invoice.xendit.callback');
//Route::post('invoices/payment/paytr/create-token', [InvoicePayTRPaymentController::class, 'createPaymentToken'])->name('customer-facing.invoice.paytr.create-token');
//Route::get('invoices/payment/paytr/success', [InvoicePayTRPaymentController::class, 'success'])->name('customer-facing.invoice.paytr.success');
//Route::get('invoices/payment/paytr/failure', [InvoicePayTRPaymentController::class, 'failure'])->name('customer-facing.invoice.paytr.failure');
//Route::post('invoices/payment/paytr/callback', [InvoicePayTRPaymentController::class, 'callback'])->name('customer-facing.invoice.paytr.callback');
//Route::post('invoices/payment/mollie', [InvoiceMolliePaymentController::class, 'processPayment'])->name('customer-facing.invoice.mollie.payment');
//Route::get('invoices/payment/mollie/success', [InvoiceMolliePaymentController::class, 'success'])->name('customer-facing.invoice.mollie.success');
//Route::post('invoices/payment/mollie/callback', [InvoiceMolliePaymentController::class, 'callback'])->name('customer-facing.invoice.mollie.callback');
//Route::post('invoices/payment/toyyibpay', [InvoiceToyyibPayPaymentController::class, 'processPayment'])->name('customer-facing.invoice.toyyibpay.payment');
//Route::match(['GET', 'POST'], 'invoices/payment/toyyibpay/success', [InvoiceToyyibPayPaymentController::class, 'success'])->name('customer-facing.invoice.toyyibpay.success');
//Route::post('invoices/payment/toyyibpay/callback', [InvoiceToyyibPayPaymentController::class, 'callback'])->name('customer-facing.invoice.toyyibpay.callback');
//Route::post('invoices/payment/iyzipay/create-form', [InvoiceIyzipayPaymentController::class, 'createPaymentForm'])->name('customer-facing.invoice.iyzipay.create-form');
//Route::post('invoices/payment/aamarpay/create', [InvoiceAamarpayPaymentController::class, 'createPayment'])->name('customer-facing.invoice.aamarpay.create');
//Route::match(['GET', 'POST'], 'invoices/payment/aamarpay/success', [InvoiceAamarpayPaymentController::class, 'success'])->name('customer-facing.invoice.aamarpay.success');
//Route::post('invoices/payment/aamarpay/callback', [InvoiceAamarpayPaymentController::class, 'callback'])->name('customer-facing.invoice.aamarpay.callback');
//Route::post('invoices/payment/midtrans/create', [InvoiceMidtransPaymentController::class, 'createPayment'])->name('customer-facing.invoice.midtrans.create');
//Route::match(['GET', 'POST'], 'invoices/payment/midtrans/success', [InvoiceMidtransPaymentController::class, 'success'])->name('customer-facing.invoice.midtrans.success');
//Route::post('invoices/payment/midtrans/callback', [InvoiceMidtransPaymentController::class, 'callback'])->name('customer-facing.invoice.midtrans.callback');
//Route::post('invoices/payment/yookassa/create-payment', [InvoiceYooKassaPaymentController::class, 'createPayment'])->name('customer-facing.invoice.yookassa.create-payment');
//Route::get('invoices/payment/yookassa/success', [InvoiceYooKassaPaymentController::class, 'success'])->name('customer-facing.invoice.yookassa.success');
//Route::post('invoices/payment/yookassa/callback', [InvoiceYooKassaPaymentController::class, 'callback'])->name('customer-facing.invoice.yookassa.callback');
//Route::post('invoices/payment/paiement/create-payment', [InvoicePaiementPaymentController::class, 'createPayment'])->name('customer-facing.invoice.paiement.create-payment');
//Route::get('invoices/payment/paiement/success', [InvoicePaiementPaymentController::class, 'success'])->name('customer-facing.invoice.paiement.success');
//Route::post('invoices/payment/paiement/callback', [InvoicePaiementPaymentController::class, 'callback'])->name('customer-facing.invoice.paiement.callback');
//Route::post('invoices/payment/cinetpay/create-payment', [InvoiceCinetPayPaymentController::class, 'createPayment'])->name('customer-facing.invoice.cinetpay.create-payment');
//Route::get('invoices/payment/cinetpay/success', [InvoiceCinetPayPaymentController::class, 'success'])->name('customer-facing.invoice.cinetpay.success');
//Route::post('invoices/payment/cinetpay/callback', [InvoiceCinetPayPaymentController::class, 'callback'])->name('customer-facing.invoice.cinetpay.callback');
//Route::post('invoices/payment/payhere/create-payment', [InvoicePayHerePaymentController::class, 'createPayment'])->name('customer-facing.invoice.payhere.create-payment');
//Route::get('invoices/payment/payhere/success', [InvoicePayHerePaymentController::class, 'success'])->name('customer-facing.invoice.payhere.success');
//Route::post('invoices/payment/payhere/callback', [InvoicePayHerePaymentController::class, 'callback'])->name('customer-facing.invoice.payhere.callback');
//Route::post('invoices/payment/fedapay/create-payment', [InvoiceFedaPayPaymentController::class, 'createPayment'])->name('customer-facing.invoice.fedapay.create-payment');
//Route::match(['GET', 'POST'], 'invoices/payment/fedapay/callback', [InvoiceFedaPayPaymentController::class, 'callback'])->name('customer-facing.invoice.fedapay.callback');
//Route::post('invoices/payment/authorizenet', [InvoiceAuthorizeNetPaymentController::class, 'processPayment'])->name('customer-facing.invoice.authorizenet.payment');
//Route::post('invoices/payment/khalti/create-payment', [InvoiceKhaltiPaymentController::class, 'createPayment'])->name('customer-facing.invoice.khalti.create-payment');
//Route::post('invoices/payment/khalti', [InvoiceKhaltiPaymentController::class, 'processPayment'])->name('customer-facing.invoice.khalti.payment');
//Route::post('invoices/payment/easebuzz/create-payment', [InvoiceEasebuzzPaymentController::class, 'createPayment'])->name('customer-facing.invoice.easebuzz.create-payment');
//Route::match(['GET', 'POST'], 'invoices/payment/easebuzz/success', [InvoiceEasebuzzPaymentController::class, 'success'])->name('customer-facing.invoice.easebuzz.success');
//Route::match(['GET', 'POST'], 'invoices/payment/easebuzz/failure', [InvoiceEasebuzzPaymentController::class, 'failure'])->name('customer-facing.invoice.easebuzz.failure');
//Route::post('invoices/payment/easebuzz/callback', [InvoiceEasebuzzPaymentController::class, 'callback'])->name('customer-facing.invoice.easebuzz.callback');
//Route::post('invoices/payment/ozow/create-payment', [InvoiceOzowPaymentController::class, 'createPayment'])->name('customer-facing.invoice.ozow.create-payment');
//Route::get('invoices/payment/ozow/success', [InvoiceOzowPaymentController::class, 'success'])->name('customer-facing.invoice.ozow.success');
//Route::post('invoices/payment/ozow/callback', [InvoiceOzowPaymentController::class, 'callback'])->name('customer-facing.invoice.ozow.callback');
//Route::post('invoices/payment/cashfree/create-session', [InvoiceCashfreePaymentController::class, 'createPaymentSession'])->name('customer-facing.invoice.cashfree.create-session');
//Route::post('invoices/payment/cashfree/verify-payment', [InvoiceCashfreePaymentController::class, 'verifyPayment'])->name('customer-facing.invoice.cashfree.verify-payment');
//Route::post('invoices/payment/cashfree/webhook', [InvoiceCashfreePaymentController::class, 'webhook'])->name('customer-facing.invoice.cashfree.webhook')->withoutMiddleware(VerifyCsrfToken::class);

// Authenticated invoice payment approval and rejection workflow. All application routes below require an authenticated and verified user. Subscription-gated modules are isolated in the nested group.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('invoices/payments/{paymentId}/approve', [InvoiceController::class, 'approvePayment'])->name('customer-facing.invoice.payments.approve');
    Route::post('invoices/payments/{paymentId}/reject', [InvoiceController::class, 'rejectPayment'])->name('customer-facing.invoice.payments.reject');
});

// Cookie consent persistence and user-accessible consent record download.
Route::post('/cookie-consent/store', [CookieConsentController::class, 'store'])->name('cookie.consent.store');
Route::get('/cookie-consent/download', [CookieConsentController::class, 'download'])->name('cookie.consent.download');

// Authenticated invoice template preview. All application routes below require an authenticated and verified user. Subscription-gated modules are isolated in the nested group.
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('invoices/preview/{templateId}/{color}', [InvoiceController::class, 'previewTemplate'])->name('customer-facing.invoice.preview');
});

Route::fallback(function () {
    return redirect()->route('login');
});
