// resources/js/types/payment.d.ts
import React from 'react';

export {};

interface PlanStats {
    maximum_users: number | string;
    maximum_projects: number | string;
    maximum_contacts: number | string;
    maximum_accounts: number | string;
    maximum_storage: string;
}

export interface Plan {
    id: number;
    name: string;
    price: string | number;
    formatted_price?: string;
    duration: string;
    description: string;
    trial_days: number;
    features: string[];
    stats: PlanStats;
    status: boolean;
    recommended?: boolean;
    is_default?: boolean;
    is_current?: boolean;
    is_trial_available?: boolean;
}

export interface CurrentPlan {
    id: number;
    expires_at?: string | null;
}

export interface PaymentMethod {
    id: string;
    name: string;
    icon: React.ReactNode;
    enabled: boolean;
    currency?: string;
}
