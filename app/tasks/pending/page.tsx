'use client';

import { useState } from 'react';
import { Task, TaskFormData } from '@/types/task';
import { TaskForm } from '@/components/task-form';
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
import { v4 as uuidv4 } from 'uuid';
import { useTasks } from '@/contexts/task-context';

export default function PendingTasksPage() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter tasks to show only pending ones
  const pendingTasks = tasks.filter(task => task.status === 'pending');

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
        <h1 className="text-3xl font-bold">Pending Tasks</h1>
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

      <TaskList
        tasks={pendingTasks}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDeleteTask}
      />
    </div>
  );
} 