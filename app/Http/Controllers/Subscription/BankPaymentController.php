<?php

namespace App\Http\Controllers\Subscription;

use App\Http\Controllers\Controller;
use App\Http\Requests\Subscription\ProcessBankPaymentRequest;
use App\Services\Subscription\BankPaymentService;
use Illuminate\Http\RedirectResponse;
use Throwable;

/**
 * Handle manual bank payment HTTP endpoints.
 *
 * Responsibilities:
 * - Accept validated payment requests.
 * - Delegate payment processing to BankPaymentService.
 * - Return the appropriate HTTP response.
 *
 * Architectural Notes:
 * - Validation is delegated to ProcessBankPaymentRequest.
 * - Payment business logic is delegated to BankPaymentService.
 * - Database operations, file uploads, pricing, and notifications are not
 *   performed directly by the controller.
 *
 * Authorization:
 * - ProcessBankPaymentRequest requires an authenticated user.
 *
 * Error handling:
 * - Unexpected application failures are reported through Laravel's exception
 *   reporting system before being passed to the existing payment error
 *   response handler.
 */
class BankPaymentController extends Controller
{
    /**
     * Create the controller instance.
     */
    public function __construct(
        private readonly BankPaymentService $bankPaymentService,
    ) {
    }

    /**
     * Submit a bank payment request for verification.
     *
     * The resulting plan order remains pending until the existing payment
     * verification process approves the bank payment.
     */
    public function processPayment(
        ProcessBankPaymentRequest $request,
    ): RedirectResponse {
        try {
            $this->bankPaymentService->process($request);

            return back()->with(
                'success',
                __('Payment request submitted. Your plan will be activated after payment verification'),
            );
        } catch (Throwable $exception) {
            report($exception);

            return handlePaymentError($exception, 'bank');
        }
    }
}
