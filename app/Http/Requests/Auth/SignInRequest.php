<?php

namespace App\Http\Requests\Auth;

use App\Rules\WorkEmail;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SignInRequest extends FormRequest
{
    /**
     * Determine if the request is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules for the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {

        return [
            'email' => [
                'required',
                'email',
                'max:255',
                new WorkEmail(),
            ],
            'password' => ['required', 'max:128'],
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'email.required' => __('The work email field is required'),
            'email.email' => __('Please provide a valid work email address'),
            'email.max' => __('Are you sure you entered the work email correctly?'),
            'password.required' => __('The password field is required'),
            'password.max' => __('Passwords may not be longer than 128 characters.'),
        ];
    }

    /**
     * Attempt to authenticate the user.
     *
     * Performs:
     * - Rate limiting
     * - Credential verification
     * - Account eligibility checks
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt(
            $this->only('email', 'password'),
            $this->boolean('remember')
        )) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('Invalid sign in credentials. Please try again.'),
            ]);
        }

        $user = Auth::user();

        if (
            $user->status === 'inactive' ||
            ! $user->is_sign_in_enabled
        ) {
            Auth::logout();

            throw ValidationException::withMessages([
                'email' => __('Your account is inactive or disabled'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the sign in request is not rate limited.
     *
     * @throws ValidationException
     */
    protected function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('Too many sign in attempts. Please wait a few minutes before trying again.', [
                'seconds' => $seconds,
                'minutes' => (int) ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key.
     */
    protected function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')) . '|' . $this->ip());
    }
}
