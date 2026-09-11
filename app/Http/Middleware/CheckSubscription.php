<?php

namespace App\Http\Middleware;

use App\Services\SubscriptionEvaluatorService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Class CheckSubscription
 *
 * Enforces subscription and trial access rules for authenticated users.
 *
 * Responsibilities:
 * - Skip checks for exempt routes
 * - Delegate subscription decisions to SubscriptionEvaluatorService
 * - Apply side effects (redirect, logout, cleanup)
 *
 * This middleware is the authoritative entry point for subscription enforcement.
 */
class CheckSubscription
{
    public function __construct(
        protected SubscriptionEvaluatorService $evaluator
    ) {
    }

    /**
     * Handle an incoming request.
     *
     * @param \Illuminate\Http\Request $request
     * @param \Closure $next
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Allow access to subscription pages
        if ($request->routeIs('subscriptions.plans.index')) {
            return $next($request);
        }

        $user = Auth::user();

        // Guests are allowed
        if (!$user) {
            return $next($request);
        }

        $result = $this->evaluator->evaluate($user);

        if ($result->allowed) {
            return $next($request);
        }

        if ($result->cleanup) {
            $this->cleanupUserSubscriptionState($user);
        }

        if ($result->logout) {
            Auth::logout();

            return redirect()
                ->route('login')
                ->with('error', $result->message);
        }

        return redirect()
            ->route('subscriptions.plans.index')
            ->with('error', $result->message);
    }

    /**
     * Reset expired subscription or trial state quietly.
     *
     * @param mixed $user
     *
     * @return void
     */
    protected function cleanupUserSubscriptionState($user): void
    {
        if ($user->is_trial) {
            $user->updateQuietly([
                'plan_id' => null,
                'is_trial' => 'off',
                'trial_expiry_date' => null,
            ]);

            return;
        }

        $user->updateQuietly([
            'plan_id' => null,
            'plan_expiry_date' => null,
        ]);
    }
}
