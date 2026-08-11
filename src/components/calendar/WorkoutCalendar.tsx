import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Workout } from '../../types';
import { WorkoutService } from '../../services/WorkoutService';
import { CalendarService, type BaseCalendarCell } from '../../services/CalendarService';

interface Props { workouts: Workout[]; }

interface WorkoutDayCell extends BaseCalendarCell { day: number; date: string; count: number; level: number; }

function getWorkoutStyle(level: number, isSelected: boolean) {
  if (isSelected) {
    return {
      background: '#60a5fa',
      color: '#ffffff',
      fontWeight: 700,
      border: '2px solid #ffffff',
      boxShadow: '0 0 10px rgba(96, 165, 250, 0.5)',
    };
  }

  switch (level) {
    case 4:
      return { background: '#3b82f6', color: '#ffffff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.2)' };
    case 3:
      return { background: 'rgba(59, 130, 246, 0.85)', color: '#eff6ff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)' };
    case 2:
      return { background: 'rgba(37, 99, 235, 0.65)', color: '#dbeafe', fontWeight: 600, border: '1px solid transparent' };
    case 1:
      return { background: 'rgba(29, 78, 216, 0.45)', color: '#bfdbfe', fontWeight: 600, border: '1px solid transparent' };
    default:
      return { background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 400, border: '1px solid transparent' };
  }
}

export default function WorkoutCalendar({ workouts }: Props) {
  const [selectedDay, setSelectedDay] = useState<{ date: string; items: Workout[] } | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const months = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    workouts.filter(w => w.completed).forEach(w => {
      const dateKey = (w.date || w.createdAt).slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(w);
    });

    return CalendarService.buildYearGrid<WorkoutDayCell>(
      viewYear,
      (day, dateStr) => {
        const items = map[dateStr] || [];
        const count = items.length;
        return { day, date: dateStr, count, level: CalendarService.getLevel(count) };
      },
      () => ({ day: 0, date: '', count: 0, level: -1 })
    );
  }, [workouts, viewYear]);

  const workoutMap = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    workouts.filter(w => w.completed).forEach(w => {
      const dateKey = (w.date || w.createdAt).slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(w);
    });
    return map;
  }, [workouts]);

  return (
    <div className="card-panel">
      {/* Header & Year Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0, fontSize: '14px' }}>🏋️ КАЛЕНДАРЬ ТРЕНИРОВОК ({viewYear})</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setViewYear(y => y - 1)}>◀ {viewYear - 1}</button>
          <button className="btn-ghost btn-ghost-xs" style={{ background: 'var(--ghost-hover)' }} onClick={() => setViewYear(new Date().getFullYear())}>ТЕКУЩИЙ ГОД</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setViewYear(y => y + 1)}>{viewYear + 1} ▶</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>Меньше</span>
        {[0, 1, 2, 3, 4].map(lvl => (
          <div key={lvl} style={{ width: '14px', height: '14px', borderRadius: '3px', ...getWorkoutStyle(lvl, false) }} />
        ))}
        <span>Больше тренировок</span>
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

                const items = workoutMap[cell.date] || [];
                const isSelected = selectedDay?.date === cell.date;
                const cellStyle = getWorkoutStyle(cell.level, isSelected);

                return (
                  <div
                    key={ci}
                    title={cell.count > 0 ? `${cell.date}: ${cell.count} тренировок` : cell.date}
                    onClick={() => setSelectedDay({ date: cell.date, items })}
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

      {/* Day Workout Details Modal */}
      {selectedDay && createPortal(
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="micro-cap" style={{ margin: 0 }}>
                🏋️ {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button className="btn-ghost btn-ghost-xs" onClick={() => setSelectedDay(null)}>✕</button>
            </div>

            {selectedDay.items.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>В этот день не было завершённых тренировок.</p>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '12px' }}>
                  Выполнено тренировок: <strong>{selectedDay.items.length}</strong>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedDay.items.map(w => (
                    <div key={w.id} style={{ padding: '10px 12px', background: 'var(--surface-hover)', borderRadius: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <span style={{ fontSize: '18px' }}>{WorkoutService.getTypeIcon(w.workoutType)}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{w.title || w.workoutType}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#60a5fa' }}>{w.duration} мин</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-soft)', marginTop: '4px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span>Категория: {w.workoutType}</span>
                        <span style={{ color: '#5aaa6f', fontWeight: 600 }}>⚡ +{w.xp} XP</span>
                      </div>
                      {w.notes && <div style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px', fontStyle: 'italic' }}>{w.notes}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
            <button className="btn-ghost btn-ghost-sm" style={{ marginTop: '16px', width: '100%' }} onClick={() => setSelectedDay(null)}>
              ЗАКРЫТЬ
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
