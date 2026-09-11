<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class UserService
{
    /**
     * Assign default role to a user
     *
     * @param User $user
     *
     * @return bool
     */
    public static function assignDefaultRole(User $user): bool
    {
        try {
            if (empty($user->type)) {
                $user->type = 'organization';
                $user->save();

                return true;
            }

            return false;
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error('Failed to assign default role: ' . $e->getMessage());

            return false;
        }
    }

    /**
     * Assign organization role and permissions to user
     *
     * @param User $user
     *
     * @return bool
     */
    public static function assignOrganizationPermissions(User $user): bool
    {
        try {
            // Get organization role
            $organizationRole = Role::where('name', 'organization')?->first();

            if ($organizationRole) {
                $user->assignRole($organizationRole);
                $user->type = 'organization';
                $user->save();

                return true;
            }

            return false;
        } catch (Exception $e) {
            // Fail silently but log once for investigation
            Log::error('Failed to assign organization role: ' . $e->getMessage());

            return false;
        }
    }
}
