import type { Category, PomodoroSession, Task } from './task';
import type { Workout } from './workout';
import type { Book } from './book';

export type TreeStage = number; // 0–49 стадий роста

export interface AppSettings {
  pomodoroWorkMinutes: number;
}

export interface AppData {
  tasks: Task[];
  categories: Category[];
  pomodoroHistory: PomodoroSession[];
  settings: AppSettings;
  workouts: Workout[];
  books?: Book[];
}

export interface CompletedDay {
  date: string;
  count: number;
  tasks: Task[];
}

export interface LevelInfo {
  level: number;
  current: number;
  next: number;
}
