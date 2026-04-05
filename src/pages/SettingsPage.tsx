import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { companyService } from '@/features/company/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Building2 } from 'lucide-react';
import type { AppRole } from '@/features/auth/types';

export default function SettingsPage() {
  const { user, profile, role, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('employee');
  const [inviteOpen, setInviteOpen] = useState(false);
  const canManage = role === 'owner' || role === 'admin';

  const { data: members = [] } = useQuery({
    queryKey: ['company-members', profile?.company_id],
    queryFn: () => companyService.getCompanyMembers(profile!.company_id!),
    enabled: !!profile?.company_id,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['company-roles', profile?.company_id],
    queryFn: () => companyService.getMemberRoles(profile!.company_id!),
    enabled: !!profile?.company_id,
  });

  const { data: company } = useQuery({
    queryKey: ['company', profile?.company_id],
    queryFn: () => companyService.getCompany(profile!.company_id!),
    enabled: !!profile?.company_id,
  });

  const inviteMutation = useMutation({
    mutationFn: () => companyService.inviteMember(profile!.company_id!, inviteEmail, inviteRole as AppRole, user!.id),
    onSuccess: () => {
      setInviteOpen(false);
      setInviteEmail('');
      toast({ title: 'Invitation sent' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const getRoleForUser = (userId: string) => {
    const r = roles.find((r: any) => r.user_id === userId);
    return r?.role || 'employee';
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your company and team</p>
      </div>

      {company && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4" /> {company.name}</CardTitle>
            <CardDescription>{members.length} member{members.length !== 1 ? 's' : ''}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Team members</CardTitle>
            <CardDescription>Manage roles and invitations</CardDescription>
          </div>
          {canManage && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><UserPlus className="mr-1 h-4 w-4" /> Invite</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={() => inviteMutation.mutate()} disabled={!inviteEmail.trim()} className="w-full">Send invitation</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {members.map((member: any) => (
            <div key={member.user_id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{member.full_name || 'Unnamed'}</p>
              </div>
              <Badge variant="secondary" className="capitalize">{getRoleForUser(member.user_id)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
