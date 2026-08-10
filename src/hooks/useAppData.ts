import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, Category, AppData, PomodoroSession, CompletedDay, Workout, Book } from '../types';
import { StorageService } from '../services/StorageService';
import { XPService } from '../services/XPService';
import { TaskService } from '../services/TaskService';

export function useAppData() {
  const [data, setData] = useState<AppData>(StorageService.loadAppData);

  useEffect(() => {
    StorageService.saveAppData(data);
  }, [data]);

  const totalXP = useMemo(() => XPService.calculateTotalXP(data), [data]);
  const levelInfo = useMemo(() => XPService.getLevelInfo(totalXP), [totalXP]);
  const treeStage = useMemo(() => XPService.getTreeStage(levelInfo.level), [levelInfo.level]);

  // Tasks CRUD
  const addTask = useCallback((task: Omit<Task, 'id' | 'completed' | 'completedDate' | 'pomodoroCount' | 'createdAt'>) => {
    const newTask: Task = {
      ...task, id: TaskService.generateId(), completed: false,
      completedDate: null, pomodoroCount: 0, createdAt: new Date().toISOString(), deadline: task.deadline || null
    };
    setData(d => ({ ...d, tasks: [...d.tasks, newTask] }));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
  }, []);

  const completeTask = useCallback((id: string) => {
    setData(d => ({
      ...d, tasks: d.tasks.map(t =>
        t.id === id ? { ...t, completed: true, completedDate: new Date().toISOString() } : t
      )
    }));
  }, []);

  const uncompleteTask = useCallback((id: string) => {
    setData(d => ({
      ...d, tasks: d.tasks.map(t =>
        t.id === id ? { ...t, completed: false, completedDate: null } : t
      )
    }));
  }, []);

  // Categories CRUD
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const newCat: Category = { ...cat, id: 'cat-' + TaskService.generateId() };
    setData(d => ({ ...d, categories: [...d.categories, newCat] }));
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setData(d => ({ ...d, categories: d.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData(d => ({
      ...d,
      categories: d.categories.filter(c => c.id !== id),
      tasks: d.tasks.map(t => t.categoryId === id ? { ...t, categoryId: d.categories[0]?.id || '' } : t)
    }));
  }, []);

  // Pomodoro
  const completePomodoro = useCallback((taskId: string, xpEarned: number) => {
    setData(d => {
      const task = d.tasks.find(t => t.id === taskId);
      const taskTitle = task ? task.title : 'Задача';
      const newSession: PomodoroSession = {
        id: TaskService.generateId(), taskId, taskTitle,
        completedAt: new Date().toISOString(), xpEarned
      };
      return {
        ...d,
        pomodoroHistory: [...d.pomodoroHistory, newSession],
        tasks: d.tasks.map(t => t.id === taskId ? { ...t, pomodoroCount: (t.pomodoroCount || 0) + 1 } : t)
      };
    });
  }, []);

  // Workouts CRUD
  const addWorkout = useCallback((workout: Omit<Workout, 'id' | 'createdAt'>) => {
    const newW: Workout = {
      ...workout, id: 'w-' + TaskService.generateId(), createdAt: new Date().toISOString()
    };
    setData(d => ({ ...d, workouts: [...(d.workouts || []), newW] }));
  }, []);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    setData(d => ({ ...d, workouts: (d.workouts || []).map(w => w.id === id ? { ...w, ...updates } : w) }));
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setData(d => ({ ...d, workouts: (d.workouts || []).filter(w => w.id !== id) }));
  }, []);

  const completeWorkout = useCallback((id: string) => {
    setData(d => ({
      ...d, workouts: (d.workouts || []).map(w => w.id === id ? { ...w, completed: true } : w)
    }));
  }, []);

  const uncompleteWorkout = useCallback((id: string) => {
    setData(d => ({
      ...d, workouts: (d.workouts || []).map(w => w.id === id ? { ...w, completed: false } : w)
    }));
  }, []);

  const renameWorkoutType = useCallback((oldName: string, newName: string) => {
    setData(d => ({
      ...d,
      workouts: (d.workouts || []).map(w => w.workoutType === oldName ? { ...w, workoutType: newName } : w)
    }));
  }, []);

  // Books CRUD
  const addBook = useCallback((book: Omit<Book, 'id' | 'createdAt' | 'completedAt' | 'xp'>) => {
    const xpEarned = book.status === 'completed' ? Math.round(book.totalPages * 0.5) : 0;
    const newB: Book = {
      ...book,
      id: 'b-' + TaskService.generateId(),
      createdAt: new Date().toISOString(),
      completedAt: book.status === 'completed' ? new Date().toISOString() : null,
      xp: xpEarned
    };
    setData(d => ({ ...d, books: [...(d.books || []), newB] }));
  }, []);

  const updateBook = useCallback((id: string, updates: Partial<Book>) => {
    setData(d => ({
      ...d,
      books: (d.books || []).map(b => {
        if (b.id !== id) return b;
        const nextStatus = updates.status !== undefined ? updates.status : b.status;
        const nextPages = updates.totalPages !== undefined ? updates.totalPages : b.totalPages;
        const wasCompleted = b.status === 'completed';
        const isCompleted = nextStatus === 'completed';
        let xp = b.xp;
        let completedAt = b.completedAt;
        if (!wasCompleted && isCompleted) {
          xp = Math.round(nextPages * 0.5);
          completedAt = new Date().toISOString();
        } else if (wasCompleted && !isCompleted) {
          xp = 0;
          completedAt = null;
        } else if (isCompleted && updates.totalPages !== undefined) {
          xp = Math.round(nextPages * 0.5);
        }
        return { ...b, ...updates, xp, completedAt };
      })
    }));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setData(d => ({ ...d, books: (d.books || []).filter(b => b.id !== id) }));
  }, []);

  // Data Import
  const importData = useCallback((json: string): boolean => {
    try {
      const newData: AppData = JSON.parse(json);
      setData({
        tasks: newData.tasks || [],
        categories: newData.categories || StorageService.DEFAULT_CATEGORIES,
        pomodoroHistory: newData.pomodoroHistory || [],
        settings: newData.settings || StorageService.DEFAULT_SETTINGS,
        workouts: newData.workouts || [],
        books: newData.books || []
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const activeTasks = useMemo(() => data.tasks.filter(t => !t.completed), [data.tasks]);
  const completedTasks = useMemo(() => data.tasks.filter(t => t.completed), [data.tasks]);

  const completedDays = useMemo(() => {
    const map: Record<string, { count: number; tasks: Task[] }> = {};
    completedTasks.forEach(t => {
      const dateKey = (t.completedDate || t.createdAt).slice(0, 10);
      if (!map[dateKey]) map[dateKey] = { count: 0, tasks: [] };
      map[dateKey].count++;
      map[dateKey].tasks.push(t);
    });
    return Object.entries(map).map(([date, { count, tasks }]): CompletedDay => ({ date, count, tasks }));
  }, [completedTasks]);

  const updateSettings = useCallback((s: Partial<AppData['settings']>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...s } }));
  }, []);

  return {
    data,
    setData,
    totalXP,
    levelInfo,
    treeStage,
    activeTasks,
    completedTasks,
    completedDays,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    addCategory,
    updateCategory,
    deleteCategory,
    completePomodoro,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    completeWorkout,
    uncompleteWorkout,
    renameWorkoutType,
    addBook,
    updateBook,
    deleteBook,
    importData,
    updateSettings,
  };
}
