<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ResetExpiredPlansJob implements ShouldQueue
{
    use Queueable;

    /**
     * Handle the job.
     *
     * Clears expired trials and plans for users in bulk.
     *
     * @return void
     */
    public function handle(): void
    {
        User::where('is_trial', true)
            ->whereDate('trial_expiry_date', '<', now())
            ->update([
                'is_trial' => false,
                'trial_expiry_date' => null,
                'plan_id' => null,
            ]);

        User::whereNotNull('plan_id')
            ->whereDate('plan_expiry_date', '<', now())
            ->update([
                'plan_id' => null,
                'plan_expiry_date' => null,
            ]);
    }
}
