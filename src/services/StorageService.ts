import type { AppData, AppSettings, Category, WorkoutTypeDef } from '../types';

export class StorageService {
  private static readonly STORAGE_KEY = 'tasktrecker-data';
  private static readonly THEME_KEY = 'tasktrecker-theme';
  private static readonly CUSTOM_TYPES_KEY = 'tasktrecker-custom-workout-types';

  public static readonly DEFAULT_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Работа', emoji: '🧠', color: '#ffffff' },
    { id: 'cat-2', name: 'Учёба', emoji: '📚', color: '#a0a0ff' },
  ];

  public static readonly DEFAULT_SETTINGS: AppSettings = {
    pomodoroWorkMinutes: 25,
  };

  public static loadAppData(): AppData {
    try {
      const raw = localStorage.getItem(StorageService.STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      tasks: [],
      categories: StorageService.DEFAULT_CATEGORIES,
      pomodoroHistory: [],
      settings: StorageService.DEFAULT_SETTINGS,
      workouts: [],
      books: [],
    };
  }

  public static saveAppData(data: AppData): void {
    try {
      localStorage.setItem(StorageService.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save AppData to localStorage', e);
    }
  }

  public static getTheme(): 'dark' | 'light' {
    try {
      const stored = localStorage.getItem(StorageService.THEME_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    return 'dark';
  }

  public static setTheme(theme: 'dark' | 'light'): void {
    try {
      localStorage.setItem(StorageService.THEME_KEY, theme);
      document.documentElement.dataset.theme = theme;
    } catch {}
  }

  public static loadCustomWorkoutTypes(): WorkoutTypeDef[] {
    try {
      const raw = localStorage.getItem(StorageService.CUSTOM_TYPES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
          return (parsed as string[]).map((name: string) => ({ icon: '⭐', name, color: '#3b82c4' }));
        }
        return parsed;
      }
    } catch {}
    return [];
  }

  public static saveCustomWorkoutTypes(types: WorkoutTypeDef[]): void {
    try {
      localStorage.setItem(StorageService.CUSTOM_TYPES_KEY, JSON.stringify(types));
    } catch (e) {
      console.error('Failed to save custom workout types', e);
    }
  }
}
