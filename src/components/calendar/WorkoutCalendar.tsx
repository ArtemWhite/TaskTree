import { useMemo, useState } from 'react';
import type { Workout } from '../../types';
import { WorkoutService } from '../../services/WorkoutService';

interface Props {
  workouts: Workout[];
}

interface CalendarDayCell {
  day: number;
  date: string;
  count: number;
  level: number;
}

interface MonthGridData {
  name: string;
  month: number;
  cells: CalendarDayCell[];
}

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getCalendarLevel(count: number): number {
  if (count >= 5) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

function getWorkoutStyle(level: number, isSelected: boolean) {
  if (isSelected) {
    return {
      background: '#4f46e5',
      color: '#ffffff',
      fontWeight: 700,
      border: '2px solid #ffffff',
      boxShadow: '0 0 10px rgba(79, 70, 229, 0.4)',
    };
  }

  switch (level) {
    case 4:
      return { background: 'rgba(70, 130, 215, 0.9)', color: '#ffffff', fontWeight: 700, border: '1px solid rgba(199, 210, 254, 0.25)' };
    case 3:
      return { background: 'rgba(55, 110, 190, 0.75)', color: '#e0e7ff', fontWeight: 600, border: '1px solid rgba(255,255,255,0.08)' };
    case 2:
      return { background: 'rgba(45, 90, 160, 0.6)', color: '#c7d2fe', fontWeight: 600, border: '1px solid transparent' };
    case 1:
      return { background: 'rgba(38, 72, 125, 0.45)', color: '#a5b4fc', fontWeight: 500, border: '1px solid transparent' };
    default:
      return { background: 'rgba(255, 255, 255, 0.03)', color: 'rgba(255, 255, 255, 0.45)', fontWeight: 400, border: '1px solid transparent' };
  }
}

function build7ColumnCalendarYearGrid(year: number, dayMap: Record<string, number>): MonthGridData[] {
  return Array.from({ length: 12 }, (_, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday = 0, Sunday = 6
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const cells: CalendarDayCell[] = [];

    // Empty offset cells before day 1
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: 0, date: '', count: 0, level: -1 });
    }

    // Actual days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const count = dayMap[dateStr] || 0;
      cells.push({ day, date: dateStr, count, level: getCalendarLevel(count) });
    }

    // Always pad to 42 cells (6 rows * 7 columns) for uniform card height
    while (cells.length < 42) {
      cells.push({ day: 0, date: '', count: 0, level: -1 });
    }

    return { name: MONTH_NAMES[month], month, cells };
  });
}

export default function WorkoutCalendar({ workouts }: Props) {
  const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  const calendarMonths = useMemo(() => {
    const dayMap: Record<string, number> = {};
    workouts.filter(w => w.completed).forEach(w => {
      dayMap[w.date] = (dayMap[w.date] || 0) + 1;
    });
    return build7ColumnCalendarYearGrid(calendarViewYear, dayMap);
  }, [workouts, calendarViewYear]);

  const selectedDateWorkouts = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return workouts.filter(w => w.date === selectedCalendarDate);
  }, [selectedCalendarDate, workouts]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0 }}>🏋️ КАЛЕНДАРЬ ТРЕНИРОВОК ({calendarViewYear})</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setCalendarViewYear(y => y - 1)}>◀ {calendarViewYear - 1}</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setCalendarViewYear(new Date().getFullYear())}>ТЕКУЩИЙ ГОД</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setCalendarViewYear(y => y + 1)}>{calendarViewYear + 1} ▶</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {calendarMonths.map(m => (
          <div key={m.month} className="card-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.8px', color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase' }}>
              {m.name}
            </div>

            {/* Weekdays Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
              {WEEKDAYS.map((wd, i) => (
                <div key={wd} style={{ fontSize: '10px', color: i >= 5 ? '#ff9f43' : 'var(--text-muted)', fontWeight: 600 }}>
                  {wd}
                </div>
              ))}
            </div>

            {/* 7-Column Days Grid (6 uniform rows) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {m.cells.map((cell, ci) => {
                if (cell.level === -1) {
                  return <div key={ci} style={{ height: '30px', width: '100%' }} />;
                }
                const isSelected = selectedCalendarDate === cell.date;
                const cellStyle = getWorkoutStyle(cell.level, isSelected);

                return (
                  <div
                    key={ci}
                    title={cell.count > 0 ? `${cell.date}: ${cell.count} трен.` : cell.date}
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

      {selectedCalendarDate && (
        <div className="modal-overlay" onClick={() => setSelectedCalendarDate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="micro-cap" style={{ margin: 0 }}>
                🏋️ {new Date(selectedCalendarDate + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button className="btn-ghost btn-ghost-xs" onClick={() => setSelectedCalendarDate(null)}>✕</button>
            </div>

            {selectedDateWorkouts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Нет тренировок на этот день.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {selectedDateWorkouts.map(w => (
                  <div key={w.id} style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '6px', borderLeft: `3px solid ${WorkoutService.getTypeColor(w.workoutType)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{w.title}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{WorkoutService.getTypeIcon(w.workoutType)} {w.workoutType}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                      ⏱ {w.duration} мин | ⚡ +{w.xp} XP | {w.completed ? '✅ Завершено' : '⏳ В ожидании'}
                    </div>
                  </div>
                ))}
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
