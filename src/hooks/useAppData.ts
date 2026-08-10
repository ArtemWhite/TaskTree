import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Task, Category, AppData, CompletedDay, Workout, Book } from '../types';
import { AppDataManager } from '../services/AppDataManager';
import { XPService } from '../services/XPService';

export function useAppData() {
  const [data, setData] = useState<AppData>(AppDataManager.load);

  useEffect(() => {
    AppDataManager.save(data);
  }, [data]);

  const totalXP = useMemo(() => XPService.calculateTotalXP(data), [data]);
  const levelInfo = useMemo(() => XPService.getLevelInfo(totalXP), [totalXP]);
  const treeStage = useMemo(() => XPService.getTreeStage(levelInfo.level), [levelInfo.level]);

  // Tasks CRUD
  const addTask = useCallback((task: Omit<Task, 'id' | 'completed' | 'completedDate' | 'pomodoroCount' | 'createdAt'>) => {
    setData(d => AppDataManager.addTask(d, task));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setData(d => AppDataManager.updateTask(d, id, updates));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData(d => AppDataManager.deleteTask(d, id));
  }, []);

  const completeTask = useCallback((id: string) => {
    setData(d => AppDataManager.completeTask(d, id));
  }, []);

  const uncompleteTask = useCallback((id: string) => {
    setData(d => AppDataManager.uncompleteTask(d, id));
  }, []);

  // Categories CRUD
  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setData(d => AppDataManager.addCategory(d, cat));
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setData(d => AppDataManager.updateCategory(d, id, updates));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData(d => AppDataManager.deleteCategory(d, id));
  }, []);

  // Pomodoro
  const completePomodoro = useCallback((taskId: string, xpEarned: number) => {
    setData(d => AppDataManager.completePomodoro(d, taskId, xpEarned));
  }, []);

  // Workouts CRUD
  const addWorkout = useCallback((workout: Omit<Workout, 'id' | 'createdAt'>) => {
    setData(d => AppDataManager.addWorkout(d, workout));
  }, []);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    setData(d => AppDataManager.updateWorkout(d, id, updates));
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setData(d => AppDataManager.deleteWorkout(d, id));
  }, []);

  const completeWorkout = useCallback((id: string) => {
    setData(d => AppDataManager.completeWorkout(d, id));
  }, []);

  const uncompleteWorkout = useCallback((id: string) => {
    setData(d => AppDataManager.uncompleteWorkout(d, id));
  }, []);

  const renameWorkoutType = useCallback((oldName: string, newName: string) => {
    setData(d => AppDataManager.renameWorkoutType(d, oldName, newName));
  }, []);

  // Books CRUD
  const addBook = useCallback((book: Omit<Book, 'id' | 'createdAt' | 'completedAt' | 'xp'>) => {
    setData(d => AppDataManager.addBook(d, book));
  }, []);

  const updateBook = useCallback((id: string, updates: Partial<Book>) => {
    setData(d => AppDataManager.updateBook(d, id, updates));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setData(d => AppDataManager.deleteBook(d, id));
  }, []);

  // Data Import
  const importData = useCallback((json: string): boolean => {
    const parsed = AppDataManager.parseImport(json);
    if (parsed) {
      setData(parsed);
      return true;
    }
    return false;
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
