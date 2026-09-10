<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Rules\WorkEmail;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Show the password reset link request page.
     */
    public function create(): Response
    {
        return Inertia::render('Account/ForgotPassword', [
            'settings' => settings(),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate(
            [
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    new WorkEmail(),
                ],
            ],
            [
                'email.required' => __('The work email field is required'),
                'email.email' => __('Please provide a valid work email address'),
                'email.max' => __('Are you sure you entered the work email correctly?'),
            ]
        );

        try {
            $status = Password::sendResetLink($validated);
            /**
             * Always show the same success message regardless of whether the email exists.
             * This prevents email enumeration attacks.
             */
            if ($status === Password::RESET_LINK_SENT) {
                return back()->with('success', __('If an account with that work email exists, a password reset link has been sent to it.'));
            }

            $messages = [
                Password::INVALID_USER => __('If an account with that work email exists, a password reset link has been sent to it.'),
                Password::RESET_THROTTLED => __('Too many requests. Please wait a few minutes before trying again.'),
            ];

            return back()->with('info', $messages[$status] ?? __('Unable to send reset link. Please try again.'));

        } catch (Exception $e) {
            // Log the exception using Laravel's logging system
            Log::error('Password reset link error', [
                'email' => $validated['email'],
                'exception' => $e,
            ]);

            // Return an appropriate error response
            return back()->with('error', __('Something went wrong. Please try again. later.'));
        }
    }
}
