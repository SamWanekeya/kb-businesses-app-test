<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StorageConfigService
{
    private static $config = null;

    /**
     * Get the active storage disk name
     */
    public static function getActiveDisk(): string
    {
        $userId = Auth::id();
        if (!$userId) {
            return 'public'; // Default for unauthenticated users
        }

        $cacheKey = 'active_storage_config';
        $config = Cache::remember($cacheKey, 300, function () use ($userId) {
            return self::loadStorageConfigFromDB($userId);
        });

        return $config['disk'] ?? 'public';
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
            'maximum:' . $maximumSize,
        ];
    }

    /**
     * Get complete storage configuration
     */
    public static function getStorageConfig(): array
    {
        try {
            // Check if user is authenticated
            if (!Auth::check() || !Auth::user()) {
                return self::getDefaultConfig();
            }

            $user = Auth::user();
            $userId = null;

            if ($user->type === 'super_admin') {
                $userId = $user->id;
            } else {
                $userId = getOrganizationId($user->created_by) ?? null;
            }

            if (!$userId) {
                return self::getDefaultConfig();
            }

            $cacheKey = 'active_storage_config_' . $userId;

            // return Cache::remember($cacheKey, 300, function () use ($userId) {
            return self::loadStorageConfigFromDB($userId);
            // });
        } catch (Exception $e) {
            Log::error('Error in getStorageConfig', ['error' => $e->getMessage()]);

            return self::getDefaultConfig();
        }
    }

    /**
     * Clear storage configuration cache
     */
    public static function clearCache(): void
    {
        Cache::forget('active_storage_config');
        Cache::forget('admin_settings');
    }

    /**
     * Load storage configuration from database
     */
    private static function loadStorageConfigFromDB($userId = null): array
    {
        try {

            if (!$userId) {
                return self::getDefaultConfig();
            }

            $settings = DB::table('settings')
                ->where('user_id', $userId)
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

            // Map storage_type to correct disk name
            $superAdmin = User::where('type', 'super_admin')->first();
            if ($superAdmin) {
                $superAdminSettings = DB::table('settings')->where('user_id', $superAdmin->id)->whereIn('key', [
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
            }

            $storageType = $superAdminSettings['storage_type'] ?? 'local';
            $diskName = match ($storageType) {
                'local' => 'public',
                'aws_s3' => 's3',
                'wasabi' => 'wasabi',
                default => 'public'
            };

            return [
                'disk' => $diskName,
                'allowed_file_types' => $superAdminSettings['storage_file_types'] ?? 'jpg,jpeg,png,webp,gif,pdf,doc,docx,csv,txt,zip,mp4,mp3',
                'maximum_file_size_mb' => (int) ($superAdminSettings['storage_maximum_upload_size'] ?? 2),
                's3' => [
                    'key' => $superAdminSettings['aws_access_key_id'] ?? '',
                    'secret' => $superAdminSettings['aws_secret_access_key'] ?? '',
                    'bucket' => $superAdminSettings['aws_bucket'] ?? '',
                    'region' => $superAdminSettings['aws_default_region'] ?? 'us-east-1',
                    'url' => $superAdminSettings['aws_url'] ?? '',
                    'endpoint' => $superAdminSettings['aws_endpoint'] ?? '',
                ],
                'wasabi' => [
                    'key' => $superAdminSettings['wasabi_access_key'] ?? '',
                    'secret' => $superAdminSettings['wasabi_secret_key'] ?? '',
                    'bucket' => $superAdminSettings['wasabi_bucket'] ?? '',
                    'region' => $superAdminSettings['wasabi_region'] ?? 'us-east-1',
                    'url' => $superAdminSettings['wasabi_url'] ?? '',
                    'root' => $superAdminSettings['wasabi_root'] ?? '',
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
            'allowed_file_types' => 'jpg,png,webp,gif,pdf,doc,docx,txt,csv,png',
            'maximum_file_size_mb' => 2,
            's3' => [],
            'wasabi' => [],
        ];
    }
}
