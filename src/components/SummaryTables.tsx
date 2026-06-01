import { useMemo, useState } from 'react';
import type { Task, Category, PomodoroSession } from '../types';

interface Props {
  tasks: Task[];
  categories: Category[];
  pomodoroHistory: PomodoroSession[];
}

export default function SummaryTables({ tasks, categories, pomodoroHistory }: Props) {
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

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>СВОДНЫЕ ТАБЛИЦЫ</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid var(--hairline)' }}>
        {(['tasks','categories','pomodoro','difficulty'] as const).map(t => (
          <button key={t} className={`tab-btn ${activeTable === t ? 'active' : ''}`} onClick={() => setActiveTable(t)}>
            {t === 'tasks' ? 'ЗАДАЧИ' : t === 'categories' ? 'КАТЕГОРИИ' : t === 'pomodoro' ? 'ПОМОДОРО' : 'СЛОЖНОСТЬ'}
          </button>
        ))}
      </div>

      {/* Task summary table */}
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
                    <td>{a.count}</td>
                    <td>{a.easy}</td>
                    <td>{a.medium}</td>
                    <td>{a.hard}</td>
                    <td>+{a.totalXP} XP</td>
                    <td>{d.count}</td>
                    <td>+{d.xp} XP</td>
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

      {/* Category stats table */}
      {activeTable === 'categories' && (
        <div className="card-panel" style={{ overflowX: 'auto' }}>
          <h3 className="micro-cap" style={{ marginBottom: '16px' }}>СТАТИСТИКА ПО КАТЕГОРИЯМ</h3>
          <table className="table-spacex">
            <thead>
              <tr>
                <th>Категория</th>
                <th>Эмодзи</th>
                <th>Цвет</th>
                <th>Всего задач</th>
                <th>Выполнено</th>
                <th>% выполнения</th>
                <th>Всего XP</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => {
                const total = tasks.filter(t => t.categoryId === c.id).length;
                const done = tasks.filter(t => t.categoryId === c.id && t.completed).length;
                const xp = tasks.filter(t => t.categoryId === c.id && t.completed).reduce((s, t) => s + t.xp, 0);
                return (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td style={{ fontSize: '20px' }}>{c.emoji}</td>
                    <td><span style={{ display: 'inline-block', width: '16px', height: '16px', borderRadius: '4px', background: c.color, border: '1px solid var(--hairline)' }} /></td>
                    <td>{total}</td>
                    <td>{done}</td>
                    <td>{total > 0 ? Math.round((done / total) * 100) : 0}%</td>
                    <td>+{xp} XP</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pomodoro history table */}
      {activeTable === 'pomodoro' && (
        <div className="card-panel" style={{ overflowX: 'auto' }}>
          <h3 className="micro-cap" style={{ marginBottom: '16px' }}>ИСТОРИЯ ПОМОДОРО-СЕССИЙ</h3>
          <table className="table-spacex">
            <thead>
              <tr>
                <th>Дата и время</th>
                <th>Задача</th>
                <th>XP заработано</th>
              </tr>
            </thead>
            <tbody>
              {pomodoroHistory.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Нет завершённых помодоро-сессий</td></tr>
              ) : (
                [...pomodoroHistory].reverse().map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.completedAt).toLocaleString('ru')}</td>
                    <td>{p.taskTitle}</td>
                    <td>+{p.xpEarned} XP</td>
                  </tr>
                ))
              )}
            </tbody>
            {pomodoroHistory.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--hairline)' }}>
                  <td colSpan={2} style={{ fontWeight: 700 }}>ВСЕГО СЕССИЙ: {pomodoroHistory.length}</td>
                  <td style={{ fontWeight: 700 }}>+{pomodoroHistory.reduce((s, p) => s + p.xpEarned, 0)} XP</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Difficulty distribution */}
      {activeTable === 'difficulty' && (
        <div className="card-panel" style={{ overflowX: 'auto' }}>
          <h3 className="micro-cap" style={{ marginBottom: '16px' }}>РАСПРЕДЕЛЕНИЕ ПО СЛОЖНОСТИ</h3>
          <table className="table-spacex">
            <thead>
              <tr>
                <th>Сложность</th>
                <th>Активные</th>
                <th>Выполненные</th>
                <th>Всего</th>
                <th>% выполнения</th>
                <th>Средний XP</th>
              </tr>
            </thead>
            <tbody>
              {(['easy','medium','hard'] as const).map(d => {
                const active = tasks.filter(t => !t.completed && t.difficulty === d).length;
                const done = tasks.filter(t => t.completed && t.difficulty === d).length;
                const total = active + done;
                const avgXP = total > 0 ? Math.round(tasks.filter(t => t.difficulty === d).reduce((s, t) => s + t.xp, 0) / total) : 0;
                return (
                  <tr key={d}>
                    <td>
                      <span className="badge" style={{ fontSize: '12px' }}>
                        {d === 'easy' ? '🟢 ЛЁГКАЯ' : d === 'medium' ? '🟡 СРЕДНЯЯ' : '🔴 СЛОЖНАЯ'}
                      </span>
                    </td>
                    <td>{active}</td>
                    <td>{done}</td>
                    <td>{total}</td>
                    <td>{total > 0 ? Math.round((done / total) * 100) : 0}%</td>
                    <td>+{avgXP} XP</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
