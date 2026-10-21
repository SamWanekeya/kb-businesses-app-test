<?php

namespace App\Services\Subscription;

use App\Http\Requests\ProcessPaystackPaymentRequest;
use App\Models\Plan;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Handles Paystack payment verification and payment processing.
 *
 * Responsibilities:
 * - Retrieve Paystack gateway configuration.
 * - Verify payment references against Paystack.
 * - Confirm that Paystack reports a successful transaction.
 * - Delegate successful payment processing to the existing
 *   payment-processing business logic.
 *
 * Architectural Notes:
 * - HTTP communication with Paystack is isolated from the controller.
 * - The Paystack secret key is retrieved exclusively from server-side
 *   gateway configuration.
 * - The service does not expose gateway credentials to callers.
 *
 * Transaction Behavior:
 * - Paystack verification occurs outside a database transaction because
 *   it is an external HTTP operation.
 * - The existing payment-processing implementation remains responsible
 *   for its own database transaction requirements.
 *
 * Performance Considerations:
 * - Requests have an explicit timeout to prevent workers from hanging
 *   indefinitely on the external gateway.
 * - Verification uses the Laravel HTTP client, which is straightforward
 *   to fake in tests.
 *
 * Extension Points:
 * - Additional payment gateways can be implemented as separate services
 *   without adding gateway-specific logic to the controller.
 */
class PaystackPaymentService
{
    private const VERIFY_URL = 'https://api.paystack.co/transaction/verify';

    private const REQUEST_TIMEOUT = 10;

    /**
     * Process a Paystack payment.
     *
     * @param ProcessPaystackPaymentRequest $request
     *
     * @throws Throwable When gateway configuration, communication,
     *                   verification, or payment processing fails.
     *
     * @return void
     */
    /**
     * Process a Paystack payment.
     *
     * @param ProcessPaystackPaymentRequest $request
     *
     * @throws Throwable When gateway configuration, communication,
     *                   verification, or payment processing fails.
     *
     * @return void
     */
    public function process(ProcessPaystackPaymentRequest $request): void
    {
        $plan = Plan::query()->findOrFail(
            $request->integer('plan_id')
        );

        $paymentId = $request->string('payment_id')->toString();

        $settings = getPaymentGatewaySettings();

        $secretKey = data_get(
            $settings,
            'paymentSettings.paystack_secret_key'
        );

        if (blank($secretKey)) {
            throw new RuntimeException(
                __('Paystack is not configured.')
            );
        }

        if (!$this->verifyPayment($paymentId, $secretKey)) {
            throw new RuntimeException(
                __('Paystack payment verification failed.')
            );
        }

        processPaymentSuccess([
            'user_id' => $request->user()->getKey(),
            'plan_id' => $plan->getKey(),
            'billing_cycle' => $request->string('billing_cycle')->toString(),
            'payment_method' => 'paystack',
            'coupon_code' => $request->input('coupon_code'),
            'payment_id' => $paymentId,
        ]);
    }

    /**
     * Verify a payment reference against Paystack.
     *
     * @param string $paymentId
     * @param string $secretKey
     *
     * @throws ConnectionException When Paystack cannot be reached.
     *
     * @return bool
     */
    private function verifyPayment(
        string $paymentId,
        string $secretKey,
    ): bool {
        try {
            $response = Http::withToken($secretKey)
                ->acceptJson()
                ->timeout(self::REQUEST_TIMEOUT)
                ->get(
                    self::VERIFY_URL . '/' . rawurlencode($paymentId)
                );
        } catch (ConnectionException $exception) {
            Log::warning('Unable to connect to Paystack while verifying payment.', [
                'payment_id' => $paymentId,
                'exception' => $exception,
            ]);

            throw $exception;
        }

        if (!$response->successful()) {
            Log::warning('Paystack returned an unsuccessful HTTP response.', [
                'payment_id' => $paymentId,
                'status' => $response->status(),
            ]);

            return false;
        }

        return $response->json('status') === true
            && $response->json('data.status') === 'success';
    }
}
