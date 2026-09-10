<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationToken;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Handles email verification using single-use tokens.
 *
 * This controller enforces that a user must be logged in
 * to verify their email address.
 *
 * Verification flow:
 * 1. User must be authenticated.
 * 2. Token must exist and not be expired.
 *    - If logged in: redirect to /verify-email with flash to request new token
 *    - If not logged in: redirect to sign in with error
 * 3. Token must belong to the authenticated user.
 * 4. Email is marked as verified.
 * 5. Token is deleted (single-use).
 * 6. Redirect to dashboard with success message.
 */
class VerifyEmailTokenController extends Controller
{
    /**
     * Verify the authenticated user's email using a token.
     *
     * @param string $token The opaque email verification token
     *
     * @return RedirectResponse
     */
    public function __invoke(string $token): RedirectResponse
    {
        // Require authentication
        $user = Auth::user();

        if (!$user) {
            return redirect()
                ->route('login')
                ->with('error', __('You must be logged in to verify your email address'));
        }

        // Resolve token (must exist and not be expired)
        $record = EmailVerificationToken::where('token', $token)
            ->where('expires_at', '>', now())?->first();

        if (!$record) {
            return redirect()
                ->route('verification.notice')
                ->with('error', __('Your verification link is invalid or expired. Please request a new one'));
        }

        // Ensure token belongs to authenticated user
        if ((int) $record->user_id !== (int) $user->id) {
            return redirect()
                ->route('login')
                ->with('error', __('Your verification link is invalid or expired. Please sign in to request a new one'));
        }

        // Mark email as verified
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        // Delete token (single-use)
        $record->delete();

        // Redirect to dashboard with success message
        return redirect()
            ->route('dashboard.index')
            ->with('success', __('Your email address has been successfully verified'));
    }
}
