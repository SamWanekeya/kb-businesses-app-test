<?php

namespace App\Http\Requests\Subscription;

use App\Enums\BillingCycle;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

/**
 * Validates requests for the subscription plan catalogue.
 *
 * Authorization:
 * - Access to this endpoint is handled by route middleware.
 *
 * Validation:
 * - Billing cycle defaults to monthly.
 * - Only currently supported customer billing cycles are accepted.
 */
class PlanIndexRequest extends FormRequest
{
    /**
     * Determine whether the request is authorized.
     *
     * Authorization is intentionally delegated to route middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'billing_cycle' => [
                'sometimes',
                new Enum(BillingCycle::class),
            ],
        ];
    }

    /**
     * Get the requested billing cycle.
     */
    public function billingCycle(): BillingCycle
    {
        return BillingCycle::tryFrom(
            $this->input(
                'billing_cycle',
                BillingCycle::Monthly->value,
            ),
        ) ?? BillingCycle::Monthly;
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'billing_cycle.enum' =>
                __('The selected billing cycle is invalid.'),
        ];
    }
}
