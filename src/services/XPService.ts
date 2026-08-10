import type { AppData, Difficulty, LevelInfo, TreeStage } from '../types';

export class XPService {
  private static readonly LEVEL_THRESHOLDS = XPService.generateLevelThresholds();

  private static generateLevelThresholds(): number[] {
    const thresholds: number[] = [];
    let threshold = 0;
    let step = 100;
    for (let i = 0; i < 50; i++) {
      thresholds.push(threshold);
      threshold += step;
      step = Math.round(step * 1.2);
    }
    return thresholds;
  }

  public static getTaskXP(difficulty: Difficulty): number {
    switch (difficulty) {
      case 'hard': return 35;
      case 'medium': return 20;
      case 'easy':
      default: return 10;
    }
  }

  public static getLevelInfo(totalXP: number): LevelInfo {
    if (totalXP === 0) return { current: 0, next: 100, level: 1 };
    for (let i = 0; i < XPService.LEVEL_THRESHOLDS.length - 1; i++) {
      if (totalXP < XPService.LEVEL_THRESHOLDS[i + 1]) {
        return {
          level: i + 1,
          current: totalXP - XPService.LEVEL_THRESHOLDS[i],
          next: XPService.LEVEL_THRESHOLDS[i + 1] - XPService.LEVEL_THRESHOLDS[i]
        };
      }
    }
    const lvl = XPService.LEVEL_THRESHOLDS.length;
    return { level: lvl, current: 0, next: 0 };
  }

  public static getTreeStage(level: number): TreeStage {
    return Math.min(level - 1, 49);
  }

  public static calculateTotalXP(data: AppData): number {
    const taskXP = data.tasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0);
    const pomoXP = data.pomodoroHistory.reduce((s, p) => s + p.xpEarned, 0);
    const workoutXP = (data.workouts || []).filter(w => w.completed).reduce((s, w) => s + w.xp, 0);
    const bookXP = (data.books || []).filter(b => b.status === 'completed').reduce((s, b) => s + b.xp, 0);
    return taskXP + pomoXP + workoutXP + bookXP;
  }
}
