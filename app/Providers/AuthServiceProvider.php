<?php

namespace App\Providers;

use App\Libraries\Auth\CustomSessionGuard;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Auth;

/**
 * Class AuthServiceProvider
 *
 * Registers and configures authentication-related services for the application.
 *
 * -----------------------------------------------------------------------------
 * CONTEXT
 * -----------------------------------------------------------------------------
 * Laravel does not provide a configuration option to customize the naming of
 * the "remember me" (recaller) cookie. To achieve this, we extend the default
 * SessionGuard and register a custom guard driver.
 *
 * This provider is responsible for:
 * - Registering the custom guard driver (`custom_session`)
 * - Wiring it into Laravel's authentication system
 *
 * -----------------------------------------------------------------------------
 * HOW IT WORKS
 * -----------------------------------------------------------------------------
 * Laravel resolves guards via the AuthManager. By calling:
 *
 *     Auth::extend('custom_session', ...)
 *
 * we register a custom driver that can be referenced in `config/auth.php`:
 *
 *     'guards' => [
 *         'web' => [
 *             'driver' => 'custom_session',
 *             'provider' => 'users',
 *         ],
 *     ],
 *
 * When the `web` guard is resolved, Laravel will invoke this closure and use
 * the returned guard instance instead of the default SessionGuard.
 *
 * -----------------------------------------------------------------------------
 * DESIGN CONSIDERATIONS
 * -----------------------------------------------------------------------------
 * - We rely on Laravel's extension points (Auth::extend) instead of modifying
 *   framework internals.
 * - We use Auth::createUserProvider(...) to remain fully compatible with
 *   configured user providers (Eloquent, database, or custom).
 * - We replicate Laravel's internal guard wiring to ensure identical behavior.
 * - No additional logic is introduced beyond swapping the guard implementation.
 *
 * -----------------------------------------------------------------------------
 * IMPORTANT NOTES
 * -----------------------------------------------------------------------------
 * - This must be registered in `bootstrap/providers.php` (Laravel 11+).
 * - Config caching can prevent this driver from being recognized; ensure
 *   caches are cleared after changes (`php artisan optimize:clear`).
 * - Any misconfiguration here will result in:
 *       "Auth driver [custom_session] is not defined."
 *
 * -----------------------------------------------------------------------------
 * MAINTENANCE
 * -----------------------------------------------------------------------------
 * This implementation mirrors Laravel's internal guard construction. If the
 * framework changes how guards are instantiated in future versions, this
 * should be reviewed and updated accordingly.
 */
class AuthServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any authentication / authorization services.
     *
     * Registers a custom session-based authentication guard that overrides
     * Laravel's default SessionGuard in order to customize the remember-me
     * cookie behavior.
     *
     * @return void
     */
    public function boot(): void
    {
        Auth::extend('custom_session', function ($app, $name, array $config) {
            // Resolve the configured user provider (e.g. Eloquent, database)
            // This ensures compatibility with auth.php configuration.
            $provider = Auth::createUserProvider($config['provider']);

            // Instantiate our custom guard implementation
            $guard = new CustomSessionGuard(
                $name,
                $provider,
                $app['session.store'],
                $app['request']
            );

            /**
             * The following bindings mirror Laravel's internal SessionGuard setup.
             * These are required for full feature parity:
             *
             * - CookieJar: Handles cookie creation and queuing
             * - Dispatcher: Enables event dispatching (login, logout, etc.)
             * - Request rebinding: Ensures the guard always has the current request
             */
            $guard->setCookieJar($app['cookie']);
            $guard->setDispatcher($app['events']);
            $guard->setRequest($app->refresh('request', $guard, 'setRequest'));

            return $guard;
        });
    }
}
