<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates requests to start subscription-plan trials.
 *
 * Authorization:
 * - Trial permission is enforced by route middleware.
 *
 * Security:
 * - The requested plan must exist.
 * - The requested plan must be enabled.
 * - The requested plan must have trials enabled.
 *
 * Business eligibility:
 * - Whether the authenticated user has already consumed a trial remains
 *   a service-level business rule.
 */
class StartTrialRequest extends FormRequest
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
                            ->where('is_trial', 'on')
                    ),
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
                __('Please select a trial plan.'),

            'plan_id.integer' =>
                __('The selected trial plan is invalid.'),

            'plan_id.exists' =>
                __('The selected plan is not available for trial.'),
        ];
    }
}
