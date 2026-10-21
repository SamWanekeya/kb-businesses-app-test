import PlanCreateEditForm from '@pages/Subscriptions/Plans/PlanCreateEditForm';

interface Props {
    hasDefaultPlan: boolean;
}

export default function CreatePlan({ hasDefaultPlan }: Props) {
    return <PlanCreateEditForm hasDefaultPlan={hasDefaultPlan} />;
}
