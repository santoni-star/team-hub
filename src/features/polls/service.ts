import { supabase } from '@/integrations/supabase/client';
import type { CreatePollInput } from './types';

export const pollService = {
  async getPolls(companyId: string) {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createPoll(input: CreatePollInput & { company_id: string; created_by: string }) {
    const { options, ...pollData } = input;
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({ question: pollData.question, company_id: pollData.company_id, created_by: pollData.created_by, ends_at: pollData.ends_at })
      .select()
      .single();
    if (pollError) throw pollError;

    const optionRows = options.map(text => ({ poll_id: poll.id, text }));
    const { error: optError } = await supabase.from('poll_options').insert(optionRows);
    if (optError) throw optError;

    return poll;
  },

  async getPollOptions(pollId: string) {
    const { data, error } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId);
    if (error) throw error;
    return data;
  },

  async vote(pollId: string, optionId: string, voterId: string) {
    const { error } = await supabase
      .from('poll_votes')
      .insert({ poll_id: pollId, option_id: optionId, voter_id: voterId });
    if (error) throw error;

    // Increment vote count
    const { data: option } = await supabase.from('poll_options').select('vote_count').eq('id', optionId).single();
    if (option) {
      await supabase.from('poll_options').update({ vote_count: option.vote_count + 1 }).eq('id', optionId);
    }
  },

  async getUserVote(pollId: string, userId: string) {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('voter_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data?.option_id || null;
  },
};
