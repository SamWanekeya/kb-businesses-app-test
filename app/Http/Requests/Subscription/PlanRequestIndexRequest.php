<?php

namespace App\Http\Requests\Subscription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates filters used to list plan requests.
 *
 * Search input is bounded to prevent excessively expensive queries.
 * Sort fields and directions are allowlisted, and pagination is capped.
 */
class PlanRequestIndexRequest extends FormRequest
{
    /**
     * Determine whether the current user may access this endpoint.
     *
     * This preserves the original controller's access behavior.
     * Apply the application's existing route middleware or policy
     * to restrict access to authorized users.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules for plan-request listing filters.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],

            'status' => [
                'nullable',
                'string',
                Rule::in([
                    'all',
                    'pending',
                    'approved',
                    'rejected',
                ]),
            ],

            'date_from' => [
                'nullable',
                'date_format:Y-m-d',
                'required_with:date_to',
                'before_or_equal:date_to',
            ],

            'date_to' => [
                'nullable',
                'date_format:Y-m-d',
                'required_with:date_from',
                'after_or_equal:date_from',
            ],

            'sort_field' => [
                'nullable',
                'string',
                Rule::in(['id', 'created_at', 'status']),
            ],

            'sort_direction' => [
                'nullable',
                'string',
                Rule::in(['asc', 'desc']),
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    /**
     * Provide explicit, user-friendly validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'search.string' => __('The search term must be a string.'),
            'search.max' => __('The search term may not exceed 255 characters.'),

            'status.in' => __('The selected status is invalid.'),

            'date_from.date_format' => __('The start date must use the YYYY-MM-DD format.'),
            'date_from.required_with' => __('A start date is required when an end date is provided.'),
            'date_from.before_or_equal' => __('The start date must be on or before the end date.'),

            'date_to.date_format' => __('The end date must use the YYYY-MM-DD format.'),
            'date_to.required_with' => __('An end date is required when a start date is provided.'),
            'date_to.after_or_equal' => __('The end date must be on or after the start date.'),

            'sort_field.in' => __('The selected sort field is invalid.'),
            'sort_direction.in' => __('The sort direction must be ascending or descending.'),

            'per_page.integer' => __('The number of results per page must be an integer.'),
            'per_page.min' => __('The number of results per page must be at least 1.'),
            'per_page.max' => __('The number of results per page may not exceed 100.'),
        ];
    }
}
