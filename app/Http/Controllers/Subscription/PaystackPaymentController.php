<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\ProcessPaystackPaymentRequest;
use App\Services\Subscription\PaystackPaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Handles Paystack payment endpoints.
 *
 * Responsibilities:
 * - Receive and validate payment requests.
 * - Delegate payment processing to PaystackPaymentService.
 * - Translate successful and failed operations into HTTP/Inertia responses.
 *
 * Architectural Notes:
 * - Validation is handled by ProcessPaystackPaymentRequest.
 * - Paystack communication and payment orchestration are handled by
 *   PaystackPaymentService.
 * - The controller intentionally contains no gateway-specific HTTP logic.
 *
 * Error Handling:
 * - Expected payment failures are converted into user-facing errors.
 * - Unexpected failures are logged with contextual information and
 *   delegated to the existing payment error handler.
 */
class PaystackPaymentController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private readonly PaystackPaymentService $paymentService,
    ) {
    }

    /**
     * Verify and process a Paystack payment.
     *
     * Validation and authentication are performed by the form request.
     * Successful payment processing is delegated to the payment service.
     *
     * @param ProcessPaystackPaymentRequest $request
     *
     * @return RedirectResponse
     */
    public function processPayment(
        ProcessPaystackPaymentRequest $request,
    ): RedirectResponse {
        try {
            $this->paymentService->process($request);

            return back()->with(
                'success',
                __('Payment successful and plan activated.')
            );
        } catch (Throwable $exception) {
            Log::error('Paystack payment processing failed.', [
                'user_id' => $request->user()?->getKey(),
                'payment_id' => $request->input('payment_id'),
                'plan_id' => $request->input('plan_id'),
                'exception' => $exception,
            ]);

            return handlePaymentError(
                $exception,
                'paystack'
            );
        }
    }
}
