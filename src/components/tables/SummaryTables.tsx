import { useMemo, useState } from 'react';
import type { Task, Category, PomodoroSession, Workout } from '../../types';
import { WorkoutService } from '../../services/WorkoutService';

interface Props {
  tasks: Task[];
  categories: Category[];
  pomodoroHistory: PomodoroSession[];
  workouts: Workout[];
}

export default function SummaryTables({ tasks, categories, pomodoroHistory, workouts }: Props) {
  const [activeTable, setActiveTable] = useState('tasks');

  const taskStats = useMemo(() => {
    const activeByCat: Record<string, { count: number; easy: number; medium: number; hard: number; totalXP: number }> = {};
    const completedByCat: Record<string, { count: number; xp: number }> = {};

    categories.forEach(c => {
      activeByCat[c.id] = { count: 0, easy: 0, medium: 0, hard: 0, totalXP: 0 };
      completedByCat[c.id] = { count: 0, xp: 0 };
    });

    tasks.forEach(t => {
      if (!t.completed && activeByCat[t.categoryId]) {
        activeByCat[t.categoryId].count++;
        activeByCat[t.categoryId][t.difficulty]++;
        activeByCat[t.categoryId].totalXP += t.xp;
      }
      if (t.completed && completedByCat[t.categoryId]) {
        completedByCat[t.categoryId].count++;
        completedByCat[t.categoryId].xp += t.xp;
      }
    });

    return { activeByCat, completedByCat };
  }, [tasks, categories]);

  const pomodoroByTask = useMemo(() => {
    const map: Record<string, { title: string; count: number; totalXP: number }> = {};
    pomodoroHistory.forEach(p => {
      if (!map[p.taskId]) map[p.taskId] = { title: p.taskTitle, count: 0, totalXP: 0 };
      map[p.taskId].count++;
      map[p.taskId].totalXP += p.xpEarned;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [pomodoroHistory]);

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
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>СВОДНЫЕ ТАБЛИЦЫ</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid var(--hairline)' }}>
        {(['tasks','categories','pomodoro','difficulty','workouts'] as const).map(t => (
          <button key={t} className={`tab-btn ${activeTable === t ? 'active' : ''}`} onClick={() => setActiveTable(t)}>
            {t === 'tasks' ? 'ЗАДАЧИ' : t === 'categories' ? 'КАТЕГОРИИ' : t === 'pomodoro' ? 'ПОМОДОРО' : t === 'difficulty' ? 'СЛОЖНОСТЬ' : 'ТРЕНИРОВКИ'}
          </button>
        ))}
      </div>

      {activeTable === 'tasks' && (
        <div className="card-panel" style={{ overflowX: 'auto' }}>
          <h3 className="micro-cap" style={{ marginBottom: '16px' }}>СВОДКА ПО ЗАДАЧАМ</h3>
          <table className="table-spacex">
            <thead>
              <tr>
                <th>Категория</th>
                <th>Активные (всего)</th>
                <th>Лёгкие</th>
                <th>Средние</th>
                <th>Сложные</th>
                <th>Потенциальный XP</th>
                <th>Выполнено</th>
                <th>Заработано XP</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => {
                const a = taskStats.activeByCat[c.id];
                const d = taskStats.completedByCat[c.id];
                return (
                  <tr key={c.id}>
                    <td>{c.emoji} {c.name}</td>
                    <td>{a?.count || 0}</td>
                    <td>{a?.easy || 0}</td>
                    <td>{a?.medium || 0}</td>
                    <td>{a?.hard || 0}</td>
                    <td>+{a?.totalXP || 0} XP</td>
                    <td>{d?.count || 0}</td>
                    <td>+{d?.xp || 0} XP</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--hairline)' }}>
                <td style={{ fontWeight: 700 }}>ИТОГО</td>
                <td style={{ fontWeight: 700 }}>{tasks.filter(t => !t.completed).length}</td>
                <td>{tasks.filter(t => !t.completed && t.difficulty === 'easy').length}</td>
                <td>{tasks.filter(t => !t.completed && t.difficulty === 'medium').length}</td>
                <td>{tasks.filter(t => !t.completed && t.difficulty === 'hard').length}</td>
                <td>+{tasks.filter(t => !t.completed).reduce((s, t) => s + t.xp, 0)} XP</td>
                <td style={{ fontWeight: 700 }}>{tasks.filter(t => t.completed).length}</td>
                <td>+{tasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0)} XP</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {activeTable === 'categories' && (
        <div className="card-panel" style={{ overflowX: 'auto' }}>
          <h3 className="micro-cap" style={{ marginBottom: '16px' }}>ДЕТАЛИЗАЦИЯ ПО КАТЕГОРИЯМ</h3>
          <table className="table-spacex">
            <thead>
              <tr>
                <th>Иконка</th>
                <th>Название</th>
                <th>Всего задач</th>
                <th>Активных</th>
                <th>Выполнено</th>
                <th>Процент выполнения</th>
                <th>Всего XP</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => {
                const total = tasks.filter(t => t.categoryId === c.id).length;
                const active = tasks.filter(t => t.categoryId === c.id && !t.completed).length;
                const done = tasks.filter(t => t.categoryId === c.id && t.completed).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const xp = tasks.filter(t => t.categoryId === c.id && t.completed).reduce((s, t) => s + t.xp, 0);

                return (
                  <tr key={c.id}>
                    <td style={{ fontSize: '20px' }}>{c.emoji}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{total}</td>
                    <td>{active}</td>
                    <td>{done}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar" style={{ flex: 1, height: '4px' }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span style={{ fontSize: '11px' }}>{pct}%</span>
                      </div>
                    </td>
                    <td>+{xp} XP</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTable === 'pomodoro' && (
        <div className="card-panel" style={{ overflowX: 'auto' }}>
          <h3 className="micro-cap" style={{ marginBottom: '16px' }}>СТАТИСТИКА ПОМОДОРО</h3>
          {pomodoroByTask.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>История сессий пока пуста</p>
          ) : (
            <table className="table-spacex">
              <thead>
                <tr>
                  <th>Задача</th>
                  <th>Сессий (по 25 мин)</th>
                  <th>Общее время</th>
                  <th>Заработано XP</th>
                </tr>
              </thead>
              <tbody>
                {pomodoroByTask.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.title}</td>
                    <td>🍅 ×{p.count}</td>
                    <td>⏱ {p.count * 25} мин</td>
                    <td>+{p.totalXP} XP</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--hairline)' }}>
                  <td style={{ fontWeight: 700 }}>ИТОГО</td>
                  <td style={{ fontWeight: 700 }}>🍅 ×{pomodoroHistory.length}</td>
                  <td style={{ fontWeight: 700 }}>⏱ {pomodoroHistory.length * 25} мин</td>
                  <td style={{ fontWeight: 700 }}>+{pomodoroHistory.reduce((s, p) => s + p.xpEarned, 0)} XP</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      )}

      {activeTable === 'difficulty' && (
        <div className="card-panel" style={{ overflowX: 'auto' }}>
          <h3 className="micro-cap" style={{ marginBottom: '16px' }}>РАСПРЕДЕЛЕНИЕ ПО СЛОЖНОСТИ</h3>
          <table className="table-spacex">
            <thead>
              <tr>
                <th>Сложность</th>
                <th>Опыт (XP)</th>
                <th>Активных</th>
                <th>Выполнено</th>
                <th>Всего</th>
                <th>Заработано XP</th>
              </tr>
            </thead>
            <tbody>
              {(['easy', 'medium', 'hard'] as const).map(diff => {
                const label = diff === 'easy' ? '🟢 Лёгкая' : diff === 'medium' ? '🟡 Средняя' : '🔴 Сложная';
                const xpVal = diff === 'easy' ? 20 : diff === 'medium' ? 50 : 100;
                const active = tasks.filter(t => !t.completed && t.difficulty === diff).length;
                const done = tasks.filter(t => t.completed && t.difficulty === diff).length;
                const total = active + done;
                const earnedXP = done * xpVal;

                return (
                  <tr key={diff}>
                    <td style={{ fontWeight: 600 }}>{label}</td>
                    <td>{xpVal} XP</td>
                    <td>{active}</td>
                    <td>{done}</td>
                    <td>{total}</td>
                    <td>+{earnedXP} XP</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTable === 'workouts' && (
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
      )}
    </section>
  );
}
