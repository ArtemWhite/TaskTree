import { useMemo, useState } from 'react';
import type { Task, Category } from '../types';

interface Props {
  tasks: Task[];
  completedTasks: Task[];
  categories: Category[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStartPomodoro: (t: Task) => void;
}

const MONTH_NAMES = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const CALENDAR_LEVELS = ['var(--level-0-cell)', '#1e3a2f', '#2d5a3f', '#3d7a4f', '#5aaa6f'];

function getCalendarLevel(count: number): number {
  if (count >= 5) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

interface CalendarDayCell {
  day: number;
  date: string;
  count: number;
  level: number;
  taskIds: string[];
}

function buildCalendarYearGrid(year: number, dayMap: Record<string, { count: number; taskIds: string[] }>) {
  return Array.from({ length: 12 }, (_, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: CalendarDayCell[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const info = dayMap[dateStr];
      const count = info ? info.count : 0;
      cells.push({ day, date: dateStr, count, level: getCalendarLevel(count), taskIds: info ? info.taskIds : [] });
    }
    const rows: CalendarDayCell[][] = [];
    for (let i = 0; i < cells.length; i += 4) rows.push(cells.slice(i, i + 4));
    const lastRow = rows[rows.length - 1];
    while (lastRow.length < 4) lastRow.push({ day: 0, date: '', count: 0, level: -1, taskIds: [] });
    return { name: MONTH_NAMES[month], month, rows };
  });
}

export default function TaskCalendar({ tasks, completedTasks, categories, onComplete, onDelete, onStartPomodoro }: Props) {
  const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const cellSize = 26;
  const cellGap = 2;

  const calendarMonths = useMemo(() => {
    const dayMap: Record<string, { count: number; taskIds: string[] }> = {};
    tasks.forEach(t => {
      const dateKey = t.deadline ? t.deadline.slice(0, 10) : null;
      if (dateKey) {
        if (!dayMap[dateKey]) dayMap[dateKey] = { count: 0, taskIds: [] };
        dayMap[dateKey].count++;
        dayMap[dateKey].taskIds.push(t.id);
      }
    });
    tasks.filter(t => !t.deadline).forEach(t => {
      const dateKey = t.createdAt.slice(0, 10);
      if (!dayMap[dateKey]) dayMap[dateKey] = { count: 0, taskIds: [] };
      dayMap[dateKey].count++;
      dayMap[dateKey].taskIds.push(t.id);
    });
    completedTasks.forEach(t => {
      if (t.completedDate) {
        const dateKey = t.completedDate.slice(0, 10);
        if (!dayMap[dateKey]) dayMap[dateKey] = { count: 0, taskIds: [] };
        dayMap[dateKey].count++;
        dayMap[dateKey].taskIds.push(t.id);
      }
    });
    return buildCalendarYearGrid(calendarViewYear, dayMap);
  }, [tasks, completedTasks, calendarViewYear]);

  const allTasksMap = useMemo(() => {
    const map: Record<string, Task> = {};
    tasks.forEach(t => { map[t.id] = t; });
    completedTasks.forEach(t => { map[t.id] = t; });
    return map;
  }, [tasks, completedTasks]);

  const categoryMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedCalendarDate) return [];
    const cell = calendarMonths.flatMap(m => m.rows).flat().find(c => c.date === selectedCalendarDate);
    if (!cell) return [];
    return cell.taskIds.map(id => allTasksMap[id]).filter(Boolean);
  }, [selectedCalendarDate, calendarMonths, allTasksMap]);

  return (
    <div className="card-panel" style={{ overflowX: 'auto', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0 }}>📅 КАЛЕНДАРЬ ЗАДАЧ</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-ghost btn-ghost-sm" onClick={() => setCalendarViewYear(y => y - 1)}>←</button>
          <span style={{ fontSize: '14px', letterSpacing: '0.8px', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'center' }}>{calendarViewYear}</span>
          <button className="btn-ghost btn-ghost-sm" onClick={() => setCalendarViewYear(y => y + 1)}>→</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {calendarMonths.map(m => (
          <div key={m.month} style={{ border: '1px solid var(--hairline)', borderRadius: '8px', padding: '12px', background: 'var(--bg-secondary)' }}>
            <div style={{ textAlign: 'center', fontSize: '13px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.96px', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--hairline)' }}>{m.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px`, alignItems: 'center' }}>
              {m.rows.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: `${cellGap}px` }}>
                  {row.map((cell, ci) => {
                    const isEmpty = cell.level < 0;
                    return (
                      <div
                        key={ci}
                        onClick={() => { if (!isEmpty && cell.count > 0) setSelectedCalendarDate(cell.date); }}
                        title={!isEmpty ? `${cell.date}: ${cell.count} задач(и)` : ''}
                        style={{
                          width: `${cellSize}px`, height: `${cellSize}px`, borderRadius: '3px',
                          background: isEmpty ? 'transparent' : CALENDAR_LEVELS[cell.level],
                          cursor: !isEmpty && cell.count > 0 ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: cell.count > 0 ? 700 : 400,
                          color: !isEmpty && cell.level >= 3 ? '#ffffff' : !isEmpty ? 'var(--text-muted)' : 'transparent',
                          transition: 'all 0.15s',
                          border: isEmpty ? 'none' : cell.count === 0 ? '1px solid var(--hairline)' : 'none',
                        }}
                        onMouseEnter={e => { if (!isEmpty && cell.count > 0) (e.target as HTMLElement).style.outline = '1px solid var(--text-primary)'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.outline = 'none'; }}
                      >{!isEmpty ? cell.day : ''}</div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>Меньше</span>
        {CALENDAR_LEVELS.slice(1).map((c, i) => (
          <div key={i} style={{ width: `${cellSize}px`, height: `${cellSize}px`, borderRadius: '3px', background: c }} />
        ))}
        <span>Больше</span>
      </div>

      {selectedCalendarDate && (
        <div className="modal-overlay" onClick={() => setSelectedCalendarDate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="micro-cap" style={{ margin: 0 }}>
                {new Date(selectedCalendarDate + 'T12:00:00').toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button className="btn-ghost btn-ghost-xs" onClick={() => setSelectedCalendarDate(null)}>✕</button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '16px' }}>
              Задач: <strong>{selectedDateTasks.length}</strong>
            </p>
            {selectedDateTasks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedDateTasks.map(task => {
                  const cat = categoryMap[task.categoryId];
                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                      background: 'var(--surface-hover)', borderRadius: '4px',
                      opacity: task.completed ? 0.5 : 1,
                    }}>
                      <span style={{ fontSize: '18px' }}>{cat?.emoji || '📝'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', textDecoration: task.completed ? 'line-through' : 'none', color: 'var(--text-primary)' }}>{task.title}</div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span className="badge" style={{ fontSize: '10px' }}>{cat?.name || '—'}</span>
                          <span className="badge" style={{ fontSize: '10px' }}>
                            {task.difficulty === 'easy' ? 'ЛЁГКАЯ' : task.difficulty === 'medium' ? 'СРЕДНЯЯ' : 'СЛОЖНАЯ'}
                          </span>
                          <span className="badge" style={{ fontSize: '10px' }}>+{task.xp} XP</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        {!task.completed && (
                          <>
                            <button className="btn-ghost btn-ghost-xs" onClick={() => onComplete(task.id)} title="Выполнить">✓</button>
                            <button className="btn-ghost btn-ghost-xs" onClick={() => onStartPomodoro(task)} title="Помодоро">🍅</button>
                          </>
                        )}
                        <button className="btn-ghost btn-ghost-xs" onClick={() => onDelete(task.id)} title="Удалить">✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>Нет задач на эту дату</p>
            )}
            <button className="btn-ghost btn-ghost-sm" style={{ marginTop: '20px', width: '100%' }} onClick={() => setSelectedCalendarDate(null)}>
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
