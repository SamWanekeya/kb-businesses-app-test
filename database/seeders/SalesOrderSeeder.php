<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Quote;
use App\Models\SalesOrder;
use App\Models\ShippingProviderType;
use App\Models\User;
use Faker\Factory as Faker;
use Illuminate\Database\Seeder;

class SalesOrderSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();
        $organizationUsers = User::where('type', 'organization')->get();

        if ($organizationUsers->isEmpty()) {
            $this->command->warn('No organization users found. Please run UserSeeder first.');

            return;
        }

        $statuses = ['draft', 'confirmed', 'processing', 'shipped', 'delivered'];

        foreach ($organizationUsers as $organization) {
            $accounts = Account::where('created_by', $organization->id)->get();
            $contacts = Contact::where('created_by', $organization->id)->get();
            $products = Product::where('created_by', $organization->id)->get();
            $quotes = Quote::where('created_by', $organization->id)->get();
            $shippingTypes = ShippingProviderType::where('created_by', $organization->id)->get();
            $staffUsers = User::where('created_by', $organization->id)->get();

            if ($accounts->isEmpty() || $contacts->isEmpty() || $products->isEmpty()) {
                continue;
            }

            for ($i = 1; $i <= 15; $i++) {
                $account = $accounts->random();
                $contact = $contacts->where('account_id', $account->id)->first() ?? $contacts->random();
                $createdDate = $faker->dateTimeBetween('-3 months', 'now');
                $deliveryDate = $faker->dateTimeBetween($createdDate, '+1 month');

                $salesOrder = SalesOrder::create([
                    'name' => 'Order ' . $i,
                    'description' => $faker->sentence(6),
                    'quote_id' => $quotes->isNotEmpty() ? $quotes->random()->id : null,
                    'account_id' => $account->id,
                    'contact_id' => $contact->id,
                    'billing_contact_id' => $contact->id,
                    'shipping_contact_id' => $contact->id,
                    'shipping_provider_type_id' => $shippingTypes->isNotEmpty() ? $shippingTypes->random()->id : null,
                    'billing_address' => $faker->streetAddress,
                    'billing_city' => $faker->city,
                    'billing_state' => $faker->state,
                    'billing_postal_code' => $faker->postcode,
                    'billing_country' => 'USA',
                    'shipping_address' => $faker->streetAddress,
                    'shipping_city' => $faker->city,
                    'shipping_state' => $faker->state,
                    'shipping_postal_code' => $faker->postcode,
                    'shipping_country' => 'USA',
                    'order_date' => $createdDate,
                    'delivery_date' => $deliveryDate,
                    'status' => $faker->randomElement($statuses),
                    'shipping_amount' => $faker->randomFloat(2, 0, 50),
                    'created_by' => $organization->id,
                    'assigned_to' => $staffUsers->isNotEmpty() ? $staffUsers->random()->id : null,
                    'created_at' => $createdDate,
                ]);

                $selectedProducts = $products->random(random_int(1, 3));
                foreach ($selectedProducts as $product) {
                    $quantity = random_int(1, 10);
                    $unitPrice = $product->price;
                    $totalPrice = $quantity * $unitPrice;

                    $salesOrder->products()->attach($product->id, [
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total_price' => $totalPrice,
                        'discount_type' => 'none',
                        'discount_value' => 0,
                        'discount_amount' => 0,
                    ]);
                }

                $salesOrder->calculateTotals();
            }
        }

        $this->command->info('Sales orders created for all organization users!');
    }
}
