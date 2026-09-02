<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\User;
use Illuminate\Database\Seeder;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $organizationUsers = User::where('type', 'organization')->get();

        if ($organizationUsers->isEmpty()) {
            $this->command->warn('No organization users found. Please run UserSeeder first.');
            return;
        }

        $brandTemplates = [
            ['name' => 'Apple', 'description' => 'Premium technology brand', 'website' => 'https://apple.com'],
            ['name' => 'Samsung', 'description' => 'Global electronics manufacturer', 'website' => 'https://samsung.com'],
            ['name' => 'Dell', 'description' => 'Computer technology organization', 'website' => 'https://dell.com'],
            ['name' => 'Microsoft', 'description' => 'Software and cloud computing', 'website' => 'https://microsoft.com'],
            ['name' => 'Sony', 'description' => 'Electronics and entertainment', 'website' => 'https://sony.com'],
            ['name' => 'HP', 'description' => 'Personal computing solutions', 'website' => 'https://hp.com']
        ];

        foreach ($organizationUsers as $organization) {
            foreach ($brandTemplates as $template) {
                Brand::firstOrCreate(
                    ['name' => $template['name'], 'created_by' => $organization->id],
                    [
                        'name' => $template['name'],

                        'description' => $template['description'],
                        'website' => $template['website'],
                        'status' => 'active',
                        'created_by' => $organization->id,
                    ]
                );
            }
        }

        $this->command->info('Brands created for all organization users!');
    }
}
