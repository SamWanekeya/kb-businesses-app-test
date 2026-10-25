<?php

namespace App\Services\Subscription;

use App\Http\Requests\Subscription\ProcessBankPaymentRequest;
use App\Models\Plan;
use App\Notifications\BankPaymentSubmittedNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Throwable;

/**
 * Process manual bank payment requests.
 *
 * Responsibilities:
 * - Resolve the selected plan.
 * - Construct the bank payment order payload.
 * - Handle optional receipt uploads through the application's existing
 *   storage abstraction.
 * - Create the pending plan order through createPlanOrder().
 * - Queue an internal payment-team notification after successful persistence.
 *
 * Architectural decisions:
 * - HTTP validation remains in ProcessBankPaymentRequest.
 * - Pricing remains exclusively controlled by createPlanOrder().
 * - The existing uploadFile() helper remains the storage boundary because it
 *   encapsulates Kakbima's dynamic local/S3/Wasabi configuration.
 * - Email delivery is queued and therefore is not part of payment success.
 *
 * The service intentionally does not catch database/order exceptions. Such
 * failures must propagate to Laravel's exception handling infrastructure.
 *
 * Receipt upload failures are handled separately because the existing payment
 * behavior allows an order to be created without a receipt when the upload
 * itself fails.
 */
class BankPaymentService
{
    /**
     * Process a validated bank payment request.
     *
     * @throws Throwable When plan resolution or order creation fails.
     */
    public function process(ProcessBankPaymentRequest $request): void
    {
        $validated = $request->validated();
        $user = $request->user();

        $plan = Plan::findOrFail($validated['plan_id']);

        $orderData = [
            'user_id' => $user->getKey(),
            'plan_id' => $plan->getKey(),
            'billing_cycle' => $validated['billing_cycle'],
            'payment_method' => 'bank',
            'coupon_code' => $validated['coupon_code'] ?? null,
            'payment_id' => $this->generatePaymentId(),
            'status' => 'pending',
        ];

        if ($request->hasFile('receipt')) {
            $receipt = $this->uploadReceipt($request);

            if ($receipt !== null) {
                $orderData['receipt'] = $receipt;
            }
        }

        $order = createPlanOrder($orderData);

        $this->sendPaymentNotification(
            order: $order,
            plan: $plan,
            user: $user,
        );
    }

    /**
     * Generate a unique bank payment identifier.
     *
     * UUID provides significantly stronger uniqueness characteristics than
     * uniqid() and does not depend on process timing.
     */
    private function generatePaymentId(): string
    {
        return 'BANK_' . strtoupper((string) Str::uuid());
    }

    /**
     * Upload the customer's payment receipt.
     *
     * The existing uploadFile() helper is retained as the application's
     * storage abstraction because it dynamically resolves local, AWS S3,
     * and Wasabi storage based on system settings.
     *
     * The helper also applies the application's administrator-configured
     * storage validation rules, so its validation remains authoritative for
     * storage-specific restrictions.
     *
     * A failed upload is logged and returns null to preserve the existing
     * behavior: payment order creation continues without a receipt.
     */
    private function uploadReceipt(ProcessBankPaymentRequest $request): ?string
    {
        try {
            $receipt = $request->file('receipt');

            if ($receipt === null) {
                return null;
            }

            $extension = strtolower(
                $receipt->getClientOriginalExtension(),
            );

            $fileName = 'bank_receipt_' .
                Str::uuid() .
                '.' .
                $extension;

            $upload = uploadFile(
                $request,
                'receipt',
                $fileName,
                'bank-receipts',
            );

            if (($upload['status'] ?? false) !== true) {
                Log::warning('Bank payment receipt upload was rejected.', [
                    'user_id' => $request->user()->getKey(),
                    'file_name' => $fileName,
                    'message' => $upload['msg'] ?? null,
                ]);

                return null;
            }

            return $upload['url'] ?? null;
        } catch (Throwable $exception) {
            Log::error('Bank payment receipt upload failed.', [
                'user_id' => $request->user()->getKey(),
                'exception' => $exception,
            ]);

            return null;
        }
    }

    /**
     * Queue an internal notification for the payment team.
     *
     * The notification contains a snapshot of persisted order data so that
     * subsequent changes to the order or plan do not alter the notification's
     * original submission details.
     *
     * Notification dispatch failure is deliberately not allowed to turn a
     * successful payment submission into an HTTP failure.
     */
    private function sendPaymentNotification(
        object $order,
        Plan   $plan,
        object $user,
    ): void {
        try {
            Notification::route(
                'mail',
                config(
                    'mail.bank_payment_notification_address'
                ),
            )->notify(
                new BankPaymentSubmittedNotification([
                    'order_id' => (int) $order->getKey(),
                    'payment_id' => (string) $order->payment_id,
                    'user_id' => (int) $order->user_id,
                    'customer_name' => (string) $user->name,
                    'customer_email' => (string) $user->email,
                    'plan_name' => (string) $plan->name,
                    'billing_cycle' => (string) $order->billing_cycle,
                    'coupon_code' => $order->coupon_code,
                    'original_price' => $order->original_price,
                    'discount_amount' => $order->discount_amount,
                    'final_price' => $order->final_price,
                    'receipt' => $order->receipt,
                    'ordered_at' => $order->ordered_at->toDateTimeString(),
                ]),
            );
        } catch (Throwable $exception) {
            /*
             * The order has already been successfully persisted. Email
             * notification is operational side effect, not payment state.
             */
            Log::error(
                'Bank payment notification could not be queued.',
                [
                    'payment_id' => $order->payment_id,
                    'order_id' => (int) $order->getKey(),
                    'exception' => $exception,
                ],
            );
        }
    }
}
