import { useMemo } from 'react';
import type { PomodoroSession } from '../../types';
import { formatXP } from '../../utils/formatUtils';

interface Props {
  pomodoroHistory: PomodoroSession[];
  onSelectTaskSessions: (title: string, sessions: PomodoroSession[]) => void;
}

export default function PomodoroStatsTable({ pomodoroHistory, onSelectTaskSessions }: Props) {
  const pomodoroByTask = useMemo(() => {
    const map: Record<string, { taskId: string; title: string; count: number; totalDuration: number; totalXP: number; sessions: PomodoroSession[] }> = {};
    pomodoroHistory.forEach(p => {
      const dur = p.duration || 25;
      if (!map[p.taskId]) {
        map[p.taskId] = { taskId: p.taskId, title: p.taskTitle, count: 0, totalDuration: 0, totalXP: 0, sessions: [] };
      }
      map[p.taskId].count++;
      map[p.taskId].totalDuration += dur;
      map[p.taskId].totalXP += p.xpEarned;
      map[p.taskId].sessions.push(p);
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [pomodoroHistory]);

  const totalPomodoroMinutes = useMemo(() => {
    return pomodoroHistory.reduce((s, p) => s + (p.duration || 25), 0);
  }, [pomodoroHistory]);

  return (
    <div className="card-panel" style={{ overflowX: 'auto' }}>
      <h3 className="micro-cap" style={{ marginBottom: '16px' }}>СТАТИСТИКА ПОМОДОРО</h3>
      {pomodoroByTask.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>История сессий пока пуста</p>
      ) : (
        <table className="table-spacex">
          <thead>
            <tr>
              <th>Задача</th>
              <th>Сессии (кол-во)</th>
              <th>Общее время</th>
              <th>Заработано XP</th>
            </tr>
          </thead>
          <tbody>
            {pomodoroByTask.map((p, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{p.title}</td>
                <td>
                  <span
                    style={{
                      cursor: 'pointer',
                      color: '#ffb7c5',
                      fontWeight: 600,
                      background: 'rgba(255, 183, 197, 0.12)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 183, 197, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => onSelectTaskSessions(p.title, p.sessions)}
                    title="Нажмите, чтобы просмотреть историю помодоро"
                  >
                    🍅 ×{p.count}
                  </span>
                </td>
                <td>⏱ {p.totalDuration} мин</td>
                <td>{formatXP(p.totalXP)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--hairline)' }}>
              <td style={{ fontWeight: 700 }}>ИТОГО</td>
              <td style={{ fontWeight: 700 }}>
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#ffb7c5',
                    fontWeight: 700,
                    background: 'rgba(255, 183, 197, 0.16)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 183, 197, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => onSelectTaskSessions('Все задачи', pomodoroHistory)}
                  title="Нажмите, чтобы просмотреть все сессии"
                >
                  🍅 ×{pomodoroHistory.length}
                </span>
              </td>
              <td style={{ fontWeight: 700 }}>⏱ {totalPomodoroMinutes} мин</td>
              <td style={{ fontWeight: 700 }}>{formatXP(pomodoroHistory.reduce((s, p) => s + p.xpEarned, 0))}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
