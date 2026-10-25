<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Setting;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $plans = Plan::all();

        // Create Super Administrator User
        $superAdmin = User::firstOrCreate(
            ['email' => 'super_admin@kakbima.dev'],
            [
                'name' => 'Super Administrator',
                'email_verified_at' => now(),
                'password' => Hash::make('Kakbima@DemoAccount2026'),
                'type' => 'super_admin',
                'lang' => 'en',
            ]
        );

        // Assign super admin role
        $superAdmin->assignRole('super_admin');

        // Create default settings for super_admin if not exists
        if (!Setting::where('user_id', $superAdmin->id)->exists()) {
            createDefaultSettings($superAdmin->id);
        }

        // Create Organization User
        $organization = User::firstOrCreate(
            ['email' => 'organization@kakbima.dev'],
            [
                'name' => 'Organization',
                'email_verified_at' => now(),
                'password' => Hash::make('Kakbima@DemoAccount2026'),
                'type' => 'organization',
                'lang' => $faker->randomElement(config('system-languages.supported_languages')),
                'plan_id' => $plans->first()?->id,
                'referral_code' => rand(100000, 999999),
                'plan_expiry_date' => $faker->dateTimeBetween('+1 month', '+400 days')->format('Y-m-d'),
                'created_by' => $superAdmin->id,
            ]
        );

        // Assign organization role
        $organization->assignRole('organization');

        // Create default settings for organization user if not exists
        if (!Setting::where('user_id', $organization->id)->exists()) {
            copySettingsFromSuperAdministrator($organization->id);
        }

        $this->command->info('Basic users created. Staff roles and users will be created by StaffRoleSeeder.');
    }
}
