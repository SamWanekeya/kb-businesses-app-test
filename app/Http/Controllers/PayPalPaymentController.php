<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;

class PayPalPaymentController extends Controller
{
    public function processPayment(Request $request)
    {
        $validated = validatePaymentRequest($request, [
            'order_id' => 'required|string',
            'payment_id' => 'required|string',
        ]);

        try {
            $plan = Plan::findOrFail($validated['plan_id']);

            processPaymentSuccess([
                'user_id' => auth()->id(),
                'plan_id' => $plan->id,
                'billing_cycle' => $validated['billing_cycle'],
                'payment_method' => 'paypal',
                'coupon_code' => $validated['coupon_code'] ?? null,
                'payment_id' => $validated['payment_id'],
            ]);

            return back()->with('success', __('Payment successful and plan activated'));

        } catch (\Exception $e) {
            return handlePaymentError($e, 'paypal');
        }
    }
}
