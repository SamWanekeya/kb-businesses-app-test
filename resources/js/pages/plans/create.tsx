import PlanForm from '@pages/plans/form';

interface Props {
    hasDefaultPlan: boolean;
}

export default function CreatePlan({ hasDefaultPlan }: Props) {
    return <PlanForm hasDefaultPlan={hasDefaultPlan} />;
}
