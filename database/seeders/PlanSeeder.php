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
        | Annual pricing represents 20% discount against monthly billing.
        |
        */

        $plans = [
            [
                'name' => 'Starter',
                'price' => 19,
                'yearly_price' => 182.40,
                'duration' => 'monthly',
                'description' => 'Essential insurance CRM for individual agents and small agencies. Manage clients, policies, leads and renewals from one place.',
                'maximum_users' => 3,
                'maximum_projects' => 5,
                'maximum_contacts' => 2500,
                'maximum_accounts' => 50,
                'enable_branding' => 'on',
                'enable_kakbima_intelligence' => 'off',
                'storage_limit' => 1,
                'is_trial' => 'on',
                'trial_days' => 14,
                'is_plan_enabled' => 'on',
                'is_default' => true,
                'module' => null,
            ],

            [
                'name' => 'Professional',
                'price' => 69,
                'yearly_price' => 662.40,
                'duration' => 'monthly',
                'description' =>'Advanced insurance CRM for growing agencies and brokerages with automation, renewal management, reporting and team collaboration.',
                'maximum_users' => 10,
                'maximum_projects' => 25,
                'maximum_contacts' => 10000,
                'maximum_accounts' => 500,
                'enable_branding' => 'off',
                'enable_kakbima_intelligence' => 'on',
                'storage_limit' => 10,
                'is_trial' => 'on',
                'trial_days' => 14,
                'is_plan_enabled' => 'on',
                'is_default' => false,
                'module' => null,
            ],

            [
                'name' => 'Enterprise',
                'price' => 129,
                'yearly_price' => 1238.40,
                'duration' => 'monthly',
                'description' => 'Enterprise insurance CRM for large brokerages, insurers, MGAs and multi-branch organizations requiring advanced automation, governance, integrations and intelligence.',
                'maximum_users' => 25,
                'maximum_projects' => 100,
                'maximum_contacts' => 50000,
                'maximum_accounts' => 2500,
                'enable_branding' => 'off',
                'enable_kakbima_intelligence' => 'on',
                'storage_limit' => 100,
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
