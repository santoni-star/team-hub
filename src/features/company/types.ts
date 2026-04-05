import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'employee']),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export interface Company {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  invited_by: string;
  created_at: string;
  expires_at: string;
}
