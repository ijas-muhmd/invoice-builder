'use client';

import { useTasks } from '@/contexts/task-context';
import { TaskList } from '@/components/task-list';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { TaskForm } from '@/components/task-form';
import { TaskFormData, Task } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';
import { EmptyState } from '@/components/empty-state';
import { Calendar } from 'lucide-react';

export default function TodayTasksPage() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter tasks for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= today && taskDate < tomorrow;
  });

  const handleCreateTask = (data: TaskFormData) => {
    const newTask: Task = {
      id: uuidv4(),
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addTask(newTask);
    setIsDialogOpen(false);
  };

  const handleEditTask = (data: TaskFormData) => {
    if (!editingTask) return;

    updateTask(editingTask.id, {
      ...data,
      updatedAt: new Date(),
    });
    setEditingTask(null);
    setIsDialogOpen(false);
  };

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    updateTask(taskId, {
      status,
      updatedAt: new Date(),
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Today's Tasks</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
            </DialogHeader>
            <TaskForm
              onSubmit={editingTask ? handleEditTask : handleCreateTask}
              initialData={editingTask || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      {todayTasks.length === 0 ? (
        <EmptyState
          title="No Tasks for Today"
          description="You have no tasks scheduled for today. Add a task to get started."
          icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
          action={{
            label: 'Add Task',
            onClick: () => setIsDialogOpen(true)
          }}
        />
      ) : (
        <TaskList
          tasks={todayTasks}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
} 