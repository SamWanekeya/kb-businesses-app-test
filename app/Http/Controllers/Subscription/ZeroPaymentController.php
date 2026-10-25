<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Exception;
use Illuminate\Http\Request;

class ZeroPaymentController extends Controller
{
    public function processPayment(Request $request)
    {
        $validated = validatePaymentRequest($request, [
            'amount' => 'required|numeric|min:0',
        ]);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);

            createPlanOrder([
                'user_id' => auth()?->id(),
                'plan_id' => $plan->id,
                'billing_cycle' => $validated['billing_cycle'],
                'payment_method' => '-',
                'discount_code' => $validated['discount_code'] ?? null,
                'payment_id' => strtoupper(uniqid()),
                'status' => 'pending',
            ]);

            return back()->with('success', __('Payment request submitted. Your plan will be activated after payment verification.'));

        } catch (Exception $e) {
            return handlePaymentError($e);
        }
    }
}
