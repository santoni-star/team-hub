import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, BarChart3, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { profile, role } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', profile?.company_id],
    queryFn: async () => {
      if (!profile?.company_id) return null;
      const [members, shifts, polls, messages] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id),
        supabase.from('shifts').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('status', 'scheduled'),
        supabase.from('polls').select('id', { count: 'exact', head: true }).eq('company_id', profile.company_id).eq('is_active', true),
        supabase.from('channels').select('id').eq('company_id', profile.company_id).limit(1),
      ]);
      return {
        totalEmployees: members.count || 0,
        activeShifts: shifts.count || 0,
        openPolls: polls.count || 0,
      };
    },
    enabled: !!profile?.company_id,
  });

  const statCards = [
    { title: 'Total employees', value: stats?.totalEmployees ?? 0, icon: Users, color: 'text-info' },
    { title: 'Active shifts', value: stats?.activeShifts ?? 0, icon: Calendar, color: 'text-success' },
    { title: 'Open polls', value: stats?.openPolls ?? 0, icon: BarChart3, color: 'text-warning' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || 'there'}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
