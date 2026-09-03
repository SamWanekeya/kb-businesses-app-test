// utils/rolePermissions.ts
export const getModulesFromNavigation = (userRole: string): string[] => {
    const superAdminModules = [
        'dashboard',
        'organizations',
        'nfc_cards',
        'nfc_card_order_requests',
        'campaigns',
        'plans',
        'plan_requests',
        'plan_orders',
        'domain_requests',
        'currencies',
        'referral',
        'settings',
    ];

    const organizationModules = [
        'dashboard',
        'users',
        'roles',
        'contacts',
        'appointments',
        'nfc_cards',
        'campaigns',
        'plans',
        'referral',
        'settings',
    ];

    return userRole === 'super_admin' || userRole === 'super admin' ? superAdminModules : organizationModules;
};

export const filterPermissionsByRole = (permissions: Record<string, any[]>, userRole: string): Record<string, any[]> => {
    const allowedModules = getModulesFromNavigation(userRole);
    const filteredPermissions: Record<string, any[]> = {};

    Object.keys(permissions).forEach((module) => {
        if (allowedModules.includes(module)) {
            filteredPermissions[module] = permissions[module];
        }
    });

    return filteredPermissions;
};
