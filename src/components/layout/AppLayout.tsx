import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, Calendar, MessageSquare, BarChart3,
  ListTodo, CreditCard, Settings, LogOut, ChevronLeft, Menu
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/shifts', icon: Calendar, label: 'Shifts' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/polls', icon: BarChart3, label: 'Polls' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/billing', icon: CreditCard, label: 'Billing' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { profile, role, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50 bg-card transition-all duration-200 md:relative',
        collapsed ? 'w-16' : 'w-56',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Logo */}
        <div className={cn('flex h-14 items-center border-b border-border/50 px-4', collapsed && 'justify-center')}>
          {!collapsed && <span className="text-sm font-semibold text-foreground">ShiftFlow</span>}
          <Button variant="ghost" size="icon" className={cn('ml-auto h-7 w-7', collapsed && 'ml-0')} onClick={() => setCollapsed(c => !c)}>
            <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
              end={item.to === '/'}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className={cn('border-t border-border/50 p-3', collapsed && 'flex justify-center')}>
          {!collapsed && (
            <div className="mb-2 px-1">
              <p className="truncate text-sm font-medium text-foreground">{profile?.full_name || 'User'}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{role || 'member'}</p>
            </div>
          )}
          <Button variant="ghost" size={collapsed ? 'icon' : 'sm'} onClick={signOut} className={cn('w-full justify-start gap-2 text-muted-foreground', collapsed && 'justify-center')}>
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Sign out'}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <div className="flex h-14 items-center border-b border-border/50 px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-3 text-sm font-semibold text-foreground">ShiftFlow</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
