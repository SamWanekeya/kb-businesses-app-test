<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class EnsureEmailIsVerified
 *
 * Ensures authenticated users who require email verification have
 * verified their email address before accessing protected routes.
 *
 * Responsibilities:
 * - Allow users who do not require email verification to proceed.
 * - Allow users who have already verified their email address to proceed.
 * - Redirect authenticated unverified users to the application's
 *   email verification notice route.
 *
 * Route:
 * - Redirects unverified users to `authenticated.verification.notice`.
 */
class EnsureEmailIsVerified
{
    /**
     * Handle an incoming request.
     *
     * @param Request $request The incoming request.
     * @param Closure(Request): Response $next The next middleware.
     *
     * @return Response
     */
    public function handle(
        Request $request,
        Closure $next,
    ): Response {
        $user = $request->user();

        if (
            $user instanceof MustVerifyEmail
            && !$user->hasVerifiedEmail()
        ) {
            return Redirect::guest(
                route('authenticated.verification.notice'),
            );
        }

        return $next($request);
    }
}
