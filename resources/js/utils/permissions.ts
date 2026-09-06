// utils/usePermissions.ts
import { usePage } from '@inertiajs/react';

/**
 * Hook to check if the current user has a specific permission
 * @param permission The permission name to check
 * @returns boolean indicating if the user has the permission
 */
export const useHasPermission = (permission: string): boolean => {
    const { auth } = usePage().props;

    if (!auth || !auth.user || !auth.permissions) return false;

    return auth.permissions.includes(permission);
};

/**
 * Hook to check if the current user has any of the specified permissions
 * @param permissions Array of permission names to check
 * @returns boolean indicating if the user has any of the permissions
 */
export const useHasAnyPermission = (permissions: string[]): boolean => {
    const { auth } = usePage().props;

    if (!auth || !auth.user || !auth.permissions) return false;

    return permissions.some((p) => auth.permissions?.includes(p));
};
