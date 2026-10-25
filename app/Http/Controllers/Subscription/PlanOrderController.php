<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\BaseController;
use App\Models\Currency;
use App\Models\PlanOrder;
use App\Models\User;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PlanOrderController extends BaseController
{
    public function index(Request $request)
    {

        $query = PlanOrder::with(['user', 'plan', 'coupon', 'processedBy']);

        // For Organization
        if (Auth::user()?->hasRole('organization')) {
            $query->where('user_id', Auth::user()?->id);
        }

        // Handle search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('plan', function ($planQuery) use ($search) {
                        $planQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Handle date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('ordered_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('ordered_at', '<=', $request->date_to);
        }

        // Handle sorting
        $sortField = $request->input('sort_field', 'ordered_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        // Validate sort field
        $allowedSortFields = ['id', 'ordered_at', 'status', 'final_price'];
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'ordered_at';
        }

        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->input('per_page', 10);
        $planOrders = $query->paginate($perPage);

        // Transform data for frontend
        $planOrders->getCollection()->transform(function ($planOrder) {
            return [
                'id' => $planOrder->id,
                'order_number' => $planOrder->order_number,
                'user' => [
                    'id' => $planOrder->user->id,
                    'name' => $planOrder->user->name,
                    'email' => $planOrder->user->email,
                    'avatar' => checkFile($planOrder->user->avatar) ?? getFile($planOrder->user->avatar),
                ],
                'plan' => [
                    'id' => $planOrder->plan->id,
                    'name' => $planOrder->plan->name,
                ],
                'billing_cycle' => $planOrder->billing_cycle,
                'original_price' => $planOrder->original_price,
                'discount_amount' => $planOrder->discount_amount,
                'final_price' => $planOrder->final_price,
                'coupon_code' => $planOrder->coupon_code,
                'payment_method' => $planOrder->payment_method,
                'payment_id' => $planOrder->payment_id,
                'status' => $planOrder->status,
                'ordered_at' => $planOrder->ordered_at,
                'processed_at' => $planOrder->processed_at,
                'processed_by' => $planOrder->processedBy ? [
                    'id' => $planOrder->processedBy->id,
                    'name' => $planOrder->processedBy->name,
                ] : null,
                'notes' => $planOrder->notes,
                'receipt' => $planOrder->receipt && checkFile($planOrder->receipt) ? getFile($planOrder->receipt) : null,
            ];
        });

        // Always use super admin currency for plan pricing
        $superAdmin = User::where('type', 'super_admin')?->first();
        $superAdminSettings = settings($superAdmin->id);
        $currency = $superAdminSettings['default_currency'] ?? 'USD';
        $currencySymbol = '$';
        if (!empty($currency)) {
            $currencyData = Currency::where('code', $currency)?->first();
            $currencySymbol = $currencyData ? $currencyData->symbol : '$';
        }

        return Inertia::render('Subscriptions/PlanOrders/Index', [
            'planOrders' => $planOrders,
            'filters' => $request->all(['search', 'status', 'date_from', 'date_to', 'sort_field', 'sort_direction', 'per_page']),
            'currency' => $currency,
            'currency_symbol' => $currencySymbol,
        ]);
    }

    public function approve(PlanOrder $planOrder)
    {
        try {
            $planOrder->approve(Auth::id());

            return redirect()->back()->with('success', __('Plan order approved successfully'));
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);

            // Return an appropriate error response
            return redirect()->back()->with('error', __('Something went wrong. Please try again.'));
        }
    }

    public function reject(Request $request, PlanOrder $planOrder)
    {
        try {
            $request->validate([
                'notes' => 'nullable|string|max:500',
            ]);

            $planOrder->reject(Auth::id(), $request->notes);

            return redirect()->back()->with('success', __('Plan order rejected successfully'));
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error($e);

            // Return an appropriate error response
            return redirect()->back()->with('error', __('Something went wrong. Please try again.'));
        }
    }
}
