import { Button } from '@/components/ui/button';
import { CheckSquare, ClipboardList, Clock, FileCheck } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon || <ClipboardList className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
      )}
    </div>
  );
}

export function TaskEmptyState({ status, onAddTask }: { status: string; onAddTask: () => void }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: 'No Pending Tasks',
          description: 'You have no pending tasks. Add a new task to get started.',
          icon: <Clock className="h-8 w-8 text-muted-foreground" />
        };
      case 'in-progress':
        return {
          title: 'No In Progress Tasks',
          description: 'You have no tasks in progress. Move a task from pending to get started.',
          icon: <CheckSquare className="h-8 w-8 text-muted-foreground" />
        };
      case 'completed':
        return {
          title: 'No Completed Tasks',
          description: 'You have no completed tasks yet. Complete some tasks to see them here.',
          icon: <FileCheck className="h-8 w-8 text-muted-foreground" />
        };
      default:
        return {
          title: 'No Tasks',
          description: 'You have no tasks. Add a new task to get started.',
          icon: <ClipboardList className="h-8 w-8 text-muted-foreground" />
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <EmptyState
      {...config}
      action={{
        label: 'Add Task',
        onClick: onAddTask
      }}
    />
  );
} 