import type { Priority, Task } from '../types';

export class TaskModel {
  public static readonly PRIORITY_WEIGHTS: Record<Priority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  public static getPriorityWeight(priority?: Priority): number {
    return TaskModel.PRIORITY_WEIGHTS[priority || 'medium'];
  }

  public static isOverdue(task: Task): boolean {
    if (!task.deadline || task.completed) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(task.deadline);
    return deadlineDate < now;
  }

  public static isDueToday(task: Task): boolean {
    if (!task.deadline || task.completed) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return task.deadline.slice(0, 10) === todayStr;
  }

  public static getDifficultyLabel(difficulty?: 'easy' | 'medium' | 'hard'): { label: string; color: string } {
    switch (difficulty) {
      case 'hard':
        return { label: '🔴 Сложная', color: '#ff6b6b' };
      case 'medium':
        return { label: '🟡 Средняя', color: '#ffd700' };
      case 'easy':
      default:
        return { label: '🟢 Лёгкая', color: '#5aaa6f' };
    }
  }

  public static sortTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const pA = TaskModel.getPriorityWeight(a.priority);
      const pB = TaskModel.getPriorityWeight(b.priority);
      if (pB !== pA) return pB - pA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}
