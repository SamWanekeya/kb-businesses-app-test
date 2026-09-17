<?php

declare(strict_types=1);

namespace App\Helpers;

use Illuminate\Support\Facades\Vite;

final class AssetHelper
{
    /**
     * Resolve a public asset URL for the current application environment.
     *
     * Determines whether the given path refers to a Vite-built asset
     * (prefixed with "static/") or a standard public asset and returns
     * the appropriate fully-qualified URL.
     *
     * - "static/..." paths are resolved via the Vite manifest.
     * - All other paths are resolved using Laravel's asset() helper.
     *
     * @param non-empty-string $path Relative asset path.
     *
     * @phpstan-param non-empty-string $path
     *
     * @psalm-param non-empty-string $path
     *
     * @return non-empty-string
     *
     * @phpstan-return non-empty-string
     *
     * @psalm-return non-empty-string
     */
    public static function asset(string $path): string
    {
        if (str_starts_with($path, 'static/')) {
            return self::viteAsset($path);
        }

        /** @var non-empty-string */
        return asset($path);
    }

    /**
     * Resolve a Vite-managed asset URL using Laravel's Vite facade.
     *
     * The "static/" prefix is removed before delegating to Vite::asset(),
     * allowing compatibility with:
     * - Vite development server (HMR)
     * - Production manifest-based versioned assets
     *
     * Example:
     *   static/cdn/app.js -> assets/app.[hash].js
     *
     * @param non-empty-string $path Vite asset path prefixed with "static/".
     *
     * @phpstan-param non-empty-string $path
     *
     * @psalm-param non-empty-string $path
     *
     * @return non-empty-string
     *
     * @phpstan-return non-empty-string
     *
     * @psalm-return non-empty-string
     */
    public static function viteAsset(string $path): string
    {
        $normalized = str_replace('static/', '', $path);

        /** @var non-empty-string */
        return Vite::asset($normalized);
    }
}
