import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

export const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;

export type AppRole = 'owner' | 'admin' | 'manager' | 'employee';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  company_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  user_id: string;
  role: AppRole;
  profile: UserProfile;
}
