import { useState } from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MoreVertical, CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

const statusIcons = {
  pending: Circle,
  'in-progress': Clock,
  completed: CheckCircle2,
};

export function TaskList({ tasks, onStatusChange, onEdit, onDelete }: TaskListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'in-progress' ? 'default' : 'outline'}
            onClick={() => setFilter('in-progress')}
          >
            In Progress
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredTasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          return (
            <Card key={task.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <StatusIcon
                    className={cn(
                      'h-5 w-5',
                      task.status === 'completed' ? 'text-green-500' : 'text-gray-500'
                    )}
                  />
                  <CardTitle className="text-lg font-medium">{task.title}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(task)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(task.id)}
                      className="text-red-600"
                    >
                      Delete
                    </DropdownMenuItem>
                    {task.status !== 'completed' && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(task.id, 'completed')}
                      >
                        Mark as completed
                      </DropdownMenuItem>
                    )}
                    {task.status !== 'in-progress' && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(task.id, 'in-progress')}
                      >
                        Mark as in progress
                      </DropdownMenuItem>
                    )}
                    {task.status !== 'pending' && (
                      <DropdownMenuItem
                        onClick={() => onStatusChange(task.id, 'pending')}
                      >
                        Mark as pending
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                {task.description && (
                  <CardDescription className="mb-2">{task.description}</CardDescription>
                )}
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className={cn('font-medium', priorityColors[task.priority])}
                  >
                    {task.priority}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Due: {format(task.dueDate, 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 