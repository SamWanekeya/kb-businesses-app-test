<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationToken;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Class VerifyEmailTokenController
 *
 * Handles verification of a user's email address using an opaque,
 * database-backed verification token.
 *
 * Responsibilities:
 * - Validate the supplied verification token.
 * - Validate the token expiration time.
 * - Ensure the token belongs to the authenticated user when signed in.
 * - Ensure the token was issued for the user's current email address.
 * - Mark the user's email address as verified.
 * - Remove the consumed verification token.
 * - Provide appropriate feedback for invalid, expired, already verified,
 *   and successfully verified requests.
 */
class VerifyEmailTokenController extends Controller
{
    /**
     * Verify the user's email address.
     *
     * @param Request $request The incoming verification request.
     * @param string $token The raw verification token supplied in the URL.
     *
     * @return RedirectResponse
     */
    public function __invoke(
        Request $request,
        string $token,
    ): RedirectResponse {
        $user = $request->user();

        try {
            $verificationToken = EmailVerificationToken::query()
                ->where(
                    'token',
                    hash('sha256', $token),
                )
                ->first();

            if (!$verificationToken) {
                return $this->invalidTokenResponse($request);
            }

            if ($verificationToken->expires_at->isPast()) {
                $verificationToken->delete();

                return $this->invalidTokenResponse($request);
            }

            if (
                $user
                && (int) $verificationToken->user_id !== (int) $user->getKey()
            ) {
                return $this->invalidTokenResponse($request);
            }

            $tokenUser = $verificationToken->user;

            if (!$tokenUser) {
                return $this->invalidTokenResponse($request);
            }

            if (
                $verificationToken->email
                !== $tokenUser->getEmailForVerification()
            ) {
                return $this->invalidTokenResponse($request);
            }

            if ($tokenUser->hasVerifiedEmail()) {
                return redirect()
                    ->route('dashboard.index')
                    ->with(
                        'info',
                        __('Your email address has already been verified.'),
                    );
            }

            if (!$user) {
                return redirect()
                    ->route('sign-in')
                    ->with(
                        'warning',
                        __('Please sign in to complete your email verification.'),
                    );
            }

            DB::transaction(function () use ($tokenUser, $verificationToken): void {
                $lockedToken = EmailVerificationToken::query()
                    ->whereKey($verificationToken->getKey())
                    ->lockForUpdate()
                    ->first();

                if (!$lockedToken) {
                    return;
                }

                if ($lockedToken->expires_at->isPast()) {
                    $lockedToken->delete();

                    return;
                }

                if (
                    $lockedToken->email
                    !== $tokenUser->getEmailForVerification()
                ) {
                    return;
                }

                $tokenUser->markEmailAsVerified();

                event(new Verified($tokenUser));

                $lockedToken->delete();
            });

            return redirect()
                ->intended(
                    route('dashboard.index', absolute: false),
                )
                ->with(
                    'success',
                    __('Your email address has been successfully verified.'),
                );
        } catch (Throwable $exception) {
            Log::error(
                'Email verification failed.',
                [
                    'user_id' => $user?->getKey(),
                    'email' => $user?->getEmailForVerification(),
                    'exception' => $exception,
                ],
            );

            return redirect()
                ->route(
                    $user
                        ? 'authenticated.verification.notice'
                        : 'sign-in',
                )
                ->with(
                    'error',
                    __(
                        'We could not verify your email address. Please request a new verification email and try again.',
                    ),
                );
        }
    }

    /**
     * Build the response for an invalid or expired verification token.
     *
     * @param Request $request The incoming verification request.
     *
     * @return RedirectResponse
     */
    private function invalidTokenResponse(
        Request $request,
    ): RedirectResponse {
        if ($request->user()) {
            return redirect()
                ->route('authenticated.verification.notice')
                ->with(
                    'error',
                    __(
                        'This verification link is invalid or has expired. Please request a new verification email.',
                    ),
                );
        }

        return redirect()
            ->route('sign-in')
            ->with(
                'error',
                __(
                    'This verification link is invalid or has expired. Please sign in and request a new verification email.',
                ),
            );
    }
}
