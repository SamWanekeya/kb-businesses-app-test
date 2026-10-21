<?php

namespace App\Observers;

use App\Models\User;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        // Generate a unique referral code
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
    }
}
