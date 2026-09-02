import React from 'react';
import PlanForm from './form';

interface Plan {
  id: number;
  name: string;
  price: number;
  yearly_price: number | null;
  duration: string;
  description: string | null;
  maximum_users: number;
  maximum_projects: number;
  maximum_contacts: number;
  maximum_accounts: number;
  storage_limit: number;
  enable_branding: string;
  enable_kakbima_intelligence: string;
  module: string[] | null;
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
  return <PlanForm plan={plan} otherDefaultPlanExists={otherDefaultPlanExists} />;
}
