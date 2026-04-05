
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee');

-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create company_invitations table
CREATE TABLE public.company_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Create shifts table
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Create shift_swap_requests table
CREATE TABLE public.shift_swap_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- Create time_off_requests table
CREATE TABLE public.time_off_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;

-- Create channels table
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Create poll_options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, voter_id)
);
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  employee_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Utility: updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _company_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND company_id = _company_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _company_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND company_id = _company_id AND role = ANY(_roles)
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- Companies: members can view their company
CREATE POLICY "Users can view their company" ON public.companies
  FOR SELECT USING (id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can update their company" ON public.companies
  FOR UPDATE USING (public.has_role(auth.uid(), id, 'owner'));

-- Profiles: users in same company can view, self can update
CREATE POLICY "Company members can view profiles" ON public.profiles
  FOR SELECT USING (
    company_id IS NULL OR company_id = public.get_user_company_id(auth.uid()) OR user_id = auth.uid()
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- User roles: company members can view roles
CREATE POLICY "Company members can view roles" ON public.user_roles
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Owners/admins can manage roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[]));

CREATE POLICY "Owners/admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[]));

CREATE POLICY "Owners/admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[]));

-- Company invitations
CREATE POLICY "Company members can view invitations" ON public.company_invitations
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Admins+ can create invitations" ON public.company_invitations
  FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

CREATE POLICY "Admins+ can update invitations" ON public.company_invitations
  FOR UPDATE USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Shifts: company-isolated
CREATE POLICY "Company members can view shifts" ON public.shifts
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Managers+ can create shifts" ON public.shifts
  FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

CREATE POLICY "Managers+ can update shifts" ON public.shifts
  FOR UPDATE USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

CREATE POLICY "Managers+ can delete shifts" ON public.shifts
  FOR DELETE USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

-- Shift swap requests
CREATE POLICY "Company members can view swap requests" ON public.shift_swap_requests
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.shifts s WHERE s.id = shift_id AND s.company_id = public.get_user_company_id(auth.uid())
  ));

CREATE POLICY "Employees can create swap requests" ON public.shift_swap_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Managers+ can update swap requests" ON public.shift_swap_requests
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.shifts s WHERE s.id = shift_id AND public.has_any_role(auth.uid(), s.company_id, ARRAY['owner', 'admin', 'manager']::app_role[])
  ));

-- Time off requests
CREATE POLICY "Company members can view time off" ON public.time_off_requests
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Employees can request time off" ON public.time_off_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid() AND company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Managers+ can update time off" ON public.time_off_requests
  FOR UPDATE USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

-- Channels: company-isolated
CREATE POLICY "Company members can view channels" ON public.channels
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Company members can create channels" ON public.channels
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Messages: via channel company isolation
CREATE POLICY "Company members can view messages" ON public.messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.company_id = public.get_user_company_id(auth.uid())
  ));

CREATE POLICY "Company members can send messages" ON public.messages
  FOR INSERT WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.company_id = public.get_user_company_id(auth.uid())
  ));

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Polls: company-isolated
CREATE POLICY "Company members can view polls" ON public.polls
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Managers+ can create polls" ON public.polls
  FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

CREATE POLICY "Managers+ can update polls" ON public.polls
  FOR UPDATE USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

-- Poll options
CREATE POLICY "Company members can view poll options" ON public.poll_options
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.company_id = public.get_user_company_id(auth.uid())
  ));

CREATE POLICY "Managers+ can create poll options" ON public.poll_options
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.has_any_role(auth.uid(), p.company_id, ARRAY['owner', 'admin', 'manager']::app_role[])
  ));

-- Poll votes
CREATE POLICY "Company members can view votes" ON public.poll_votes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.company_id = public.get_user_company_id(auth.uid())
  ));

CREATE POLICY "Company members can vote" ON public.poll_votes
  FOR INSERT WITH CHECK (voter_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.polls p WHERE p.id = poll_id AND p.company_id = public.get_user_company_id(auth.uid())
  ));

-- Tasks: company-isolated
CREATE POLICY "Company members can view tasks" ON public.tasks
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Managers+ can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

CREATE POLICY "Assignees and managers+ can update tasks" ON public.tasks
  FOR UPDATE USING (assignee_id = auth.uid() OR public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

CREATE POLICY "Managers+ can delete tasks" ON public.tasks
  FOR DELETE USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin', 'manager']::app_role[]));

-- Subscriptions: owner/admin only
CREATE POLICY "Admins can view subscription" ON public.subscriptions
  FOR SELECT USING (public.has_any_role(auth.uid(), company_id, ARRAY['owner', 'admin']::app_role[]));

CREATE POLICY "System can manage subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), company_id, 'owner'));

CREATE POLICY "Owners can update subscription" ON public.subscriptions
  FOR UPDATE USING (public.has_role(auth.uid(), company_id, 'owner'));

-- Enable realtime for messages and shifts
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;

-- Indexes for performance
CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_company ON public.user_roles(user_id, company_id);
CREATE INDEX idx_shifts_company_id ON public.shifts(company_id);
CREATE INDEX idx_shifts_employee_id ON public.shifts(employee_id);
CREATE INDEX idx_shifts_start_time ON public.shifts(start_time);
CREATE INDEX idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_channels_company_id ON public.channels(company_id);
CREATE INDEX idx_polls_company_id ON public.polls(company_id);
CREATE INDEX idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX idx_tasks_assignee_id ON public.tasks(assignee_id);
CREATE INDEX idx_company_invitations_email ON public.company_invitations(email);
