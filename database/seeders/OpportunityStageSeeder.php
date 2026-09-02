<?php

namespace Database\Seeders;

use App\Models\OpportunityStage;
use App\Models\User;
use Illuminate\Database\Seeder;

class OpportunityStageSeeder extends Seeder
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

        $stageTemplates = [
            ['name' => 'Prospecting', 'color' => '#6B7280', 'probability' => 10, 'description' => 'Initial stage for identifying opportunities'],
            ['name' => 'Qualification', 'color' => '#3B82F6', 'probability' => 25, 'description' => 'Qualifying and understanding requirements'],
            ['name' => 'Proposal', 'color' => '#F59E0B', 'probability' => 50, 'description' => 'Proposal submitted to client'],
            ['name' => 'Negotiation', 'color' => '#8B5CF6', 'probability' => 75, 'description' => 'Negotiating terms and conditions'],
            ['name' => 'Closed Won', 'color' => '#10b77f', 'probability' => 100, 'description' => 'Opportunity successfully closed'],
            ['name' => 'Closed Lost', 'color' => '#EF4444', 'probability' => 0, 'description' => 'Opportunity lost or cancelled']
        ];

        foreach ($organizationUsers as $organization) {
            foreach ($stageTemplates as $template) {
                OpportunityStage::firstOrCreate(
                    ['name' => $template['name'], 'created_by' => $organization->id],
                    [
                        'name' => $template['name'],
                        'color' => $template['color'],
                        'probability' => $template['probability'],
                        'description' => $template['description'],
                        'status' => 'active',
                        'created_by' => $organization->id,
                    ]
                );
            }
        }

        $this->command->info('Opportunity stages created for all organization users!');
    }
}
