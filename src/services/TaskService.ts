import type { Priority, Task } from '../types';

export class TaskService {
  public static readonly PRIORITY_WEIGHTS: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  public static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  public static sortTasksByPriorityAndDate(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const pA = TaskService.PRIORITY_WEIGHTS[a.priority || 'medium'];
      const pB = TaskService.PRIORITY_WEIGHTS[b.priority || 'medium'];
      if (pB !== pA) return pB - pA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public static groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {};
    tasks.forEach(t => {
      const dateKey = (t.completedDate || t.createdAt).slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return groups;
  }
}
