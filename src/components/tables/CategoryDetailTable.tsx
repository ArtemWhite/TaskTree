import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Task, Category, PomodoroSession } from '../../types';
import { formatXP } from '../../utils/formatUtils';

type ColumnKey = 'total' | 'active' | 'done' | 'pct' | 'xp' | 'pomoCount' | 'pomoDuration' | 'pomoXP';

const TOGGLEABLE_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'total', label: 'Всего задач' },
  { key: 'active', label: 'Активных' },
  { key: 'done', label: 'Выполнено' },
  { key: 'pct', label: 'Прогресс' },
  { key: 'xp', label: 'XP задач' },
  { key: 'pomoCount', label: '🍅 Сессии' },
  { key: 'pomoDuration', label: '⏱ Время' },
  { key: 'pomoXP', label: '⚡ XP помодоро' },
];

interface Props {
  tasks: Task[];
  categories: Category[];
  pomodoroHistory: PomodoroSession[];
  onSelectCategorySessions: (title: string, sessions: PomodoroSession[]) => void;
}

interface CategoryPomodoroStats {
  count: number;
  totalDuration: number;
  totalXP: number;
  sessions: PomodoroSession[];
}

const thStyle: CSSProperties = { textAlign: 'center' };
const tdStyle: CSSProperties = { textAlign: 'center', whiteSpace: 'nowrap' };

export default function CategoryDetailTable({ tasks, categories, pomodoroHistory, onSelectCategorySessions }: Props) {
  const [hidden, setHidden] = useState<Set<ColumnKey>>(new Set());

  const isVisible = (key: ColumnKey) => !hidden.has(key);

  const toggleColumn = (key: ColumnKey) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const taskCategoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    tasks.forEach(t => {
      map[t.id] = t.categoryId;
    });
    return map;
  }, [tasks]);

  const pomodoroByCategory = useMemo(() => {
    const map: Record<string, CategoryPomodoroStats> = {};
    pomodoroHistory.forEach(p => {
      const categoryId = taskCategoryMap[p.taskId];
      if (!categoryId) return;
      if (!map[categoryId]) {
        map[categoryId] = { count: 0, totalDuration: 0, totalXP: 0, sessions: [] };
      }
      map[categoryId].count++;
      map[categoryId].totalDuration += p.duration || 25;
      map[categoryId].totalXP += p.xpEarned;
      map[categoryId].sessions.push(p);
    });
    return map;
  }, [pomodoroHistory, taskCategoryMap]);

  const totals = useMemo(() => {
    let total = 0;
    let active = 0;
    let done = 0;
    let xp = 0;
    let pomoCount = 0;
    let pomoDuration = 0;
    let pomoXP = 0;
    categories.forEach(c => {
      const catTasks = tasks.filter(t => t.categoryId === c.id);
      total += catTasks.length;
      const catActive = catTasks.filter(t => !t.completed).length;
      const catDone = catTasks.length - catActive;
      active += catActive;
      done += catDone;
      xp += catTasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0);
      const pomo = pomodoroByCategory[c.id];
      if (pomo) {
        pomoCount += pomo.count;
        pomoDuration += pomo.totalDuration;
        pomoXP += pomo.totalXP;
      }
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, active, done, pct, xp, pomoCount, pomoDuration, pomoXP };
  }, [categories, tasks, pomodoroByCategory]);

  return (
    <div className="card-panel">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <h3 className="micro-cap" style={{ margin: 0, lineHeight: '24px' }}>
          ДЕТАЛИЗАЦИЯ ПО КАТЕГОРИЯМ
        </h3>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="micro-cap" style={{ fontSize: '10px', marginRight: '2px' }}>
            СТОЛБЦЫ:
          </span>
          {TOGGLEABLE_COLUMNS.map(col => {
            const visible = isVisible(col.key);
            return (
              <button
                key={col.key}
                type="button"
                className="btn-ghost btn-ghost-xs"
                style={{
                  background: visible ? 'var(--ghost-hover)' : 'transparent',
                  opacity: visible ? 1 : 0.5,
                }}
                onClick={() => toggleColumn(col.key)}
                title={visible ? `Скрыть: ${col.label}` : `Показать: ${col.label}`}
              >
                {col.label}
              </button>
            );
          })}
        </div>
      </div>

      <table className="table-spacex">
        <thead>
          <tr>
            <th style={{ textAlign: 'center', width: '52px' }}>Иконка</th>
            <th style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>Название</th>
            {isVisible('total') && <th style={thStyle}>Всего задач</th>}
            {isVisible('active') && <th style={thStyle}>Активных</th>}
            {isVisible('done') && <th style={thStyle}>Выполнено</th>}
            {isVisible('pct') && <th style={{ ...thStyle, minWidth: '160px' }}>Процент выполнения</th>}
            {isVisible('xp') && <th style={thStyle}>Всего XP</th>}
            {isVisible('pomoCount') && <th style={thStyle}>🍅 Сессии</th>}
            {isVisible('pomoDuration') && <th style={thStyle}>⏱ Время</th>}
            {isVisible('pomoXP') && <th style={thStyle}>⚡ XP помодоро</th>}
          </tr>
        </thead>
        <tbody>
          {categories.map(c => {
            const catTasks = tasks.filter(t => t.categoryId === c.id);
            const total = catTasks.length;
            const active = catTasks.filter(t => !t.completed).length;
            const done = total - active;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const xp = catTasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0);
            const pomo = pomodoroByCategory[c.id] ?? { count: 0, totalDuration: 0, totalXP: 0, sessions: [] };

            return (
              <tr key={c.id}>
                <td style={{ textAlign: 'center', fontSize: '20px' }}>{c.emoji}</td>
                <td style={{ textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.name}</td>
                {isVisible('total') && <td style={tdStyle}>{total}</td>}
                {isVisible('active') && <td style={tdStyle}>{active}</td>}
                {isVisible('done') && <td style={tdStyle}>{done}</td>}
                {isVisible('pct') && (
                  <td style={{ textAlign: 'left', minWidth: '160px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="progress-bar" style={{ flex: 1, height: '6px' }}>
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                )}
                {isVisible('xp') && <td style={tdStyle}>{formatXP(xp)}</td>}
                {isVisible('pomoCount') && (
                  <td style={tdStyle}>
                    {pomo.count > 0 ? (
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
                        onClick={() => onSelectCategorySessions(c.name, pomo.sessions)}
                        title="Нажмите, чтобы просмотреть историю помодоро"
                      >
                        🍅 ×{pomo.count}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
                {isVisible('pomoDuration') && (
                  <td style={tdStyle}>{pomo.count > 0 ? `⏱ ${pomo.totalDuration} мин` : '—'}</td>
                )}
                {isVisible('pomoXP') && (
                  <td style={tdStyle}>{pomo.count > 0 ? formatXP(pomo.totalXP) : '—'}</td>
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--hairline)' }}>
            <td style={{ textAlign: 'center', fontSize: '20px' }}>🌳</td>
            <td style={{ textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' }}>ИТОГО</td>
            {isVisible('total') && <td style={{ ...tdStyle, fontWeight: 700 }}>{totals.total}</td>}
            {isVisible('active') && <td style={{ ...tdStyle, fontWeight: 700 }}>{totals.active}</td>}
            {isVisible('done') && <td style={{ ...tdStyle, fontWeight: 700 }}>{totals.done}</td>}
            {isVisible('pct') && (
              <td style={{ textAlign: 'left', minWidth: '160px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="progress-bar" style={{ flex: 1, height: '6px' }}>
                    <div className="progress-bar-fill" style={{ width: `${totals.pct}%` }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, minWidth: '36px', textAlign: 'right' }}>
                    {totals.pct}%
                  </span>
                </div>
              </td>
            )}
            {isVisible('xp') && <td style={tdStyle}>{formatXP(totals.xp)}</td>}
            {isVisible('pomoCount') && <td style={tdStyle}>{totals.pomoCount > 0 ? `🍅 ×${totals.pomoCount}` : '—'}</td>}
            {isVisible('pomoDuration') && <td style={tdStyle}>{totals.pomoCount > 0 ? `⏱ ${totals.pomoDuration} мин` : '—'}</td>}
            {isVisible('pomoXP') && <td style={tdStyle}>{totals.pomoCount > 0 ? formatXP(totals.pomoXP) : '—'}</td>}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
