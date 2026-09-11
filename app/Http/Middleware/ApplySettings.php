<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to dynamically apply application settings at runtime.
 *
 * This middleware retrieves cached configuration settings and applies them
 * to the current request lifecycle — for example, updating the application’s
 * timezone based on user or system preferences.
 *
 * It is particularly useful when system-wide settings are stored in the database
 * or configuration cache and need to be reflected immediately across requests.
 *
 * **Behavior:**
 * - Reads settings via the `settings()` helper.
 * - Updates the PHP and Laravel timezone configuration if different from the current one.
 * - Ensures that long-running processes (e.g., Laravel Octane or Swoole workers)
 *   revert to a default timezone after each response, preventing cross-request leakage.
 *
 * @package App\Http\Middleware
 */
class ApplySettings
{
    /**
     * Handle an incoming HTTP request and apply runtime settings.
     *
     * This method adjusts configuration parameters (e.g., timezone) before
     * passing control to the next middleware or request handler.
     *
     * @param \Illuminate\Http\Request $request The current HTTP request.
     * @param \Closure $next The next middleware or request handler.
     *
     * @return \Symfony\Component\HttpFoundation\Response The HTTP response after processing.
     *
     * @example
     * // Example registration in `app/Http/Kernel.php`
     * protected $middleware = [
     *     \App\Http\Middleware\ApplySettings::class,
     * ];
     */
    public function handle(Request $request, Closure $next): Response
    {
        $settings = settings();

        // Only adjust timezone if required
        if (!empty($settings['default_timezone'])) {
            $newTz = $settings['default_timezone'];
            if (date_default_timezone_get() !== $newTz) {
                Config::set('app.timezone', $newTz);
                date_default_timezone_set($newTz);
            }
        }

        // Continue processing
        $response = $next($request);

        // For long-lived workers (Octane, Swoole): reset timezone after response
        if (app()->bound('server') && app()->environment(['octane', 'swoole'])) {
            date_default_timezone_set(Config::get('app.fallback_timezone', 'UTC'));
        }

        return $response;
    }
}
