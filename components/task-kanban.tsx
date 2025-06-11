'use client';

import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { TaskFormData } from '@/types/task';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { Clock, FileCheck, Plus, TrendingUp } from 'lucide-react';
import { format, isAfter, isBefore, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskKanbanProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddTask: (data: TaskFormData) => void;
}

export function TaskKanban({ tasks, onStatusChange, onEdit, onDelete, onAddTask }: TaskKanbanProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleUpdateTask = (data: TaskFormData) => {
    if (editingTask) {
      onEdit({ ...editingTask, ...data, updatedAt: new Date() });
      setEditingTask(null);
      setIsDialogOpen(false);
    }
  };

  const getStatusConfig = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return {
          title: 'Pending',
          description: 'Tasks that need to be started',
          icon: <Clock className="h-4 w-4 text-muted-foreground" />,
          color: 'bg-yellow-100 text-yellow-700'
        };
      case 'in-progress':
        return {
          title: 'In Progress',
          description: 'Tasks currently being worked on',
          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
          color: 'bg-blue-100 text-blue-700'
        };
      case 'completed':
        return {
          title: 'Completed',
          description: 'Tasks that have been finished',
          icon: <FileCheck className="h-4 w-4 text-muted-foreground" />,
          color: 'bg-green-100 text-green-700'
        };
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
    }
  };

  const isOverdue = (task: Task) => {
    const deadline = new Date(task.deadline);
    return isValid(deadline) && isBefore(deadline, new Date());
  };

  const isNearDeadline = (task: Task) => {
    const deadline = new Date(task.deadline);
    if (!isValid(deadline)) return false;
    
    const now = new Date();
    const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffInHours > 0 && diffInHours <= 24;
  };

  const formatDate = (date: Date | string) => {
    const parsedDate = new Date(date);
    return isValid(parsedDate) ? format(parsedDate, 'MMM d, yyyy') : 'Invalid date';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {(['pending', 'in-progress', 'completed'] as const).map((status) => {
        const config = getStatusConfig(status);
        const statusTasks = tasks.filter(task => task.status === status);

        return (
          <Card key={status} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                {config.icon}
                <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
              </div>
              <Badge variant="secondary">{statusTasks.length}</Badge>
            </CardHeader>
            <CardContent className="flex-1">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-4">
                  {statusTasks.length === 0 ? (
                    <EmptyState
                      title={`No ${config.title} Tasks`}
                      description={config.description}
                      icon={config.icon}
                      action={status === 'pending' ? {
                        label: 'Add Task',
                        onClick: () => setIsDialogOpen(true)
                      } : undefined}
                    />
                  ) : (
                    statusTasks.map(task => (
                      <div
                        key={task.id}
                        className="p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => handleEdit(task)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{task.title}</h3>
                          <Badge
                            variant="secondary"
                            className={getPriorityColor(task.priority)}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">
                              Due: {formatDate(task.dueDate)}
                            </p>
                            <p className={`${
                              isOverdue(task) ? 'text-red-600' :
                              isNearDeadline(task) ? 'text-yellow-600' :
                              'text-muted-foreground'
                            }`}>
                              Deadline: {formatDate(task.deadline)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(task.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={editingTask ? handleUpdateTask : onAddTask}
            initialData={editingTask || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 