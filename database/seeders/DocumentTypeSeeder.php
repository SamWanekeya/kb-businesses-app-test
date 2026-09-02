<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DocumentType;
use App\Models\User;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $organizations = User::where('type', 'organization')->get();

        if ($organizations->isEmpty()) {
            $this->command->warn('No organization users found. Please run UserSeeder first.');
            return;
        }

        $documentTypes = [
            'Contract',
            'Invoice',
            'Proposal',
            'Report',
            'Presentation',
            'Agreement',
            'Policy',
            'Manual',
        ];

        foreach ($organizations as $organization) {
            foreach ($documentTypes as $typeName) {
                DocumentType::firstOrCreate(
                    [
                        'type_name' => $typeName,
                        'created_by' => $organization->id
                    ],
                    [
                        'type_name' => $typeName,
                        'status' => 'active',
                        'created_by' => $organization->id,
                    ]
                );
            }
        }

        $this->command->info('Document types created for all organization users!');
    }
}
