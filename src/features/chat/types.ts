import { z } from 'zod';

export const createChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required').max(50),
  description: z.string().optional(),
  is_private: z.boolean().default(false),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty'),
  channel_id: z.string().uuid(),
});

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export interface Channel {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender?: { full_name: string | null; avatar_url: string | null };
}
