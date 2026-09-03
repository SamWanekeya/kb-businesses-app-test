<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Webhook;
use Illuminate\Database\Seeder;

class WebhookSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('type', 'organization')->take(3)->get();

        if ($users->isEmpty()) {
            $this->command->warn('No organization users found. Please seed users first.');

            return;
        }

        $webhooks = [
            [
                'user_id' => $users->first()->id,
                'module' => 'New User',
                'method' => 'POST',
                'url' => 'https://accounts.kakbima.dev/webhooks/new-user',
            ],
            [
                'user_id' => $users->first()->id,
                'module' => 'Lead Assigned',
                'method' => 'POST',
                'url' => 'https://accounts.kakbima.dev/webhooks/lead-assigned',
            ],
            [
                'user_id' => $users->first()->id,
                'module' => 'Case Created',
                'method' => 'POST',
                'url' => 'https://accounts.kakbima.dev/webhooks/case-created',
            ],
            [
                'user_id' => $users->skip(1)->first()->id,
                'module' => 'Meeting Invitation',
                'method' => 'GET',
                'url' => 'https://organization2.com/api/meeting-invitation',
            ],
            [
                'user_id' => $users->skip(1)->first()->id,
                'module' => 'Opportunity Created',
                'method' => 'POST',
                'url' => 'https://organization2.com/webhooks/opportunity-created',
            ],
            [
                'user_id' => $users->last()->id,
                'module' => 'Quote Created',
                'method' => 'POST',
                'url' => 'https://organization3.com/webhooks/quote-created',
            ],
            [
                'user_id' => $users->last()->id,
                'module' => 'Task Assigned',
                'method' => 'POST',
                'url' => 'https://organization3.com/webhooks/task-assigned',
            ],
        ];

        foreach ($webhooks as $webhookData) {
            Webhook::create($webhookData);
        }

        $this->command->info('Webhooks seeded successfully!');
    }
}
