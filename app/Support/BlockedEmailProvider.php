<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

/**
 * Provides cached access to blocked email domain data.
 *
 * Loads large static JSON datasets once and caches them
 * to avoid repeated disk I/O and JSON decoding during
 * request handling.
 */
final class BlockedEmailProvider
{
    /**
     * Get blocked email domains.
     *
     * @return array<int, string>
     */
    public static function domains(): array
    {
        return Cache::rememberForever('blocked_email_domains', static function () {
            return self::loadJson(
                resource_path('data/blocked_email_domains.json')
            );
        });
    }

    /**
     * Get blocked email domain keywords.
     *
     * @return array<int, string>
     */
    public static function keywords(): array
    {
        return Cache::rememberForever('blocked_email_keywords', static function () {
            return self::loadJson(
                resource_path('data/blocked_email_keywords.json')
            );
        });
    }

    /**
     * Load and normalize a JSON file.
     *
     * @param string $path
     *
     * @return array<int, string>
     */
    private static function loadJson(string $path): array
    {
        if (! is_file($path)) {
            return [];
        }

        $data = json_decode(file_get_contents($path), true);

        if (! is_array($data)) {
            return [];
        }

        return array_map('strtolower', $data);
    }
}
