export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  deadline: Date;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate: Date;
  deadline: Date;
  priority: TaskPriority;
  status: TaskStatus;
} 