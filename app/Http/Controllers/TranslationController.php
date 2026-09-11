<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\File;

class TranslationController extends BaseController
{
    /**
     * Resolve the preferred locale based on multiple factors.
     *
     * Order of precedence:
     *  1. Frontend-provided locale (query or route param)
     *  2. Cookie (__kb_lcl)
     *  3. Authenticated user preference
     *  4. Default: 'en'
     *
     * @param string|null $requestedLocale
     *
     * @return string
     */
    protected function resolveLocale(?string $requestedLocale = null): string
    {
        if ($requestedLocale) {
            return $requestedLocale;
        }

        if ($cookieLocale = Cookie::get('__kb_lcl')) {
            return $cookieLocale;
        }

        if (auth()?->check()) {
            return auth()?->user()?->lang ?? 'en';
        }

        return 'en';
    }

    /**
     * Determine layout direction based on locale.
     *
     * @param string $locale
     *
     * @return string 'rtl' or 'ltr'
     */
    protected function getLayoutDirection(string $locale): string
    {
        $rtlLocales = ['ar', 'ar-sa', 'ar-ae', 'ar-eg', 'ar-ma', 'ar-dz', 'ar-qa', 'ar-lb', 'he-il', 'fa', 'ur'];

        return in_array(strtolower($locale), $rtlLocales, true) ? 'rtl' : 'ltr';
    }

    /**
     * Load translations for a locale (cached per locale).
     *
     * Uses Laravel's cache to avoid repeated file reads.
     * Cache key format: "translations.{locale}"
     *
     * @param string $locale
     *
     * @return array{locale: string, translations: array, layout_direction: string}
     */
    protected function loadTranslations(string $locale): array
    {
        return Cache::rememberForever("translations.{$locale}", function () use ($locale) {
            $path = resource_path("lang/{$locale}.json");

            if (!File::exists($path)) {
                $path = resource_path('lang/en.json');
                $locale = 'en';
            }

            $translations = json_decode(File::get($path), true) ?? [];
            $layoutDirection = $this->getLayoutDirection($locale);

            return [
                'locale' => $locale,
                'layout_direction' => $layoutDirection,
                'translations' => $translations,
            ];
        });
    }

    /**
     * Persist the user's language preference via cookie and database.
     *
     * @param string $locale
     * @param string $layoutDirection
     *
     * @return void
     */
    protected function persistLocalePreference(string $locale, string $layoutDirection): void
    {
        //        $minutes = 400 * 24 * 60; // 400 days in minutes
        //        Cookie::queue('__kb_lcl', $locale, $minutes);

        if (auth()?->check()) {
            auth()?->user()?->update(['lang' => $locale]);

            Setting::updateOrCreate(
                ['key' => 'layout_direction', 'user_id' => auth()?->id()],
                ['value' => $layoutDirection]
            );
        }
    }

    /**
     * Main endpoint: Get translation data for a given locale.
     *
     * Frontend usage examples:
     *  - Initial language load
     *  - Language switch event
     *
     * Example call:
     *  GET /translations/sw
     *
     * @param string|null $locale
     *
     * @return JsonResponse
     */
    public function getTranslations(?string $locale = null): JsonResponse
    {
        $resolvedLocale = $this->resolveLocale($locale);
        $data = $this->loadTranslations($resolvedLocale);

        $this->persistLocalePreference($data['locale'], $data['layout_direction']);

        return response()->json($data);
    }

    /**
     * Secondary endpoint: Get the user's current locale (for app initialization).
     *
     * Example frontend flow:
     *  1. GET /initial-locale -> returns { locale: "sw", layout_direction: "ltr" }
     *  2. Initialize i18n with that locale before rendering.
     *
     * @return JsonResponse
     */
    public function getInitialLocale(): JsonResponse
    {
        $locale = $this->resolveLocale();
        $layoutDirection = $this->getLayoutDirection($locale);

        return response()->json([
            'locale' => $locale,
            'layout_direction' => $layoutDirection,
        ]);
    }

    /**
     * Clear cached translations manually (useful when updating language files).
     *
     * Example admin command:
     *  GET /clear-translations-cache
     *
     * @return JsonResponse
     */
    public function clearTranslationsCache(): JsonResponse
    {
        $locales = collect(File::files(resource_path('lang')))
            ->filter(fn ($file) => $file->getExtension() === 'json')
            ->map(fn ($file) => pathinfo($file->getFilename(), PATHINFO_FILENAME));

        foreach ($locales as $locale) {
            Cache::forget("translations.{$locale}");
        }

        return response()->json(['status' => 'ok', 'message' => 'Translation cache cleared.']);
    }
}
