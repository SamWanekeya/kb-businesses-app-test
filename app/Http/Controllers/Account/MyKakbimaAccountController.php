<?php

namespace App\Http\Controllers\Account;

use App\Actions\Account\DeleteAccountAction;
use App\Actions\Account\UpdateProfileAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\DeleteAccountRequest;
use App\Http\Requests\Account\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Handles the authenticated user's Kakbima account profile settings.
 *
 * Responsibilities:
 * - Render the user's account settings page.
 * - Coordinate profile updates.
 * - Coordinate account deletion.
 *
 * Architectural Notes:
 * - Validation is delegated to Form Requests.
 * - Profile mutation is delegated to UpdateProfileAction.
 * - Account deletion is delegated to DeleteAccountAction.
 * - Authentication and session lifecycle remain at the HTTP boundary.
 *
 * Performance Considerations:
 * - Does not introduce additional database queries beyond those required
 *   by the underlying account operations.
 * - Uses the already-authenticated user rather than querying the user again.
 */
class MyKakbimaAccountController extends Controller
{
    /**
     * Create a new account controller instance.
     *
     * @param UpdateProfileAction $updateProfileAction Handles profile updates.
     * @param DeleteAccountAction $deleteAccountAction Handles account deletion.
     */
    public function __construct(
        private readonly UpdateProfileAction $updateProfileAction,
        private readonly DeleteAccountAction $deleteAccountAction,
    ) {
    }

    /**
     * Show the authenticated user's profile settings page.
     *
     * @param Request $request The current authenticated request.
     *
     * @return Response The Inertia account settings response.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('Account/MyKakbimaAccount', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the authenticated user's profile information.
     *
     * Redirects users to the email verification screen when their email
     * address has changed. The account page is stored as the intended
     * destination so the user returns to their profile after verification.
     *
     * @param ProfileUpdateRequest $request The validated profile update request.
     *
     * @return RedirectResponse
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $emailChanged = $user->email !== $request->validated('email');

        $this->updateProfileAction->execute(
            user: $user,
            request: $request,
            attributes: $request->validated(),
        );

        if ($emailChanged) {
            $request->session()->put(
                'url.intended',
                route('my-kakbima-account.success', absolute: false),
            );

            return to_route('authenticated.verification.notice');
        }

        return to_route('my-kakbima-account.success')
            ->with(
                'success',
                __('Profile updated successfully.'),
            );
    }

    /**
     * Delete the authenticated user's account.
     *
     * DeleteAccountRequest verifies the user's current password before
     * this method executes.
     *
     * The account is deleted before the authentication session is terminated
     * so that authentication state is not destroyed if the database
     * operation fails.
     *
     * @param DeleteAccountRequest $request The validated deletion request.
     *
     * @return RedirectResponse Redirects the user to the sign-in page.
     */
    public function destroy(
        DeleteAccountRequest $request
    ): RedirectResponse {
        $user = $request->user();

        $this->deleteAccountAction->execute($user);

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('sign-in');
    }
}
