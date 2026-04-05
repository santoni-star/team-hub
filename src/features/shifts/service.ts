import { supabase } from '@/integrations/supabase/client';
import type { CreateShiftInput, Shift } from './types';

export const shiftService = {
  async getShifts(companyId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*, profiles!shifts_employee_id_fkey(full_name, avatar_url)')
      .eq('company_id', companyId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createShift(input: { employee_id: string; start_time: string; end_time: string; title: string; notes?: string; company_id: string; created_by: string }) {
    const { data, error } = await supabase
      .from('shifts')
      .insert(input)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateShift(id: string, updates: Partial<Shift>) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteShift(id: string) {
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (error) throw error;
  },

  async getMyShifts(employeeId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_time', { ascending: true });
    if (error) throw error;
    return data;
  },

  async requestTimeOff(companyId: string, employeeId: string, startDate: string, endDate: string, reason?: string) {
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert({ company_id: companyId, employee_id: employeeId, start_date: startDate, end_date: endDate, reason })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getTimeOffRequests(companyId: string) {
    const { data, error } = await supabase
      .from('time_off_requests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};
