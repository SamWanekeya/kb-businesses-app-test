<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validate a manual bank payment submission.
 *
 * Authorization is limited to authenticated users because a payment request
 * must be associated with the currently authenticated account.
 *
 * Validation responsibilities:
 * - Validate the selected plan.
 * - Validate the billing cycle.
 * - Validate optional coupon information.
 * - Validate the submitted payment amount.
 * - Validate the optional payment receipt.
 *
 * The submitted amount is validated for request integrity but is not trusted
 * as the authoritative order price. Pricing is resolved by createPlanOrder()
 * from the selected plan, billing cycle, and coupon.
 */
class ProcessBankPaymentRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to submit a payment request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'plan_id' => [
                'required',
                'integer',
                Rule::exists('plans', 'id'),
            ],

            'billing_cycle' => [
                'required',
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

            'amount' => [
                'required',
                'numeric',
                'min:0',
            ],

            'receipt' => [
                'nullable',
                'file',
                'mimes:jpeg,jpg,png,pdf',
                'max:5120',
            ],
        ];
    }

    /**
     * Get custom validation messages for the request.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plan_id.required' => __('Please select a plan.'),
            'plan_id.integer' => __('The selected plan is invalid.'),
            'plan_id.exists' => __('The selected plan could not be found.'),

            'billing_cycle.required' => __('Please select a billing cycle.'),
            'billing_cycle.in' => __('The selected billing cycle is invalid.'),

            'coupon_code.string' => __('The coupon code must be a valid string.'),
            'coupon_code.max' => __('The coupon code may not exceed 100 characters.'),

            'amount.required' => __('The payment amount field is required.'),
            'amount.numeric' => __('The payment amount must be a valid number.'),
            'amount.min' => __('The payment amount may not be negative.'),

            'receipt.file' => __('The payment receipt must be a valid file.'),
            'receipt.mimes' => __('The payment receipt must be a JPEG, JPG, PNG, or PDF file.'),
            'receipt.max' => __('The payment receipt may not exceed 5 MB.'),
        ];
    }
}
