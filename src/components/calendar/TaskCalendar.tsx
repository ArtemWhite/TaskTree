import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Task, Category } from '../../types';
import { CalendarService, type BaseCalendarCell } from '../../services/CalendarService';

interface Props {
  tasks: Task[];
  categories: Category[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onStartPomodoro: (t: Task) => void;
}

interface CalendarDayCell extends BaseCalendarCell {
  day: number;
  date: string;
  count: number;
  level: number;
  taskIds: string[];
}

function getTaskStyle(level: number, isSelected: boolean) {
  if (isSelected) {
    return {
      background: '#5aaa6f',
      color: '#ffffff',
      fontWeight: 700,
      border: '2px solid #ffffff',
      boxShadow: '0 0 10px rgba(90, 170, 111, 0.5)',
    };
  }

  switch (level) {
    case 4:
      return { background: '#5aaa6f', color: '#ffffff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' };
    case 3:
      return { background: 'rgba(50, 145, 85, 0.85)', color: '#f0fdf4', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' };
    case 2:
      return { background: 'rgba(40, 115, 70, 0.65)', color: '#d1fae5', fontWeight: 600, border: '1px solid transparent' };
    case 1:
      return { background: 'rgba(30, 85, 55, 0.45)', color: '#a7f3d0', fontWeight: 600, border: '1px solid transparent' };
    default:
      return { background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 400, border: '1px solid transparent' };
  }
}

export default function TaskCalendar({ tasks, categories, onComplete, onDelete, onStartPomodoro }: Props) {
  const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const dayMap = useMemo(() => {
    const map: Record<string, { count: number; taskIds: string[] }> = {};
    tasks.forEach(t => {
      const dateKey = t.deadline ? t.deadline.slice(0, 10) : null;
      if (dateKey) {
        if (!map[dateKey]) map[dateKey] = { count: 0, taskIds: [] };
        map[dateKey].count++;
        map[dateKey].taskIds.push(t.id);
      }
    });
    return map;
  }, [tasks]);

  const months = useMemo(() => {
    return CalendarService.buildYearGrid<CalendarDayCell>(
      calendarViewYear,
      (day, dateStr) => {
        const info = dayMap[dateStr];
        const count = info ? info.count : 0;
        return {
          day,
          date: dateStr,
          count,
          level: CalendarService.getLevel(count),
          taskIds: info ? info.taskIds : [],
        };
      },
      () => ({ day: 0, date: '', count: 0, level: -1, taskIds: [] })
    );
  }, [calendarViewYear, dayMap]);

  const categoryMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return tasks.filter(t => t.deadline && t.deadline.slice(0, 10) === selectedCalendarDate);
  }, [tasks, selectedCalendarDate]);

  return (
    <div className="card-panel">
      {/* Header & Year Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0, fontSize: '14px' }}>📋 КАЛЕНДАРЬ ЗАДАЧ С ДЕДЛАЙНОМ ({calendarViewYear})</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setCalendarViewYear(y => y - 1)}>◀ {calendarViewYear - 1}</button>
          <button className="btn-ghost btn-ghost-xs" style={{ background: 'var(--ghost-hover)' }} onClick={() => setCalendarViewYear(new Date().getFullYear())}>ТЕКУЩИЙ ГОД</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setCalendarViewYear(y => y + 1)}>{calendarViewYear + 1} ▶</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>Меньше</span>
        {[0, 1, 2, 3, 4].map(lvl => (
          <div key={lvl} style={{ width: '14px', height: '14px', borderRadius: '3px', ...getTaskStyle(lvl, false) }} />
        ))}
        <span>Больше задач</span>
      </div>

      {/* 12 Months Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {months.map(m => (
          <div key={m.month} style={{ background: 'var(--surface-hover)', borderRadius: '8px', padding: '12px', border: '1px solid var(--hairline)' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-soft)', marginBottom: '8px', letterSpacing: '0.8px' }}>
              {m.name}
            </div>

            {/* Weekdays Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px', textAlign: 'center' }}>
              {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(wd => (
                <span key={wd} style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>{wd}</span>
              ))}
            </div>

            {/* 7-Column Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {m.cells.map((cell, ci) => {
                if (cell.level === -1) {
                  return <div key={ci} style={{ height: '30px', width: '100%' }} />;
                }
                const isSelected = selectedCalendarDate === cell.date;
                const cellStyle = getTaskStyle(cell.level, isSelected);

                return (
                  <div
                    key={ci}
                    title={cell.count > 0 ? `${cell.date}: ${cell.count} задач` : cell.date}
                    onClick={() => setSelectedCalendarDate(cell.date)}
                    style={{
                      height: '30px',
                      width: '100%',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      transition: 'all 0.15s ease',
                      boxSizing: 'border-box',
                      ...cellStyle,
                    }}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Day Tasks Modal */}
      {selectedCalendarDate && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedCalendarDate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="micro-cap" style={{ margin: 0 }}>
                📅 {new Date(selectedCalendarDate + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button className="btn-ghost btn-ghost-xs" onClick={() => setSelectedCalendarDate(null)}>✕</button>
            </div>

            {selectedDateTasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>На этот день нет задач с дедлайном.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {selectedDateTasks.map(t => {
                  const cat = t.categoryId ? categoryMap[t.categoryId] : undefined;
                  return (
                    <div key={t.id} style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '6px', borderLeft: `3px solid ${cat?.color || '#5aaa6f'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '14px', textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{cat?.emoji || '📝'} {cat?.name || 'Без категории'}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-soft)', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                        <span>⚡ +{t.xp} XP</span>
                        <span>{t.completed ? '✅ Завершено' : '⏳ В ожидании'}</span>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                          {!t.completed && (
                            <button className="btn-ghost btn-ghost-xs" style={{ color: '#ffb7c5', borderColor: '#ffb7c5' }} onClick={() => { setSelectedCalendarDate(null); onStartPomodoro(t); }}>
                              🍅 ПОМОДОРО
                            </button>
                          )}
                          {!t.completed && (
                            <button className="btn-ghost btn-ghost-xs" style={{ color: '#5aaa6f' }} onClick={() => onComplete(t.id)}>
                              ✓
                            </button>
                          )}
                          <button className="btn-ghost btn-ghost-xs" style={{ color: '#ff6b6b' }} onClick={() => onDelete(t.id)}>
                            🗑️
                          </button>
                        </div>
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
        </div>,
        document.body
      )}
    </div>
  );
}
