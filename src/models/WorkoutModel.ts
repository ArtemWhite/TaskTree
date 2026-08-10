import type { Workout, WorkoutTypeDef } from '../types';
import { WorkoutService } from '../services/WorkoutService';

export class WorkoutModel {
  public static getTypeIcon(typeName: string, customDefs?: WorkoutTypeDef[]): string {
    return WorkoutService.getTypeIcon(typeName, customDefs);
  }

  public static getTypeColor(typeName: string, customDefs?: WorkoutTypeDef[]): string {
    return WorkoutService.getTypeColor(typeName, customDefs);
  }

  public static getFormattedDuration(durationMinutes: number): string {
    const hrs = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    if (hrs > 0) {
      return `${hrs} ч ${mins > 0 ? `${mins} мин` : ''}`;
    }
    return `${mins} мин`;
  }

  public static isCompleted(workout: Workout): boolean {
    return !!workout.completed;
  }
}
