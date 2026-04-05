import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { chatService } from '@/features/chat/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Hash, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelOpen, setChannelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: channels = [] } = useQuery({
    queryKey: ['channels', profile?.company_id],
    queryFn: () => chatService.getChannels(profile!.company_id!),
    enabled: !!profile?.company_id,
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedChannel],
    queryFn: () => chatService.getMessages(selectedChannel!),
    enabled: !!selectedChannel,
  });

  // Auto-select first channel
  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      setSelectedChannel(channels[0].id);
    }
  }, [channels, selectedChannel]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedChannel) return;
    const sub = chatService.subscribeToMessages(selectedChannel, () => {
      refetchMessages();
    });
    return () => { chatService.unsubscribe(selectedChannel); };
  }, [selectedChannel, refetchMessages]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: () => chatService.sendMessage({ channel_id: selectedChannel!, content: message, sender_id: user!.id }),
    onSuccess: () => {
      setMessage('');
      refetchMessages();
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const createChannelMutation = useMutation({
    mutationFn: () => chatService.createChannel({ name: channelName, company_id: profile!.company_id!, created_by: user!.id }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      setChannelOpen(false);
      setChannelName('');
      setSelectedChannel(data.id);
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendMutation.mutate();
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] md:h-screen">
      {/* Channel list */}
      <div className="w-56 shrink-0 border-r border-border/50 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Channels</span>
          <Dialog open={channelOpen} onOpenChange={setChannelOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3.5 w-3.5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New channel</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Channel name</Label>
                  <Input value={channelName} onChange={e => setChannelName(e.target.value)} placeholder="announcements" />
                </div>
                <Button onClick={() => createChannelMutation.mutate()} disabled={!channelName.trim()} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setSelectedChannel(ch.id)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors',
                selectedChannel === ch.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <Hash className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{ch.name}</span>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Messages area */}
      <div className="flex flex-1 flex-col">
        {selectedChannel ? (
          <>
            <div className="border-b border-border/50 px-4 py-3">
              <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> {channels.find(c => c.id === selectedChannel)?.name}
              </h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg: any) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-accent-foreground shrink-0">
                      {(msg.profiles?.full_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-foreground">{msg.profiles?.full_name || 'User'}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), 'HH:mm')}</span>
                      </div>
                      <p className="text-sm text-foreground/90">{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <form onSubmit={handleSend} className="border-t border-border/50 p-3 flex gap-2">
              <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1" />
              <Button type="submit" size="icon" disabled={!message.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
