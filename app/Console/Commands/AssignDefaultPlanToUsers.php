<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Models\User;
use Illuminate\Console\Command;

class AssignDefaultPlanToUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:assign-default-plan';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign default plan to organization users without a plan';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $defaultPlan = Plan::getDefaultPlan();

        if (!$defaultPlan) {
            $this->error(__('No default plan found. Please create a default plan first.'));
            return 1;
        }

        $count = User::where('type', 'organization')
            ->whereNull('plan_id')
            ->update(['plan_id' => $defaultPlan->id, 'is_plan_active' => 1]);

        $this->info("Successfully assigned default plan to {$count} users.");

        return 0;
    }
}
