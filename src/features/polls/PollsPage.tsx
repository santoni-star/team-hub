import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { pollService } from '@/features/polls/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Plus, BarChart3, X } from 'lucide-react';
import { motion } from 'framer-motion';

function PollCard({ poll, userId }: { poll: any; userId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: options = [] } = useQuery({
    queryKey: ['poll-options', poll.id],
    queryFn: () => pollService.getPollOptions(poll.id),
  });

  const { data: userVote } = useQuery({
    queryKey: ['poll-vote', poll.id, userId],
    queryFn: () => pollService.getUserVote(poll.id, userId),
  });

  const voteMutation = useMutation({
    mutationFn: (optionId: string) => pollService.vote(poll.id, optionId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['poll-options', poll.id] });
      queryClient.invalidateQueries({ queryKey: ['poll-vote', poll.id] });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const totalVotes = options.reduce((sum: number, o: any) => sum + o.vote_count, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{poll.question}</CardTitle>
        <CardDescription>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {options.map((opt: any) => {
          const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
          const voted = userVote === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => !userVote && voteMutation.mutate(opt.id)}
              disabled={!!userVote || voteMutation.isPending}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className={voted ? 'font-medium text-foreground' : 'text-foreground'}>{opt.text}</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
              <Progress value={pct} className="h-2" />
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function PollsPage() {
  const { user, profile, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const canCreate = role === 'owner' || role === 'admin' || role === 'manager';

  const { data: polls = [] } = useQuery({
    queryKey: ['polls', profile?.company_id],
    queryFn: () => pollService.getPolls(profile!.company_id!),
    enabled: !!profile?.company_id,
  });

  const createMutation = useMutation({
    mutationFn: () => pollService.createPoll({
      question,
      options: options.filter(o => o.trim()),
      company_id: profile!.company_id!,
      created_by: user!.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setOpen(false);
      setQuestion('');
      setOptions(['', '']);
      toast({ title: 'Poll created' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Polls</h1>
          <p className="text-sm text-muted-foreground">Vote and share opinions</p>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Create poll</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create poll</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input value={question} onChange={e => setQuestion(e.target.value)} placeholder="What should we do for team building?" />
                </div>
                <div className="space-y-2">
                  <Label>Options</Label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={opt} onChange={e => { const next = [...options]; next[i] = e.target.value; setOptions(next); }} placeholder={`Option ${i + 1}`} />
                      {options.length > 2 && (
                        <Button variant="ghost" size="icon" onClick={() => setOptions(options.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                      )}
                    </div>
                  ))}
                  {options.length < 10 && (
                    <Button variant="outline" size="sm" onClick={() => setOptions([...options, ''])} className="w-full">Add option</Button>
                  )}
                </div>
                <Button onClick={() => createMutation.mutate()} disabled={!question.trim() || options.filter(o => o.trim()).length < 2} className="w-full">
                  Create poll
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {polls.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No polls yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {polls.map((poll: any, i: number) => (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <PollCard poll={poll} userId={user!.id} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
