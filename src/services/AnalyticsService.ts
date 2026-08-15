import type { Category, PomodoroSession, Task, Workout } from '../types';
import type { PopupItem } from '../components/analytics/AnalyticsPopupModal';

export class AnalyticsService {
  public static calculateDailyData(
    tasks: Task[],
    pomodoroHistory: PomodoroSession[],
    workouts: Workout[]
  ) {
    const map: Record<
      string,
      { date: string; tasks: number; xp: number; pomodoro: number; workouts: number; workoutXP: number }
    > = {};

    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = {
        date: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
        tasks: 0,
        xp: 0,
        pomodoro: 0,
        workouts: 0,
        workoutXP: 0,
      };
    }

    tasks.filter(t => t.completed).forEach(t => {
      const dateStr = t.completedDate || t.createdAt;
      const key = dateStr.slice(0, 10);
      if (map[key]) {
        map[key].tasks++;
        map[key].xp += t.xp;
      }
    });

    pomodoroHistory.forEach(p => {
      const dateStr = p.completedAt;
      const key = dateStr.slice(0, 10);
      if (map[key]) {
        map[key].pomodoro++;
      }
    });

    workouts.filter(w => w.completed).forEach(w => {
      const key = w.date;
      if (map[key]) {
        map[key].workouts++;
        map[key].workoutXP += w.xp;
        map[key].xp += w.xp;
      }
    });

    return Object.values(map);
  }

  public static calculateCategoryDistribution(tasks: Task[], categories: Category[]) {
    const map: Record<
      string,
      { name: string; emoji: string; color: string; value: number; xp: number; tasks: PopupItem[] }
    > = {};

    categories.forEach(c => {
      map[c.id] = { name: c.name, emoji: c.emoji ?? '', color: c.color, value: 0, xp: 0, tasks: [] };
    });

    tasks.filter(t => t.completed).forEach(t => {
      if (map[t.categoryId]) {
        map[t.categoryId].value++;
        map[t.categoryId].xp += t.xp;
        map[t.categoryId].tasks.push({
          taskId: t.id,
          title: t.title,
          date: t.completedDate || t.createdAt,
          xp: t.xp,
          pomodoro: t.pomodoroCount || 0,
        });
      }
    });

    return Object.values(map).filter(d => d.value > 0);
  }

  public static calculateSportDurationData(workouts: Workout[]) {
    const map: Record<string, { date: string; duration: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }), duration: 0 };
    }

    workouts.filter(w => w.completed).forEach(w => {
      const key = w.date;
      if (map[key]) map[key].duration += w.duration;
    });

    return Object.values(map);
  }
}
