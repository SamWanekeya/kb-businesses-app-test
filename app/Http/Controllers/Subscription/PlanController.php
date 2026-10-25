<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\PlanIndexRequest;
use App\Http\Requests\Subscription\PlanRequestSubmissionRequest;
use App\Http\Requests\Subscription\StartTrialRequest;
use App\Http\Requests\Subscription\StorePlanRequest;
use App\Http\Requests\Subscription\SubscribeRequest;
use App\Http\Requests\Subscription\UpdatePlanRequest;
use App\Models\Plan;
use App\Services\Subscription\PlanCatalogService;
use App\Services\Subscription\PlanService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * PlanController
 *
 * Handles subscription-plan HTTP endpoints.
 *
 * Responsibilities:
 * - Receive validated requests.
 * - Delegate plan read operations to PlanCatalogService.
 * - Delegate plan mutations to PlanService.
 * - Return Inertia responses and redirects.
 *
 * Architectural Notes:
 * - Authentication is enforced by route middleware.
 * - Permission checks are enforced by route middleware.
 * - Validation is delegated to Form Requests.
 * - Business rules are delegated to PlanService.
 * - Read-side catalogue construction is delegated to
 *   PlanCatalogService.
 * - API Resources are intentionally not used because these are
 *   Inertia endpoints rather than API endpoints.
 *
 * Error Handling:
 * - Validation failures are handled by Laravel Form Requests and returned
 *   through the normal Inertia validation flow.
 * - Expected business failures use existing Inertia flash messages.
 * - Unexpected exceptions are allowed to propagate to Laravel's exception
 *   handler for logging and production reporting.
 */
class PlanController extends Controller
{
    /**
     * Create a new plan controller instance.
     */
    public function __construct(
        private readonly PlanService        $planService,
        private readonly PlanCatalogService $catalogService,
    ) {
    }

    /**
     * Display the subscription plan catalogue.
     */
    public function index(PlanIndexRequest $request): Response
    {
        $user = $request->user();

        $catalogue = $this->catalogService->forUser(
            $user,
            $request->billingCycle(),
        );

        if ($user->type !== 'super_admin') {
            return Inertia::render('Subscriptions/Plans/Index', [
                'plans' => $catalogue['plans'],
                'billingCycle' => $catalogue['billingCycle'],
                'currentPlan' => $catalogue['currentPlan'],
                'userTrialUsed' => $catalogue['userTrialUsed'],
                'currency' => $catalogue['currency'],
                'currencySymbol' => $catalogue['currencySymbol'],
            ]);
        }

        return Inertia::render('Subscriptions/Plans/Index', [
            'plans' => $catalogue['plans'],
            'billingCycle' => $catalogue['billingCycle'],
            'hasDefaultPlan' => $catalogue['hasDefaultPlan'],
            'currency' => $catalogue['currency'],
            'currencySymbol' => $catalogue['currencySymbol'],
        ]);
    }

    /**
     * Toggle the enabled state of a plan.
     */
    public function toggleStatus(Plan $plan): RedirectResponse
    {
        $status = $this->planService->togglePlanStatus($plan);

        return back()->with(
            'success',
            __('Plan :status successfully', [
                'status' => $status,
            ]),
        );
    }

    /**
     * Store a newly created subscription plan.
     */
    public function store(
        StorePlanRequest $request,
    ): RedirectResponse {
        $this->planService->createPlan(
            $request->validated(),
        );

        return redirect()
            ->route('subscriptions.plans.index')
            ->with(
                'success',
                __('Plan created successfully.'),
            );
    }

    /**
     * Update an existing subscription plan.
     */
    public function update(
        UpdatePlanRequest $request,
        Plan              $plan,
    ): RedirectResponse {
        $this->planService->updatePlan(
            $plan,
            $request->validated(),
        );

        return redirect()
            ->route('subscriptions.plans.index')
            ->with(
                'success',
                __('Plan updated successfully.'),
            );
    }

    /**
     * Display the plan creation form.
     */
    public function create(): Response
    {
        $hasDefaultPlan = Plan::query()
            ->where('is_default', true)
            ->exists();

        return Inertia::render('Subscriptions/Plans/Create', [
            'hasDefaultPlan' => $hasDefaultPlan,
        ]);
    }

    /**
     * Display the plan editing form.
     */
    public function edit(Plan $plan): Response
    {
        $otherDefaultPlanExists = Plan::query()
            ->where('is_default', true)
            ->whereKeyNot($plan->id)
            ->exists();

        return Inertia::render('Subscriptions/Plans/Edit', [
            'plan' => $plan,
            'otherDefaultPlanExists' => $otherDefaultPlanExists,
        ]);
    }

    /**
     * Delete a subscription plan.
     */
    public function destroy(Plan $plan): RedirectResponse
    {
        if (!$this->planService->deletePlan($plan)) {
            return back()->with(
                'error',
                __('You cannot delete the default plan.'),
            );
        }

        return redirect()
            ->route('subscriptions.plans.index')
            ->with(
                'success',
                __('Plan deleted successfully.'),
            );
    }

    /**
     * Submit a customer request for a plan change.
     */
    public function requestPlan(
        PlanRequestSubmissionRequest $request,
    ): RedirectResponse {
        $validated = $request->validated();

        $plan = Plan::query()->findOrFail(
            $validated['plan_id'],
        );

        $this->planService->submitPlanRequest(
            $request->user(),
            $plan,
            $validated['billing_cycle'],
        );

        return back()->with(
            'success',
            __('Plan request submitted successfully'),
        );
    }

    /**
     * Start a subscription-plan trial.
     *
     * Trial ineligibility is treated as an expected business condition and
     * returned through the normal Inertia flash-message mechanism.
     */
    public function startTrial(
        StartTrialRequest $request,
    ): RedirectResponse {
        $plan = Plan::query()->findOrFail(
            $request->integer('plan_id'),
        );

        $started = $this->planService->startTrial(
            $request->user(),
            $plan,
        );

        if (!$started) {
            return back()->with(
                'error',
                __('Trial not available'),
            );
        }

        return redirect()
            ->route('dashboard.index')
            ->with(
                'success',
                __('Your 14-day free trial has started'),
            );
    }

    /**
     * Create a pending subscription order.
     */
    public function subscribe(
        SubscribeRequest $request,
    ): RedirectResponse {
        $validated = $request->validated();

        $plan = Plan::query()->findOrFail(
            $validated['plan_id'],
        );

        $this->planService->createSubscriptionOrder(
            $request->user(),
            $plan,
            $validated['billing_cycle'],
        );

        return back()->with(
            'success',
            __('Subscription request submitted successfully'),
        );
    }
}
