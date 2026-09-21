<?php

use App\Http\Controllers\ReferralController;
use App\Models\BaseModel;
use App\Models\Coupon;
use App\Models\EmailTemplate;
use App\Models\NotificationTemplate;
use App\Models\NotificationTemplateLang;
use App\Models\PaymentSetting;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserEmailTemplate;
use App\Models\UserNotificationTemplate;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

if (!function_exists('getCacheSize')) {
    /**
     * Get the total cache size in MB
     *
     * @return string
     */
    function getCacheSize(): string
    {
        $file_size = 0;
        $framework_path = storage_path('framework');

        if (is_dir($framework_path)) {
            foreach (File::allFiles($framework_path) as $file) {
                $file_size += $file->getSize();
            }
        }

        return number_format($file_size / 1000000, 2);
    }
}

if (!function_exists('settings')) {
    /**
     * Resolve and cache application settings for a given user context.
     *
     * Centralizes how settings are loaded across the system, including:
     * - Multi-tenant scoping (super admin vs organization vs child users)
     * - Transparent fallback to the owning organization/super admin
     * - In-request memoization + optional Redis persistence
     *
     * This prevents repeated DB access and ensures consistent configuration
     * resolution regardless of where it is called (controllers, jobs, views).
     *
     * Resolution rules:
     * - If no $user_id is provided:
     *   - super_admin / organization -> their own settings
     *   - other users -> inherit from `created_by`
     *   - unauthenticated -> fallback to first super_admin
     *
     * Behavior:
     * - Uses static in-memory cache per request
     * - Uses Redis (if available) for cross-request caching
     * - Falls back silently to DB if Redis is unavailable
     * - Merges a subset of super_admin settings for non-super-admin users
     *
     * Assumptions:
     * - A valid super_admin user exists in the system
     * - Settings are stored as key/value pairs
     *
     * Edge cases:
     * - Returns empty collection if no valid user_id can be resolved
     * - Does not invalidate cache automatically on updateSetting()
     *
     * Safe to call in all contexts (HTTP, CLI, queue), but:
     * - Behavior differs slightly without auth context
     *
     */
    function settings($user_id = null): array
    {
        static $localCache = [];

        // Resolve user_id if not provided
        if (is_null($user_id) && auth()?->check()) {
            $user = auth()->user();

            $user_id = $user->type === 'super_admin' || $user->type === 'organization'
                ? $user->id
                : $user->created_by;
        }

        if (!$user_id) {
            return [];
        }

        // Return from in-request cache if already loaded
        if (isset($localCache[$user_id])) {
            return $localCache[$user_id];
        }

        //        $cacheKey = "app_settings:{$user_id}";
        //        $ttl = 86400; // 24 hours
        //
        //        $redisAvailable = config('cache.stores.redis')
        //            && (class_exists(\Redis::class) || class_exists(\Predis\Client::class));
        //
        //        if ($redisAvailable) {
        //            $settings = Cache::store('redis')->remember(
        //                $cacheKey,
        //                $ttl,
        //                function () use ($user_id) {
        //                    return loadSettingsFromDb($user_id) ?? [];
        //                }
        //            );
        //        } else {
        //            // Redis not configured -> fallback to direct DB query silently
        //            $settings = loadSettingsFromDb($user_id) ?? [];
        //        }
        // Delete once Redis code above is enabled
        $settings = loadSettingsFromDb($user_id) ?? [];

        return $localCache[$user_id] = $settings;
    }
}

/**
 * Load raw settings from persistence and apply inheritance rules.
 *
 * This is the underlying data loader for settings(), separated to keep
 * caching concerns out of the retrieval logic.
 *
 * Responsibilities:
 * - Fetch user-specific settings from DB
 * - Merge a curated subset of super_admin settings for non-super-admin users
 *
 * Why this exists:
 * - Allows settings() to delegate DB access cleanly
 * - Keeps inheritance rules centralized and consistent
 *
 * Business rules:
 * - Only a whitelist of system-level keys are inherited from super_admin
 * - User-specific values always override inherited ones
 *
 * Assumptions:
 * - Super admin exists when inheritance is required
 *
 * Edge cases:
 * - Returns null/empty array if no settings found
 *
 */
function loadSettingsFromDb($user_id): array
{
    $userSettings = Setting::where('user_id', $user_id)?->pluck('value', 'key')?->toArray();

    // Merge in selected super_admin settings if needed
    if (auth()?->check() && auth()?->user()?->type !== 'super_admin') {
        $superAdmin = User::where('type', 'super_admin')?->first();
        if ($superAdmin) {
            $superAdminKeys = [
                'decimal_format', 'default_currency', 'thousands_separator', 'float_number',
                'currency_symbol_space', 'currency_symbol_position',
                'date_format', 'time_format', 'calendar_start_day', 'default_timezone', 'contact_us_url', 'contact_us_description', 'strictly_cookie_description', 'cookie_description', 'strictly_cookie_title', 'cookie_title', 'strictly_necessary_cookies', 'enable_logging'];

            $superAdminSettings = Setting::where('user_id', $superAdmin->id)
                ->whereIn('key', $superAdminKeys)?->pluck('value', 'key')?->toArray();

            $userSettings = array_merge($superAdminSettings, $userSettings);
        }
    }

    return $userSettings;
}

if (!function_exists('formatDateTime')) {
    /**
     * Format a date/time value using user-specific locale settings.
     *
     * Centralizes date formatting rules across the application to ensure:
     * - Consistent formatting (UI, exports, logs where applicable)
     * - Respect for user-configured timezone and format preferences
     *
     * Behavior:
     * - Applies timezone conversion before formatting
     * - Supports date-only or date+time output
     *
     * Assumptions:
     * - Input is parseable by Carbon
     *
     * Edge cases:
     * - Returns null for empty input
     * - Invalid date strings may throw from Carbon::parse()
     *
     * Safe in all contexts; depends on settings()
     *
     */
    function formatDateTime($date, $includeTime = true): ?string
    {
        if (!$date) {
            return null;
        }

        $settings = settings();

        $date_format = $settings['date_format'] ?? 'Y-m-d';
        $time_format = $settings['time_format'] ?? 'H:i';
        $timezone = $settings['default_timezone'] ?? config('app.timezone', 'UTC');

        $format = $includeTime ? "$date_format $time_format" : $date_format;

        return Carbon::parse($date)->timezone($timezone)->format($format);
    }
}

if (!function_exists('getSetting')) {
    /**
     * Retrieve a single setting value with layered fallback logic.
     *
     * Provides a consistent way to access configuration values while enforcing:
     * - Per-user overrides
     * - Fallback to defaultSettings() when not explicitly set
     *
     * Why this exists:
     * Avoids scattered "isset + fallback" logic across the codebase and ensures
     * all consumers respect the same default configuration contract.
     *
     * Behavior:
     * - Reads from settings() (cached + merged)
     * - Falls back to defaultSettings() ONLY if $default is not provided
     *
     * Edge cases:
     * - Returns null if setting is missing and no default exists
     *
     */
    function getSetting($key, $default = null, $user_id = null)
    {
        $settings = settings($user_id);

        // If no value found and no default provided, try to get from defaultSettings
        if (!isset($settings[$key]) && $default === null) {
            $defaultSettings = defaultSettings();
            $default = $defaultSettings[$key] ?? null;
        }

        return $settings[$key] ?? $default;
    }
}

if (!function_exists('updateSetting')) {
    /**
     * Persist a setting value for the resolved user scope.
     *
     * Encapsulates multi-tenant ownership rules to ensure settings are always
     * written against the correct "owner" (super_admin or organization).
     *
     * Why this exists:
     * Prevents inconsistent writes where child users accidentally override
     * their own settings instead of their parent organization.
     *
     * Resolution rules mirror settings():
     * - child users -> write to created_by
     * - organization/super_admin -> write to self
     * - unauthenticated -> fallback to super_admin
     *
     * Important:
     * - Does NOT invalidate any in-memory or Redis cache
     *   -> callers must handle cache invalidation if consistency is required
     *
     */
    function updateSetting($key, $value, $user_id = null): false|Setting|BaseModel
    {
        if (is_null($user_id)) {
            if (auth()?->user()) {
                if (!in_array(auth()?->user()?->type, ['super_admin', 'organization'])) {
                    $user_id = auth()?->user()?->created_by;
                } else {
                    $user_id = auth()?->id();
                }
            } else {
                $user = User::where('type', 'super_admin')?->first();
                $user_id = $user?->id;
            }
        }

        if (!$user_id) {
            return false;
        }

        return Setting::updateOrCreate(
            ['user_id' => $user_id, 'key' => $key],
            ['value' => $value]
        );
    }
}

if (!function_exists('defaultRoleAndSetting')) {
    /**
     * Initialize baseline roles and settings for a newly created user.
     *
     * Encapsulates all onboarding side effects required to make a user
     * operational within the system.
     *
     * Responsibilities:
     * - Assign default "organization" role if applicable
     * - Initialize settings based on user type
     * - Bootstrap organization-specific templates and data
     *
     * Why this exists:
     * Prevents partial user setup by ensuring all required artifacts are
     * created in a single, consistent flow.
     *
     * Behavior:
     * - super_admin -> creates full default settings
     * - organization -> copies system settings + seeds domain data/templates
     *
     * Side effects:
     * - Writes to roles, settings, and multiple template tables
     *
     * Assumptions:
     * - $user is already persisted
     *
     */
    function defaultRoleAndSetting($user): true
    {
        $organizationRole = Role::where('name', 'organization')?->first();

        if ($organizationRole) {
            $user->assignRole($organizationRole);
        }

        // Create default settings for the user
        if ($user->type === 'super_admin') {
            createDefaultSettings($user->id);
            createDefaultEmailTemplateSettings($user->id);
            createDefaultNotificationTemplateSettings($user->id);
        } elseif ($user->type === 'organization') {
            copySettingsFromSuperAdmin($user->id);
            createDefaultNotificationTemplates($user->id);
            createDefaultEmailTemplateSettings($user->id);
            createDefaultNotificationTemplateSettings($user->id);
            $user->organizationDefaultData($user);
        }

        return true;
    }
}

if (!function_exists('getPaymentSettings')) {
    /**
     * Resolve payment settings for a given user scope.
     *
     * Centralizes ownership rules for payment configuration, ensuring that
     * non-super-admin users always operate using system-level (super_admin)
     * payment settings unless explicitly overridden.
     *
     * Why this exists:
     * Avoids inconsistent payment configuration resolution across gateways.
     *
     * Behavior:
     * - super_admin -> own settings
     * - others -> fallback to super_admin
     *
     */
    function getPaymentSettings(?int $userId = null): array
    {
        if (is_null($userId)) {
            if (auth()?->check() && auth()?->user()?->type == 'super_admin') {
                $userId = auth()?->id();
            } else {
                $user = User::where('type', 'super_admin')?->first();
                $userId = $user?->id;
            }
        }

        return PaymentSetting::getUserSettings($userId);
    }
}

if (!function_exists('updatePaymentSetting')) {
    /**
     * Persist a payment configuration value for a user.
     *
     * Thin abstraction over PaymentSetting model, but enforces consistent
     * user resolution (defaults to authenticated user).
     *
     * Important:
     * - Does not enforce super_admin-only writes
     * - Does not invalidate any cached payment settings
     *
     */
    function updatePaymentSetting(string $key, mixed $value, ?int $userId = null): PaymentSetting
    {
        if (is_null($userId)) {
            $userId = auth()?->id();
        }

        return PaymentSetting::updateOrCreateSetting($userId, $key, $value);
    }
}

if (!function_exists('isPaymentMethodEnabled')) {
    /**
     * Determine if a payment method is enabled for the resolved user scope.
     *
     * Normalizes truthy values across storage formats (boolean vs string).
     *
     * Why this exists:
     * Prevents repeated conditional checks and inconsistencies when reading
     * boolean flags from loosely typed storage.
     *
     * Behavior:
     * - Accepts both boolean true and string '1' as enabled
     *
     */
    function isPaymentMethodEnabled(string $method, ?int $userId = null): bool
    {
        $settings = getPaymentSettings($userId);
        $key = "is_{$method}_enabled";

        return isset($settings[$key]) && ($settings[$key] === true || $settings[$key] === '1');
    }
}

if (!function_exists('getPaymentMethodConfig')) {
    /**
     * Normalize payment gateway configuration into a consistent structure.
     *
     * Provides a single abstraction layer over heterogeneous payment settings,
     * allowing the rest of the system to interact with gateways uniformly.
     *
     * Why this exists:
     * - Each gateway has different required fields and naming conventions
     * - Prevents duplication of config mapping logic across controllers/services
     *
     * Behavior:
     * - Always returns a structured array with at least `enabled`
     * - Includes only relevant keys per gateway
     * - Applies sensible defaults (e.g. sandbox mode)
     *
     * Conventions enforced:
     * - Boolean "enabled" flag derived via isPaymentMethodEnabled()
     * - Missing credentials resolve to null (never undefined)
     *
     * Edge cases:
     * - Unknown method returns empty array
     *
     */
    function getPaymentMethodConfig(string $method, ?int $userId = null): array
    {
        $settings = getPaymentSettings($userId);

        switch ($method) {
            //            case 'stripe':
            //                return [
            //                    'enabled' => isPaymentMethodEnabled('stripe', $userId),
            //                    'key' => $settings['stripe_key'] ?? null,
            //                    'secret' => $settings['stripe_secret'] ?? null,
            //                ];
            //
            //            case 'paypal':
            //                return [
            //                    'enabled' => isPaymentMethodEnabled('paypal', $userId),
            //                    'mode' => $settings['paypal_mode'] ?? 'sandbox',
            //                    'client_id' => $settings['paypal_client_id'] ?? null,
            //                    'secret' => $settings['paypal_secret_key'] ?? null,
            //                ];
            //
            //            case 'razorpay':
            //                return [
            //                    'enabled' => isPaymentMethodEnabled('razorpay', $userId),
            //                    'key' => $settings['razorpay_key'] ?? null,
            //                    'secret' => $settings['razorpay_secret'] ?? null,
            //                ];
            //
            //            case 'mercadopago':
            //                return [
            //                    'enabled' => isPaymentMethodEnabled('mercadopago', $userId),
            //                    'mode' => $settings['mercadopago_mode'] ?? 'sandbox',
            //                    'access_token' => $settings['mercadopago_access_token'] ?? null,
            //                ];

            case 'paystack':
                return [
                    'enabled' => isPaymentMethodEnabled('paystack', $userId),
                    'public_key' => $settings['paystack_public_key'] ?? null,
                    'secret_key' => $settings['paystack_secret_key'] ?? null,
                ];

                //            case 'flutterwave':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('flutterwave', $userId),
                //                    'public_key' => $settings['flutterwave_public_key'] ?? null,
                //                    'secret_key' => $settings['flutterwave_secret_key'] ?? null,
                //                ];

            case 'bank':
                return [
                    'enabled' => isPaymentMethodEnabled('bank', $userId),
                    'details' => $settings['bank_details'] ?? null,
                ];

                //            case 'paytabs':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('paytabs', $userId),
                //                    'mode' => $settings['paytabs_mode'] ?? 'sandbox',
                //                    'profile_id' => $settings['paytabs_profile_id'] ?? null,
                //                    'server_key' => $settings['paytabs_server_key'] ?? null,
                //                    'region' => $settings['paytabs_region'] ?? 'ARE',
                //                ];
                //
                //            case 'skrill':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('skrill', $userId),
                //                    'merchant_id' => $settings['skrill_merchant_id'] ?? null,
                //                    'secret_word' => $settings['skrill_secret_word'] ?? null,
                //                ];
                //
                //            case 'coingate':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('coingate', $userId),
                //                    'mode' => $settings['coingate_mode'] ?? 'sandbox',
                //                    'api_token' => $settings['coingate_api_token'] ?? null,
                //                ];
                //
                //            case 'payfast':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('payfast', $userId),
                //                    'mode' => $settings['payfast_mode'] ?? 'sandbox',
                //                    'merchant_id' => $settings['payfast_merchant_id'] ?? null,
                //                    'merchant_key' => $settings['payfast_merchant_key'] ?? null,
                //                    'passphrase' => $settings['payfast_passphrase'] ?? null,
                //                ];
                //
                //            case 'tap':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('tap', $userId),
                //                    'secret_key' => $settings['tap_secret_key'] ?? null,
                //                ];
                //
                //            case 'xendit':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('xendit', $userId),
                //                    'api_key' => $settings['xendit_api_key'] ?? null,
                //                ];
                //
                //            case 'paytr':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('paytr', $userId),
                //                    'merchant_id' => $settings['paytr_merchant_id'] ?? null,
                //                    'merchant_key' => $settings['paytr_merchant_key'] ?? null,
                //                    'merchant_salt' => $settings['paytr_merchant_salt'] ?? null,
                //                ];
                //
                //            case 'mollie':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('mollie', $userId),
                //                    'api_key' => $settings['mollie_api_key'] ?? null,
                //                ];
                //
                //            case 'toyyibpay':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('toyyibpay', $userId),
                //                    'category_code' => $settings['toyyibpay_category_code'] ?? null,
                //                    'secret_key' => $settings['toyyibpay_secret_key'] ?? null,
                //                    'mode' => $settings['toyyibpay_mode'] ?? 'sandbox',
                //                ];
                //
                //            case 'cashfree':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('cashfree', $userId),
                //                    'mode' => $settings['cashfree_mode'] ?? 'sandbox',
                //                    'public_key' => $settings['cashfree_public_key'] ?? null,
                //                    'secret_key' => $settings['cashfree_secret_key'] ?? null,
                //                ];
                //
                //            case 'iyzipay':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('iyzipay', $userId),
                //                    'mode' => $settings['iyzipay_mode'] ?? 'sandbox',
                //                    'public_key' => $settings['iyzipay_public_key'] ?? null,
                //                    'secret_key' => $settings['iyzipay_secret_key'] ?? null,
                //                ];
                //
                //            case 'benefit':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('benefit', $userId),
                //                    'mode' => $settings['benefit_mode'] ?? 'sandbox',
                //                    'public_key' => $settings['benefit_public_key'] ?? null,
                //                    'secret_key' => $settings['benefit_secret_key'] ?? null,
                //                ];
                //
                //            case 'ozow':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('ozow', $userId),
                //                    'mode' => $settings['ozow_mode'] ?? 'sandbox',
                //                    'site_key' => $settings['ozow_site_key'] ?? null,
                //                    'private_key' => $settings['ozow_private_key'] ?? null,
                //                    'api_key' => $settings['ozow_api_key'] ?? null,
                //                ];
                //
                //            case 'easebuzz':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('easebuzz', $userId),
                //                    'merchant_key' => $settings['easebuzz_merchant_key'] ?? null,
                //                    'salt_key' => $settings['easebuzz_salt_key'] ?? null,
                //                    'environment' => $settings['easebuzz_environment'] ?? 'test',
                //                ];
                //
                //            case 'khalti':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('khalti', $userId),
                //                    'public_key' => $settings['khalti_public_key'] ?? null,
                //                    'secret_key' => $settings['khalti_secret_key'] ?? null,
                //                ];
                //
                //            case 'authorizenet':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('authorizenet', $userId),
                //                    'mode' => $settings['authorizenet_mode'] ?? 'sandbox',
                //                    'merchant_id' => $settings['authorizenet_merchant_id'] ?? null,
                //                    'transaction_key' => $settings['authorizenet_transaction_key'] ?? null,
                //                    'supported_countries' => ['US', 'CA', 'GB', 'AU'],
                //                    'supported_currencies' => ['USD', 'CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'NOK', 'PLN', 'SEK', 'AUD', 'NZD'],
                //                ];
                //
                //            case 'fedapay':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('fedapay', $userId),
                //                    'mode' => $settings['fedapay_mode'] ?? 'sandbox',
                //                    'public_key' => $settings['fedapay_public_key'] ?? null,
                //                    'secret_key' => $settings['fedapay_secret_key'] ?? null,
                //                ];
                //
                //            case 'payhere':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('payhere', $userId),
                //                    'mode' => $settings['payhere_mode'] ?? 'sandbox',
                //                    'merchant_id' => $settings['payhere_merchant_id'] ?? null,
                //                    'merchant_secret' => $settings['payhere_merchant_secret'] ?? null,
                //                    'app_id' => $settings['payhere_app_id'] ?? null,
                //                    'app_secret' => $settings['payhere_app_secret'] ?? null,
                //                ];
                //
                //            case 'cinetpay':
                //                return [
                //                    'enabled' => isPaymentMethodEnabled('cinetpay', $userId),
                //                    'site_id' => $settings['cinetpay_site_id'] ?? null,
                //                    'api_key' => $settings['cinetpay_api_key'] ?? null,
                //                    'secret_key' => $settings['cinetpay_secret_key'] ?? null,
                //                ];

            default:
                return [];
        }
    }
}

if (!function_exists('getEnabledPaymentMethods')) {
    /**
     * Return all configured and enabled payment methods with normalized configs.
     *
     * Acts as the canonical source for:
     * - Checkout flows
     * - Payment method listings
     * - Gateway capability checks
     *
     * Why this exists:
     * Avoids repeated enablement checks and config assembly across the system.
     *
     * Behavior:
     * - Iterates through all supported gateways
     * - Filters by isPaymentMethodEnabled()
     * - Returns fully hydrated configs (via getPaymentMethodConfig())
     *
     * Output shape:
     * [
     *   'stripe' => [...],
     *   'paypal' => [...],
     * ]
     *
     */
    function getEnabledPaymentMethods(?int $userId = null): array
    {
        //$methods = ['stripe', 'paypal', 'razorpay', 'mercadopago', 'paystack', 'flutterwave', 'bank', 'paytabs', 'skrill', 'coingate', 'payfast', 'tap', 'xendit', 'paytr', 'mollie', 'toyyibpay', 'cashfree', 'iyzipay', 'benefit', 'ozow', 'easebuzz', 'khalti', 'authorizenet', 'fedapay', 'payhere', 'cinetpay'];
        $methods = ['paystack', 'bank'];
        $enabled = [];

        foreach ($methods as $method) {
            if (isPaymentMethodEnabled($method, $userId)) {
                $enabled[$method] = getPaymentMethodConfig($method, $userId);
            }
        }

        return $enabled;
    }
}

if (!function_exists('validatePaymentMethodConfig')) {
    /**
     * Validate required configuration fields for a specific payment gateway.
     *
     * Provides a lightweight validation layer independent of Laravel FormRequests,
     * intended for dynamic/admin-driven configuration flows.
     *
     * Why this exists:
     * - Each gateway has different required credentials
     * - Centralizes validation rules to avoid duplication
     *
     * Behavior:
     * - Returns structured response instead of throwing
     * - Only validates required presence (not format correctness)
     *
     * Limitations:
     * - Does not validate value formats (e.g., key structure, API reachability)
     * - Silent for unsupported methods
     *
     */
    function validatePaymentMethodConfig(string $method, array $config): array
    {
        $errors = [];

        switch ($method) {
            //            case 'stripe':
            //                if (empty($config['key'])) {
            //                    $errors[] = __('Stripe publishable key is required');
            //                }
            //                if (empty($config['secret'])) {
            //                    $errors[] = __('Stripe secret key is required');
            //                }
            //                break;
            //
            //            case 'paypal':
            //                if (empty($config['client_id'])) {
            //                    $errors[] = __('PayPal client ID is required');
            //                }
            //                if (empty($config['secret'])) {
            //                    $errors[] = __('PayPal secret key is required');
            //                }
            //                break;
            //
            //            case 'razorpay':
            //                if (empty($config['key'])) {
            //                    $errors[] = __('Razorpay key ID is required');
            //                }
            //                if (empty($config['secret'])) {
            //                    $errors[] = __('Razorpay secret key is required');
            //                }
            //                break;
            //
            //            case 'mercadopago':
            //                if (empty($config['access_token'])) {
            //                    $errors[] = __('Mercado Pago access token is required');
            //                }
            //                break;

            case 'bank':
                if (empty($config['details'])) {
                    $errors[] = __('Bank details are required');
                }
                break;

                //            case 'paytabs':
                //                if (empty($config['server_key'])) {
                //                    $errors[] = __('PayTabs server key is required');
                //                }
                //                if (empty($config['profile_id'])) {
                //                    $errors[] = __('PayTabs profile ID is required');
                //                }
                //                if (empty($config['region'])) {
                //                    $errors[] = __('PayTabs region is required');
                //                }
                //                break;
                //
                //            case 'skrill':
                //                if (empty($config['merchant_id'])) {
                //                    $errors[] = __('Skrill merchant ID is required');
                //                }
                //                if (empty($config['secret_word'])) {
                //                    $errors[] = __('Skrill secret word is required');
                //                }
                //                break;
                //
                //            case 'coingate':
                //                if (empty($config['api_token'])) {
                //                    $errors[] = __('CoinGate API token is required');
                //                }
                //                break;
                //
                //            case 'payfast':
                //                if (empty($config['merchant_id'])) {
                //                    $errors[] = __('Payfast merchant ID is required');
                //                }
                //                if (empty($config['merchant_key'])) {
                //                    $errors[] = __('Payfast merchant key is required');
                //                }
                //                break;
                //
                //            case 'tap':
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('Tap secret key is required');
                //                }
                //                break;
                //
                //            case 'xendit':
                //                if (empty($config['api_key'])) {
                //                    $errors[] = __('Xendit API key is required');
                //                }
                //                break;
                //
                //            case 'paytr':
                //                if (empty($config['merchant_id'])) {
                //                    $errors[] = __('PayTR merchant ID is required');
                //                }
                //                if (empty($config['merchant_key'])) {
                //                    $errors[] = __('PayTR merchant key is required');
                //                }
                //                if (empty($config['merchant_salt'])) {
                //                    $errors[] = __('PayTR merchant salt is required');
                //                }
                //                break;
                //
                //            case 'mollie':
                //                if (empty($config['api_key'])) {
                //                    $errors[] = __('Mollie API key is required');
                //                }
                //                break;
                //
                //            case 'toyyibpay':
                //                if (empty($config['category_code'])) {
                //                    $errors[] = __('ToyyibPay category code is required');
                //                }
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('ToyyibPay secret key is required');
                //                }
                //                break;
                //
                //            case 'cashfree':
                //                if (empty($config['public_key'])) {
                //                    $errors[] = __('Cashfree App ID is required');
                //                }
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('Cashfree Secret Key is required');
                //                }
                //                break;
                //
                //            case 'iyzipay':
                //                if (empty($config['public_key'])) {
                //                    $errors[] = __('IyziPay API key is required');
                //                }
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('IyziPay secret key is required');
                //                }
                //                break;
                //
                //            case 'benefit':
                //                if (empty($config['public_key'])) {
                //                    $errors[] = __('Benefit API key is required');
                //                }
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('Benefit secret key is required');
                //                }
                //                break;
                //
                //            case 'ozow':
                //                if (empty($config['site_key'])) {
                //                    $errors[] = __('Ozow site key is required');
                //                }
                //                if (empty($config['private_key'])) {
                //                    $errors[] = __('Ozow private key is required');
                //                }
                //                break;
                //
                //            case 'easebuzz':
                //                if (empty($config['merchant_key'])) {
                //                    $errors[] = __('Easebuzz merchant key is required');
                //                }
                //                if (empty($config['salt_key'])) {
                //                    $errors[] = __('Easebuzz salt key is required');
                //                }
                //                break;
                //
                //            case 'khalti':
                //                if (empty($config['public_key'])) {
                //                    $errors[] = __('Khalti public key is required');
                //                }
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('Khalti secret key is required');
                //                }
                //                break;
                //
                //            case 'authorizenet':
                //                if (empty($config['merchant_id'])) {
                //                    $errors[] = __('AuthorizeNet merchant ID is required');
                //                }
                //                if (empty($config['transaction_key'])) {
                //                    $errors[] = __('AuthorizeNet transaction key is required');
                //                }
                //                break;
                //
                //            case 'fedapay':
                //                if (empty($config['public_key'])) {
                //                    $errors[] = __('FedaPay public key is required');
                //                }
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('FedaPay secret key is required');
                //                }
                //                break;
                //
                //            case 'payhere':
                //                if (empty($config['merchant_id'])) {
                //                    $errors[] = __('PayHere merchant ID is required');
                //                }
                //                if (empty($config['merchant_secret'])) {
                //                    $errors[] = __('PayHere merchant secret is required');
                //                }
                //                break;
                //
                //            case 'cinetpay':
                //                if (empty($config['site_id'])) {
                //                    $errors[] = __('CinetPay site ID is required');
                //                }
                //                if (empty($config['api_key'])) {
                //                    $errors[] = __('CinetPay API key is required');
                //                }
                //                break;
                //
                //            case 'paiement':
                //                if (empty($config['merchant_id'])) {
                //                    $errors[] = __('Paiement Pro merchant ID is required');
                //                }
                //                break;
                //
                //            case 'nepalste':
                //                if (empty($config['public_key'])) {
                //                    $errors[] = __('Nepalste public key is required');
                //                }
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('Nepalste secret key is required');
                //                }
                //                break;
                //
                //            case 'yookassa':
                //                if (empty($config['shop_id'])) {
                //                    $errors[] = __('YooKassa shop ID is required');
                //                }
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('YooKassa secret key is required');
                //                }
                //                break;
                //
                //            case 'midtrans':
                //                if (empty($config['secret_key'])) {
                //                    $errors[] = __('Midtrans secret key is required');
                //                }
                //                break;
                //
                //            case 'aamarpay':
                //                if (empty($config['store_id'])) {
                //                    $errors[] = __('AamarPay store ID is required');
                //                }
                //                if (empty($config['signature'])) {
                //                    $errors[] = __('AamarPay signature is required');
                //                }
                //                break;
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}

if (!function_exists('calculatePlanPricing')) {
    /**
     * Compute final plan pricing with optional coupon application.
     *
     * Encapsulates all pricing rules to ensure consistency between:
     * - Checkout
     * - Order creation
     * - Payment validation
     *
     * Why this exists:
     * Prevents duplicated discount logic and ensures coupon handling remains
     * consistent across all payment entry points.
     *
     * Business rules:
     * - Supports percentage and fixed discounts
     * - Fixed discounts cannot exceed original price
     * - Final price is never negative
     * - Only active coupons are considered
     *
     * Assumptions:
     * - Plan provides pricing per billing cycle
     *
     * Edge cases:
     * - Invalid/expired coupon -> silently ignored
     * - Missing coupon -> no discount applied
     *
     */
    function calculatePlanPricing($plan, $couponCode = null, $billingCycle = 'monthly'): array
    {
        // $originalPrice = $plan->price;
        $originalPrice = $plan->getPriceForCycle($billingCycle);
        $discountAmount = 0;
        $finalPrice = $originalPrice;
        $couponId = null;

        if ($couponCode) {
            $coupon = Coupon::where('code', $couponCode)
                ->where('status', 1)?->first();

            if ($coupon) {
                if ($coupon->type === 'percentage') {
                    $discountAmount = ($originalPrice * $coupon->discount_amount) / 100;
                } else {
                    $discountAmount = min($coupon->discount_amount, $originalPrice);
                }
                $finalPrice = max(0, $originalPrice - $discountAmount);
                $couponId = $coupon->id;
            }
        }

        return [
            'original_price' => $originalPrice,
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice,
            'coupon_id' => $couponId,
        ];
    }
}

if (!function_exists('createPlanOrder')) {
    /**
     * Create a plan order with fully resolved pricing and metadata.
     *
     * Couples pricing calculation with persistence to ensure that:
     * - Stored order values always reflect the exact pricing logic used at checkout
     * - Coupon application is captured at time of purchase (immutable)
     *
     * Why this exists:
     * Prevents discrepancies between displayed price and stored order data.
     *
     * Behavior:
     * - Resolves plan
     * - Delegates pricing to calculatePlanPricing()
     * - Stores all derived fields (original, discount, final)
     *
     * Assumptions:
     * - $data contains required fields (validated upstream)
     *
     * Side effects:
     * - Persists PlanOrder record
     *
     */
    function createPlanOrder($data)
    {
        $plan = Plan::findOrFail($data['plan_id']);
        $billingCycle = $data['billing_cycle'] ?? 'monthly';
        $pricing = calculatePlanPricing($plan, $data['coupon_code'] ?? null, $data['billing_cycle'] ?? 'monthly');

        return PlanOrder::create([
            'user_id' => $data['user_id'],
            'plan_id' => $plan->id,
            'coupon_id' => $pricing['coupon_id'],
            'billing_cycle' => $billingCycle,
            'payment_method' => $data['payment_method'],
            'coupon_code' => $data['coupon_code'] ?? null,
            'original_price' => $pricing['original_price'],
            'discount_amount' => $pricing['discount_amount'],
            'final_price' => $pricing['final_price'],
            'payment_id' => $data['payment_id'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'ordered_at' => now(),
            'processed_at' => $data['processed_at'] ?? null,   // Add
            'receipt_path' => $data['receipt_path'] ?? null,
        ]);
    }
}

if (!function_exists('assignPlanToUser')) {
    /**
     * Apply a subscription plan to a user with expiry handling.
     *
     * Encapsulates subscription state mutation to ensure consistent updates
     * across all payment flows.
     *
     * Behavior:
     * - Sets plan_id
     * - Calculates expiry based on billing cycle
     * - Marks plan as active
     *
     * Side effects:
     * - Updates user record
     * - Emits logs (for traceability)
     *
     * Assumptions:
     * - Does not validate plan eligibility or conflicts
     *
     * Not safe for concurrent/idempotent use without guards.
     *
     */
    function assignPlanToUser($user, $plan, $billingCycle): void
    {
        $expiresAt = $billingCycle === 'yearly' ? now()->addYear() : now()->addMonth();

        Log::info('Assigning plan ' . $plan->id . ' to user ' . $user->id . ' with billing cycle ' . $billingCycle);

        $updated = $user->update([
            'plan_id' => $plan->id,
            'plan_expiry_date' => $expiresAt,
            'is_plan_active' => 1,
            'is_trial' => $user->is_trial == 1 ? 0 : $user->is_trial,
            'trial_expiry_date' => null,
            'trial_days' => 0,
        ]);

        Log::info('Plan assignment result: ' . ($updated ? 'success' : 'failed'));
    }
}

if (!function_exists('processPaymentSuccess')) {
    /**
     * Handle post-payment success workflow.
     *
     * Orchestrates all side effects required after a successful transaction:
     * - Order creation
     * - Plan assignment
     * - Referral tracking
     *
     * Why this exists:
     * Centralizes critical business flow to avoid partial or inconsistent
     * post-payment states across different gateways.
     *
     * Behavior:
     * - Forces order status to "approved"
     * - Assigns plan with correct billing cycle
     * - Triggers referral tracking (if applicable)
     *
     * Side effects:
     * - Writes to orders table
     * - Updates user subscription state
     * - May create referral records
     *
     * Assumptions:
     * - Payment has already been verified externally
     *
     * Not idempotent:
     * - Calling this multiple times will duplicate orders and reassign plans
     *
     */
    function processPaymentSuccess($data)
    {
        $plan = Plan::findOrFail($data['plan_id']);
        $user = User::findOrFail($data['user_id']);

        $planOrder = createPlanOrder(array_merge($data, ['status' => 'approved']));
        assignPlanToUser($user, $plan, $data['billing_cycle']);

        // Verify the plan was assigned
        $user->refresh();

        // Create referral record if user was referred
        ReferralController::createReferralRecord($user);

        return $planOrder;
    }
}

if (!function_exists('getPaymentGatewaySettings')) {
    /**
     * Retrieve system-wide payment and general settings for gateway initialization.
     *
     * Intended for bootstrapping payment services that require both:
     * - Payment-specific configuration
     * - General system configuration
     *
     * Behavior:
     * - Always resolves settings from super_admin
     *
     * Assumptions:
     * - Single source of truth for payment config is super_admin
     *
     */
    function getPaymentGatewaySettings(): array
    {
        $superAdminId = User::where('type', 'super_admin')?->first()?->id;

        return [
            'payment_settings' => PaymentSetting::getUserSettings($superAdminId),
            'general_settings' => Setting::getUserSettings($superAdminId),
            'super_admin_id' => $superAdminId,
        ];
    }
}

if (!function_exists('validatePaymentRequest')) {
    /**
     * Apply baseline validation rules for payment initiation requests.
     *
     * Provides a shared validation contract across all payment entry points.
     *
     * Why this exists:
     * Ensures consistent validation regardless of which controller or gateway
     * initiates the payment flow.
     *
     * Behavior:
     * - Merges base rules with caller-provided rules
     * - Delegates to Laravel validator (throws on failure)
     *
     */
    function validatePaymentRequest($request, $additionalRules = [])
    {
        $baseRules = [
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|in:monthly,yearly',
            'coupon_code' => 'nullable|string',
        ];

        return $request->validate(array_merge($baseRules, $additionalRules));
    }
}

if (!function_exists('handlePaymentError')) {
    /**
     * Standardize error handling for payment failures.
     *
     * Provides a consistent user-facing response for all payment-related errors.
     *
     * Why this exists:
     * Avoids leaking gateway-specific errors directly to users and ensures
     * uniform UX across payment flows.
     *
     * Behavior:
     * - Redirects back with a formatted error message
     *
     * Limitations:
     * - Does not log the exception
     * - Does not differentiate error types
     *
     */
    function handlePaymentError($e, $method = 'payment'): RedirectResponse
    {
        return back()->withErrors(['error' => __('Payment processing failed', ['message' => $e->getMessage()])]);
    }
}

if (!function_exists('defaultSettings')) {
    /**
     * Get default settings for System, Brand, Storage, and Currency configurations
     *
     * @return array
     */
    function defaultSettings(): array
    {
        return [
            // System Settings
            'default_language' => 'en',
            'date_format' => 'Y-m-d',
            'time_format' => 'H:i',
            'calendar_start_day' => 'sunday',
            'default_timezone' => 'UTC',

            'layout_direction' => 'ltr',
            'theme_mode' => 'system',

            // Storage Settings
            'storage_type' => 'local',
            'storage_file_types' => 'jpg,png,webp,gif,pdf,doc,docx,txt,csv',
            'storage_maximum_upload_size' => 2048,
            'aws_access_key_id' => '',
            'aws_secret_access_key' => '',
            'aws_default_region' => 'af-south-1',
            'aws_bucket' => '',
            'aws_url' => '',
            'aws_endpoint' => '',
            'wasabi_access_key' => '',
            'wasabi_secret_key' => '',
            'wasabi_region' => 'eu-central-2',
            'wasabi_bucket' => '',
            'wasabi_url' => '',
            'wasabi_root' => '',

            // Currency Settings
            'decimal_format' => 2,
            'default_currency' => 'USD',
            'decimal_separator' => '.',
            'thousands_separator' => ',',
            'float_number' => true,
            'currency_symbol_space' => true,
            'currency_symbol_position' => 'before',
            'working_days' => '[1,2,3,4,5]',
        ];
    }
}

if (!function_exists('createDefaultSettings')) {
    /**
     * Seed a user with the full default settings set.
     *
     * Used primarily during system initialization or super_admin setup.
     *
     * Why this exists:
     * Ensures all expected configuration keys exist, avoiding repeated
     * null checks across the system.
     *
     * Behavior:
     * - Converts all values to string storage format
     * - Performs bulk insert (no upsert)
     *
     * Assumptions:
     * - Should only be called once per user
     *
     * Side effects:
     * - Direct DB insert without checking for duplicates
     *
     */
    function createDefaultSettings(int $userId): void
    {
        $defaults = defaultSettings();
        $settingsData = [];

        foreach ($defaults as $key => $value) {
            $settingsData[] = [
                'user_id' => $userId,
                'key' => $key,
                'value' => is_bool($value) ? ($value ? '1' : '0') : (string)$value,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Setting::insert($settingsData);
    }
}

if (!function_exists('copySettingsFromSuperAdmin')) {
    /**
     * Copy selected system-level settings from super_admin to an organization.
     *
     * Used during organization onboarding to inherit global configuration
     * while allowing future overrides.
     *
     * Why this exists:
     * - Avoids forcing organizations to start from empty configuration
     * - Limits inheritance to safe/system-level keys only
     *
     * Behavior:
     * - Copies only a predefined subset of keys
     * - Does not overwrite existing values (insertOrIgnore)
     *
     * Fallback:
     * - If no super_admin exists, falls back to createDefaultSettings()
     *
     */
    function copySettingsFromSuperAdmin(int $organizationUserId): void
    {
        $superAdmin = User::where('type', 'super_admin')?->first();
        if (!$superAdmin) {
            createDefaultSettings($organizationUserId);

            return;
        }

        // Settings to copy from super_admin (system and brand settings only)
        $settingsToCopy = [
            'default_language',
            'date_format',
            'time_format',
            'calendar_start_day',
            'default_timezone',
            'layout_direction',
            'theme_mode',
        ];

        $superAdminSettings = Setting::where('user_id', $superAdmin->id)
            ->whereIn('key', $settingsToCopy)
            ->get();

        $settingsData = [];

        // Only copy existing super_admin settings
        foreach ($superAdminSettings as $setting) {
            $settingsData[] = [
                'user_id' => $organizationUserId,
                'key' => $setting->key,
                'value' => $setting->value,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Setting::insertOrIgnore($settingsData);
    }
}

if (!function_exists('createdBy')) {
    /**
     * Resolve the user ID that should be recorded as the creator of the current entity.
     *
     * Super admins and organization users are treated as the direct creator. For
     * other authenticated users, the creator is inherited from their `created_by`
     * relationship. This centralizes the application's creator attribution rule
     * so records consistently retain the owning organization/admin context.
     *
     * Returns `null` when no authenticated user is available.
     *
     * @return int|string|null
     */
    function createdBy()
    {
        if (Auth::user()?->type == 'super_admin') {
            return Auth::user()?->id;
        } elseif (Auth::user()?->type == 'organization') {
            return Auth::user()?->id;
        } else {
            return Auth::user()?->created_by;
        }
    }
}

if (!function_exists('getOrganizationId')) {
    /**
     * Resolve the root organization for a given user.
     *
     * Traverses the `created_by` chain recursively until an organization
     * (or top-level owner) is found.
     *
     * Why this exists:
     * Ensures consistent ownership resolution across the system.
     *
     * Behavior:
     * - Returns user ID if user is organization
     * - Otherwise walks up the hierarchy
     *
     * Edge cases:
     * - Returns null if no valid chain exists
     * - Recursive; assumes no circular references
     *
     */
    function getOrganizationId($userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return null;
        }
        if ($user->type === 'organization' || $user->hasRole('organization')) {
            return $user->id;
        }

        if ($user->created_by) {
            return getOrganizationId($user->created_by);
        }

        return null;
    }
}

if (!function_exists('getAdminAllSetting')) {
    /**
     * Retrieve and cache all super_admin settings indefinitely.
     *
     * Acts as a high-performance read layer for global configuration.
     *
     * Why this exists:
     * Avoids repeated DB queries for frequently accessed system settings.
     *
     * Behavior:
     * - Cached forever (manual invalidation required)
     *
     * Risks:
     * - Stale data if settings are updated without cache clear
     *
     */
    function getAdminAllSetting()
    {
        // Laravel cache
        return Cache::rememberForever('admin_settings', function () {
            $superAdmin = User::where('type', 'super_admin')?->first();

            $settings = [];
            if ($superAdmin) {
                $settings = Setting::where('user_id', $superAdmin->id)?->pluck('value', 'key')?->toArray();
            }

            return $settings;
        });
    }
}

// File Upload Function
if (!function_exists('uploadFile')) {
    /**
     * Handle file upload with dynamic storage backend resolution.
     *
     * Abstracts storage configuration (local, S3, Wasabi) and validation into
     * a single entry point to ensure consistent upload behavior.
     *
     * Why this exists:
     * - Prevents duplication of storage configuration logic
     * - Enforces system-wide file validation rules
     *
     * Behavior:
     * - Dynamically configures filesystem at runtime
     * - Validates file type and size against settings
     * - Stores file under `media/{path}`
     *
     * Business rules:
     * - Allowed extensions and max size driven by admin settings
     * - Rejects files before Laravel validation if extension is invalid
     *
     * Edge cases:
     * - Returns structured error response instead of throwing
     * - Missing storage config -> explicit failure
     *
     * Side effects:
     * - Mutates runtime config()
     * - Writes to filesystem
     *
     * Not a pure helper; tightly coupled to request + environment.
     *
     */
    function uploadFile($request, $key_name, $name, $path, $custom_validation = []): array
    {
        $storage_settings = getAdminAllSetting();

        if (isset($storage_settings['storage_type'])) {
            if ($storage_settings['storage_type'] == 'wasabi') {
                config(
                    [
                        'filesystems.disks.wasabi.driver' => 's3',
                        'filesystems.disks.wasabi.key' => $storage_settings['wasabi_access_key'],
                        'filesystems.disks.wasabi.secret' => $storage_settings['wasabi_secret_key'],
                        'filesystems.disks.wasabi.region' => $storage_settings['wasabi_region'] ?? 'us-east-1',
                        'filesystems.disks.wasabi.bucket' => $storage_settings['wasabi_bucket'],
                        'filesystems.disks.wasabi.endpoint' => $storage_settings['wasabi_url'],
                        'filesystems.disks.wasabi.root' => $storage_settings['wasabi_root'],
                        'filesystems.disks.use_path_style_endpoint' => false,
                        'filesystems.disks.wasabi.visibility' => 'public',
                    ]
                );
            } elseif ($storage_settings['storage_type'] == 'aws_s3') {
                config(
                    [
                        'filesystems.disks.s3.driver' => 's3',
                        'filesystems.disks.s3.key' => $storage_settings['aws_access_key_id'],
                        'filesystems.disks.s3.secret' => $storage_settings['aws_secret_access_key'],
                        'filesystems.disks.s3.region' => $storage_settings['aws_default_region'] ?? 'af-south-1',
                        'filesystems.disks.s3.bucket' => $storage_settings['aws_bucket'],
                        'filesystems.disks.s3.url' => $storage_settings['aws_url'],
                        'filesystems.disks.s3.endpoint' => $storage_settings['aws_endpoint'],
                        'filesystems.disks.s3.use_path_style_endpoint' => false,
                        'filesystems.disks.s3.visibility' => 'public',
                    ]
                );
            }
            $maximumSize = !empty($storage_settings['storage_maximum_upload_size']) ? $storage_settings['storage_maximum_upload_size'] : 2048;
            $mimes = !empty($storage_settings['storage_file_types']) ? $storage_settings['storage_file_types'] : 'jpeg,jpg,png,svg,zip,txt,gif,docx';
            $file = $request->$key_name;

            $extension = strtolower($file->getClientOriginalExtension());
            $allowed_extensions = explode(',', $mimes);

            if (empty($extension) || !in_array($extension, $allowed_extensions)) {
                return [
                    'status' => false,
                    'msg' => __('The ' . $key_name . ' must be a file of type: ' . implode(', ', $allowed_extensions) . '.'),
                ];
            }

            if (count($custom_validation) > 0) {
                $validation = $custom_validation;
            } else {
                $validation = [
                    'mimes:' . $mimes,
                    'maximum:' . $maximumSize,
                ];
            }
            $validator = Validator::make($request->all(), [
                $key_name => $validation,
            ]);
            if ($validator->fails()) {
                $res = [
                    'status' => false,
                    'msg' => $validator->messages()?->first(),
                ];

            } else {
                $storageType = $storage_settings['storage_type'] ?? 'local';
                $diskName = match ($storageType) {
                    'local' => 'public',
                    'aws_s3' => 's3',
                    'wasabi' => 'wasabi',
                    default => 'public'
                };

                // Store file directly to storage
                $file->storeAs('media/' . $path, $name, $diskName);

                $res = [
                    'status' => true,
                    'msg' => 'success',
                    'url' => $path . '/' . $name,
                ];

            }

            return $res;
        } else {
            return [
                'status' => false,
                'msg' => __('Storage type settings not configured. Please configure storage settings in system settings.'),
            ];
        }
    }

    if (!function_exists('checkFile')) {
        /**
         * Determine whether a file exists across supported storage backends.
         *
         * Provides a unified existence check that abstracts filesystem differences
         * and enforces the application's storage path convention (`media/{path}`).
         *
         * This helper exists to:
         * - Avoid leaking storage driver logic into calling code
         * - Ensure consistent path normalization across local and remote disks
         * - Gracefully handle partially configured or invalid storage setups
         *
         * Behavior:
         * - Local: checks `storage/app/public/media/` first, then falls back to base path.
         * - S3/Wasabi: dynamically configures disk and checks via Storage facade.
         *
         * Assumptions / constraints:
         * - `$path` is relative to the `media/` directory (leading slash tolerated).
         * - Admin storage settings must be present and valid for remote disks.
         *
         * Edge cases:
         * - Empty path returns false.
         * - Missing or incomplete storage configuration returns false.
         * - No exception is thrown for connectivity or config issues.
         *
         * Side effects:
         * - Mutates runtime filesystem config for S3/Wasabi.
         *
         * Context safety:
         * - Safe across HTTP, CLI, and queue workers.
         * - Depends on external storage availability for remote drivers.
         *
         * @return bool
         */
        function checkFile($path)
        {
            if (empty($path)) {
                return false;
            }
            $storage_settings = getAdminAllSetting();
            if (!isset($storage_settings['storage_type'])) {
                return false;
            }

            $storageType = $storage_settings['storage_type'];

            // Handle local storage
            if ($storageType === 'local') {
                // Check in public storage path
                $publicPath = storage_path('app/public/media/' . ltrim($path, '/'));
                if (file_exists($publicPath)) {
                    return true;
                }

                // Check in base path as fallback
                $basePath = base_path($path);

                return file_exists($basePath);
            }

            // Handle AWS S3 storage
            if ($storageType === 'aws_s3') {
                if (
                    empty($storage_settings['aws_access_key_id']) ||
                    empty($storage_settings['aws_secret_access_key']) ||
                    empty($storage_settings['aws_default_region']) ||
                    empty($storage_settings['aws_bucket'])
                ) {
                    return false;
                }

                config([
                    'filesystems.disks.s3.key' => $storage_settings['aws_access_key_id'],
                    'filesystems.disks.s3.secret' => $storage_settings['aws_secret_access_key'],
                    'filesystems.disks.s3.region' => $storage_settings['aws_default_region'] ?? 'us-east-1',
                    'filesystems.disks.s3.bucket' => $storage_settings['aws_bucket'],
                ]);

                // Normalize path for S3
                $s3Path = 'media/' . ltrim($path, '/');

                return Storage::disk('s3')->exists($s3Path);
            }

            // Handle Wasabi storage
            if ($storageType === 'wasabi') {
                if (
                    empty($storage_settings['wasabi_access_key']) ||
                    empty($storage_settings['wasabi_secret_key']) ||
                    empty($storage_settings['wasabi_region']) ||
                    empty($storage_settings['wasabi_bucket']) ||
                    empty($storage_settings['wasabi_url']) ||
                    empty($storage_settings['wasabi_root'])
                ) {
                    return false;
                }

                config([
                    'filesystems.disks.wasabi.key' => $storage_settings['wasabi_access_key'],
                    'filesystems.disks.wasabi.secret' => $storage_settings['wasabi_secret_key'],
                    'filesystems.disks.wasabi.region' => $storage_settings['wasabi_region'] ?? 'us-east-1',
                    'filesystems.disks.wasabi.bucket' => $storage_settings['wasabi_bucket'],
                    'filesystems.disks.wasabi.endpoint' => $storage_settings['wasabi_url'] ?? null,
                    'filesystems.disks.wasabi.root' => $storage_settings['wasabi_root'] ?? '',
                ]);

                // Normalize path for Wasabi
                $wasabiPath = 'media/' . ltrim($path, '/');

                return Storage::disk('wasabi')->exists($wasabiPath);
            }

            // Unknown storage type
            return false;
        }
    }

    if (!function_exists('getFile')) {
        /**
         * Resolve a public URL for a stored file across supported storage backends.
         *
         * Centralizes URL generation and storage driver handling so that consumers
         * can treat file paths as storage-agnostic references.
         *
         * This helper enforces:
         * - Consistent `media/{path}` prefixing
         * - Graceful fallback to local URLs when remote storage is misconfigured
         *
         * Behavior:
         * - Local: returns URL under `/storage/media/...`
         * - S3/Wasabi: returns fully qualified remote URL via disk driver
         * - Falls back to local URL if remote configuration is incomplete
         *
         * Assumptions / constraints:
         * - `$path` is a relative media path (not a full URL).
         * - Does not verify file existence before generating URL.
         *
         * Edge cases:
         * - Empty path returns empty string.
         * - Misconfigured remote storage silently falls back to local URL.
         *
         * Side effects:
         * - Mutates runtime filesystem config for S3/Wasabi.
         *
         * Context safety:
         * - Safe in all contexts.
         * - Relies on configuration state; output may differ between environments.
         *
         * @return string
         */
        function getFile($path)
        {
            // Return empty string if path is empty
            if (empty($path)) {
                return '';
            }

            $storage_settings = getAdminAllSetting();

            // Check if storage settings exist, fallback to local
            if (!isset($storage_settings['storage_type'])) {
                return url('storage/media/' . ltrim($path, '/'));
            }

            $storageType = $storage_settings['storage_type'];

            // Handle AWS S3 storage
            if ($storageType === 'aws_s3' || $storageType === 's3') {
                if (
                    empty($storage_settings['s3_key']) ||
                    empty($storage_settings['s3_secret']) ||
                    empty($storage_settings['s3_region']) ||
                    empty($storage_settings['s3_bucket'])
                ) {
                    return url('storage/media/' . ltrim($path, '/'));
                }

                config([
                    'filesystems.disks.s3.key' => $storage_settings['s3_key'],
                    'filesystems.disks.s3.secret' => $storage_settings['s3_secret'],
                    'filesystems.disks.s3.region' => $storage_settings['s3_region'],
                    'filesystems.disks.s3.bucket' => $storage_settings['s3_bucket'],
                ]);

                // Normalize path for S3
                $s3Path = 'media/' . ltrim($path, '/');

                return Storage::disk('s3')->url($s3Path);
            }

            // Handle Wasabi storage
            if ($storageType === 'wasabi') {
                if (
                    empty($storage_settings['wasabi_key']) ||
                    empty($storage_settings['wasabi_secret']) ||
                    empty($storage_settings['wasabi_region']) ||
                    empty($storage_settings['wasabi_bucket']) ||
                    empty($storage_settings['wasabi_root']) ||
                    empty($storage_settings['wasabi_url'])
                ) {
                    return url('storage/media/' . ltrim($path, '/'));
                }

                config([
                    'filesystems.disks.wasabi.key' => $storage_settings['wasabi_key'],
                    'filesystems.disks.wasabi.secret' => $storage_settings['wasabi_secret'],
                    'filesystems.disks.wasabi.region' => $storage_settings['wasabi_region'],
                    'filesystems.disks.wasabi.bucket' => $storage_settings['wasabi_bucket'],
                    'filesystems.disks.wasabi.root' => $storage_settings['wasabi_root'],
                    'filesystems.disks.wasabi.endpoint' => $storage_settings['wasabi_url'],
                ]);

                // Normalize path for Wasabi
                $wasabiPath = 'media/' . ltrim($path, '/');

                return Storage::disk('wasabi')->url($wasabiPath);
            }

            // Handle local storage (default)
            return url('storage/media/' . ltrim($path, '/'));
        }
    }

    if (!function_exists('deleteFile')) {
        /**
         * Delete a file from the configured storage backend.
         *
         * Provides a single entry point for file deletion that:
         * - Enforces consistent path handling (`media/{path}`)
         * - Prevents unnecessary delete operations by checking existence first
         * - Abstracts storage driver differences
         *
         * This helper ensures callers do not need to:
         * - Know which disk is active
         * - Handle path normalization
         * - Guard against missing files
         *
         * Behavior:
         * - Performs existence check via `checkFile()` before attempting deletion.
         * - Local: deletes from `storage/app/public/media/`.
         * - S3/Wasabi: deletes via Storage facade after runtime config setup.
         *
         * Assumptions / constraints:
         * - `$path` is relative to the `media/` directory.
         * - Storage configuration must be valid for remote deletion.
         *
         * Edge cases:
         * - Empty path returns false.
         * - Non-existent file returns false (no-op).
         * - Misconfigured storage returns false without throwing.
         *
         * Side effects:
         * - Deletes physical file from storage.
         * - Mutates runtime filesystem config for S3/Wasabi.
         *
         * Context safety:
         * - Safe in HTTP, CLI, and queue contexts.
         * - Remote deletion depends on network and credentials.
         *
         * @return bool
         */
        function deleteFile($path)
        {
            // Return false if path is empty
            if (empty($path)) {
                return false;
            }

            // Check if file exists first
            if (!checkFile($path)) {
                return false;
            }

            $storage_settings = getAdminAllSetting();

            // Check if storage settings exist
            if (!isset($storage_settings['storage_type'])) {
                return false;
            }

            $storageType = $storage_settings['storage_type'];

            // Handle local storage
            if ($storageType === 'local') {
                $publicPath = storage_path('app/public/media/' . ltrim($path, '/'));
                if (file_exists($publicPath)) {
                    return unlink($publicPath);
                }

                return false;
            }

            // Handle AWS S3 storage
            if ($storageType === 'aws_s3' || $storageType === 's3') {
                if (
                    empty($storage_settings['s3_key']) ||
                    empty($storage_settings['s3_secret']) ||
                    empty($storage_settings['s3_region']) ||
                    empty($storage_settings['s3_bucket'])
                ) {
                    return false;
                }

                config([
                    'filesystems.disks.s3.key' => $storage_settings['s3_key'],
                    'filesystems.disks.s3.secret' => $storage_settings['s3_secret'],
                    'filesystems.disks.s3.region' => $storage_settings['s3_region'],
                    'filesystems.disks.s3.bucket' => $storage_settings['s3_bucket'],
                ]);

                // Normalize path for S3
                $s3Path = 'media/' . ltrim($path, '/');

                return Storage::disk('s3')->delete($s3Path);
            }

            // Handle Wasabi storage
            if ($storageType === 'wasabi') {
                if (
                    empty($storage_settings['wasabi_key']) ||
                    empty($storage_settings['wasabi_secret']) ||
                    empty($storage_settings['wasabi_region']) ||
                    empty($storage_settings['wasabi_bucket']) ||
                    empty($storage_settings['wasabi_root']) ||
                    empty($storage_settings['wasabi_url'])
                ) {
                    return false;
                }

                config([
                    'filesystems.disks.wasabi.key' => $storage_settings['wasabi_key'],
                    'filesystems.disks.wasabi.secret' => $storage_settings['wasabi_secret'],
                    'filesystems.disks.wasabi.region' => $storage_settings['wasabi_region'],
                    'filesystems.disks.wasabi.bucket' => $storage_settings['wasabi_bucket'],
                    'filesystems.disks.wasabi.root' => $storage_settings['wasabi_root'],
                    'filesystems.disks.wasabi.endpoint' => $storage_settings['wasabi_url'],
                ]);

                // Normalize path for Wasabi
                $wasabiPath = 'media/' . ltrim($path, '/');

                return Storage::disk('wasabi')->delete($wasabiPath);
            }

            // Unknown storage type
            return false;
        }
    }

    if (!function_exists('getDeviceType')) {
        /**
         * Classifies a request's device type based on the provided User-Agent string.
         *
         * This helper centralizes device categorization logic used across the application
         * (e.g., layout decisions, analytics segmentation, feature toggling). It enforces
         * a consistent interpretation of "mobile", "tablet", and "desktop" to avoid
         * divergent regex checks scattered throughout the codebase.
         *
         * The detection is heuristic and regex-based. It prioritizes mobile detection
         * over tablet, and falls back to "desktop" when no patterns match or when the
         * User-Agent is missing. This reflects a conservative default aligned with
         * desktop-first rendering assumptions in the system.
         *
         * Assumptions / constraints:
         * - Relies entirely on the accuracy of the User-Agent string; no client hints
         *   or feature detection are used.
         * - Regex patterns are intentionally broad and may not cover newer or atypical
         *   devices (e.g., hybrid devices, spoofed agents, modern iPad desktop UAs).
         * - Bots and crawlers are not explicitly filtered and may be misclassified.
         *
         * Edge cases:
         * - Empty or null User-Agent returns "desktop".
         * - Some Android tablets may be misclassified depending on UA format.
         * - Devices reporting desktop-class UAs (e.g., certain tablets) will be treated as "desktop".
         *
         * This function is pure and has no side effects. It is safe to call in any context
         * (HTTP, CLI, queues) as long as a User-Agent string is provided.
         *
         * @param string|null $userAgent Raw User-Agent header; null or empty values trigger a "desktop" fallback.
         *
         * @return string One of: "mobile", "tablet", or "desktop".
         */
        function getDeviceType(?string $userAgent): string
        {
            if (empty($userAgent)) {
                return 'desktop';
            }

            $mobileRegex = '/(?:phone|windows\s+phone|ipod|blackberry|(?:android|bb\d+|meego|silk).+?mobile|palm|windows\s+ce|opera mini|avantgo|mobilesafari|docomo)/i';
            $tabletRegex = '/(?:ipad|playbook|(?:android|bb\d+|meego|silk)(?!.*mobile))/i';

            if (preg_match($mobileRegex, $userAgent)) {
                return 'mobile';
            }

            if (preg_match($tabletRegex, $userAgent)) {
                return 'tablet';
            }

            return 'desktop';
        }
    }
}

if (!function_exists('isNotEditableRoles')) {
    /**
     * Return roles that are protected from modification.
     *
     * Centralizes the application's protected-role rule so role management
     * flows consistently prevent changes to system-managed roles.
     *
     * @return array<int, string> Role names that cannot be edited.
     */
    function isNotEditableRoles(): array
    {
        return [
            'agency_manager',
        ];
    }
}

if (!function_exists('isNotDeletableRoles')) {
    /**
     * Return roles that are protected from deletion.
     *
     * Centralizes the application's protected-role rule so role management
     * flows consistently prevent removal of system-managed roles.
     *
     * @return array<int, string> Role names that cannot be deleted.
     */
    function isNotDeletableRoles(): array
    {
        return [
            'agency_manager',
        ];
    }
}

if (!function_exists('createDefaultEmailTemplateSettings')) {

    /**
     * Initializes a user's email template preferences with all templates disabled.
     *
     * Existing preferences are reset to inactive, ensuring newly initialized
     * users follow the application's opt-in email notification convention.
     *
     * This helper centralizes default email-template preference initialization
     * and is safe to call repeatedly because preferences are upserted.
     *
     * @param int|string $userId User whose email template preferences are initialized.
     *
     * @return void
     */
    function createDefaultEmailTemplateSettings(int|string $userId): void
    {
        $templates = EmailTemplate::all();

        foreach ($templates as $template) {
            UserEmailTemplate::updateOrCreate(
                ['user_id' => $userId, 'template_id' => $template->id],
                ['is_active' => false]
            );
        }
    }
}

if (!function_exists('isNotificationTemplateEnabled')) {

    /**
     * Determines whether a notification template is enabled for a user.
     *
     * When no user is provided, the current application creator/context is used.
     * Missing templates and missing user preferences both resolve to disabled,
     * providing a safe default when configuration has not been initialized.
     *
     * The helper centralizes notification-template lookup and the application's
     * default-disabled behavior.
     *
     * @param string $templateName Notification template name.
     * @param string $templateType Notification template type used to distinguish templates with the same name.
     * @param int|string|null $userId User to check; defaults to the current creator/context.
     *
     * @return bool
     */
    function isNotificationTemplateEnabled(string $templateName, string $templateType, int|string $userId = null): bool
    {
        if (is_null($userId)) {
            $userId = createdBy();
        }

        $template = NotificationTemplate::where('name', $templateName)
            ->where('type', $templateType)
            ->first();
        if (!$template) {
            return false;
        }

        $userTemplate = UserNotificationTemplate::where('user_id', $userId)
            ->where('template_id', $template->id)
            ->first();

        return $userTemplate ? $userTemplate->is_active : false;
    }
}

if (!function_exists('createDefaultNotificationTemplateSettings')) {

    /**
     * Initializes a user's notification template preferences with all templates disabled.
     *
     * Existing preferences are reset to inactive, enforcing the application's
     * default opt-in behavior for notification templates. The operation is
     * repeatable because preferences are upserted.
     *
     * @param int|string $userId User whose notification template preferences are initialized.
     *
     * @return void
     */
    function createDefaultNotificationTemplateSettings(int|string $userId): void
    {
        $templates = NotificationTemplate::all();

        foreach ($templates as $template) {
            UserNotificationTemplate::updateOrCreate(
                ['user_id' => $userId, 'template_id' => $template->id],
                ['is_active' => false]
            );
        }
    }
}

if (!function_exists('createDefaultNotificationTemplates')) {

    /**
     * Seeds an organization's notification-template content from the global defaults.
     *
     * Creates organization-specific translations for every supported language
     * only when a translation does not already exist. Global content is treated
     * as the source of defaults; languages without a corresponding global
     * translation are intentionally skipped.
     *
     * This preserves organization-level overrides while providing a consistent
     * baseline from the globally maintained templates.
     *
     * @param int|string $organizationId Organization that receives the template content.
     *
     * @return void
     */
    function createDefaultNotificationTemplates(int|string $organizationId): void
    {
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        $langCodes = collect($languages)->pluck('code')->toArray();

        $templates = NotificationTemplate::get();

        foreach ($templates as $template) {
            foreach ($langCodes as $langCode) {
                $existingContent = NotificationTemplateLang::where('parent_id', $template->id)
                    ->where('lang', $langCode)
                    ->where('created_by', $organizationId)
                    ->first();

                if ($existingContent) {
                    continue;
                }

                $globalContent = NotificationTemplateLang::where('parent_id', $template->id)
                    ->where('lang', $langCode)
                    ->where('created_by', 1)
                    ->first();

                if ($globalContent) {
                    NotificationTemplateLang::create([
                        'parent_id' => $template->id,
                        'lang' => $langCode,
                        'title' => $globalContent->title,
                        'notification_template_content' => $globalContent->notification_template_content,
                        'created_by' => $organizationId,
                    ]);
                }
            }
        }
    }
}

if (!function_exists('isEmailTemplateEnabled')) {

    /**
     * Determines whether an email template is enabled for a user.
     *
     * When no user is provided, the current application creator/context is used.
     * Missing templates and missing user preferences both resolve to disabled,
     * so uninitialized or invalid configuration cannot enable email delivery.
     *
     * @param string $templateName Email template name.
     * @param int|string|null $userId User to check; defaults to the current creator/context.
     *
     * @return bool
     */
    function isEmailTemplateEnabled(string $templateName, int|string $userId = null): bool
    {
        if (is_null($userId)) {
            $userId = createdBy();
        }

        $template = EmailTemplate::where('name', $templateName)->first();
        if (!$template) {
            return false;
        }

        $userTemplate = UserEmailTemplate::where('user_id', $userId)
            ->where('template_id', $template->id)
            ->first();

        return $userTemplate ? $userTemplate->is_active : false;
    }
}

/**
 * Returns the application's Twilio configuration from persisted settings.
 *
 * Centralizes access to the Twilio credentials and sender number so callers
 * do not need to know the underlying setting keys. Missing settings resolve
 * to empty strings, allowing callers to handle an unconfigured Twilio
 * integration explicitly.
 *
 * Configuration is read at call time, so the returned values reflect the
 * current application settings. No authentication or request context is
 * required.
 *
 * @return array{twilio_sid: string, twilio_token: string, twilio_from: string}
 */
function getTwilioConfig(): array
{
    return [
        'twilio_sid' => getSetting('twilio_sid', ''),
        'twilio_token' => getSetting('twilio_token', ''),
        'twilio_from' => getSetting('twilio_from', ''),
    ];
}
