import { z } from 'zod';

export const createPollSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters'),
  options: z.array(z.string().min(1)).min(2, 'At least 2 options required').max(10),
  ends_at: z.string().optional(),
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

export interface Poll {
  id: string;
  company_id: string;
  question: string;
  created_by: string;
  is_active: boolean;
  ends_at: string | null;
  created_at: string;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  vote_count: number;
}

export interface PollVote {
  id: string;
  poll_id: string;
  option_id: string;
  voter_id: string;
  created_at: string;
}
