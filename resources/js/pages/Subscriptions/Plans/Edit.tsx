import PlanCreateEditForm from '@pages/Subscriptions/Plans/PlanCreateEditForm';

interface Plan {
    id: number;
    name: string;
    price: number;
    yearly_price: number | null;
    duration: string;
    description: string | null;
    maximum_users: number;
    maximum_staffs: number;
    storage_limit: number;
    enable_kakbima_intelligence: string;
    is_trial: string | null;
    trial_days: number;
    is_plan_enabled: string;
    is_default: boolean;
}

interface Props {
    plan: Plan;
    otherDefaultPlanExists: boolean;
}

export default function EditPlan({ plan, otherDefaultPlanExists }: Props) {
    return <PlanCreateEditForm plan={plan} otherDefaultPlanExists={otherDefaultPlanExists} />;
}
