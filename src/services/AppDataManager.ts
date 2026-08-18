import type { Task, Category, AppData, PomodoroSession, Workout, Book, NewTaskInput } from '../types';
import { StorageService } from './StorageService';
import { BookModel } from '../models/BookModel';
import { generateId } from '../utils/id';

export class AppDataManager {
  public static load(): AppData {
    return StorageService.loadAppData();
  }

  public static save(data: AppData): void {
    StorageService.saveAppData(data);
  }

  // Tasks
  public static addTask(data: AppData, task: NewTaskInput): AppData {
    const newTask: Task = {
      ...task,
      id: generateId(),
      completed: task.completed ?? false,
      completedDate: task.completedDate ?? null,
      pomodoroCount: 0,
      createdAt: task.createdAt || new Date().toISOString(),
      deadline: task.deadline || null
    };
    return { ...data, tasks: [...data.tasks, newTask] };
  }

  public static updateTask(data: AppData, id: string, updates: Partial<Task>): AppData {
    return { ...data, tasks: data.tasks.map(t => t.id === id ? { ...t, ...updates } : t) };
  }

  public static deleteTask(data: AppData, id: string): AppData {
    return { ...data, tasks: data.tasks.filter(t => t.id !== id) };
  }

  public static completeTask(data: AppData, id: string): AppData {
    return {
      ...data,
      tasks: data.tasks.map(t => t.id === id ? { ...t, completed: true, completedDate: new Date().toISOString() } : t)
    };
  }

  public static uncompleteTask(data: AppData, id: string): AppData {
    return {
      ...data,
      tasks: data.tasks.map(t => t.id === id ? { ...t, completed: false, completedDate: null } : t)
    };
  }

  // Categories
  public static addCategory(data: AppData, cat: Omit<Category, 'id'>): AppData {
    const newCat: Category = { ...cat, id: 'cat-' + generateId() };
    return { ...data, categories: [...data.categories, newCat] };
  }

  public static updateCategory(data: AppData, id: string, updates: Partial<Category>): AppData {
    return { ...data, categories: data.categories.map(c => c.id === id ? { ...c, ...updates } : c) };
  }

  public static deleteCategory(data: AppData, id: string): AppData {
    const fallbackCatId = data.categories[0]?.id || '';
    return {
      ...data,
      categories: data.categories.filter(c => c.id !== id),
      tasks: data.tasks.map(t => t.categoryId === id ? { ...t, categoryId: fallbackCatId } : t)
    };
  }

  // Pomodoro
  public static completePomodoro(data: AppData, taskId: string, xpEarned: number, duration: number): AppData {
    const task = data.tasks.find(t => t.id === taskId);
    const taskTitle = task ? task.title : 'Задача';
    const newSession: PomodoroSession = {
      id: generateId(),
      taskId,
      taskTitle,
      completedAt: new Date().toISOString(),
      xpEarned,
      duration
    };
    return {
      ...data,
      pomodoroHistory: [...data.pomodoroHistory, newSession],
      tasks: data.tasks.map(t => t.id === taskId ? { ...t, pomodoroCount: (t.pomodoroCount || 0) + 1 } : t)
    };
  }

  // Workouts
  public static addWorkout(data: AppData, workout: Omit<Workout, 'id' | 'createdAt'>): AppData {
    const newW: Workout = {
      ...workout,
      id: 'w-' + generateId(),
      createdAt: new Date().toISOString()
    };
    return { ...data, workouts: [...(data.workouts || []), newW] };
  }

  public static updateWorkout(data: AppData, id: string, updates: Partial<Workout>): AppData {
    return { ...data, workouts: (data.workouts || []).map(w => w.id === id ? { ...w, ...updates } : w) };
  }

  public static deleteWorkout(data: AppData, id: string): AppData {
    return { ...data, workouts: (data.workouts || []).filter(w => w.id !== id) };
  }

  public static completeWorkout(data: AppData, id: string): AppData {
    return { ...data, workouts: (data.workouts || []).map(w => w.id === id ? { ...w, completed: true } : w) };
  }

  public static uncompleteWorkout(data: AppData, id: string): AppData {
    return { ...data, workouts: (data.workouts || []).map(w => w.id === id ? { ...w, completed: false } : w) };
  }

  public static renameWorkoutType(data: AppData, oldName: string, newName: string): AppData {
    return {
      ...data,
      workouts: (data.workouts || []).map(w => w.workoutType === oldName ? { ...w, workoutType: newName } : w)
    };
  }

  // Books
  public static addBook(data: AppData, book: Omit<Book, 'id' | 'createdAt' | 'completedAt' | 'xp'>): AppData {
    const xpEarned = BookModel.calculateXP(book.totalPages, book.status);
    const newB: Book = {
      ...book,
      id: 'b-' + generateId(),
      createdAt: new Date().toISOString(),
      completedAt: book.status === 'completed' ? new Date().toISOString() : null,
      xp: xpEarned
    };
    return { ...data, books: [...(data.books || []), newB] };
  }

  public static updateBook(data: AppData, id: string, updates: Partial<Book>): AppData {
    return {
      ...data,
      books: (data.books || []).map(b => b.id === id ? BookModel.updateBookState(b, updates) : b)
    };
  }

  public static deleteBook(data: AppData, id: string): AppData {
    return { ...data, books: (data.books || []).filter(b => b.id !== id) };
  }

  public static parseImport(json: string): AppData | null {
    try {
      const newData: AppData = JSON.parse(json);
      return {
        tasks: newData.tasks || [],
        categories: newData.categories || StorageService.DEFAULT_CATEGORIES,
        pomodoroHistory: newData.pomodoroHistory || [],
        settings: newData.settings || StorageService.DEFAULT_SETTINGS,
        workouts: newData.workouts || [],
        books: newData.books || []
      };
    } catch {
      return null;
    }
  }
}
