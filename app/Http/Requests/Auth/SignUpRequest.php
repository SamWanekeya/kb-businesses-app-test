<?php

namespace App\Http\Requests\Auth;

use App\Rules\WorkEmail;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password as PasswordRule;

class SignUpRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get validation rules for registration.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {

        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
                new WorkEmail(),
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
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => __('The full name field is required'),
            'name.min' => __('Are you sure you entered the full name correctly?'),
            'name.max' => __('Are you sure you entered the full name correctly?'),
            'email.required' => __('The work email field is required'),
            'email.email' => __('Please provide a valid work email address'),
            'email.max' => __('Are you sure you entered the work email correctly?'),
            'email.unique' => __('That work email is already taken. Try another'),
            'password.required' => __('The password field is required.'),
            'password.confirmed' => __('Passwords do not match.'),
            'password.min' => __('Password must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.'),
            'password.uncompromised' => __('This password has appeared in a data breach. Please choose a safer one.'),
            'password.max' => __('Passwords may not be longer than 128 characters.'),
        ];
    }
}
