<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password as PasswordRule;

/**
 * Validates an authenticated user's password update request.
 *
 * Responsibilities:
 * - Verify the user's existing password.
 * - Enforce the application's password complexity requirements.
 * - Require confirmation of the new password.
 *
 * Security:
 * - The current password must match the authenticated user's password.
 * - The new password must be at least 12 characters long.
 * - The new password must contain mixed case, numbers, and symbols.
 * - Compromised passwords are rejected using Laravel's uncompromised
 *   password validation.
 *
 * Architectural Notes:
 * - Validation and authorization are kept outside the controller.
 * - Password hashing is performed only after validation succeeds.
 * - Password policy is explicitly defined here rather than relying on
 *   Password::defaults(), making the account requirement predictable.
 */
class UpdatePasswordRequest extends FormRequest
{
    /**
     * Determine whether the authenticated user may update their password.
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
            'current_password' => [
                'required',
                'current_password',
            ],

            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(12)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised()
                    ->max(128),
            ],
        ];
    }

    /**
     * Get the custom validation messages for the request.
     *
     * Each explicitly configured validation rule has an application-specific
     * message so password validation does not depend on Laravel's default
     * wording.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => __('Please enter your current password.'),
            'current_password.current_password' => __('The current password is incorrect.'),
            'password.required' => __('The password field is required.'),
            'password.confirmed' => __('Passwords do not match.'),
            'password.min' => __('The new password must be at least 12 characters.'),
            'password.max' => __('The new password may not be greater than 128 characters.'),
            'password.mixed' => __('The new password must contain at least one uppercase and one lowercase letter.'),
            'password.numbers' => __('The new password must contain at least one number.'),
            'password.symbols' => __('The new password must contain at least one symbol.'),
            'password.uncompromised' => __('The new password has appeared in a known data breach. Please choose a different password.'),
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
            'current_password' => __('current password'),
            'password' => __('new password'),
            'password_confirmation' => __('password confirmation'),
        ];
    }
}
