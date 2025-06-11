'use client';

import { useTasks } from '@/contexts/task-context';
import { TaskKanban } from '@/components/task-kanban';
import { Task, TaskFormData } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function TaskBoardPage() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateTask = (data: TaskFormData) => {
    const newTask: Task = {
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      id: Math.random().toString(36).substr(2, 9)
    };
    addTask(newTask);
  };

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    updateTask(taskId, { status, updatedAt: new Date() });
  };

  const handleEdit = (task: Task) => {
    updateTask(task.id, { ...task, updatedAt: new Date() });
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Task Board</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <TaskKanban
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddTask={handleCreateTask}
      />
    </div>
  );
} 