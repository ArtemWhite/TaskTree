import type { Difficulty, Priority } from './enums';

export interface Category {
  id: string;
  name: string;
  emoji?: string;
  icon?: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  difficulty: Difficulty;
  priority?: Priority;
  xp: number;
  completed: boolean;
  completedDate: string | null;
  pomodoroCount: number;
  createdAt: string;
  deadline: string | null;
  isBackdated?: boolean;
}

export type NewTaskInput = Omit<Task, 'id' | 'completed' | 'completedDate' | 'pomodoroCount' | 'createdAt'> & {
  createdAt?: string;
  completed?: boolean;
  completedDate?: string | null;
};

export interface PomodoroSession {
  id: string;
  taskId: string;
  taskTitle: string;
  completedAt: string;
  xpEarned: number;
  duration?: number;
}
