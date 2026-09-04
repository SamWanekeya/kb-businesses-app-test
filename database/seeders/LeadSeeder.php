<?php

namespace Database\Seeders;

use App\Models\AccountIndustry;
use App\Models\Campaign;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadStatus;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class LeadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();
        $organizationUsers = User::where('type', 'organization')->get();

        if ($organizationUsers->isEmpty()) {
            $this->command->warn('No organization users found. Please run UserSeeder first.');

            return;
        }

        $organizationNames = ['TechCorp', 'HealthPlus', 'RetailMax', 'FinanceHub', 'ManufacturePro', 'EduSoft', 'LogisticsPro', 'GreenEnergy'];
        $positions = ['CEO', 'CTO', 'VP Sales', 'IT Director', 'Operations Manager', 'Marketing Director', 'Head of Digital'];
        $values = [25000, 45000, 75000, 95000, 125000, 150000, 200000, 300000];

        foreach ($organizationUsers as $organization) {
            $leadStatuses = LeadStatus::where('created_by', $organization->id)->get();
            $leadSources = LeadSource::where('created_by', $organization->id)->get();
            $campaigns = Campaign::where('created_by', $organization->id)->get();
            $accountIndustries = AccountIndustry::where('created_by', $organization->id)->get();
            $staffUsers = User::where('created_by', $organization->id)->get();

            if ($leadStatuses->isEmpty() || $leadSources->isEmpty()) {
                continue;
            }

            for ($i = 1; $i <= 25; $i++) {
                $organizationName = $faker->randomElement($organizationNames);
                $firstName = $faker->firstName;
                $lastName = $faker->lastName;

                Lead::create([
                    'name' => $firstName . ' ' . $lastName,
                    'email' => strtolower($firstName . '.' . $lastName . '.' . $organization->id) . '@' . strtolower($organizationName) . '.com',
                    'phone' => $faker->phoneNumber,
                    'organization' => $organizationName . ' Inc',
                    'account_name' => $faker->firstName . ' ' . $faker->lastName,
                    'position' => $faker->randomElement($positions),
                    'address' => $faker->streetAddress,
                    'value' => $faker->randomElement($values),
                    'status' => 'active',
                    'is_converted' => $faker->boolean(30), // 30% conversion rate
                    'lead_status_id' => $leadStatuses->random()->id,
                    'lead_source_id' => $leadSources->random()->id,
                    'created_by' => $organization->id,
                    'assigned_to' => $staffUsers->isNotEmpty() ? $staffUsers->random()->id : null,
                    'campaign_id' => $campaigns->isNotEmpty() ? $campaigns->random()->id : null,
                    'account_industry_id' => $accountIndustries->isNotEmpty() ? $accountIndustries->random()->id : null,
                    'created_at' => $faker->dateTimeBetween('-3 months', 'now'),
                ]);
            }
        }

        $this->command->info('Leads created for all organization users!');
    }
}
