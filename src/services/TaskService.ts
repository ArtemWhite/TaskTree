import type { Task } from '../types';

export class TaskService {
  public static groupTasksByDate(tasks: Task[], groupBy: 'createdAt' | 'deadline' = 'createdAt'): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {};
    tasks.forEach(t => {
      let dateKey: string;
      if (groupBy === 'deadline') {
        dateKey = t.deadline ? t.deadline.slice(0, 10) : 'Без дедлайна';
      } else {
        dateKey = (t.completedDate || t.createdAt).slice(0, 10);
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }
}
