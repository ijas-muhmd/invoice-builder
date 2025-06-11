'use client';

import { useTasks } from '@/contexts/task-context';
import { TaskList } from '@/components/task-list';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { Task, TaskFormData } from '@/types/task';
import { useState } from 'react';
import { TaskEmptyState } from '@/components/empty-state';

export default function StatusTasksPage({ params }: { params: { status: string } }) {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Validate status
  const validStatuses = ['pending', 'in-progress', 'completed'];
  if (!validStatuses.includes(params.status)) {
    return <div>Invalid status</div>;
  }

  const handleCreateTask = (data: TaskFormData) => {
    const newTask: Task = {
      ...data,
      status: params.status as Task['status'],
      createdAt: new Date(),
      updatedAt: new Date(),
      id: Math.random().toString(36).substr(2, 9)
    };
    addTask(newTask);
    setIsDialogOpen(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleUpdateTask = (data: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        ...data,
        status: params.status as Task['status'],
        updatedAt: new Date()
      });
      setEditingTask(null);
      setIsDialogOpen(false);
    }
  };

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    updateTask(taskId, { status, updatedAt: new Date() });
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  // Filter tasks by status
  const filteredTasks = tasks.filter(task => task.status === params.status);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold capitalize">{params.status} Tasks</h1>
        <Button onClick={() => setIsDialogOpen(true)}>Add Task</Button>
      </div>

      {filteredTasks.length === 0 ? (
        <TaskEmptyState 
          status={params.status} 
          onAddTask={() => setIsDialogOpen(true)} 
        />
      ) : (
        <TaskList
          tasks={filteredTasks}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
            initialData={editingTask || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 