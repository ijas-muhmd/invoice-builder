export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
} 