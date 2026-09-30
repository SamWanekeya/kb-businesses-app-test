<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdatePasswordRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;

/**
 * Handles authenticated user password management.
 *
 * Responsibilities:
 * - Coordinate password update requests.
 * - Hash validated passwords before persistence.
 * - Return the appropriate redirect response.
 *
 * Architectural Notes:
 * - Validation and authorization are delegated to UpdatePasswordRequest.
 * - Password policy is explicitly defined by the request.
 * - Password hashing remains at the persistence boundary.
 *
 * Security Considerations:
 * - The current password must be verified before this method executes.
 * - The new password is never stored in plaintext.
 * - No password value is included in the response.
 *
 * Performance Considerations:
 * - Performs one user update after validation.
 * - Password hashing intentionally consumes computational resources as a
 *   security control and should not be bypassed.
 */
class PasswordController extends Controller
{
    /**
     * Update the authenticated user's password.
     *
     * @param UpdatePasswordRequest $request The validated password request.
     *
     * @return RedirectResponse Redirects back with a success message.
     */
    public function update(
        UpdatePasswordRequest $request
    ): RedirectResponse {
        $request->user()->update([
            'password' => Hash::make(
                $request->validated('password')
            ),
        ]);

        return back()->with(
            'success',
            __('Password updated successfully.')
        );
    }
}
