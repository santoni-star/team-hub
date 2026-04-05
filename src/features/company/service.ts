import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, AppRole } from '../auth/types';
import type { CreateCompanyInput } from './types';

export const companyService = {
  async createCompany(input: CreateCompanyInput, userId: string) {
    // Create company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({ name: input.name, owner_id: userId })
      .select()
      .single();
    if (companyError) throw companyError;

    // Update profile with company_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ company_id: company.id })
      .eq('user_id', userId);
    if (profileError) throw profileError;

    // Add owner role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, company_id: company.id, role: 'owner' as AppRole });
    if (roleError) throw roleError;

    // Create default #general channel
    await supabase
      .from('channels')
      .insert({ company_id: company.id, name: 'general', description: 'General discussion', created_by: userId });

    // Create starter subscription
    await supabase
      .from('subscriptions')
      .insert({ company_id: company.id, plan: 'starter', status: 'trialing', employee_count: 1 });

    return company;
  },

  async getCompany(companyId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    if (error) throw error;
    return data;
  },

  async getCompanyMembers(companyId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('company_id', companyId);
    if (error) throw error;
    return data;
  },

  async getMemberRoles(companyId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('company_id', companyId);
    if (error) throw error;
    return data;
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data as UserProfile;
  },

  async getUserRole(userId: string, companyId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .single();
    if (error) return null;
    return data.role as AppRole;
  },

  async inviteMember(companyId: string, email: string, role: AppRole, invitedBy: string) {
    const { data, error } = await supabase
      .from('company_invitations')
      .insert({ company_id: companyId, email, role, invited_by: invitedBy })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getPendingInvitations(companyId: string) {
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'pending');
    if (error) throw error;
    return data;
  },

  async getMyInvitations(email: string) {
    const { data, error } = await supabase
      .from('company_invitations')
      .select('*, companies(name)')
      .eq('email', email)
      .eq('status', 'pending');
    if (error) throw error;
    return data;
  },

  async acceptInvitation(invitationId: string, userId: string) {
    const { data: invitation, error: fetchError } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();
    if (fetchError) throw fetchError;

    // Update invitation status
    await supabase
      .from('company_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    // Update profile
    await supabase
      .from('profiles')
      .update({ company_id: invitation.company_id })
      .eq('user_id', userId);

    // Add role
    await supabase
      .from('user_roles')
      .insert({ user_id: userId, company_id: invitation.company_id, role: invitation.role });

    return invitation;
  },
};
