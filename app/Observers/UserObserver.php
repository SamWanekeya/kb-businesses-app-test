<?php

namespace App\Observers;

use App\Models\Plan;
use App\Models\User;

class UserObserver
{
    /**
     * Handle the User "creating" event.
     */
    public function creating(User $user): void
    {
        // If user is organization type and has no plan_id, assign default plan
        if ($user->type === 'organization' && is_null($user->plan_id)) {
            $defaultPlan = Plan::getDefaultPlan();
            if ($defaultPlan) {
                $user->plan_id = $defaultPlan->id;
                $user->is_plan_active = 1;
            }
        }
    }

    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Generate a unique referral code if not already set
        if ($user->type === 'organization' && empty($user->referral_code)) {
            do {
                $code = rand(100000, 999999);
            } while (User::where('referral_code', $code)->exists());

            $user->referral_code = $code;
            $user->save();
        }

        // Create default settings for new users
        if ($user->type === 'super_admin') {
            createDefaultSettings($user->id);
        } elseif ($user->type === 'organization') {
            copySettingsFromSuperAdministrator($user->id);
        }
        if ($user->type == 'organization') {
            if ($user->plan_id) {
                $data = [
                    'user_id' => $user->id,
                    'plan_id' => $user->plan_id,
                    // 'billing_cycle'=>'monthly',
                    'payment_method' => 'manual',
                    'coupon_code' => null,
                    'payment_id' => null,
                    'status' => 'approved',
                    'processed_at' => now(),
                ];
                createPlanOrder($data);
            }
        }
    }
}
