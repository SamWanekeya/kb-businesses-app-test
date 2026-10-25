<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |
        | Pricing is designed around insurance agencies, brokers, agents,
        | MGAs and insurers rather than generic project management.
        |
        | Annual pricing represents 16.7% discount against monthly billing.
        |
        */

        $plans = [
            [
                'name' => 'Starter',
                'price' => 9,
                'yearly_price' => 90,
                'duration' => 'monthly',
                'description' => 'Designed for individual insurance agents and small businesses getting started with customer relationship management.',
                'maximum_users' => 3,
                'maximum_projects' => 3,
                'maximum_contacts' => 1000,
                'maximum_accounts' => 500,
                'enable_kakbima_intelligence' => 'off',
                'storage_limit' => 10,
                'is_trial' => 'on',
                'trial_days' => 14,
                'is_plan_enabled' => 'on',
                'is_default' => true,
                'module' => null,
            ],

            [
                'name' => 'Growth',
                'price' => 39,
                'yearly_price' => 390,
                'duration' => 'monthly',
                'description' => 'Designed for growing agencies and small brokerages that need more capacity for their teams, customer records, and day-to-day sales activities.',
                'maximum_users' => 15,
                'maximum_projects' => 15,
                'maximum_contacts' => 10000,
                'maximum_accounts' => 5000,
                'enable_kakbima_intelligence' => 'on',
                'storage_limit' => 50,
                'is_trial' => 'on',
                'trial_days' => 14,
                'is_plan_enabled' => 'on',
                'is_default' => false,
                'module' => null,
            ],

            [
                'name' => 'Business',
                'price' => 99,
                'yearly_price' => 990,
                'duration' => 'monthly',
                'description' => 'Designed for established brokerages, agencies, and insurance businesses with larger teams and customer databases.',
                'maximum_users' => 50,
                'maximum_projects' => 100,
                'maximum_contacts' => 50000,
                'maximum_accounts' => 25000,
                'enable_kakbima_intelligence' => 'on',
                'storage_limit' => 250,
                'is_trial' => 'on',
                'trial_days' => 14,
                'is_plan_enabled' => 'on',
                'is_default' => false,
                'module' => null,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(
                ['name' => $planData['name']],
                $planData
            );
        }
    }
}
