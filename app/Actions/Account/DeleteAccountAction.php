<?php

namespace App\Actions\Account;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Deletes a user account.
 *
 * Responsibilities:
 * - Execute the user deletion operation within a database transaction.
 *
 * Architectural Notes:
 * - Credential verification is performed by DeleteAccountRequest.
 * - Authentication/session management remains in the controller.
 * - Database mutation is isolated from HTTP concerns.
 *
 * Transaction Behavior:
 * - The deletion is wrapped in a transaction so database changes triggered
 *   by the deletion either commit together or roll back together.
 *
 * Side Effects:
 * - User deletion events, observers, and database-level cascades may execute
 *   according to the application's existing model configuration.
 */
final class DeleteAccountAction
{
    /**
     * Delete the given user account.
     *
     * @param User $user The account to delete.
     *
     * @return void
     */
    public function execute(User $user): void
    {
        DB::transaction(
            static fn (): bool => $user->delete()
        );
    }
}
