import { useMemo } from 'react';
import type { Task, Category } from '../../types';
import { formatXP } from '../../utils/formatUtils';

interface Props {
  tasks: Task[];
  categories: Category[];
}

export default function TaskSummaryTable({ tasks, categories }: Props) {
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
                <td>{formatXP(a?.totalXP || 0)}</td>
                <td>{d?.count || 0}</td>
                <td>{formatXP(d?.xp || 0)}</td>
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
            <td>{formatXP(tasks.filter(t => !t.completed).reduce((s, t) => s + t.xp, 0))}</td>
            <td style={{ fontWeight: 700 }}>{tasks.filter(t => t.completed).length}</td>
            <td>{formatXP(tasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
