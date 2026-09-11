<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Middleware to restrict access to Super Administrators only.
 *
 * This middleware ensures that only users with the `Super Admin` role or status
 * can access specific routes or resources. If the authenticated user is not a
 * Super Admin, the request is denied, and the response varies depending on the
 * request type:
 *
 * - **JSON (API) requests:** Returns a JSON response with HTTP 403 (Forbidden).
 * - **Web requests:** Redirects the user to the organizations index page with an error message.
 *
 * **Typical Use Cases:**
 * - Protecting administrative dashboards or configuration routes.
 * - Restricting sensitive operations (e.g., system-level settings, user management).
 *
 * @package App\Http\Middleware
 */
class EnsureSuperAdmin
{
    /**
     * Handle an incoming request and ensure the authenticated user is a Super Admin.
     *
     * This middleware intercepts each request, verifies the user’s role, and either
     * grants access or redirects/returns a 403 response based on the request context.
     *
     * @param \Illuminate\Http\Request $request The incoming HTTP request.
     * @param \Closure $next The next middleware or request handler.
     *
     * @return mixed The next middleware response or a redirect/JSON response if unauthorized.
     *
     * @example
     * // Example registration in routes/web.php
     * Route::middleware(['ensure.super_admin'])->group(function () {
     *      Route::get('/admin/settings', [AdminSettingsController::class, 'index']);
     * });
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        // Handle API (JSON) requests
        if ($request->expectsJson()) {
            return response()->json(['message' => 'Unauthorized access'], 403);
        }

        // Handle standard web requests
        return redirect()
            ->route('organizations.index')
            ->with('error', 'Unauthorized access');
    }
}
