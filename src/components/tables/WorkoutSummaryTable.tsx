import { useMemo } from 'react';
import type { Workout } from '../../types';
import { WorkoutService } from '../../services/WorkoutService';

interface Props {
  workouts: Workout[];
}

export default function WorkoutSummaryTable({ workouts }: Props) {
  const workoutStats = useMemo(() => {
    const map: Record<string, { name: string; icon: string; color: string; total: number; completed: number; duration: number; xp: number }> = {};
    workouts.forEach(w => {
      if (!map[w.workoutType]) {
        map[w.workoutType] = {
          name: w.workoutType,
          icon: WorkoutService.getTypeIcon(w.workoutType),
          color: WorkoutService.getTypeColor(w.workoutType),
          total: 0,
          completed: 0,
          duration: 0,
          xp: 0,
        };
      }
      map[w.workoutType].total++;
      if (w.completed) {
        map[w.workoutType].completed++;
        map[w.workoutType].duration += w.duration;
        map[w.workoutType].xp += w.xp;
      }
    });
    return Object.values(map).sort((a, b) => b.completed - a.completed);
  }, [workouts]);

  return (
    <div className="card-panel" style={{ overflowX: 'auto' }}>
      <h3 className="micro-cap" style={{ marginBottom: '16px' }}>СВОДКА ПО ТРЕНИРОВКАМ</h3>
      {workoutStats.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Тренировок пока нет</p>
      ) : (
        <table className="table-spacex">
          <thead>
            <tr>
              <th>Тип тренировки</th>
              <th>Всего создано</th>
              <th>Выполнено</th>
              <th>Общая длительность</th>
              <th>Заработано XP</th>
            </tr>
          </thead>
          <tbody>
            {workoutStats.map(w => (
              <tr key={w.name}>
                <td style={{ fontWeight: 600 }}>{w.icon} {w.name}</td>
                <td>{w.total}</td>
                <td>{w.completed}</td>
                <td>⏱ {w.duration} мин</td>
                <td>+{w.xp} XP</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--hairline)' }}>
              <td style={{ fontWeight: 700 }}>ИТОГО</td>
              <td style={{ fontWeight: 700 }}>{workouts.length}</td>
              <td style={{ fontWeight: 700 }}>{workouts.filter(w => w.completed).length}</td>
              <td style={{ fontWeight: 700 }}>⏱ {workouts.filter(w => w.completed).reduce((s, w) => s + w.duration, 0)} мин</td>
              <td style={{ fontWeight: 700 }}>+{workouts.filter(w => w.completed).reduce((s, w) => s + w.xp, 0)} XP</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
