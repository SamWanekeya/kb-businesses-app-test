<?php

namespace App\Services\Subscription;

use App\Models\PlanRequest;
use Illuminate\Support\Facades\DB;

/**
 * Coordinates plan-request state transitions and their subscription
 * side effects.
 *
 * Approval and rejection are restricted to pending requests. Row locks
 * prevent concurrent actions from processing the same request twice.
 * Approval, plan assignment and order creation execute atomically.
 *
 * Existing domain helpers remain the source of plan-assignment and
 * plan-order business logic.
 */
class PlanRequestService
{
    /**
     * Approve a pending request and activate its requested plan.
     *
     * @return array{status: string, current_status?: string}
     */
    public function approve(
        PlanRequest $planRequest,
        int|string  $approverId,
    ): array {
        return DB::transaction(function () use (
            $planRequest,
            $approverId,
        ): array {
            $request = PlanRequest::query()
                ->lockForUpdate()
                ->findOrFail($planRequest->getKey());

            if ($request->status !== 'pending') {
                return [
                    'status' => 'already_processed',
                    'current_status' => $request->status,
                ];
            }

            // Load the current relationships after acquiring the lock.
            $request->load(['user', 'plan']);

            $plan = $request->plan;

            if (!$plan) {
                return ['status' => 'plan_missing'];
            }

            $user = $request->user;

            if (!$user) {
                return ['status' => 'user_missing'];
            }

            // Preserve the existing monthly fallback.
            $billingCycle = $request->billing_cycle ?? 'monthly';

            $now = now();

            $request->update([
                'status' => 'approved',
                'approved_at' => $now,
                'approved_by' => $approverId,
            ]);

            assignPlanToUser($user, $plan, $billingCycle);

            createPlanOrder([
                'user_id' => $user->id,
                'plan_id' => $plan->id,
                'billing_cycle' => $billingCycle,
                'payment_method' => 'Plan Request',
                'coupon_code' => null,
                'payment_id' => null,
                'status' => 'approved',
                'processed_at' => $now,
            ]);

            return ['status' => 'approved'];
        }, attempts: 3);
    }

    /**
     * Reject a pending request without changing subscription data.
     *
     * @return array{status: string, current_status?: string}
     */
    public function reject(
        PlanRequest $planRequest,
        int|string  $rejectorId,
    ): array {
        return DB::transaction(function () use (
            $planRequest,
            $rejectorId,
        ): array {
            $request = PlanRequest::query()
                ->lockForUpdate()
                ->findOrFail($planRequest->getKey());

            if ($request->status !== 'pending') {
                return [
                    'status' => 'already_processed',
                    'current_status' => $request->status,
                ];
            }

            $request->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejected_by' => $rejectorId,
            ]);

            return ['status' => 'rejected'];
        }, attempts: 3);
    }
}
