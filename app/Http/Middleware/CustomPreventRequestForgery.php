<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery as BaseMiddleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Custom CSRF Protection Middleware.
 *
 * This class extends the core Laravel PreventRequestForgery middleware to customize
 * the XSRF-TOKEN cookie name. This is specifically implemented to support
 * custom security requirements (e.g., __Host- prefixes) and to obscure
 * the framework's default footprint.
 *
 * @important If this cookie name is changed, the frontend HTTP client (Inertia)
 * must be updated to match the new `xsrfCookieName` configuration.
 */
class CustomPreventRequestForgery extends BaseMiddleware
{
    /**
     * The custom name for the XSRF token cookie.
     *
     * * @var string
     */
    public const string COOKIE_NAME = '__kb_xsrf_token';

    /**
     * Add the CSRF token to the response cookies.
     *
     * Overridden from the base middleware to rename the standard 'XSRF-TOKEN'.
     * We maintain the standard security flags (Secure, SameSite) defined in
     * the session configuration.
     *
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    protected function addCookieToResponse($request, $response): Response
    {
        $config = config('session');

        $response->headers->setCookie(
            cookie(
                self::COOKIE_NAME,
                $request->session()->token(),
                $config['lifetime'],
                $config['path'],
                $config['domain'],
                $config['secure'] ?? $request->isSecure(),
                false, // httpOnly must be false: JS needs access to read this for the X-XSRF-TOKEN header
                false, // raw
                $config['same_site'] ?? 'lax'
            )
        );

        return $response;
    }
}
