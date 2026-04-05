import React from 'react';
import { useAuth } from '@/features/auth/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { ListTodo } from 'lucide-react';

export default function TasksPage() {
  const { role } = useAuth();
  const isPremium = false; // TODO: check subscription tier

  if (!isPremium) {
    return (
      <div className="p-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">Task management for your team</p>
        </div>
        <Card className="mt-6 border-border/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ListTodo className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">Premium feature</p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Tasks are available on the Growth plan and above. Upgrade your subscription to unlock task management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <div className="p-6"><h1 className="text-xl font-semibold text-foreground">Tasks</h1></div>;
}
