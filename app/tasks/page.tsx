'use client';

import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/task-form';
import { Task, TaskFormData } from '@/types/task';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { CheckSquare, Clock, FileCheck, Plus, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, isValid, parseISO } from 'date-fns';
import { TaskKanban } from '@/components/task-kanban';

export default function TasksOverviewPage() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleCreateTask = (data: TaskFormData) => {
    const newTask: Task = {
      ...data,
      status: 'pending',
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

  // Calculate statistics
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Get tasks due today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= today && taskDate < tomorrow;
  });

  if (tasks.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Task Overview</h1>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
        <EmptyState
          title="No Tasks Yet"
          description="Start managing your tasks by adding your first task."
          icon={<CheckSquare className="h-8 w-8 text-muted-foreground" />}
          action={{
            label: 'Add Task',
            onClick: () => setIsDialogOpen(true)
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Task Overview</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {completedTasks} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              {((pendingTasks / totalTasks) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              {((inProgressTasks / totalTasks) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Today's Tasks</CardTitle>
          <CardDescription>Tasks due today</CardDescription>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <EmptyState
              title="No Tasks for Today"
              description="You have no tasks scheduled for today."
              icon={<Clock className="h-8 w-8 text-muted-foreground" />}
              action={{
                label: 'Add Task',
                onClick: () => setIsDialogOpen(true)
              }}
            />
          ) : (
            <div className="space-y-4">
              {todayTasks.map(task => {
                const deadlineDate = task.deadline ? (typeof task.deadline === 'string' ? parseISO(task.deadline) : new Date(task.deadline)) : null;
                const isDeadlineValid = deadlineDate && isValid(deadlineDate);
                return (
                  <div
                    key={task.id}
                    className="p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEdit(task)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{task.title}</h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">
                          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </p>
                        <p className={`${
                          deadlineDate && deadlineDate < new Date() ? 'text-red-600' :
                          deadlineDate && deadlineDate.getTime() - new Date().getTime() <= 24 * 60 * 60 * 1000 ? 'text-yellow-600' :
                          'text-muted-foreground'
                        }`}>
                          Deadline: {isDeadlineValid ? format(deadlineDate, 'MMM d, yyyy') : 'No deadline'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Task Board</CardTitle>
          <CardDescription>Manage your tasks with the Kanban board</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskKanban
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddTask={handleCreateTask}
          />
        </CardContent>
      </Card>

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