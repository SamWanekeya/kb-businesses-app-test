<?php

namespace Database\Seeders;

use App\Models\Newsletter;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class NewsletterSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 1; $i <= 10; $i++) {
            Newsletter::create([
                'email' => $faker->unique()->safeEmail,
                'created_at' => $faker->dateTimeBetween('-2 months', 'now'),
            ]);
        }

        $this->command->info('10 newsletter subscriptions created successfully!');
    }
}
