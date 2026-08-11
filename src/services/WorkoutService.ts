import type { Workout, WorkoutStats, WorkoutTypeDef } from '../types';
import { StorageService } from './StorageService';

export class WorkoutService {
  public static readonly BUILT_IN_WORKOUT_TYPES: WorkoutTypeDef[] = [
    { icon: '🏃', name: 'Бег', color: '#ff6b6b' },
    { icon: '🏋️', name: 'Силовая', color: '#ff9f43' },
    { icon: '🏊', name: 'Плавание', color: '#54a0ff' },
    { icon: '🚴', name: 'Вело', color: '#5f27cd' },
    { icon: '🧘', name: 'Растяжка', color: '#a29bfe' },
    { icon: '🥊', name: 'Единоборства', color: '#e056a0' },
    { icon: '🎾', name: 'Игровые', color: '#ffd700' },
    { icon: '🏔️', name: 'Поход', color: '#00b894' },
    { icon: '💪', name: 'Фитнес', color: '#e17055' },
    { icon: '⚽', name: 'Футбол', color: '#74b9ff' },
    { icon: '🏀', name: 'Баскетбол', color: '#fd9644' },
    { icon: '📋', name: 'Другое', color: '#b2bec3' },
  ];

  public static getAllWorkoutTypes(customTypes?: WorkoutTypeDef[]): WorkoutTypeDef[] {
    const custom = customTypes || StorageService.loadCustomWorkoutTypes();
    return [...WorkoutService.BUILT_IN_WORKOUT_TYPES, ...custom];
  }

  public static getTypeIcon(typeName: string, customDefs?: WorkoutTypeDef[]): string {
    const list = customDefs || WorkoutService.getAllWorkoutTypes();
    const found = list.find(t => t.name === typeName);
    return found ? found.icon : '⚡';
  }

  public static getTypeColor(typeName: string, customDefs?: WorkoutTypeDef[]): string {
    const list = customDefs || WorkoutService.getAllWorkoutTypes();
    const found = list.find(t => t.name === typeName);
    return found ? found.color : '#3b82c4';
  }

  public static calculateWorkoutStats(workouts: Workout[]): WorkoutStats {
    const completedWorkouts = workouts.filter(w => w.completed);
    return {
      total: workouts.length,
      completed: completedWorkouts.length,
      totalDuration: completedWorkouts.reduce((sum, w) => sum + w.duration, 0),
      totalXP: completedWorkouts.reduce((sum, w) => sum + w.xp, 0),
    };
  }
}
