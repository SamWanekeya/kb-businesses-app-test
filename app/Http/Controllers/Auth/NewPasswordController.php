<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Rules\WorkEmail;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Show the password reset page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Account/ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Reset the user's password.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate(
            [
                'token' => ['required'],
                'email' => ['required', 'email', 'max:255', new WorkEmail(),],
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
            ],
            [
                'email.required' => __('The work email field is required.'),
                'email.email' => __('Please provide a valid work email address.'),
                'email.max' => __('Are you sure you entered the work email correctly?'),
                'password.required' => __('The password field is required.'),
                'password.confirmed' => __('Passwords do not match.'),
                'password.min' => __('Password must be at least 12 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.'),
                'password.uncompromised' => __('This password has appeared in a data breach. Please choose a safer one.'),
                'password.max' => __('Passwords may not be longer than 128 characters.'),
            ]
        );

        $status = Password::reset(
            $validated,
            function ($user) use ($validated) {
                $user->forceFill([
                    'password' => Hash::make($validated['password']),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        return match ($status) {
            Password::PASSWORD_RESET => redirect()
                ->route('login')
                ->with('success', __('Your password has been reset. You can now sign in.')),

            Password::INVALID_TOKEN => back()->with('error', __('This password reset link is invalid or has expired.')),

            Password::INVALID_USER => back()->with('error', __('We could not find a user with that email address.')),

            default => back()->with('error', __('Unable to reset password. Please try again.')),
        };
    }
}
