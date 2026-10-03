<?php

namespace App\Actions\Auth;

use App\Models\EmailVerificationToken;
use App\Models\User;
use App\Notifications\VerifyEmailTokenNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Class SendEmailVerificationAction
 *
 * Generates and sends a new email verification token for a user.
 *
 * Responsibilities:
 * - Invalidate any previously issued verification tokens.
 * - Generate a cryptographically secure verification token.
 * - Store only a hash of the token in the database.
 * - Apply the configured verification-token expiration.
 * - Send the verification notification to the user's current email address.
 *
 * Security:
 * - The raw verification token is never persisted in the database.
 * - Previously issued verification tokens are invalidated before a new
 *   verification token is created.
 * - Verification tokens expire according to the configured
 *   `auth.verification.expire` value.
 *
 * @throws Throwable When the verification token cannot be generated,
 *                   persisted, or the notification cannot be dispatched.
 */
final class SendEmailVerificationAction
{
    /**
     * Execute the email verification process.
     *
     * @param User $user The user requiring email verification.
     *
     * @throws Throwable When the verification process fails.
     *
     * @return void
     */
    public function execute(User $user): void
    {
        $token = Str::random(64);

        DB::transaction(function () use ($user, $token): void {
            EmailVerificationToken::query()
                ->where('user_id', $user->getKey())
                ->delete();

            EmailVerificationToken::create([
                'user_id' => $user->getKey(),
                'email' => $user->getEmailForVerification(),
                'token' => hash('sha256', $token),
                'expires_at' => now()->addMinutes(
                    config('auth.verification.expire'),
                ),
            ]);
        });

        $user->notify(
            new VerifyEmailTokenNotification($token),
        );
    }
}
