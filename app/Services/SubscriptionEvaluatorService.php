<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\User;
use DateTimeImmutable;

/**
 * Class SubscriptionEvaluatorService
 *
 * Centralized subscription evaluation engine.
 *
 * This service contains the full subscription and trial validation logic
 * used by HTTP middleware and any future entry points (CLI, jobs, APIs).
 *
 * Responsibilities:
 * - Determine whether a user may continue
 * - Detect expired subscriptions or trials
 * - Decide whether cleanup or logout is required
 *
 * This class performs NO redirects, NO authentication actions,
 * and NO session mutations.
 */
class SubscriptionEvaluatorService
{
    /**
     * Evaluate whether the given user has valid access.
     *
     * @param \App\Models\User $user
     *
     * @return \App\Services\SubscriptionResultService
     */
    public function evaluate(User $user): SubscriptionResultService
    {
        $now = new DateTimeImmutable();

        // Super admins bypass all checks
        if ($user->isSuperAdmin()) {
            return SubscriptionResultService::allow();
        }

        // Organization owner logic
        if ($user->type === 'organization') {
            return $this->evaluateOrganization($user, $now);
        }

        // Organization member logic
        return $this->evaluateOrganizationMember($user, $now);
    }

    /**
     * Evaluate subscription rules for organization owners.
     */
    protected function evaluateOrganization(
        User $user,
        DateTimeImmutable $now
    ): SubscriptionResultService {
        if (!$user->plan_id) {
            return SubscriptionResultService::deny(
                __('Please select a subscription plan to continue')
            );
        }

        $plan = Plan::find($user->plan_id);

        if (!$plan) {
            return SubscriptionResultService::deny(
                __('The selected subscription plan does not exist. Please choose a valid plan to continue'),
                cleanup: true
            );
        }

        // Active paid plan
        if ($this->isActiveDate($user->plan_expiry_date, $now)) {
            return SubscriptionResultService::allow();
        }

        // Active trial
        if (
            $user->is_trial &&
            $this->isActiveDate($user->trial_expiry_date, $now)
        ) {
            return SubscriptionResultService::allow();
        }

        // Expired — cleanup required
        return SubscriptionResultService::deny(
            __('Your subscription plan has expired. Renew your plan or choose a new one to continue'),
            cleanup: true
        );
    }

    /**
     * Evaluate subscription rules for organization members.
     */
    protected function evaluateOrganizationMember(
        User $user,
        DateTimeImmutable $now
    ): SubscriptionResultService {
        $organization = $user->organization;

        if (
            $organization &&
            (
                // Plan expiry takes precedence if it exists
                (
                    $organization->plan_expiry_date &&
                    !$this->isActiveDate($organization->plan_expiry_date, $now)
                )

                // Otherwise fall back to trial expiry
                || (
                    !$organization->plan_expiry_date &&
                    $organization->trial_expiry_date &&
                    !$this->isActiveDate($organization->trial_expiry_date, $now)
                )
            )
        ) {
            return SubscriptionResultService::deny(
                __('Access denied. Your organization’s subscription has expired. Please contact your administrator'),
                logout: true
            );
        }

        return SubscriptionResultService::allow();
    }

    /**
     * Determine whether an expiry date is still valid.
     *
     * @param string|null $expiryDate
     * @param \DateTimeImmutable $currentDate
     *
     * @return bool
     */
    protected function isActiveDate(
        ?string $expiryDate,
        DateTimeImmutable $currentDate
    ): bool {
        if (!$expiryDate) {
            return false;
        }

        return $currentDate <= new DateTimeImmutable($expiryDate);
    }
}
