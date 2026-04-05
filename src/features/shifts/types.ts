import { z } from 'zod';

export const createShiftSchema = z.object({
  employee_id: z.string().uuid(),
  start_time: z.string(),
  end_time: z.string(),
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export interface Shift {
  id: string;
  company_id: string;
  employee_id: string;
  title: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  employee?: { full_name: string | null; avatar_url: string | null };
}

export interface ShiftSwapRequest {
  id: string;
  shift_id: string;
  requester_id: string;
  target_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  created_at: string;
}

export interface TimeOffRequest {
  id: string;
  company_id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
