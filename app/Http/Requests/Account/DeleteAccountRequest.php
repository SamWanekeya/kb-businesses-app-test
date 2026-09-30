<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates an authenticated user's account deletion request.
 *
 * Responsibilities:
 * - Ensure the authenticated user provides their current password.
 * - Verify the supplied password against the authenticated account.
 *
 * Security:
 * - Account deletion requires proof of possession of the current password.
 * - The request does not perform account deletion itself.
 */
class DeleteAccountRequest extends FormRequest
{
    /**
     * Determine whether the authenticated user may delete their account.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'password' => [
                'required',
                'current_password',
            ],
        ];
    }

    /**
     * Get the custom validation messages for the request.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'password.required' => __('Please enter your password to confirm account deletion.'),
            'password.current_password' => __('The password you entered is incorrect.'),
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'password' => __('password'),
        ];
    }
}
