<?php

use App\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use App\Http\Middleware\ApplySettings;
use App\Http\Middleware\CheckSubscription;
use App\Http\Middleware\ContentSecurityPolicy;
use App\Http\Middleware\CustomPreventRequestForgery;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\FilterRequest;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\MinifyHtml;
use App\Http\Middleware\TrimStrings;
use App\Http\Middleware\TrustHosts;
use App\Http\Middleware\TrustProxies;
use Illuminate\Auth\Middleware\EnsureEmailIsVerified;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Http\Middleware\ValidatePostSize;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Inertia\Inertia;
use Spatie\Permission\Middleware\PermissionMiddleware;
use Spatie\Permission\Middleware\RoleMiddleware;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->removeFromGroup('web', PreventRequestForgery::class);
        $middleware->encryptCookies(except: ['__kb_lcl', '__kb_thm_md']);
        /**
         * --------------------------------------------------------------------------
         * Global Middleware Stack
         * --------------------------------------------------------------------------
         * These middleware run on every request to your application.
         */
        $middleware->append([
            TrustHosts::class,
            TrustProxies::class,
            ValidatePostSize::class,
            TrimStrings::class,
            ConvertEmptyStringsToNull::class,
        ]);

        /**
         * --------------------------------------------------------------------------
         * Middleware Aliases
         * --------------------------------------------------------------------------
         * Aliases provide a convenient shortcut for applying middleware to routes.
         */
        $middleware->alias([
            'throttle' => ThrottleRequests::class,
            'role' => RoleMiddleware::class,
            'permission' => PermissionMiddleware::class,
            'role_or_permission' => RoleOrPermissionMiddleware::class,
            'verified' => EnsureEmailIsVerified::class,
            'check.subscription' => CheckSubscription::class,
            'setting' => ApplySettings::class,
            'csp' => ContentSecurityPolicy::class,
            'ensure_super_admin' => EnsureSuperAdmin::class,
        ]);

        /**
         * --------------------------------------------------------------------------
         * Web Middleware Group
         * --------------------------------------------------------------------------
         * Middleware that applies to web routes (HTML responses).
         */
        $middleware->web([
            SubstituteBindings::class,
            FilterRequest::class,
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
            CustomPreventRequestForgery::class,
            ShareErrorsFromSession::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            MinifyHtml::class,
//            ContentSecurityPolicy::class,
        ]);

        /**
         * --------------------------------------------------------------------------
         * API Middleware Group
         * --------------------------------------------------------------------------
         * Middleware that applies to API routes (stateless).
         */
        $middleware->appendToGroup('api', [
            'throttle:100,1', // 100 requests per minute per IP
            SubstituteBindings::class,
        ]);

        /**
         * --------------------------------------------------------------------------
         * CSRF Protection Exceptions
         * --------------------------------------------------------------------------
         * Excluded routes for third-party payment providers.
         */
        $middleware->preventRequestForgery(
            except: [
//                'cashfree/create-session',
//                'cashfree/webhook',
//                'ozow/create-payment',
//                'subscriptions/payments/easebuzz/success',
//                'subscriptions/payments/aamarpay/success',
//                'subscriptions/payments/aamarpay/callback',
//                'subscriptions/payments/tap/success',
//                'subscriptions/payments/tap/callback',
//                'subscriptions/payments/benefit/success',
//                'subscriptions/payments/benefit/callback',
//                'subscriptions/payments/paytabs/callback',
//                'subscriptions/payments/iyzipay/success',
//                'subscriptions/payments/iyzipay/callback',
//                'invoices/payment/iyzipay/callback',
//                'invoices/payment/aamarpay/success',
//                'invoices/payment/aamarpay/callback',
//                'invoices/payment/midtrans/success',
//                'invoices/payment/midtrans/callback',
//                'invoices/payment/easebuzz/success',
//                'invoices/payment/easebuzz/failure',
                'api/media/batch',
            ],
        );

    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Customize global exception handling here. Keep it lightweight: avoid DB calls on every exception.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {

            // If not Inertia, let the Blade files (minimal.blade.php) handle it
            if (! $request->hasHeader('X-Inertia')) {
                return $response;
            }

            $statusCode = $response->getStatusCode();

            // Transient/Functional Errors (Keep user on page)
            if (in_array($statusCode, [419, 429])) {
                return back()->with('error', match ($statusCode) {
                    419 => __('Page expired. Please refresh the page.'),
                    429 => __('Too many requests. Please wait a few minutes before trying again.'),
                    default => __('Something went wrong. Please try again.'),
                });
            }

            // Structural Errors (Render React Error Component)
            // This catches 401, 402, 403, 404, 500, 503
            if ($statusCode >= 400 && $statusCode < 600) {
                return Inertia::render('Error', [
                    'status' => $statusCode,
                    'message' => match ($statusCode) {
                        401 => __('Please sign in to access this page.'),
                        402 => __('A subscription is required to access this resource.'),
                        403 => __('You do not have the permission to access this resource.'),
                        404 => __('The page you are looking for doesn’t exist or has been moved.'),
                        503 => __('We’re currently down for maintenance. Be right back!'),
                        default => __('Something went wrong on our end.'),
                    },
                ])->toResponse($request)->setStatusCode($statusCode);
            }

            return $response;
        });
    })
    ->create();
