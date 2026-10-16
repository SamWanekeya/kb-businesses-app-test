<?php

namespace App\Http\Controllers;

use App\Http\Requests\DiscountRequest;
use App\Models\Discount;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DiscountController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Discount::with('creator');

        // Apply search
        if ($request->filled('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Apply filters
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Handle sorting with validation
        $sortField = $request->input('sort_field', 'id');
        $sortDirection = $request->input('sort_direction', 'desc');
        $allowedSorts = ['id', 'name', 'type', 'expiry_date', 'code'];
        $allowedDirection = ['asc', 'desc'];
        if (!in_array($sortDirection, $allowedDirection)) {
            $sortDirection = 'desc';
        }
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        }

        // Handle pagination with validation
        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $discounts = $query->paginate((int)$perPage)->withQueryString();

        return Inertia::render('Discounts/Index', [
            'discounts' => $discounts,
            'filters' => $request->only(['search', 'type', 'status', 'sort_field', 'sort_direction', 'per_page', 'date_from', 'date_to', 'page']),
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Discount $discount)
    {
        $discount->load(['creator', 'history.user', 'history.plan']);

        $usageHistory = $discount->history->map(function ($order) {
            return [
                'id' => $order->id,
                'user_name' => $order->user->name ?? 'N/A',
                'user_email' => $order->user->email ?? 'N/A',
                'order_id' => $order->order_number,
                'amount' => $order->original_price,
                'discount_amount' => $order->discount_amount,
                'used_at' => $order->ordered_at,
            ];
        });

        // Paginate the usage history
        $perPage = $request->input('per_page', 10);
        $page = $request->input('page', 1);
        $total = $usageHistory->count();
        $items = $usageHistory->forPage($page, $perPage)?->values();

        $paginatedUsage = new LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'pageName' => 'page']
        );

        return Inertia::render('Discounts/Show', [
            'discount' => $discount,
            'usage_history' => $paginatedUsage,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(DiscountRequest $request)
    {
        $data = $request->all();
        $data['created_by'] = Auth::id();

        // Generate code if auto-generate is selected
        if (empty($request->code) && $request->code_type === 'auto') {
            do {
                $data['code'] = strtoupper(Str::random(8));
            } while (Discount::where('code', $data['code'])->exists());
        }

        $discount = Discount::create($data);

        return redirect()->route('discounts.index')->with('success', __('Discount created successfully!'));
    }

    /**
     * Validate discount code
     */
    public function validate(Request $request)
    {
        $request->validate([
            'discount_code' => 'required|string',
            'plan_id' => 'required|integer',
            'amount' => 'required|numeric|min:0',
        ]);

        $discount = Discount::where('code', $request->discount_code)
            ->where('status', 1)
            ->first();

        if (!$discount) {
            return response()->json([
                'valid' => false,
                'message' => __('Invalid or inactive discount code'),
            ], 400);
        }

        // Check if discount is expired
        if ($discount->expiry_date && $discount->expiry_date < now()) {
            return response()->json([
                'valid' => false,
                'message' => __('Discount has expired'),
            ], 400);
        }

        // Check usage limit
        if ($discount->use_limit_per_discount && $discount->used_count >= $discount->use_limit_per_discount) {
            return response()->json([
                'valid' => false,
                'message' => __('Discount usage limit exceeded'),
            ], 400);
        }

        // Check minimum amount
        if ($discount->minimum_spend && $request->amount < $discount->minimum_spend) {
            return response()->json([
                'valid' => false,
                'message' => __('Minimum spend requirement not met'),
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'discount' => [
                'id' => $discount->id,
                'code' => $discount->code,
                'type' => $discount->type,
                'value' => $discount->discount_amount,
            ],
        ]);
    }

    /**
     * Toggle the status of the specified discount.
     */
    public function toggleStatus(Discount $discount)
    {
        $discount->update([
            'status' => !$discount->status,
        ]);

        return redirect()->back()->with([
            'success' => __('Discount status updated successfully!'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(DiscountRequest $request, Discount $discount)
    {

        $data = $request->all();

        // Generate new code if switching to auto-generate
        if ($request->code_type === 'auto' && $discount->code_type !== 'auto') {
            do {
                $data['code'] = strtoupper(Str::random(8));
            } while (Discount::where('code', $data['code'])->whereKeyNot($discount->id)->exists());
        }

        $discount->update($data);

        return redirect()->route('discounts.index')->with('success', __('Discount updated successfully!'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Discount $discount)
    {
        $discount->delete();

        return redirect()->route('discounts.index')->with('success', __('Discount deleted successfully!'));
    }
}
