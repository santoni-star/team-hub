export type PlanTier = 'starter' | 'growth' | 'enterprise';

export interface Plan {
  id: PlanTier;
  name: string;
  price: number; // PLN
  pricePerEmployee?: number;
  features: string[];
  maxEmployees?: number;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan: PlanTier;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_start: string;
  current_period_end: string;
  employee_count: number;
  created_at: string;
  updated_at: string;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 299,
    features: ['Up to 15 employees', 'Shift management', 'Team chat', 'Polls'],
    maxEmployees: 15,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 499,
    pricePerEmployee: 19,
    features: ['Unlimited employees', 'Everything in Starter', 'Tasks module', 'Payroll', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    features: ['Custom pricing', 'Everything in Growth', 'Dedicated support', 'SLA', 'Custom integrations'],
  },
];
