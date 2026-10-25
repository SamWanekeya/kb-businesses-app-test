<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates subscription plan creation.
 *
 * Responsibilities:
 * - Validate plan attributes against application and database constraints.
 * - Normalize optional settings to their existing application defaults.
 * - Provide user-facing validation messages.
 *
 * Authorization:
 * - Plan creation permission is enforced by route middleware.
 *
 * Business Rules:
 * - Yearly pricing is optional and may be manually supplied.
 * - When yearly pricing is omitted, PlanService calculates it using the
 *   approved two-month-free pricing formula.
 * - Quarterly is accepted as a plan duration for future product support,
 *   but it is not treated as a customer billing cycle.
 */
class StorePlanRequest extends FormRequest
{
    private const string MAX_DECIMAL_19_7 = '999999999999.9999999';

    private const int MAX_SIGNED_INTEGER = 2147483647;

    /**
     * Determine whether the request is authorized.
     *
     * Authorization is intentionally handled by route middleware.
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
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('plans', 'name'),
            ],

            'price' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,7',
                'max:' . self::MAX_DECIMAL_19_7,
            ],

            'yearly_price' => [
                'nullable',
                'numeric',
                'min:0',
                'decimal:0,7',
                'max:' . self::MAX_DECIMAL_19_7,
            ],

            'duration' => [
                'required',
                Rule::in([
                    'monthly',
                    'quarterly',
                    'yearly',
                ]),
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'maximum_users' => [
                'required',
                'integer',
                'min:0',
                'max:' . self::MAX_SIGNED_INTEGER,
            ],

            'maximum_projects' => [
                'required',
                'integer',
                'min:0',
                'max:' . self::MAX_SIGNED_INTEGER,
            ],

            'maximum_contacts' => [
                'required',
                'integer',
                'min:0',
                'max:' . self::MAX_SIGNED_INTEGER,
            ],

            'maximum_accounts' => [
                'required',
                'integer',
                'min:0',
                'max:' . self::MAX_SIGNED_INTEGER,
            ],

            'storage_limit' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,7',
                'max:' . self::MAX_DECIMAL_19_7,
            ],

            'enable_kakbima_intelligence' => [
                'nullable',
                Rule::in(['on', 'off']),
            ],

            'is_trial' => [
                'nullable',
                Rule::in(['on', 'off']),
            ],

            'trial_days' => [
                'nullable',
                'integer',
                'min:0',
                'max:' . self::MAX_SIGNED_INTEGER,
            ],

            'is_plan_enabled' => [
                'nullable',
                Rule::in(['on', 'off']),
            ],

            'is_default' => [
                'nullable',
                'boolean',
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
            'name.required' =>
                __('The plan name field is required.'),

            'name.string' =>
                __('The plan name must be valid text.'),

            'name.max' =>
                __('The plan name may not exceed 100 characters.'),

            'name.unique' =>
                __('A plan with this name already exists.'),

            'price.required' =>
                __('The monthly price field is required.'),

            'price.numeric' =>
                __('The monthly price must be a valid number.'),

            'price.min' =>
                __('The monthly price cannot be negative.'),

            'price.decimal' =>
                __('The monthly price may contain a maximum of 7 decimal places.'),

            'price.max' =>
                __('The monthly price exceeds the maximum supported value.'),

            'yearly_price.numeric' =>
                __('The yearly price must be a valid number.'),

            'yearly_price.min' =>
                __('The yearly price cannot be negative.'),

            'yearly_price.decimal' =>
                __('The yearly price may contain a maximum of 7 decimal places.'),

            'yearly_price.max' =>
                __('The yearly price exceeds the maximum supported value.'),

            'duration.required' =>
                __('The plan duration field is required.'),

            'duration.in' =>
                __('The selected plan duration is invalid.'),

            'description.string' =>
                __('The plan description must be valid text.'),

            'maximum_users.required' =>
                __('The maximum number of users field is required.'),

            'maximum_users.integer' =>
                __('The maximum number of users must be a whole number.'),

            'maximum_users.min' =>
                __('The maximum number of users cannot be negative.'),

            'maximum_users.max' =>
                __('The maximum number of users exceeds the supported limit.'),

            'maximum_projects.required' =>
                __('The maximum number of projects field is required.'),

            'maximum_projects.integer' =>
                __('The maximum number of projects must be a whole number.'),

            'maximum_projects.min' =>
                __('The maximum number of projects cannot be negative.'),

            'maximum_projects.max' =>
                __('The maximum number of projects exceeds the supported limit.'),

            'maximum_contacts.required' =>
                __('The maximum number of contacts field is required.'),

            'maximum_contacts.integer' =>
                __('The maximum number of contacts must be a whole number.'),

            'maximum_contacts.min' =>
                __('The maximum number of contacts cannot be negative.'),

            'maximum_contacts.max' =>
                __('The maximum number of contacts exceeds the supported limit.'),

            'maximum_accounts.required' =>
                __('The maximum number of accounts field is required.'),

            'maximum_accounts.integer' =>
                __('The maximum number of accounts must be a whole number.'),

            'maximum_accounts.min' =>
                __('The maximum number of accounts cannot be negative.'),

            'maximum_accounts.max' =>
                __('The maximum number of accounts exceeds the supported limit.'),

            'storage_limit.required' =>
                __('The storage limit field is required.'),

            'storage_limit.numeric' =>
                __('The storage limit must be a valid number.'),

            'storage_limit.min' =>
                __('The storage limit cannot be negative.'),

            'storage_limit.decimal' =>
                __('The storage limit may contain a maximum of 7 decimal places.'),

            'storage_limit.max' =>
                __('The storage limit exceeds the maximum supported value.'),

            'enable_kakbima_intelligence.in' =>
                __('The Kakbima Intelligence setting is invalid.'),

            'is_trial.in' =>
                __('The trial setting is invalid.'),

            'trial_days.integer' =>
                __('The trial duration must be a whole number.'),

            'trial_days.min' =>
                __('The trial duration cannot be negative.'),

            'trial_days.max' =>
                __('The trial duration exceeds the supported limit.'),

            'is_plan_enabled.in' =>
                __('The plan status is invalid.'),

            'is_default.boolean' =>
                __('The default-plan value must be true or false.'),
        ];
    }

    /**
     * Normalize optional values before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'enable_kakbima_intelligence' =>
                $this->input(
                    'enable_kakbima_intelligence',
                    'off',
                ),

            'is_trial' =>
                $this->input('is_trial'),

            'is_plan_enabled' =>
                $this->input(
                    'is_plan_enabled',
                    'on',
                ),

            'is_default' =>
                $this->boolean('is_default'),
        ]);
    }
}
