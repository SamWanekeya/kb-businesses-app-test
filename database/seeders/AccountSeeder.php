<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\AccountType;
use App\Models\AccountIndustry;
use App\Models\User;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $organizationUsers = User::where('type', 'organization')->get();

        if ($organizationUsers->isEmpty()) {
            $this->command->warn('No organization users found. Please run UserSeeder first.');
            return;
        }

        $organizationTemplates = [
            'TechCorp', 'HealthPlus', 'RetailMax', 'FinanceHub', 'ManufacturePro', 'EduSoft', 'LogisticsPro', 'GreenEnergy',
            'AutoMotive', 'FoodService', 'RealEstate', 'Construction', 'Marketing', 'Consulting', 'Insurance', 'Travel',
            'Fashion', 'Sports', 'Entertainment', 'Agriculture', 'Mining', 'Telecom', 'Banking', 'Pharma',
            'Aerospace', 'Chemical', 'Textile', 'Furniture', 'Jewelry', 'Publishing', 'Gaming', 'Security'
        ];

        $organizationSuffixes = ['Inc', 'LLC', 'Corp', 'Ltd', 'Group', 'Solutions', 'Services', 'Systems', 'Technologies', 'Enterprises'];
        $statuses = ['active', 'inactive'];
        $countries = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 'Japan', 'India', 'Brazil', 'Mexico'];

        foreach ($organizationUsers as $organization) {
            $accountTypes = AccountType::where('created_by', $organization->id)->get();
            $accountIndustries = AccountIndustry::where('created_by', $organization->id)->get();
            $staffUsers = User::where('created_by', $organization->id)->get();

            if ($accountTypes->isEmpty() || $accountIndustries->isEmpty()) {
                continue;
            }

            for ($i = 1; $i <= 25; $i++) {
                $organizationName = $organizationTemplates[array_rand($organizationTemplates)];
                $organizationSuffix = $organizationSuffixes[array_rand($organizationSuffixes)];
                $fullOrganizationName = $organizationName . ' ' . $organizationSuffix;
                $email = strtolower(str_replace(' ', '', $organizationName)) . $i . '-' . $organization->id . '@' . strtolower($organizationName) . '.com';
                $country = $countries[array_rand($countries)];
                $status = $statuses[array_rand($statuses)];
                $sameShippingAddress = $faker->boolean(70); // 70% chance same as billing

                Account::firstOrCreate(
                    ['email' => $email, 'created_by' => $organization->id],
                    [
                        'name' => $fullOrganizationName . ($i > 1 ? ' #' . $i : ''),
                        'email' => $email,
                        'phone' => $faker->phoneNumber,
                        'billing_address' => $faker->streetAddress,
                        'billing_city' => $faker->city,
                        'billing_state' => $faker->state,
                        'billing_postal_code' => $faker->postcode,
                        'billing_country' => $country,
                        'shipping_address' => $sameShippingAddress ? null : $faker->streetAddress,
                        'shipping_city' => $sameShippingAddress ? null : $faker->city,
                        'shipping_state' => $sameShippingAddress ? null : $faker->state,
                        'shipping_postal_code' => $sameShippingAddress ? null : $faker->postcode,
                        'shipping_country' => $sameShippingAddress ? null : $country,
                        'website' => $faker->boolean(80) ? 'https://' . strtolower(str_replace(' ', '', $organizationName)) . '.com' : null,
                        'account_type_id' => $accountTypes->random()->id,
                        'account_industry_id' => $accountIndustries->random()->id,
                        'status' => $status,
                        'created_by' => $organization->id,
                        'assigned_to' => $staffUsers->isNotEmpty() ? $staffUsers->random()->id : null,
                        'created_at' => $faker->dateTimeBetween('-2 years', 'now'),
                        'updated_at' => $faker->dateTimeBetween('-1 year', 'now'),
                    ]
                );
            }
        }

        $totalAccounts = Account::count();
        $this->command->info("Total {$totalAccounts} accounts created for all organization users!");
    }
}
