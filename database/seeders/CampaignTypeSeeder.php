<?php

namespace Database\Seeders;

use App\Models\CampaignType;
use App\Models\User;
use Illuminate\Database\Seeder;

class CampaignTypeSeeder extends Seeder
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

        $typeTemplates = [
            ['name' => 'Email Marketing', 'description' => 'Email-based marketing campaigns', 'color' => '#3B82F6'],
            ['name' => 'Social Media', 'description' => 'Social media marketing campaigns', 'color' => '#8B5CF6'],
            ['name' => 'Direct Mail', 'description' => 'Physical mail marketing campaigns', 'color' => '#10b77f'],
            ['name' => 'Webinar', 'description' => 'Online webinar campaigns', 'color' => '#F59E0B'],
            ['name' => 'Trade Show', 'description' => 'Trade show and event campaigns', 'color' => '#EF4444'],
            ['name' => 'Content Marketing', 'description' => 'Content-based marketing campaigns', 'color' => '#059669'],
        ];

        foreach ($organizationUsers as $organization) {
            foreach ($typeTemplates as $template) {
                CampaignType::firstOrCreate(
                    ['name' => $template['name'], 'created_by' => $organization->id],
                    [
                        'name' => $template['name'],
                        'description' => $template['description'],
                        'color' => $template['color'],
                        'status' => 'active',
                        'created_by' => $organization->id,
                    ]
                );
            }
        }

        $this->command->info('Campaign types created for all organization users!');
    }
}
