export interface WorkoutTypeDef {
  icon: string;
  name: string;
  color: string;
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

export interface WorkoutStats {
  total: number;
  completed: number;
  totalDuration: number;
  totalXP: number;
}
