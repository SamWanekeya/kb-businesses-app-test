<?php

namespace App\Http\Requests\Account;

use App\Models\User;
use App\Rules\WorkEmail;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates authenticated user profile updates.
 *
 * Responsibilities:
 * - Validate profile identity fields.
 * - Validate the user's work email address.
 * - Validate optional avatar uploads.
 * - Validate HTTP method spoofing input used by the profile form.
 *
 * Security:
 * - Only authenticated users may update their own profile.
 * - The email uniqueness check ignores the currently authenticated user.
 * - Profile attributes are validated before being passed to the application
 *   layer for persistence.
 *
 * Architectural Notes:
 * - Business logic and file handling are intentionally excluded from this
 *   request.
 * - Custom validation messages provide consistent application-facing errors.
 */
class ProfileUpdateRequest extends FormRequest
{
    /**
     * Determine whether the authenticated user may update their profile.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, ValidationRule|string>>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                new WorkEmail(),
                Rule::unique(User::class)->ignore($this->user()),
            ],

            'avatar' => [
                'nullable',
                'image',
                'mimes:jpeg,png,jpg,gif',
                'max:2048',
            ],

            '_method' => [
                'sometimes',
                'string',
                'in:PATCH',
            ],
        ];
    }

    /**
     * Get the custom validation messages for the request.
     *
     * Every standard validation rule defined by this request has an
     * application-specific message.
     *
     * WorkEmail is a custom validation rule and should provide its own
     * message through the rule's message() implementation.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => __('The full name field is required.'),
            'name.string' => __('The name must be a valid text value.'),
            'name.max' => __('The full name cannot exceed 255 characters.'),
            'email.required' => __('Please enter your email address.'),
            'email.email' => __('Please enter a valid email address.'),
            'email.max' => __('Your email address cannot exceed 255 characters.'),
            'email.unique' => __('This email address is already associated with another account.'),
            'avatar.image' => __('The profile picture must be a valid image.'),
            'avatar.mimes' => __('The profile picture must be a JPEG, PNG, JPG, or GIF image.'),
            'avatar.max' => __('The profile picture must not be larger than 2 MB.'),
            '_method.string' => __('The request method must be a valid text value.'),
            '_method.in' => __('The request method must be PATCH.'),
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
            'name' => __('full name'),
            'email' => __('email address'),
            'avatar' => __('avatar'),
            '_method' => __('request method'),
        ];
    }
}
