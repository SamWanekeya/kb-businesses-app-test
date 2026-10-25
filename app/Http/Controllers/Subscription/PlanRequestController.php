<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Subscription\PlanRequestIndexRequest;
use App\Http\Resources\PlanRequestResource;
use App\Models\PlanRequest;
use App\Services\Subscription\PlanRequestService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles the Inertia endpoints for managing plan requests.
 *
 * Responsibilities:
 * - Build the filtered and paginated listing.
 * - Delegate state transitions to PlanRequestService.
 * - Return the existing Inertia page and translated flash messages.
 *
 * Validation is handled by Form Requests, and response serialization
 * is handled by PlanRequestResource.
 */
class PlanRequestController extends BaseController
{
    /**
     * Display a searchable, filterable list of plan requests.
     *
     * Organization users can view only their own requests. Other
     * authenticated users retain the original listing scope; access
     * to this endpoint must be restricted by the application's
     * existing route middleware or authorization policy.
     *
     * @return Response
     */
    public function index(PlanRequestIndexRequest $request): Response
    {
        $filters = $request->validated();

        $query = PlanRequest::query()
            ->with(['user', 'plan']);

        if ($request->user()->hasRole('organization')) {
            $query->where('user_id', $request->user()->getKey());
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search): void {
                $query
                    ->whereHas('user', function ($userQuery) use ($search): void {
                        $userQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('plan', function ($planQuery) use ($search): void {
                        $planQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (
            isset($filters['status'])
            && $filters['status'] !== 'all'
        ) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate(
                'created_at',
                '>=',
                $filters['date_from'],
            );
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate(
                'created_at',
                '<=',
                $filters['date_to'],
            );
        }

        $sortField = $filters['sort_field'] ?? 'id';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        $planRequests = $query
            ->orderBy($sortField, $sortDirection)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();

        // Preserve Laravel's existing paginator response structure.
        $planRequests->through(
            fn (PlanRequest $planRequest): array => (new PlanRequestResource($planRequest))
                ->resolve($request),
        );

        return Inertia::render('Subscriptions/PlanRequests', [
            'planRequests' => $planRequests,
            'filters' => [
                'search' => $filters['search'] ?? null,
                'status' => $filters['status'] ?? null,
                'date_from' => $filters['date_from'] ?? null,
                'date_to' => $filters['date_to'] ?? null,
                'sort_field' => $filters['sort_field'] ?? null,
                'sort_direction' => $filters['sort_direction'] ?? null,
                'per_page' => $filters['per_page'] ?? null,
            ],
        ]);
    }

    /**
     * Approve a pending plan request.
     *
     * The service performs the state transition and associated
     * subscription/order operations within a database transaction.
     */
    public function approve(
        PlanRequest        $planRequest,
        PlanRequestService $service,
    ): RedirectResponse {
        $result = $service->approve(
            $planRequest,
            request()->user()->getAuthIdentifier(),
        );

        if ($result['status'] === 'already_processed') {
            return $this->backWithError(
                __('This plan request has already been :status.', [
                    'status' => $result['current_status'],
                ]),
            );
        }

        if ($result['status'] === 'plan_missing') {
            return $this->backWithError(
                __('The requested plan no longer exists.'),
            );
        }

        if ($result['status'] === 'user_missing') {
            return $this->backWithError(
                __('The requesting user no longer exists.'),
            );
        }

        return redirect()
            ->route('subscriptions.plan-requests.index')
            ->with('success', __('Plan request approved successfully'));
    }

    /**
     * Reject a pending plan request.
     *
     * Rejection is idempotency-protected at the state-transition
     * boundary: requests that are no longer pending are not modified.
     */
    public function reject(
        PlanRequest        $planRequest,
        PlanRequestService $service,
    ): RedirectResponse {
        $result = $service->reject(
            $planRequest,
            request()->user()->getAuthIdentifier(),
        );

        if ($result['status'] === 'already_processed') {
            return $this->backWithError(
                __('This plan request has already been :status.', [
                    'status' => $result['current_status'],
                ]),
            );
        }

        return redirect()
            ->route('subscriptions.plan-requests.index')
            ->with('success', __('Plan request rejected successfully'));
    }

    /**
     * Redirect to the listing with a translated error message.
     */
    private function backWithError(string $message): RedirectResponse
    {
        return redirect()
            ->route('subscriptions.plan-requests.index')
            ->with('error', $message);
    }
}
