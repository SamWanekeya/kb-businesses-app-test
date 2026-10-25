<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates requests used to process Paystack payments.
 *
 * Responsibilities:
 * - Authenticate the payment-processing request.
 * - Validate the Paystack payment reference.
 * - Validate the selected plan and billing cycle.
 * - Normalize optional coupon input.
 *
 * Architectural Notes:
 * - Request validation is intentionally kept outside the controller.
 * - Authorization is enforced here so the controller can assume an
 *   authenticated user exists when processing the payment.
 *
 * Security Considerations:
 * - All client-controlled values consumed by the payment flow are validated.
 * - The Paystack secret key is never accepted from the client.
 */
class ProcessPaystackPaymentRequest extends FormRequest
{
    /**
     * Determine whether the authenticated user may process a payment.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules for the request.
     *
     * @return array<string, array<int, mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payment_id' => [
                'required',
                'string',
                'max:255',
            ],

            'plan_id' => [
                'required',
                'integer',
                'exists:plans,id',
            ],

            'billing_cycle' => [
                'required',
                'string',
                Rule::in([
                    'monthly',
                    'yearly',
                ]),
            ],

            'coupon_code' => [
                'nullable',
                'string',
                'max:100',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * These messages provide user-facing feedback without exposing
     * internal validation or implementation details.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'payment_id.required' => __('A Paystack payment reference field is required.'),
            'payment_id.string' => __('The Paystack payment reference must be valid.'),
            'payment_id.max' => __('The Paystack payment reference is too long.'),

            'plan_id.required' => __('Please select a plan.'),
            'plan_id.integer' => __('The selected plan is invalid.'),
            'plan_id.exists' => __('The selected plan could not be found.'),

            'billing_cycle.required' => __('Please select a billing cycle.'),
            'billing_cycle.string' => __('The billing cycle is invalid.'),
            'billing_cycle.in' => __('The selected billing cycle is invalid.'),

            'coupon_code.string' => __('The coupon code must be valid.'),
            'coupon_code.max' => __('The coupon code is too long.'),
        ];
    }

    /**
     * Prepare optional input before validation.
     *
     * Empty coupon values are normalized to null so downstream
     * payment processing receives a predictable value.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('coupon_code') && blank($this->input('coupon_code'))) {
            $this->merge([
                'coupon_code' => null,
            ]);
        }
    }
}
