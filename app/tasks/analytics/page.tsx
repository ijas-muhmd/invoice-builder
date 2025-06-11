'use client';

import { useTasks } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { EmptyState } from '@/components/empty-state';
import { BarChart } from 'lucide-react';

export default function TaskAnalyticsPage() {
  const { tasks } = useTasks();

  if (tasks.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Task Analytics</h1>
        <EmptyState
          title="No Task Data"
          description="Start adding tasks to see your analytics and track your progress."
          icon={<BarChart className="h-8 w-8 text-muted-foreground" />}
        />
      </div>
    );
  }

  // Calculate task statistics
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate tasks by priority
  const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;
  const mediumPriorityTasks = tasks.filter(task => task.priority === 'medium').length;
  const lowPriorityTasks = tasks.filter(task => task.priority === 'low').length;

  // Calculate tasks due this week
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  
  const tasksDueThisWeek = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= today && taskDate <= endOfWeek;
  }).length;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Task Analytics</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              Across all statuses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasksDueThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              Until {format(endOfWeek, 'MMM d, yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium">{pendingTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">In Progress</span>
                <span className="text-sm font-medium">{inProgressTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <span className="text-sm font-medium">{completedTasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">High Priority</span>
                  <span className="text-sm text-muted-foreground">{highPriorityTasks} tasks</span>
                </div>
                <Progress value={(highPriorityTasks / totalTasks) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Medium Priority</span>
                  <span className="text-sm text-muted-foreground">{mediumPriorityTasks} tasks</span>
                </div>
                <Progress value={(mediumPriorityTasks / totalTasks) * 100} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Low Priority</span>
                  <span className="text-sm text-muted-foreground">{lowPriorityTasks} tasks</span>
                </div>
                <Progress value={(lowPriorityTasks / totalTasks) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5)
                .map((task) => (
                  <div key={task.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.updatedAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="text-xs font-medium">{task.status}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 