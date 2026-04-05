import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { shiftService } from '@/features/shifts/service';
import { companyService } from '@/features/company/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function ShiftsPage() {
  const { user, profile, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const canManage = role === 'owner' || role === 'admin' || role === 'manager';

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', profile?.company_id],
    queryFn: () => shiftService.getShifts(profile!.company_id!),
    enabled: !!profile?.company_id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['company-members', profile?.company_id],
    queryFn: () => companyService.getCompanyMembers(profile!.company_id!),
    enabled: !!profile?.company_id && canManage,
  });

  const createMutation = useMutation({
    mutationFn: () => shiftService.createShift({
      title, employee_id: employeeId, start_time: startTime, end_time: endTime,
      notes: notes || undefined, company_id: profile!.company_id!, created_by: user!.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setOpen(false);
      setTitle(''); setEmployeeId(''); setStartTime(''); setEndTime(''); setNotes('');
      toast({ title: 'Shift created' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const statusColors: Record<string, string> = {
    scheduled: 'bg-info/10 text-info',
    in_progress: 'bg-success/10 text-success',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Shifts</h1>
          <p className="text-sm text-muted-foreground">Manage team schedules</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Create shift</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create shift</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Morning shift" />
                </div>
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      {members.map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>{m.full_name || 'Unnamed'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start</Label>
                    <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End</Label>
                    <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." />
                </div>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !title || !employeeId || !startTime || !endTime} className="w-full">
                  {createMutation.isPending ? 'Creating...' : 'Create shift'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {shifts.length === 0 ? (
          <Card className="border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No shifts scheduled yet</p>
            </CardContent>
          </Card>
        ) : (
          shifts.map((shift: any, i: number) => (
            <motion.div key={shift.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{shift.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {shift.profiles?.full_name || 'Unassigned'} • {format(new Date(shift.start_time), 'MMM d, HH:mm')} – {format(new Date(shift.end_time), 'HH:mm')}
                    </p>
                  </div>
                  <Badge variant="secondary" className={statusColors[shift.status] || ''}>{shift.status}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
