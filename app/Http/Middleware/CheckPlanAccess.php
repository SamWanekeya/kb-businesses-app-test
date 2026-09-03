<?php

namespace App\Http\Middleware;

use App\Models\Plan;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CheckPlanAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if (!$user) {
            return $next($request);
        }

        // Super admin has full access
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        if ($user->type !== 'organization') {
            $organization = User::find($user->created_by);
            if ($organization && $organization->type === 'organization' && !$organization->hasActivePlan()) {
                auth()->logout();
                throw ValidationException::withMessages([
                    'plan_expired' => __("Your organization's plan has expired. Please contact your organization to renew the plan."),
                ]);
            }
        }


        // if ($user->type !== 'organization') {
        //     $organization = User::find($user->created_by);
        //     if ($organization && $organization->type === 'organization' && $organization->isPlanExpired()) {
        //         auth()->logout();
        //         return redirect()->route('login')->with('error', __('Access denied. Only organization users can access this area.'));
        //     }
        // }

        // Check if user needs plan subscription
        if ($user->needsPlanSubscription()) {
            $message = __('Please subscribe to a plan to continue.');

            if ($user->isTrialExpired()) {
                $message = __('Your trial period has expired. Please subscribe to a plan to continue.');
                // Reset trial status
                $defaultPlan = Plan::getDefaultPlan();
                if ($defaultPlan) {
                    assignPlanToUser($user, $defaultPlan, 'monthly');
                    $data = [
                        'user_id' => $user->id,
                        'plan_id' => $defaultPlan->id,
                        'billing_cycle' => 'monthly',
                        'payment_method' => 'manual',
                        'status' => 'approved',
                        'processed_at' => now(),
                    ];
                    createPlanOrder($data);

                    return $next($request);
                } else {
                    $user->update([
                        'plan_id' => null,
                        'is_trial' => 0,
                        'trial_expiry_date' => null,
                    ]);
                }
            } elseif ($user->isPlanExpired() || !$user->hasActivePlan()) {
                $message = __('Your plan has expired. Please renew your subscription.');
                // Reset expired plan
                $user->update([
                    'plan_id' => null,
                    'plan_expiry_date' => null,
                    'is_plan_active' => 0,
                ]);
            }

            return redirect()->route('plans.index')->with('error', $message);
        }

        return $next($request);
    }
}
