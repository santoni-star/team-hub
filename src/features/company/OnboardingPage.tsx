import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/AuthProvider';
import { companyService } from '@/features/company/service';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Building2, Mail } from 'lucide-react';

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user?.email) {
      companyService.getMyInvitations(user.email).then(data => {
        setInvitations(data || []);
        setChecked(true);
      });
    }
  }, [user?.email]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await companyService.createCompany({ name: companyName }, user.id);
      await refreshProfile();
      toast({ title: 'Company created!' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      await companyService.acceptInvitation(invitationId, user.id);
      await refreshProfile();
      toast({ title: 'Invitation accepted!' });
      navigate('/');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!checked) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome to ShiftFlow</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a company or join an existing one.</p>
        </div>

        {invitations.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" /> Pending invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{(inv as any).companies?.name || 'Company'}</p>
                    <p className="text-xs text-muted-foreground">Role: {inv.role}</p>
                  </div>
                  <Button size="sm" onClick={() => handleAcceptInvitation(inv.id)} disabled={loading}>
                    Accept
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" /> Create a new company
            </CardTitle>
            <CardDescription>Start managing your team in seconds.</CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateCompany}>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company name</Label>
                <Input id="company-name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create company'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
