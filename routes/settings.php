<?php

use App\Http\Controllers\InvoiceStripePaymentController;
use App\Http\Controllers\Settings\CurrencySettingController;
use App\Http\Controllers\Settings\EmailSettingController;
use App\Http\Controllers\Settings\OrganizationPaymentSettingController;
use App\Http\Controllers\Settings\OrganizationSystemSettingsController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\PaymentSettingController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SettingsController;
use App\Http\Controllers\Settings\SystemSettingsController;
use App\Http\Controllers\Settings\WebhookController;
use App\Http\Controllers\StripePaymentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
|
| Here are the routes for settings management.
|
*/

/*
|--------------------------------------------------------------------------
| Payment Routes
|--------------------------------------------------------------------------
|
| Payment methods and Stripe payment routes are accessible without
| the subscription check.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/payment-methods', [PaymentSettingController::class, 'getPaymentMethods'])
        ->name('payment.methods');

    Route::get('/enabled-payment-methods', [PaymentSettingController::class, 'getEnabledMethods'])
        ->name('payment.enabled-methods');

    Route::post('/stripe-payment', [StripePaymentController::class, 'processPayment'])
        ->name('settings.stripe.payment');
});

/*
|--------------------------------------------------------------------------
| Settings Routes
|--------------------------------------------------------------------------
|
| The following routes require authentication, email verification,
| and an active subscription.
|
*/

Route::middleware(['auth', 'verified', 'check.subscription'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Payment Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing administrator payment settings.
    |
    */

    Route::post('/payment-settings', [PaymentSettingController::class, 'store'])
        ->name('payment.settings');

    /*
    |--------------------------------------------------------------------------
    | Organization Payment Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing organization-level payment settings and
    | retrieving the payment methods configured for the organization.
    |
    */

    Route::post('/organization-payment-settings', [OrganizationPaymentSettingController::class, 'store'])
        ->name('organization.payment.settings');

    Route::get('/organization-payment-methods', [OrganizationPaymentSettingController::class, 'getOrganizationPaymentMethods'])
        ->name('organization.payment.methods');

    /*
    |--------------------------------------------------------------------------
    | Invoice Payment
    |--------------------------------------------------------------------------
    |
    | Routes for processing Stripe payments for invoices.
    |
    */

    Route::post('/invoice-stripe-payment', [InvoiceStripePaymentController::class, 'processPayment'])
        ->name('settings.invoice.stripe.payment');

    /*
    |--------------------------------------------------------------------------
    | My Account Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing the authenticated user's profile and password.
    |
    */

    Route::get('my-kakbima-account', ProfileController::class)
        ->name('my-kakbima-account.success');

    Route::patch('my-kakbima-account', [ProfileController::class, 'update'])
        ->name('my-kakbima-account.update');

    // Supports file uploads with method spoofing.
    Route::post('my-kakbima-account', [ProfileController::class, 'update']);

    Route::delete('my-kakbima-account', [ProfileController::class, 'destroy'])
        ->name('my-kakbima-account.destroy');

    Route::put('my-kakbima-account/password', [PasswordController::class, 'update'])
        ->name('my-kakbima-account.password.update');

    /*
    |--------------------------------------------------------------------------
    | General Settings
    |--------------------------------------------------------------------------
    |
    | Routes for accessing and managing general application settings.
    |
    */

    Route::get('settings', [SettingsController::class, 'index'])
        ->name('settings');

    /*
    |--------------------------------------------------------------------------
    | Email Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing application email configuration and testing
    | outgoing email.
    |
    */

    Route::prefix('settings/email')
        ->name('settings.email.')
        ->controller(EmailSettingController::class)
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/get', 'getEmailSettings')->name('get');
            Route::post('/update', 'updateEmailSettings')->name('update');
            Route::post('/test', 'sendTestEmail')->name('test');
        });

    /*
    |--------------------------------------------------------------------------
    | System Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing system-wide application settings.
    |
    */

    Route::post('settings/system', [SystemSettingsController::class, 'update'])
        ->name('settings.system.update');

    Route::post('settings/brand', [SystemSettingsController::class, 'updateBrand'])
        ->name('settings.brand.update');

    Route::post('settings/recaptcha', [SystemSettingsController::class, 'updateRecaptcha'])
        ->name('settings.recaptcha.update');

    Route::post('settings/chat-gpt', [SystemSettingsController::class, 'updateChatgpt'])
        ->name('settings.chat-gpt.update');

    Route::post('settings/cookie', [SystemSettingsController::class, 'updateCookie'])
        ->name('settings.cookie.update');

    Route::post('settings/storage', [SystemSettingsController::class, 'updateStorage'])
        ->name('settings.storage.update');

    Route::post('settings/cache/clear', [SystemSettingsController::class, 'clearCache'])
        ->name('settings.cache.clear');

    /*
    |--------------------------------------------------------------------------
    | Organization System Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing organization-level system settings.
    |
    */

    Route::post('settings/organization/system', [OrganizationSystemSettingsController::class, 'update'])
        ->name('settings.organization.system.update');

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing application currency settings.
    |
    */

    Route::post('settings/currency', [CurrencySettingController::class, 'update'])
        ->name('settings.currency.update');

    /*
    |--------------------------------------------------------------------------
    | Invoice Template Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing invoice template settings.
    |
    */

    Route::post('settings/invoice-template', [SystemSettingsController::class, 'updateInvoiceTemplate'])
        ->name('settings.invoice-template');

    /*
    |--------------------------------------------------------------------------
    | Quote Template Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing quote template settings.
    |
    */

    Route::post('settings/quote-template', [SystemSettingsController::class, 'updateQuoteTemplate'])
        ->name('settings.quote-template');

    /*
    |--------------------------------------------------------------------------
    | Sales Order Template Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing sales order template settings.
    |
    */

    Route::post('settings/sales-order-template', [SystemSettingsController::class, 'updateSalesOrderTemplate'])
        ->name('settings.sales-order-template');

    /*
    |--------------------------------------------------------------------------
    | Email Notification Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing email notification preferences and retrieving
    | the notifications available for configuration.
    |
    */

    Route::get('settings/email-notifications', [SystemSettingsController::class, 'getEmailNotifications'])
        ->name('settings.email-notifications.get');

    Route::get('settings/email-notifications/available', [SystemSettingsController::class, 'getAvailableEmailNotifications'])
        ->name('settings.email-notifications.available');

    Route::post('settings/email-notifications', [SystemSettingsController::class, 'updateEmailNotifications'])
        ->name('settings.email-notifications.update');

    /*
    |--------------------------------------------------------------------------
    | Twilio Notification Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing Twilio/SMS notification preferences and
    | retrieving the available notification events and configuration.
    |
    */

    Route::get('settings/twilio-notifications', [SystemSettingsController::class, 'getTwilioNotifications'])
        ->name('settings.twilio-notifications.get');

    Route::get('settings/twilio-notifications/available', [SystemSettingsController::class, 'getAvailableTwilioNotifications'])
        ->name('settings.twilio-notifications.available');

    Route::get('settings/twilio-config', [SystemSettingsController::class, 'getTwilioConfig'])
        ->name('settings.twilio-config.get');

    Route::post('settings/twilio-notifications', [SystemSettingsController::class, 'updateTwilioNotifications'])
        ->name('settings.twilio-notifications.update');

    Route::post('settings/sms/test', [SystemSettingsController::class, 'sendTestSMS'])
        ->name('settings.sms.test');

    /*
    |--------------------------------------------------------------------------
    | Slack Notification Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing Slack notification preferences and retrieving
    | the available notification events and configuration.
    |
    */

    Route::get('settings/slack-notifications', [SystemSettingsController::class, 'getSlackNotifications'])
        ->name('settings.slack-notifications.get');

    Route::get('settings/slack-notifications/available', [SystemSettingsController::class, 'getAvailableSlackNotifications'])
        ->name('settings.slack-notifications.available');

    Route::get('settings/slack-config', [SystemSettingsController::class, 'getSlackConfig'])
        ->name('settings.slack-config.get');

    Route::post('settings/slack-notifications', [SystemSettingsController::class, 'updateSlackNotifications'])
        ->name('settings.slack-notifications.update');

    Route::post('settings/slack/test', [SystemSettingsController::class, 'sendTestSlack'])
        ->name('settings.slack.test');

    /*
    |--------------------------------------------------------------------------
    | Webhook Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing application webhooks.
    |
    */

    Route::get('settings/webhooks', [WebhookController::class, 'index'])
        ->name('settings.webhooks.index');

    Route::post('settings/webhooks', [WebhookController::class, 'store'])
        ->name('settings.webhooks.store');

    Route::put('settings/webhooks/{webhook}', [WebhookController::class, 'update'])
        ->name('settings.webhooks.update');

    Route::delete('settings/webhooks/{webhook}', [WebhookController::class, 'destroy'])
        ->name('settings.webhooks.destroy');

    /*
    |--------------------------------------------------------------------------
    | Google Calendar Settings
    |--------------------------------------------------------------------------
    |
    | Routes for managing Google Calendar integration and synchronization.
    |
    */

    Route::post('settings/google-calendar', [SystemSettingsController::class, 'updateGoogleCalendar'])
        ->name('settings.google-calendar.update');

    Route::post('settings/google-calendar/sync', [SystemSettingsController::class, 'syncGoogleCalendar'])
        ->name('settings.google-calendar.sync');
});
