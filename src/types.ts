export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  categoryId: string;
  difficulty: Difficulty;
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

export type TreeStage = number; // 0–49 стадий роста

export interface AppData {
  tasks: Task[];
  categories: Category[];
  pomodoroHistory: PomodoroSession[];
  settings: AppSettings;
}

export interface AppSettings {
  pomodoroWorkMinutes: number;
  pomodoroBonusXP: number;
}

export interface CompletedDay {
  date: string;
  count: number;
  tasks: Task[];
}

export type ChartType = 'line' | 'bar' | 'area' | 'dot';
