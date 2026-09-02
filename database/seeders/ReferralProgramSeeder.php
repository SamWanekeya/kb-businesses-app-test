<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Plan;
use App\Models\Referral;
use App\Models\PayoutRequest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class ReferralProgramSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $plan = Plan::first();

        // Create organization@kakbima.dev with MORE data
        $mainOrganization = User::updateOrCreate(
            ['email' => 'organization@kakbima.dev'],
            [
                'name' => 'Organization',
                'email_verified_at' => now(),
                'password' => Hash::make('password'),
                'type' => 'organization',
                'plan_id' => $plan->id,
                'referral_code' => rand(100000, 999999),
            ]
        );
        $mainOrganization->assignRole('organization');

        // Realistic organization names for referred users
        $referredOrganizations = [
            'TechStart Solutions', 'Digital Marketing Pro', 'CloudSync Systems', 'DataFlow Analytics',
            'WebCraft Studios', 'MobileFirst Apps', 'SecureNet Services', 'AutoScale Tech',
            'SmartBiz Tools', 'InnovateLab Inc', 'GrowthHack Agency', 'NextGen Software'
        ];

        // Create 12 referred users for organization@kakbima.dev (MORE than others)
        foreach ($referredOrganizations as $i => $organizationName) {
            $email = strtolower(str_replace(' ', '', $organizationName)) . '@business.com';
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $organizationName,
                    'email_verified_at' => $faker->dateTimeBetween('-8 months', '-1 month'),
                    'password' => Hash::make('password'),
                    'type' => 'organization',
                    'plan_id' => $plan->id,
                    'referral_code' => rand(100000, 999999),
                    'referral_code_used' => $mainOrganization->referral_code,
                    'created_at' => $faker->dateTimeBetween('-8 months', '-1 month'),
                ]
            );
            $user->assignRole('organization');

            // Create realistic commission pattern - monthly recurring
            $joinDate = $user->created_at;
            $currentDate = now();
            $monthsDiff = $joinDate->diffInMonths($currentDate);

            // Create monthly commissions based on plan price
            $planPrice = $plan->price ?? 99;
            $commissionRate = 15; // 15%
            $monthlyCommission = ($planPrice * $commissionRate) / 100;

            for ($month = 0; $month <= $monthsDiff; $month++) {
                $commissionDate = $joinDate->copy()->addMonths($month);
                if ($commissionDate <= $currentDate) {
                    // Add some variation to commission amounts
                    $variation = $faker->randomFloat(2, -10, 25);
                    $finalAmount = max(5, $monthlyCommission + $variation);

                    Referral::create([
                        'user_id' => $user->id,
                        'organization_id' => $mainOrganization->id,
                        'commission_percentage' => $commissionRate,
                        'amount' => $finalAmount,
                        'plan_id' => $plan->id,
                        'created_at' => $commissionDate,
                        'updated_at' => $commissionDate,
                    ]);
                }
            }
        }

        // Create realistic payout requests based on actual earnings
        $totalEarnings = Referral::where('organization_id', $mainOrganization->id)->sum('amount');
        $availableBalance = $totalEarnings;

        // Create historical payout requests
        $payoutHistory = [
            ['months_ago' => 4, 'percentage' => 0.3, 'status' => 'approved', 'note' => 'Q1 commission payout'],
            ['months_ago' => 3, 'percentage' => 0.25, 'status' => 'approved', 'note' => 'Monthly withdrawal - March'],
            ['months_ago' => 2, 'percentage' => 0.2, 'status' => 'rejected', 'note' => 'Incomplete tax documentation'],
            ['months_ago' => 1, 'percentage' => 0.15, 'status' => 'approved', 'note' => 'Monthly withdrawal - May'],
            ['months_ago' => 0.5, 'percentage' => 0.1, 'status' => 'pending', 'note' => 'Current month withdrawal request'],
        ];

        $processedAmount = 0;
        foreach ($payoutHistory as $payout) {
            $requestAmount = min($totalEarnings * $payout['percentage'], $availableBalance - $processedAmount);
            if ($requestAmount > 50) {
                PayoutRequest::create([
                    'organization_id' => $mainOrganization->id,
                    'amount' => round($requestAmount, 2),
                    'status' => $payout['status'],
                    'notes' => $payout['note'],
                    'created_at' => now()->subMonths($payout['months_ago']),
                    'updated_at' => now()->subMonths($payout['months_ago'] - 0.1),
                ]);

                if ($payout['status'] === 'approved') {
                    $processedAmount += $requestAmount;
                }
            }
        }

        // Create other realistic organizations with LESS data
        $otherOrganizations = [
            ['name' => 'StartupHub Co', 'email' => 'startuphub@business.com'],
            ['name' => 'LocalBiz Solutions', 'email' => 'localbiz@organization.com'],
            ['name' => 'FreelanceForce', 'email' => 'freelanceforce@agency.com'],
            ['name' => 'ConsultPro Services', 'email' => 'consultpro@services.com'],
        ];

        foreach ($otherOrganizations as $organizationData) {
            $organization = User::updateOrCreate(
                ['email' => $organizationData['email']],
                [
                    'name' => $organizationData['name'],
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                    'type' => 'organization',
                    'plan_id' => $plan->id,
                    'referral_code' => rand(100000, 999999),
                ]
            );
            $organization->assignRole('organization');

            // Create fewer referred users for other organizations (2-4 users)
            $referredCount = $faker->numberBetween(2, 4);
            $smallBusinessNames = ['QuickStart', 'EasyFlow', 'SimpleTools', 'FastTrack', 'SmallBiz'];

            for ($i = 1; $i <= $referredCount; $i++) {
                $businessName = $faker->randomElement($smallBusinessNames) . ' ' . $faker->word();
                $email = strtolower(str_replace(' ', '', $businessName)) . $i . '@small.biz';

                $user = User::updateOrCreate(
                    ['email' => $email],
                    [
                        'name' => $businessName,
                        'email_verified_at' => $faker->dateTimeBetween('-3 months', '-2 weeks'),
                        'password' => Hash::make('password'),
                        'type' => 'organization',
                        'plan_id' => $plan->id,
                        'referral_code' => rand(100000, 999999),
                        'referral_code_used' => $organization->referral_code,
                        'created_at' => $faker->dateTimeBetween('-3 months', '-2 weeks'),
                    ]
                );
                $user->assignRole('organization');

                // Create realistic monthly commissions (fewer months)
                $joinDate = $user->created_at;
                $monthsActive = min(3, $joinDate->diffInMonths(now()));
                $planPrice = $plan->price ?? 49; // Smaller organizations use cheaper plans
                $monthlyCommission = ($planPrice * 15) / 100;

                for ($month = 0; $month <= $monthsActive; $month++) {
                    $commissionDate = $joinDate->copy()->addMonths($month);
                    if ($commissionDate <= now()) {
                        Referral::create([
                            'user_id' => $user->id,
                            'organization_id' => $organization->id,
                            'commission_percentage' => 15,
                            'amount' => $monthlyCommission + $faker->randomFloat(2, -5, 10),
                            'plan_id' => $plan->id,
                            'created_at' => $commissionDate,
                        ]);
                    }
                }
            }

            // Create multiple payout requests for other organizations
            $organizationEarnings = Referral::where('organization_id', $organization->id)->sum('amount');
            if ($organizationEarnings > 50) {
                $payoutRequests = [
                    ['months_ago' => 2, 'percentage' => 0.4, 'status' => 'approved', 'note' => 'Initial payout'],
                    ['months_ago' => 1, 'percentage' => 0.3, 'status' => $faker->randomElement(['approved', 'rejected']), 'note' => 'Monthly withdrawal'],
                    ['months_ago' => 0.2, 'percentage' => 0.25, 'status' => $faker->randomElement(['pending', 'approved']), 'note' => 'Recent withdrawal request'],
                ];

                $processedAmount = 0;
                foreach ($payoutRequests as $payout) {
                    $requestAmount = min($organizationEarnings * $payout['percentage'], $organizationEarnings - $processedAmount);
                    if ($requestAmount > 25) {
                        PayoutRequest::create([
                            'organization_id' => $organization->id,
                            'amount' => round($requestAmount, 2),
                            'status' => $payout['status'],
                            'notes' => $payout['note'],
                            'created_at' => now()->subMonths($payout['months_ago']),
                            'updated_at' => now()->subMonths($payout['months_ago'] - 0.1),
                        ]);

                        if ($payout['status'] === 'approved') {
                            $processedAmount += $requestAmount;
                        }
                    }
                }
            }
        }

        $this->command->info('Referral program data created successfully!');
        $this->command->info('Main Organization (MORE data): organization@kakbima.dev / password');
        $this->command->info('Other Organizations (LESS data): organizationa@kakbima.dev, organizationb@kakbima.dev, organizationc@kakbima.dev / password');
        $this->command->info('Main organization earnings: $' . Referral::where('organization_id', $mainOrganization->id)->sum('amount'));
    }
}
