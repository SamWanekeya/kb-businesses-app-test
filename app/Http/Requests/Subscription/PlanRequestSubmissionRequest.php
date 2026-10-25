<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates customer requests to change subscription plans.
 *
 * Authorization:
 * - The request permission is enforced by route middleware.
 *
 * Security:
 * - The selected plan must exist.
 * - Only currently enabled plans may be requested.
 * - Billing cycles are restricted to currently supported options.
 */
class PlanRequestSubmissionRequest extends FormRequest
{
    /**
     * Determine whether the request is authorized.
     *
     * Authorization is handled by route middleware.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'plan_id' => [
                'required',
                'integer',
                Rule::exists('plans', 'id')
                    ->where(
                        fn ($query) => $query
                            ->where('is_plan_enabled', 'on')
                    ),
            ],

            'billing_cycle' => [
                'required',
                Rule::in([
                    'monthly',
                    'yearly',
                ]),
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plan_id.required' =>
                __('Please select a subscription plan.'),

            'plan_id.integer' =>
                __('The selected plan is invalid.'),

            'plan_id.exists' =>
                __('The selected plan is unavailable.'),

            'billing_cycle.required' =>
                __('Please select a billing cycle.'),

            'billing_cycle.in' =>
                __('The selected billing cycle is invalid.'),
        ];
    }
}
