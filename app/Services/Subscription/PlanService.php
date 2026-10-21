<?php

namespace App\Services\Subscription;

use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlanRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * PlanService
 *
 * Handles subscription-plan mutations and subscription lifecycle operations.
 *
 * Responsibilities:
 * - Create plans.
 * - Update plans.
 * - Maintain the single-default-plan rule.
 * - Toggle plan availability.
 * - Delete plans.
 * - Submit customer plan requests.
 * - Start customer trials.
 * - Create pending subscription orders.
 *
 * Architectural Notes:
 * - HTTP concerns remain in PlanController.
 * - Validation remains in Form Requests.
 * - Authorization remains in route middleware.
 * - Database mutations are centralized here.
 *
 * Transaction Behavior:
 * - Plan creation and updates are transactional when the default-plan
 *   state may change.
 * - Trial activation is transactional because multiple user fields must
 *   change together.
 *
 * Pricing:
 * - Explicit yearly prices are always respected.
 * - When omitted, yearly pricing is calculated as ten monthly payments,
 *   representing two months free.
 *
 * Performance:
 * - Mutations use direct Eloquent operations.
 * - No unnecessary model retrieval is performed for bulk default-plan
 *   changes.
 */
class PlanService
{
    /**
     * Number of monthly billing periods charged for a yearly plan when
     * automatic yearly pricing is required.
     *
     * Ten paid months means two months are effectively free.
     */
    private const int YEARLY_BILLING_MONTHS = 10;

    /**
     * Create a subscription plan.
     *
     * If the plan is marked as default, all existing default plans are
     * cleared before the new plan is created.
     *
     * Explicit yearly pricing is preserved. Automatic pricing is only
     * applied when yearly_price is null.
     *
     * @param array<string, mixed> $attributes
     */
    public function createPlan(array $attributes): Plan
    {
        return DB::transaction(function () use ($attributes): Plan {
            if ($attributes['is_default']) {
                $this->clearDefaultPlan();
            }

            $attributes['yearly_price'] ??=
                $attributes['price']
                * self::YEARLY_BILLING_MONTHS;

            return Plan::create($attributes);
        });
    }

    /**
     * Update an existing subscription plan.
     *
     * If the plan becomes the default plan, all other default plans are
     * cleared within the same transaction.
     *
     * Explicit yearly pricing is preserved.
     *
     * @param array<string, mixed> $attributes
     */
    public function updatePlan(
        Plan  $plan,
        array $attributes,
    ): Plan {
        return DB::transaction(
            function () use ($plan, $attributes): Plan {
                if (
                    $attributes['is_default']
                    && !$plan->is_default
                ) {
                    $this->clearDefaultPlan($plan);
                }

                $attributes['yearly_price'] ??=
                    $attributes['price']
                    * self::YEARLY_BILLING_MONTHS;

                $plan->update($attributes);

                return $plan->refresh();
            }
        );
    }

    /**
     * Toggle the enabled state of a subscription plan.
     *
     * @return string The resulting status.
     */
    public function togglePlanStatus(Plan $plan): string
    {
        $plan->update([
            'is_plan_enabled' =>
                $plan->is_plan_enabled === 'on'
                    ? 'off'
                    : 'on',
        ]);

        return $plan->is_plan_enabled === 'on'
            ? 'activated'
            : 'deactivated';
    }

    /**
     * Delete a subscription plan.
     *
     * Default plans cannot be deleted.
     *
     * @return bool True when the plan was deleted, otherwise false.
     */
    public function deletePlan(Plan $plan): bool
    {
        if ($plan->is_default) {
            return false;
        }

        return (bool) $plan->delete();
    }

    /**
     * Submit a customer plan-change request.
     */
    public function submitPlanRequest(
        User   $user,
        Plan   $plan,
        string $billingCycle,
    ): PlanRequest {
        return PlanRequest::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_cycle' => $billingCycle,
            'status' => 'pending',
        ]);
    }

    /**
     * Start a trial for a user.
     *
     * Expected ineligible states return false rather than throwing an
     * exception. This allows the controller to return the normal Inertia
     * flash error already used by the application.
     *
     * @return bool True when the trial was started.
     */
    public function startTrial(
        User $user,
        Plan $plan,
    ): bool {
        if (
            $user->is_trial
            || $plan->is_trial !== 'on'
            || $plan->is_plan_enabled !== 'on'
        ) {
            return false;
        }

        DB::transaction(function () use ($user, $plan): void {
            $user->update([
                'plan_id' => $plan->id,
                'is_trial' => true,
                'trial_days' => $plan->trial_days,
                'trial_expiry_date' => now()->addDays(
                    $plan->trial_days
                ),
            ]);
        });

        return true;
    }

    /**
     * Create a pending subscription order.
     *
     * The billing cycle is persisted because the application uses the
     * latest approved order to determine the user's current billing cycle.
     */
    public function createSubscriptionOrder(
        User   $user,
        Plan   $plan,
        string $billingCycle,
    ): PlanOrder {
        $price = $billingCycle === 'yearly'
            ? $plan->yearly_price
            : $plan->price;

        return PlanOrder::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_cycle' => $billingCycle,
            'original_price' => $price,
            'final_price' => $price,
            'status' => 'pending',
        ]);
    }

    /**
     * Remove the default flag from all plans except an optional plan.
     *
     * @param Plan|null $except Plan that should retain its default status.
     */
    private function clearDefaultPlan(?Plan $except = null): void
    {
        Plan::query()
            ->where('is_default', true)
            ->when(
                $except,
                fn ($query) => $query->whereKeyNot($except->getKey(), ),
            )
            ->update([
                'is_default' => false,
            ]);
    }
}
