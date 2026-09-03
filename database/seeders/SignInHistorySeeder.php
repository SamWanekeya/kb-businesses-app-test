<?php

namespace Database\Seeders;

use App\Models\SignInHistory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SignInHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing users
        $users = User::all();

        if ($users->isEmpty()) {
            $this->command->warn('No users found. Please run UserSeeder first.');

            return;
        }

        // Sample IP addresses
        $ipAddressAddresses = [
            '192.168.1.100',
            '10.0.0.50',
            '172.16.0.25',
            '203.0.113.45',
            '198.51.100.78',
            '127.0.0.1',
            '192.168.0.15',
            '10.1.1.200',
        ];

        // Sample browser and device data
        $browserData = [
            [
                'browser_name' => 'Chrome',
                'os_name' => 'Windows',
                'device_type' => 'desktop',
                'browser_language' => 'en',
            ],
            [
                'browser_name' => 'Firefox',
                'os_name' => 'Linux',
                'device_type' => 'desktop',
                'browser_language' => 'en',
            ],
            [
                'browser_name' => 'Safari',
                'os_name' => 'macOS',
                'device_type' => 'desktop',
                'browser_language' => 'en',
            ],
            [
                'browser_name' => 'Chrome',
                'os_name' => 'Android',
                'device_type' => 'mobile',
                'browser_language' => 'en',
            ],
            [
                'browser_name' => 'Safari',
                'os_name' => 'iOS',
                'device_type' => 'mobile',
                'browser_language' => 'en',
            ],
        ];

        // Sample location data
        $locationData = [
            [
                'country' => 'United States',
                'countryCode' => 'US',
                'region' => 'CA',
                'regionName' => 'California',
                'city' => 'San Francisco',
                'zip' => '94102',
                'lat' => 37.7749,
                'lon' => -122.4194,
                'timezone' => 'America/Los_Angeles',
                'isp' => 'Comcast Cable',
                'org' => 'Comcast Cable Communications',
            ],
            [
                'country' => 'United Kingdom',
                'countryCode' => 'GB',
                'region' => 'ENG',
                'regionName' => 'England',
                'city' => 'London',
                'zip' => 'SW1A',
                'lat' => 51.5074,
                'lon' => -0.1278,
                'timezone' => 'Europe/London',
                'isp' => 'British Telecom',
                'org' => 'BT Group',
            ],
            [
                'country' => 'Germany',
                'countryCode' => 'DE',
                'region' => 'BE',
                'regionName' => 'Berlin',
                'city' => 'Berlin',
                'zip' => '10115',
                'lat' => 52.5200,
                'lon' => 13.4050,
                'timezone' => 'Europe/Berlin',
                'isp' => 'Deutsche Telekom',
                'org' => 'T-Systems',
            ],
            [
                'country' => null,
                'countryCode' => null,
                'region' => null,
                'regionName' => null,
                'city' => null,
                'zip' => null,
                'lat' => null,
                'lon' => null,
                'timezone' => null,
                'isp' => null,
                'org' => null,
            ],
        ];

        // Get users by type
        $superAdminUsers = User::where('type', 'super_admin')->get();
        $organizationUsers = User::where('type', 'organization')->get();
        $staffUsers = User::where('type', '!=', 'super_admin')->where('type', '!=', 'organization')->get();

        // Create mixed sign in history records (20 total)
        $recordsCreated = 0;

        // Create 5 super_admin sign in records
        if ($superAdminUsers->isNotEmpty()) {
            for ($i = 0; $i < 5 && $recordsCreated < 20; $i++) {
                $user = $superAdminUsers->random();
                $this->createLoginRecord($user, $browserData, $locationData, $ipAddressAddresses, $user->id);
                $recordsCreated++;
            }
        }

        // Create 8 organization sign in records
        if ($organizationUsers->isNotEmpty()) {
            for ($i = 0; $i < 8 && $recordsCreated < 20; $i++) {
                $user = $organizationUsers->random();
                $superAdmin = $superAdminUsers->first();
                $createdBy = $superAdmin ? $superAdmin->id : $user->id;
                $this->createLoginRecord($user, $browserData, $locationData, $ipAddressAddresses, $createdBy);
                $recordsCreated++;
            }
        }

        // Create 7 staff sign in records (mostly created_by=2)
        if ($staffUsers->isNotEmpty()) {
            for ($i = 0; $i < 7 && $recordsCreated < 20; $i++) {
                $user = $staffUsers->random();
                $createdBy = rand(1, 2);
                $this->createLoginRecord($user, $browserData, $locationData, $ipAddressAddresses, $createdBy);
                $recordsCreated++;
            }
        }

        // Fill remaining records if any user type is missing
        while ($recordsCreated < 20 && $users->isNotEmpty()) {
            $user = $users->random();
            $createdBy = $this->getCreatedBy($user, $superAdminUsers, $organizationUsers);
            $this->createLoginRecord($user, $browserData, $locationData, $ipAddressAddresses, $createdBy);
            $recordsCreated++;
        }

        $this->command->info("{$recordsCreated} sign in history records created successfully.");
        $this->command->info('Distribution: 5 super_admin, 8 organization, 7 staff records.');
    }

    private function createLoginRecord($user, $browserData, $locationData, $ipAddressAddresses, $createdBy)
    {
        $browser = $browserData[array_rand($browserData)];
        $location = $locationData[array_rand($locationData)];
        $ipAddress = $ipAddressAddresses[array_rand($ipAddressAddresses)];

        // Combine all details
        $details = array_merge($browser, $location, [
            'status' => 'success',
            'query' => $ipAddress,
            'referrer_host' => fake()->randomElement(['localhost', 'kakbima.dev', 'kakbima.com', null]),
            'referrer_path' => fake()->randomElement(['/sign-in', '/dashboard', '/home', null]),
            'as' => null,
        ]);

        SignInHistory::create([
            'user_id' => $user->id,
            'ip_address' => $ipAddress,
            'date' => Carbon::now()->subDays(rand(0, 30))->toDateString(),
            'details' => $details,
            'type' => $user->type,
            'created_by' => $createdBy,
            'created_at' => Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59)),
            'updated_at' => Carbon::now(),
        ]);
    }

    private function getCreatedBy($user, $superAdminUsers, $organizationUsers)
    {
        if ($user->type === 'super_admin') {
            return $user->id;
        } elseif ($user->type === 'organization') {
            $superAdmin = $superAdminUsers->first();

            return $superAdmin ? $superAdmin->id : $user->id;
        } else {
            return $user->created_by ?: ($organizationUsers->first() ? $organizationUsers->first()->id : $user->id);
        }
    }
}
