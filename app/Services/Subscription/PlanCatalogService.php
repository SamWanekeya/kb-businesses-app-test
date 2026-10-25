<?php

namespace App\Services\Subscription;

use App\Enums\BillingCycle;
use App\Models\Currency;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * PlanCatalogService
 *
 * Builds the subscription plan catalogue required by the Inertia frontend.
 *
 * Responsibilities:
 * - Retrieve plans appropriate to the authenticated user.
 * - Resolve application billing currency.
 * - Resolve user subscription billing cycle.
 * - Calculate billing-cycle-specific pricing.
 * - Transform plans into the existing Inertia payload shape.
 * - Determine the recommended plan.
 *
 * Architectural Notes:
 * - Contains read-side application logic only.
 * - Does not return Inertia responses.
 * - Does not mutate application state.
 *
 * Performance:
 * - Subscriber counts are loaded with the plan query.
 * - Currency symbols are retrieved as scalar values.
 * - Latest approved subscription order is limited to one row.
 */
class PlanCatalogService
{
    /**
     * Build the plan catalogue for an authenticated user.
     *
     * @return array<string, mixed>
     */
    public function forUser(
        User         $user,
        BillingCycle $billingCycle,
    ): array {
        $isSuperAdmin = $user->type === 'super_admin';

        $plans = Plan::query()
            ->withCount('users')
            ->when(
                !$isSuperAdmin,
                fn ($query) => $query->where(
                    'is_plan_enabled',
                    'on',
                ),
            )
            ->get();

        $currency = $this->applicationCurrency();

        $currencySymbol = Currency::query()
            ->where('code', $currency)
            ->value('symbol') ?? '$';

        $userPlanCycle = $isSuperAdmin
            ? BillingCycle::Monthly
            : $this->userBillingCycle($user);

        /*
         * Preserve the existing recommendation behavior:
         *
         * - Super-admin view excludes the free plan.
         * - Organization view may recommend the most subscribed plan
         *   regardless of price.
         *
         * The recommendation is calculated across all plans, matching the
         * original implementation rather than only enabled plans.
         */
        $recommendedPlanId = $this->recommendedPlanId(
            excludeFreePlan: $isSuperAdmin,
        );

        return [
            'plans' => $this->transformPlans(
                plans: $plans,
                billingCycle: $billingCycle,
                currencySymbol: $currencySymbol,
                user: $user,
                userPlanCycle: $userPlanCycle,
                recommendedPlanId: $recommendedPlanId,
                isSuperAdmin: $isSuperAdmin,
            ),

            'billingCycle' => $billingCycle->value,

            'currentPlan' => $isSuperAdmin
                ? null
                : $user->plan,

            'userTrialUsed' => (bool) $user->is_trial,

            'hasDefaultPlan' => $plans->contains(
                fn (Plan $plan): bool => (bool) $plan->is_default,
            ),

            'currency' => $currency,

            'currencySymbol' => $currencySymbol,
        ];
    }

    /**
     * Resolve the application's configured currency.
     */
    private function applicationCurrency(): string
    {
        $superAdmin = User::query()
            ->where('type', 'super_admin')
            ->firstOrFail(['id']);

        return settings($superAdmin->id)['default_currency']
            ?? 'USD';
    }

    /**
     * Resolve the user's current billing cycle from their latest approved
     * order for their current plan.
     *
     * Trial users intentionally remain on the monthly cycle.
     */
    private function userBillingCycle(User $user): BillingCycle
    {
        if ($user->is_trial) {
            return BillingCycle::Monthly;
        }

        $latestOrder = PlanOrder::query()
            ->where('user_id', $user->id)
            ->where('plan_id', $user->plan_id)
            ->where('status', 'approved')
            ->latest('id')
            ->first(['billing_cycle']);

        return BillingCycle::tryFrom(
            $latestOrder?->billing_cycle
            ?? BillingCycle::Monthly->value,
        ) ?? BillingCycle::Monthly;
    }

    /**
     * Determine the most subscribed plan.
     *
     * The query intentionally considers all plans because that matches the
     * existing recommendation behavior.
     */
    private function recommendedPlanId(
        bool $excludeFreePlan,
    ): ?int {
        return Plan::query()
            ->when(
                $excludeFreePlan,
                fn ($query) => $query->where(
                    'price',
                    '!=',
                    0,
                ),
            )
            ->withCount('users')
            ->orderByDesc('users_count')
            ->value('id');
    }

    /**
     * Transform plans into the existing Inertia response structure.
     *
     * @param Collection<int, Plan> $plans
     *
     * @return array<int, array<string, mixed>>
     */
    private function transformPlans(
        Collection   $plans,
        BillingCycle $billingCycle,
        string       $currencySymbol,
        User         $user,
        BillingCycle $userPlanCycle,
        ?int         $recommendedPlanId,
        bool         $isSuperAdmin,
    ): array {
        return $plans
            ->map(
                function (Plan $plan) use (
                    $billingCycle,
                    $currencySymbol,
                    $user,
                    $userPlanCycle,
                    $recommendedPlanId,
                    $isSuperAdmin,
                ): array {
                    $price = $billingCycle === BillingCycle::Yearly
                        ? $plan->yearly_price
                        : $plan->price;

                    $features = $this->features($plan);

                    if ($isSuperAdmin) {
                        return [
                            'id' => $plan->id,
                            'name' => $plan->name,
                            'price' => $price,
                            'formattedPrice' =>
                                $currencySymbol . $price,
                            'duration' => $billingCycle->value,
                            'description' => $plan->description,
                            'trial_days' => $plan->trial_days,
                            'features' => $features,
                            'stats' => [
                                'maximum_users' => $plan->maximum_users,
                                'maximum_projects' => $plan->maximum_projects,
                                'maximum_contacts' => $plan->maximum_contacts,
                                'maximum_accounts' => $plan->maximum_accounts,
                                'maximum_storage' => number_format(
                                    $plan->storage_limit,
                                ),
                            ],
                            'status' =>
                                $plan->is_plan_enabled === 'on',
                            'is_default' =>
                                (bool) $plan->is_default,
                            'recommended' =>
                                $plan->id === $recommendedPlanId,
                        ];
                    }

                    return [
                        'id' => $plan->id,
                        'name' => $plan->name,
                        'price' => $price,
                        'formatted_price' => $price,
                        'duration' => $billingCycle->value,
                        'description' => $plan->description,
                        'trial_days' => $plan->trial_days,
                        'features' => $features,
                        'stats' => [
                            'maximum_users' => $plan->maximum_users,
                            'maximum_projects' => $plan->maximum_projects,
                            'maximum_contacts' => $plan->maximum_contacts,
                            'maximum_accounts' => $plan->maximum_accounts,
                            'maximum_storage' => number_format(
                                $plan->storage_limit,
                            ),
                        ],
                        'is_current' =>
                            $user->plan_id === $plan->id
                            && $userPlanCycle === $billingCycle,
                        'is_trial_available' =>
                            $plan->is_trial === 'on'
                            && !$user->is_trial,
                        'is_default' =>
                            (bool) $plan->is_default,
                        'recommended' =>
                            $plan->id === $recommendedPlanId,
                    ];
                },
            )
            ->values()
            ->all();
    }

    /**
     * Resolve features enabled for a plan.
     *
     * @return array<int, string>
     */
    private function features(Plan $plan): array
    {
        return $plan->enable_kakbima_intelligence === 'on'
            ? ['Kakbima Intelligence']
            : [];
    }
}
