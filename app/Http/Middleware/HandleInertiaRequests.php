<?php

namespace App\Http\Middleware;

use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

/**
 * Middleware responsible for handling Inertia.js requests and sharing
 * global data with every Inertia response.
 *
 * This middleware extends Inertia's base `Middleware` class and provides
 * shared data used by the client-side Inertia application. It defines the
 * root view, manages asset versioning, and exposes app-wide variables such as:
 *
 * - Application metadata (name, environment, base URLs)
 * - Authentication context (user, roles, permissions)
 * - Flash messages (success, error)
 * - Currency and global settings
 * - CSP nonces for enhanced security
 * - Ziggy route definitions for client-side routing
 *
 * @package App\Http\Middleware
 *
 * @see https://inertiajs.com/server-side-setup
 * @see https://inertiajs.com/asset-versioning
 */
class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded during the initial page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version for Inertia.
     *
     * This method ensures that Inertia automatically reloads pages
     * when assets are updated, such as after a deployment.
     *
     * @param \Illuminate\Http\Request $request The current HTTP request.
     *
     * @return string|null The current asset version identifier.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the data that is shared across all Inertia responses.
     *
     * This includes application metadata, global settings, authenticated user details,
     * flash messages, and other contextual data required by the frontend.
     *
     * Shared data may be accessed in any Inertia page component via `usePage().props`.
     *
     * @param \Illuminate\Http\Request $request The current HTTP request.
     *
     * @return array The array of shared props passed to all Inertia responses.
     *
     * @example
     * // Example usage inside a Vue component:
     * const { name, auth, flash, globalSettings } = usePage().props;
     */
    public function share(Request $request): array
    {
        $settings = settings();
        $currencyCode = $settings['default_currency'] ?? 'USD';
        $currency = Currency::where('code', $currencyCode)?->first();

        $currencySettings = $currency ? [
            'currency_symbol' => $currency->symbol,
            'currency_name' => $currency->name,
        ] : [
            'currency_symbol' => '$',
            'currency_name' => 'US Dollar',
        ];

        // Get available languages
        $languagesFile = resource_path('lang/language.json');
        $availableLanguages = [];
        if (file_exists($languagesFile)) {
            $availableLanguages = json_decode(file_get_contents($languagesFile), true) ?? [];
        }

        $globalSettings = array_merge($settings, $currencySettings, [
            'available_languages' => $availableLanguages,
        ]);


        return [
            ...parent::share($request),
            // Environment and security context
            'csrfToken' => csrf_token(),
            'cspNonce' => app('cspNonce'),

            // Auth context
            'auth' => [
                'user' => $request->user() ? array_merge(
                    $request->user()?->toArray(),
                    [
                        'avatar' => checkFile($request->user()?->avatar) ?? getFile($request->user()?->avatar),
                        'plan' => $request->user()->type === 'organization'
                            ? optional($request->user()->plan)->only(['id', 'name', 'maximum_staffs', 'maximum_users'])
                            : null,
                    ]
                ) : null,
                'permissions' => fn () => $request->user()?->getAllPermissions()?->pluck('name'),
            ],

            // Impersonation and routing
            'isOnBehalfOf' => (bool) session('on_behalf_of_by'),
            'namedRoutes' => function () use ($request): array {
                // If user is signed in, give them all routes
                if ($request->user()) {
                    return array_merge(
                        (new Ziggy())?->toArray() ?? [],
                        ['location' => $request->url()]
                    );
                }
                // If guest, strip out authenticated routes
                $guestZiggy = (new Ziggy())?->toArray() ?? [];

                if (isset($guestZiggy['routes'])) {
                    $guestZiggy['routes'] = array_filter(
                        $guestZiggy['routes'],
                        function ($key) {
                            // Hide any routes starting with 'payment.', 'settings.', 'my-kakbima-account.', etc.
                            return !preg_match('/^(payment|settings|my-kakbima-account|verification|subscriptions|coupons|bank|paystack|media-library|permissions|plan-orders|organizations|plan-requests|referral-program|currencies|chat-gpt|sign-in-history|on-behalf-of|dashboard)\./', $key);
                        },
                        ARRAY_FILTER_USE_KEY
                    );
                }

                return array_merge(
                    $guestZiggy,
                    ['location' => $request->url()]
                );
            },

            // Flash messages
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],

            // Global and currency-aware configuration
            'globalSettings' => $globalSettings,
        ];
    }
}
