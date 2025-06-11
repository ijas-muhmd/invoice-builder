'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  Clock, 
  ListTodo,
  BarChart2,
  Settings
} from "lucide-react";
import { useTasks } from "@/contexts/task-context";

export default function TaskSidebar() {
  const pathname = usePathname();
  const { tasks } = useTasks();

  // Calculate task statistics
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;

  const navigation = [
    {
      name: 'Overview',
      href: '/tasks',
      icon: LayoutDashboard,
      count: totalTasks
    },
    {
      name: 'Today',
      href: '/tasks/today',
      icon: Calendar,
      count: tasks.filter(task => {
        const today = new Date();
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === today.toDateString();
      }).length
    },
    {
      name: 'Pending',
      href: '/tasks/pending',
      icon: Clock,
      count: pendingTasks
    },
    {
      name: 'In Progress',
      href: '/tasks/in-progress',
      icon: ListTodo,
      count: inProgressTasks
    },
    {
      name: 'Completed',
      href: '/tasks/completed',
      icon: CheckSquare,
      count: completedTasks
    },
    {
      name: 'Analytics',
      href: '/tasks/analytics',
      icon: BarChart2
    },
    {
      name: 'Settings',
      href: '/tasks/settings',
      icon: Settings
    }
  ];

  return (
    <div className="fixed top-14 bottom-0 z-40 flex w-72 flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pt-6">
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link href={item.href}>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "w-full justify-start",
                      pathname === item.href && "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                    {item.count !== undefined && (
                      <span className="ml-auto bg-muted px-2 py-0.5 text-xs rounded-full">
                        {item.count}
                      </span>
                    )}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
} 