<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets as Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Production-only middleware to add <link rel="preload"> headers for preloaded assets.
 *
 * This middleware extends Laravel's default AddLinkHeadersForPreloadedAssets
 * middleware and ensures that link headers are only injected in the production environment.
 *
 * In non-production environments (local, staging, etc.), the middleware is skipped
 * to prevent interference with development tooling like Vite HMR or Inertia page hydration.
 */
class AddLinkHeadersForPreloadedAssets extends Middleware
{
    /**
     * Handle an incoming request.
     *
     * This method will only invoke the parent middleware logic in production.
     * In non-production environments, it returns the response immediately without
     * modifying headers.
     *
     * @param Request $request
     * @param Closure $next
     * @param null $limit
     *
     * @return \Symfony\Component\HttpFoundation\Response The HTTP response with optional headers.
     */
    public function handle($request, $next, $limit = null): Response
    {
        if (!app()->isProduction()) {
            // Skip injecting preload headers outside production
            return $next($request);
        }

        // Run the original Laravel middleware logic
        return parent::handle($request, $next);
    }
}
