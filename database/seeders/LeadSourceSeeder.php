<?php

namespace Database\Seeders;

use App\Models\LeadSource;
use App\Models\User;
use Illuminate\Database\Seeder;

class LeadSourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $organizationUsers = User::where('type', 'organization')->get();

        if ($organizationUsers->isEmpty()) {
            $this->command->warn('No organization users found. Please run UserSeeder first.');
            return;
        }

        $sourceTemplates = [
            ['name' => 'Website', 'description' => 'Leads from organization website'],
            ['name' => 'Social Media', 'description' => 'Leads from social media platforms'],
            ['name' => 'Email Campaign', 'description' => 'Leads from email marketing campaigns'],
            ['name' => 'Referral', 'description' => 'Leads from customer referrals'],
            ['name' => 'Cold Call', 'description' => 'Leads from cold calling activities'],
            ['name' => 'Trade Show', 'description' => 'Leads from trade shows and events']
        ];

        foreach ($organizationUsers as $organization) {
            foreach ($sourceTemplates as $template) {
                LeadSource::firstOrCreate(
                    ['name' => $template['name'], 'created_by' => $organization->id],
                    [
                        'name' => $template['name'],
                        'description' => $template['description'],
                        'status' => 'active',
                        'created_by' => $organization->id,
                    ]
                );
            }
        }

        $this->command->info('Lead sources created for all organization users!');
    }
}
