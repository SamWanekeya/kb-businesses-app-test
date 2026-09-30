<?php

namespace App\Actions\Account;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Updates an authenticated user's profile.
 *
 * Responsibilities:
 * - Apply validated profile attributes to the user.
 * - Handle optional avatar replacement.
 * - Reset email verification when the email address changes.
 * - Persist the updated profile.
 * - Remove the previous avatar after a successful replacement.
 *
 * Architectural Notes:
 * - Input validation remains in ProfileUpdateRequest.
 * - The controller only coordinates the application operation.
 * - Existing uploadFile(), checkFile(), and deleteFile() helpers are
 *   retained to preserve the application's configured storage behavior.
 *
 * File Replacement Strategy:
 * - The new avatar is uploaded first.
 * - The user record is updated with the new avatar path.
 * - The old avatar is deleted only after the user has been persisted.
 *
 * This ordering prevents a failed replacement upload from destroying the
 * user's existing avatar.
 *
 * @throws RuntimeException When the avatar upload fails.
 */
final class UpdateProfileAction
{
    /**
     * Execute the profile update.
     *
     * @param User $user The authenticated user.
     * @param Request $request The profile update request.
     * @param array<string, mixed> $attributes Validated profile attributes.
     *
     * @throws RuntimeException When avatar upload fails.
     *
     * @return void
     */
    public function execute(
        User $user,
        Request $request,
        array $attributes,
    ): void {
        unset($attributes['_method']);

        $previousAvatar = $user->avatar;
        $hasNewAvatar = $request->hasFile('avatar');

        if ($hasNewAvatar) {
            $attributes['avatar'] = $this->uploadAvatar($request);
        } else {
            unset($attributes['avatar']);
        }

        $user->fill($attributes);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        if (
            $hasNewAvatar
            && $previousAvatar
            && checkFile($previousAvatar)
        ) {
            deleteFile($previousAvatar);
        }
    }

    /**
     * Upload the user's replacement avatar.
     *
     * The existing uploadFile() helper is intentionally retained because
     * it resolves the configured storage backend and is currently coupled
     * to the request object.
     *
     * @param Request $request The profile update request.
     *
     * @throws RuntimeException When the upload fails.
     *
     * @return string The stored avatar path.
     */
    private function uploadAvatar(Request $request): string
    {
        $file = $request->file('avatar');

        if ($file === null) {
            throw new RuntimeException(
                __('The avatar file was not provided.')
            );
        }

        $filename = pathinfo(
            $file->getClientOriginalName(),
            PATHINFO_FILENAME
        );

        $extension = strtolower(
            $file->getClientOriginalExtension()
        );

        $storedFilename = sprintf(
            '%s_%s.%s',
            Str::slug($filename),
            now()->timestamp,
            $extension
        );

        $upload = uploadFile(
            $request,
            'avatar',
            $storedFilename,
            'avatars'
        );

        if (!($upload['status'] ?? false)) {
            throw new RuntimeException(
                $upload['msg']
                ?? __('Unable to upload the avatar.')
            );
        }

        return $upload['url'];
    }
}
