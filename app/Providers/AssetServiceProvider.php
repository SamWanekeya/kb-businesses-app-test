<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AssetServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register a custom Blade directive for our asset helper
        Blade::directive('dynamicAsset', function ($expression) {
            return "<?php echo App\\Helpers\\AssetHelper::asset($expression); ?>";
        });

        // Register a custom Blade directive for Vite assets
        Blade::directive('dynamicVite', function ($expression) {
            return "<?php echo App\\Helpers\\AssetHelper::viteAsset($expression); ?>";
        });
    }
}
