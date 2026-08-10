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
  priority?: 'low' | 'medium' | 'high';
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
  workouts: Workout[];
  books?: Book[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  readPages: number;
  status: 'reading' | 'completed' | 'planned';
  rating: number; // 0 to 5
  review: string;
  createdAt: string;
  completedAt: string | null;
  xp: number;
}

export interface Workout {
  id: string;
  date: string;
  title: string;
  workoutType: string;
  duration: number;
  notes: string;
  completed: boolean;
  xp: number;
  createdAt: string;
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
