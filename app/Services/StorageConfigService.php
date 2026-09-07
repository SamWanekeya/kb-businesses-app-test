<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Log;

class StorageConfigService
{
    private static $config = null;

    /**
     * Get the active storage disk name
     */
    public static function getActiveDisk(): string
    {
        $cacheKey = 'global_storage_config';
        $config = Cache::remember($cacheKey, 60, function () {
            return self::loadStorageConfigFromDB();
        });

        return $config['disk'] ?? 'public';
    }

    /**
     * Load storage configuration from database
     */
    private static function loadStorageConfigFromDB(): array
    {
        try {
            $superAdminId = DB::table('users')
                ->where('type', 'super_admin')
                ->value('id');

            if (!$superAdminId) {
                return self::getDefaultConfig();
            }

            $settings = DB::table('settings')
                ->where('user_id', $superAdminId)
                ->whereIn('key', [
                    'storage_type',
                    'storage_file_types',
                    'storage_maximum_upload_size',
                    'aws_access_key_id',
                    'aws_secret_access_key',
                    'aws_default_region',
                    'aws_bucket',
                    'aws_url',
                    'aws_endpoint',
                    'wasabi_access_key',
                    'wasabi_secret_key',
                    'wasabi_region',
                    'wasabi_bucket',
                    'wasabi_url',
                    'wasabi_root',
                ])
                ->pluck('value', 'key')
                ->toArray();

            Log::info('Storage settings loaded', ['user_id' => $superAdminId, 'settings' => $settings]);

            // If no settings found, return default
            if (empty($settings)) {
                Log::info('No storage settings found, using defaults');

                return self::getDefaultConfig();
            }
            // Map storage_type to correct disk name
            $storageType = $settings['storage_type'] ?? 'local';
            $diskName = match ($storageType) {
                'local' => 'public',
                's3' => 's3',
                'wasabi' => 'wasabi',
                default => 'public'
            };

            return [
                'disk' => $diskName,
                'allowed_file_types' => $settings['storage_file_types'] ?? 'jpg,png,webp,gif',
                'maximum_file_size_mb' => (int)($settings['storage_maximum_upload_size'] ?? 2),
                's3' => [
                    'key' => $settings['aws_access_key_id'] ?? '',
                    'secret' => $settings['aws_secret_access_key'] ?? '',
                    'bucket' => $settings['aws_bucket'] ?? '',
                    'region' => $settings['aws_default_region'] ?? 'us-east-1',
                    'url' => $settings['aws_url'] ?? '',
                    'endpoint' => $settings['aws_endpoint'] ?? '',
                ],
                'wasabi' => [
                    'key' => $settings['wasabi_access_key'] ?? '',
                    'secret' => $settings['wasabi_secret_key'] ?? '',
                    'bucket' => $settings['wasabi_bucket'] ?? '',
                    'region' => $settings['wasabi_region'] ?? 'us-east-1',
                    'url' => $settings['wasabi_url'] ?? '',
                    'root' => $settings['wasabi_root'] ?? '',
                ],
            ];
        } catch (Exception $e) {
            Log::error('Failed to load storage config from DB', ['error' => $e->getMessage()]);

            return self::getDefaultConfig();
        }
    }

    /**
     * Get default storage configuration
     */
    private static function getDefaultConfig(): array
    {
        return [
            'disk' => 'public',
            'allowed_file_types' => 'jpg,png,webp,gif',
            'maximum_file_size_mb' => 2,
            's3' => [],
            'wasabi' => [],
        ];
    }

    /**
     * Get file validation rules based on settings
     */
    public static function getFileValidationRules(): array
    {
        $config = self::getStorageConfig();

        $allowedTypes = $config['allowed_file_types'] ?? '';
        $maximumSize = ($config['maximum_file_size_mb'] ?? 2) * 1024; // Convert MB to KB

        return [
            'mimes:' . $allowedTypes,
            'max:' . $maximumSize,
        ];
    }

    /**
     * Get complete storage configuration
     */
    public static function getStorageConfig(): array
    {
        $cacheKey = 'global_storage_config';

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        $data = self::loadStorageConfigFromDB();

        Cache::put($cacheKey, $data, 300);

        return $data;
    }

    /**
     * Clear storage configuration cache
     */
    public static function clearCache(): void
    {
        Cache::forget('global_storage_config');
        // Also clear for all users if needed
        Cache::flush();
    }
}
