<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Plan;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Administrator User
        $superAdmin = User::firstOrCreate(
            ['email' => 'super_admin@kakbima.dev'],
            [
                'name' => 'Super Administrator',
                'email_verified_at' => now(),
                'password' => Hash::make('Kakbima@DemoAccount2026'),
                'type' => 'super_admin',
                'lang' => 'en'
            ]
        );

        // Assign super admin role
        $superAdmin->assignRole('super_admin');

        // Create default settings for super_admin if not exists
        if (!Setting::where('user_id', $superAdmin->id)->exists()) {
            createDefaultSettings($superAdmin->id);
        }

        // Get default plan
        $defaultPlan = Plan::where('is_default', true)->first();

        // Create Organization User
        $organization = User::firstOrCreate(
            ['email' => 'organization@kakbima.dev'],
            [
                'name' => 'Organization',
                'email_verified_at' => now(),
                'password' => Hash::make('Kakbima@DemoAccount2026'),
                'type' => 'organization',
                'lang' => 'en',
                // 'plan_id' => $defaultPlan ? $defaultPlan->id : null,
                'referral_code' => rand(100000, 999999),
                'created_by' => $superAdmin->id,
            ]
        );

        // Assign organization role
        $organization->assignRole('organization');

        // Create default settings for organization user if not exists
        if (!Setting::where('user_id', $organization->id)->exists()) {
            copySettingsFromSuperAdmin($organization->id);
        }

        // Assign default plan to all organization users with null plan_id
        if ($defaultPlan) {
            User::where('type', 'organization')
                ->whereNull('plan_id')
                ->update(['plan_id' => $defaultPlan->id]);
        }

        $this->command->info('Basic users created. Staff roles and users will be created by StaffRoleSeeder.');
    }
}
