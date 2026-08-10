import { useMemo, useState } from 'react';
import type { Task, Category } from '../../types';

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
    return buildCalendarYearGrid(calendarViewYear, dayMap);
  }, [tasks, calendarViewYear]);

  const categoryMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return [...tasks, ...completedTasks].filter(t => t.deadline && t.deadline.slice(0, 10) === selectedCalendarDate);
  }, [selectedCalendarDate, tasks, completedTasks]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0 }}>КАЛЕНДАРЬ ЗАДАЧ С ДЕДЛАЙНОМ ({calendarViewYear})</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setCalendarViewYear(y => y - 1)}>◀ {calendarViewYear - 1}</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setCalendarViewYear(new Date().getFullYear())}>ТЕКУЩИЙ ГОД</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setCalendarViewYear(y => y + 1)}>{calendarViewYear + 1} ▶</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {calendarMonths.map(m => (
          <div key={m.month} className="card-panel" style={{ padding: '16px' }}>
            <div className="micro-cap" style={{ marginBottom: '12px', fontSize: '11px' }}>{m.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
              {m.rows.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: `${cellGap}px` }}>
                  {row.map((cell, ci) => {
                    if (cell.level === -1) {
                      return <div key={ci} style={{ width: `${cellSize}px`, height: `${cellSize}px` }} />;
                    }
                    const isSelected = selectedCalendarDate === cell.date;
                    return (
                      <div
                        key={ci}
                        title={cell.count > 0 ? `${cell.date}: ${cell.count} задач(и)` : cell.date}
                        onClick={() => setSelectedCalendarDate(cell.date)}
                        style={{
                          width: `${cellSize}px`, height: `${cellSize}px`,
                          borderRadius: '4px',
                          background: isSelected ? '#a0a0ff' : CALENDAR_LEVELS[cell.level],
                          color: isSelected ? '#000000' : cell.level > 2 ? '#ffffff' : 'var(--text-soft)',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: cell.count > 0 || isSelected ? 700 : 400,
                          transition: 'all 0.15s ease', border: isSelected ? '2px solid #ffffff' : 'none'
                        }}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedCalendarDate && (
        <div className="modal-overlay" onClick={() => setSelectedCalendarDate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="micro-cap" style={{ margin: 0 }}>
                📅 {new Date(selectedCalendarDate + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button className="btn-ghost btn-ghost-xs" onClick={() => setSelectedCalendarDate(null)}>✕</button>
            </div>

            {selectedDateTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Нет задач с дедлайном на этот день.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {selectedDateTasks.map(t => {
                  const cat = categoryMap[t.categoryId];
                  return (
                    <div key={t.id} style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '6px', borderLeft: `3px solid ${cat?.color || '#ffffff'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', textDecoration: t.completed ? 'line-through' : 'none' }}>
                          {cat?.emoji} {t.title}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>+{t.xp} XP</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
                        {!t.completed && (
                          <button className="btn-ghost btn-ghost-xs" onClick={() => onComplete(t.id)}>✓ ВЫПОЛНИТЬ</button>
                        )}
                        {!t.completed && (
                          <button className="btn-ghost btn-ghost-xs" style={{ color: '#ffb7c5' }} onClick={() => { setSelectedCalendarDate(null); onStartPomodoro(t); }}>🍅 ПОМОДОРО</button>
                        )}
                        <button className="btn-ghost btn-ghost-xs" style={{ color: '#ff6b6b' }} onClick={() => onDelete(t.id)}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="btn-ghost btn-ghost-sm" style={{ marginTop: '16px', width: '100%' }} onClick={() => setSelectedCalendarDate(null)}>
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
