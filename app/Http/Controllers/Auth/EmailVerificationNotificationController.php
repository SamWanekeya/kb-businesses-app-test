<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Class EmailVerificationNotificationController
 *
 * Handles requests to resend an email verification notification
 * to an authenticated user.
 *
 * Responsibilities:
 * - Prevent already verified users from requesting another verification email.
 * - Request a new verification token from the authenticated user.
 * - Surface successful delivery requests to the user.
 * - Log unexpected notification failures.
 * - Surface a user-friendly error when the notification cannot be sent.
 */
class EmailVerificationNotificationController extends Controller
{
    /**
     * Send a new email verification notification.
     *
     * @param Request $request The incoming resend request.
     *
     * @return RedirectResponse
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(
                route('dashboard.index', absolute: false)
            )->with('info', __('Your email address has already been verified.'));
        }

        try {
            $user->sendEmailVerificationNotification('resend');

            return back()->with(
                'status',
                'verification-link-sent',
            );
        } catch (Throwable $exception) {
            Log::error(
                'Email verification notification failed.',
                [
                    'user_id' => $user->getKey(),
                    'email' => $user->getEmailForVerification(),
                    'exception' => $exception,
                ],
            );

            return back()->with(
                'error',
                __(
                    'We could not send the verification email. Please try again later.',
                ),
            );
        }
    }
}
