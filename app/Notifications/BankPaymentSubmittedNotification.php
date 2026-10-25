<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notify Kakbima's payment team when a bank payment request is submitted.
 *
 * The notification is queued so email delivery is completely independent of
 * the HTTP payment-submission request.
 *
 * The notification receives a snapshot of the payment data rather than the
 * PlanOrder model itself. This ensures the email represents the exact state
 * recorded at submission time and avoids requiring additional database
 * queries when the queued notification is processed.
 *
 * Security:
 * - The queued payload is encrypted because it contains customer/payment
 *   information.
 *
 * Failure behavior:
 * - Mail delivery failures are handled by Laravel's queue retry/failure
 *   mechanisms and do not invalidate the successfully created payment order.
 */
class BankPaymentSubmittedNotification extends Notification implements
    ShouldQueue,
    ShouldBeEncrypted
{
    use Queueable;

    /**
     * Create the notification.
     *
     * @param array{
     *     payment_id: string,
     *     user_id: int,
     *     customer_name: string,
     *     customer_email: string,
     *     plan_name: string,
     *     billing_cycle: string,
     *     coupon_code: ?string,
     *     original_price: mixed,
     *     discount_amount: mixed,
     *     final_price: mixed,
     *     receipt: ?string,
     *     ordered_at: string
     * } $payment
     */
    public function __construct(
        private readonly array $payment,
    ) {
        $this->onQueue('mail');
    }

    /**
     * Determine the notification delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the payment-submission email.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $payment = $this->payment;

        return (new MailMessage())
            ->subject(
                __('New bank payment request: :payment_id', [
                    'payment_id' => $payment['payment_id'],
                ]),
            )
            ->tag('bank-payment')
            ->metadata('payment_id', $payment['payment_id'])
            ->metadata('order_id', (string) $payment['order_id'])
            ->greeting(__('New bank payment request'))
            ->line(__('A customer has submitted a new bank payment request that requires verification.'))
            ->line(__('Payment ID: :payment_id', [
                'payment_id' => $payment['payment_id'],
            ]))
            ->line(__('Customer: :name', [
                'name' => $payment['customer_name'],
            ]))
            ->line(__('Customer email: :email', [
                'email' => $payment['customer_email'],
            ]))
            ->line(__('Plan: :plan', [
                'plan' => $payment['plan_name'],
            ]))
            ->line(__('Billing cycle: :cycle', [
                'cycle' => $payment['billing_cycle'],
            ]))
            ->line(__('Original price: $:price', [
                'price' => number_format($payment['original_price']),
            ]))
            ->line(__('Discount: $:discount', [
                'discount' => number_format($payment['discount_amount']),
            ]))
            ->line(__('Final price: $:price', [
                'price' => number_format($payment['final_price']),
            ]))
            ->lineIf(
                filled($payment['coupon_code']),
                __('Coupon code: :coupon', [
                    'coupon' => $payment['coupon_code'],
                ]),
            )
            ->lineIf(
                filled($payment['receipt']),
                __('Receipt: :receipt', [
                    'receipt' => getFile($payment['receipt']),
                ]),
            )
            ->line(__('Please verify the payment before activating the customer plan.'))
            ->line(__('Submitted at: :date', [
                'date' => $payment['ordered_at'],
            ]));
    }
}
