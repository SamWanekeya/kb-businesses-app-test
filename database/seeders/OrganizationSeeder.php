<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Setting;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class OrganizationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Get default plan
        $defaultPlan = Plan::where('is_default', true)->first();
        $plans = Plan::all();

        // Organization names
        $organizationNames = [
            'Acme Corporation',
            'Globex Industries',
            'Stark Enterprises',
            'Wayne Enterprises',
            'Umbrella Corporation',
            'Cyberdyne Systems',
            'Soylent Corp',
            'Initech Technologies',
            'Massive Dynamic',
            'Oscorp Industries',
            'Aperture Science',
            'Weyland-Yutani Corp',
            'Tyrell Corporation',
            'Rekall Inc',
            'Virtucon Industries',
        ];

        // Create organization users
        foreach ($organizationNames as $index => $organizationName) {
            $email = strtolower(str_replace(' ', '', $organizationName)) . '@kakbima.dev';

            // Skip if user already exists
            if (User::where('email', $email)->exists()) {
                continue;
            }

            // Create user
            $user = User::create([
                'name' => $organizationName,
                'email' => $email,
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'type' => 'organization',
                'lang' => $faker->randomElement(['en', 'es', 'fr', 'de']),
                'plan_id' => $plans->random()->id,
                'referral_code' => rand(100000, 999999),
                'created_at' => $faker->dateTimeBetween('-1 year', 'now'),
            ]);

            // Assign organization role
            $user->assignRole('organization');

            // Create default settings
            if (!Setting::where('user_id', $user->id)->exists()) {
                copySettingsFromSuperAdministrator($user->id);
            }
        }

        $this->command->info('Created ' . count($organizationNames) . ' organization users successfully!');
    }
}
