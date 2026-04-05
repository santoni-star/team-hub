import React from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { PLANS } from '@/features/billing/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function BillingPage() {
  const { profile, role } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ['subscription', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', profile!.company_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.company_id && (role === 'owner' || role === 'admin'),
  });

  const currentPlan = subscription?.plan || 'starter';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground">Manage your subscription</p>
      </div>

      {subscription && (
        <Card className="border-border/50">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium text-foreground">Current plan: <span className="capitalize">{subscription.plan}</span></p>
              <p className="text-xs text-muted-foreground">Status: {subscription.status} • {subscription.employee_count} employees</p>
            </div>
            <Badge variant="secondary" className="capitalize">{subscription.status}</Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan, i) => (
          <motion.div key={plan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={cn('border-border/50 relative', currentPlan === plan.id && 'ring-2 ring-primary')}>
              {currentPlan === plan.id && (
                <Badge className="absolute -top-2.5 left-4 text-xs">Current</Badge>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.price > 0 ? (
                    <><span className="text-2xl font-semibold text-foreground">{plan.price} PLN</span><span className="text-muted-foreground">/mo</span></>
                  ) : (
                    <span className="text-lg font-medium text-foreground">Contact us</span>
                  )}
                  {plan.pricePerEmployee && (
                    <span className="block text-xs mt-1">+ {plan.pricePerEmployee} PLN/employee/mo</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-success shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={currentPlan === plan.id ? 'secondary' : 'default'}
                  className="w-full mt-4"
                  disabled={currentPlan === plan.id}
                >
                  {currentPlan === plan.id ? 'Current plan' : plan.price > 0 ? 'Upgrade' : 'Contact sales'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
