import { supabase } from '@/integrations/supabase/client';
import type { CreateChannelInput, SendMessageInput, Channel, Message } from './types';

export const chatService = {
  async getChannels(companyId: string) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as Channel[];
  },

  async createChannel(input: CreateChannelInput & { company_id: string; created_by: string }) {
    const { data, error } = await supabase
      .from('channels')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getMessages(channelId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name, avatar_url)')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async sendMessage(input: SendMessageInput & { sender_id: string }) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ channel_id: input.channel_id, sender_id: input.sender_id, content: input.content })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToMessages(channelId: string, callback: (message: any) => void) {
    return supabase
      .channel(`messages:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channelId}`,
      }, payload => callback(payload.new))
      .subscribe();
  },

  unsubscribe(channelId: string) {
    supabase.removeChannel(supabase.channel(`messages:${channelId}`));
  },
};
