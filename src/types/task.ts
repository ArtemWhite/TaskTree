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
}

export interface PomodoroSession {
  id: string;
  taskId: string;
  taskTitle: string;
  completedAt: string;
  xpEarned: number;
}
