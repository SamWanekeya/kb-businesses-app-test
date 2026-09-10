<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     *
     * Responsibilities:
     * - Redirect verified users to their intended destination
     * - Render the verification prompt for unverified users
     * - Rely exclusively on Inertia shared flash messages
     *
     * Flash messages are NOT passed manually. They are shared globally
     * via HandleInertiaRequests and consumed by the Auth layout.
     *
     * @param Request $request
     *
     * @return Response|RedirectResponse
     */
    public function __invoke(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user && $user->hasVerifiedEmail()) {
            return redirect()->intended(
                route('dashboard.index', absolute: false)
            );
        }

        return Inertia::render('Account/VerifyEmail', []);
    }
}
