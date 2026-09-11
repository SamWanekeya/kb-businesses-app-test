<?php

namespace App\Providers;

use App\Models\Account;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Opportunity;
use App\Models\Plan;
use App\Models\PurchaseOrder;
use App\Models\Quote;
use App\Models\SalesOrder;
use App\Models\User;
use App\Observers\AccountObserver;
use App\Observers\InvoiceObserver;
use App\Observers\LeadObserver;
use App\Observers\OpportunityObserver;
use App\Observers\PlanObserver;
use App\Observers\PurchaseOrderObserver;
use App\Observers\QuoteObserver;
use App\Observers\SalesOrderObserver;
use App\Observers\UserObserver;
use App\Services\SubscriptionEvaluatorService;
use App\Services\WebhookService;
use Exception;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Ensure a single CSP nonce per request
        $this->app->scoped('cspNonce', fn () => rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '='));

        $this->app->singleton(WebhookService::class);

        // Register our AssetServiceProvider
        $this->app->register(AssetServiceProvider::class);

        $this->app->singleton(SubscriptionEvaluatorService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        /**
         * Blade helper: @nonce
         *
         * Usage:
         * <script @nonce>...</script>
         *
         * Injects the per-request CSP nonce into inline script/style tags.
         * This ensures compatibility with strict Content Security Policy (CSP)
         * where all executable scripts must include a valid nonce.
         *
         * Note:
         * - The nonce is generated once per request and shared across:
         *   - Blade inline scripts (@nonce)
         *   - Vite assets (via Vite::useCspNonce)
         *   - Inertia v3 JSON hydration script
         * - All must use the SAME nonce value for CSP to pass.
         */
        Blade::directive('nonce', function () {
            return '<?php echo \'nonce="\' . e(app(\'cspNonce\')) . \'"\'; ?>';
        });

        // Ensure Vite (and Inertia v3) scripts receive the same CSP nonce
        Vite::useCspNonce(app('cspNonce'));
        // Register the UserObserver
        User::observe(UserObserver::class);

        // Register the PlanObserver
        Plan::observe(PlanObserver::class);

        // Register the LeadObserver
        Lead::observe(LeadObserver::class);

        // Register the AccountObserver
        Account::observe(AccountObserver::class);

        // Register the OpportunityObserver
        Opportunity::observe(OpportunityObserver::class);

        // Register the QuoteObserver
        Quote::observe(QuoteObserver::class);

        // Register the SalesOrderObserver
        SalesOrder::observe(SalesOrderObserver::class);

        // Register the InvoiceObserver
        Invoice::observe(InvoiceObserver::class);

        // Register the PurchaseOrderObserver
        PurchaseOrder::observe(PurchaseOrderObserver::class);

        // Configure dynamic storage disks
        //        try {
        //            \App\Services\DynamicStorageService::configureDynamicDisks();
        //        } catch (Exception $e) {
        //            // Silently fail during migrations or when database is not ready
        //            Log::error($e);
        //        }

        // Ensure storage symlink exists (run once per boot, not per request)
        if (!File::exists(public_path('storage'))) {
            try {
                Artisan::call('storage:link');
            } catch (Exception $e) {
                // Fail silently but log once for investigation
                Log::error($e);
            }
        }
    }
}
