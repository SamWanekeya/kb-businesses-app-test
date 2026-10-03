<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Class EmailVerificationPromptController
 *
 * Displays the email verification screen to authenticated users whose
 * email address has not yet been verified.
 *
 * Responsibilities:
 * - Redirect already verified users to their intended destination.
 * - Render the Inertia verification screen for unverified users.
 */
class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     *
     * @param Request $request The incoming request.
     *
     * @return Response|RedirectResponse
     */
    public function __invoke(
        Request $request,
    ): Response|RedirectResponse {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->intended(
                route('dashboard.index', absolute: false)
            )->with('info', __('Your email address has already been verified.'));
        }

        return Inertia::render('Account/VerifyEmail');
    }
}
