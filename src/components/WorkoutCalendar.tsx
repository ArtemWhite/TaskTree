import { useMemo, useState } from 'react';
import type { Workout } from '../types';

interface Props { workouts: Workout[]; }

interface DayCell { day: number; date: string; count: number; level: number; }
interface MonthGrid { name: string; month: number; rows: DayCell[][]; }

const BLUE_LEVELS = ['var(--level-0-cell)', '#1a2a3d', '#1e3d5c', '#2563a0', '#3b82c4'];
const MONTH_NAMES = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

function getLevel(count: number): number {
  if (count >= 4) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

function buildYearGrid(year: number, dayMap: Record<string, number>): MonthGrid[] {
  return Array.from({ length: 12 }, (_, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: DayCell[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const count = dayMap[dateStr] || 0;
      cells.push({ day, date: dateStr, count, level: getLevel(count) });
    }
    const rows: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 4) rows.push(cells.slice(i, i + 4));
    const lastRow = rows[rows.length - 1];
    while (lastRow.length < 4) lastRow.push({ day: 0, date: '', count: 0, level: -1 });
    return { name: MONTH_NAMES[month], month, rows };
  });
}

export default function WorkoutCalendar({ workouts }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const months = useMemo(() => {
    const dayMap: Record<string, number> = {};
    workouts.filter(w => w.completed).forEach(w => {
      dayMap[w.date] = (dayMap[w.date] || 0) + 1;
    });
    return buildYearGrid(viewYear, dayMap);
  }, [workouts, viewYear]);

  const cellSize = 26;
  const cellGap = 2;

  const selectedWorkouts = selectedDate
    ? workouts.filter(w => w.date === selectedDate && w.completed)
    : [];

  return (
    <div className="card-panel" style={{ overflowX: 'auto', marginTop: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0 }}>📅 КАЛЕНДАРЬ ТРЕНИРОВОК</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-ghost btn-ghost-sm" onClick={() => setViewYear(y => y - 1)}>←</button>
          <span style={{ fontSize: '14px', letterSpacing: '0.8px', color: 'var(--text-primary)', minWidth: '50px', textAlign: 'center' }}>{viewYear}</span>
          <button className="btn-ghost btn-ghost-sm" onClick={() => setViewYear(y => y + 1)}>→</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {months.map(m => (
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
                        onClick={() => { if (!isEmpty && cell.count > 0) setSelectedDate(cell.date); }}
                        title={!isEmpty ? `${cell.date}: ${cell.count} тренировок` : ''}
                        style={{
                          width: `${cellSize}px`, height: `${cellSize}px`, borderRadius: '3px',
                          background: isEmpty ? 'transparent' : BLUE_LEVELS[cell.level],
                          cursor: !isEmpty && cell.count > 0 ? 'pointer' : 'default',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: cell.count > 0 ? 700 : 400,
                          color: !isEmpty && cell.level >= 3 ? '#ffffff' : !isEmpty ? 'var(--text-muted)' : 'transparent',
                          transition: 'all 0.15s',
                          border: isEmpty ? 'none' : cell.count === 0 ? '1px solid var(--hairline)' : 'none',
                        }}
                        onMouseEnter={e => { if (!isEmpty && cell.count > 0) (e.target as HTMLElement).style.outline = '1px solid #3b82c4'; }}
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

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>Меньше</span>
        {BLUE_LEVELS.slice(1).map((c, i) => (
          <div key={i} style={{ width: `${cellSize}px`, height: `${cellSize}px`, borderRadius: '3px', background: c }} />
        ))}
        <span>Больше</span>
      </div>

      {/* Day detail modal */}
      {selectedDate && (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="micro-cap" style={{ margin: 0 }}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button className="btn-ghost btn-ghost-xs" onClick={() => setSelectedDate(null)}>✕</button>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '16px' }}>
              Тренировок: <strong>{selectedWorkouts.length}</strong>
            </p>
            {selectedWorkouts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedWorkouts.map(w => (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--surface-hover)', borderRadius: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#3b82c4' }}>🏋️</span>
                    <span style={{ fontSize: '14px', flex: 1, color: 'var(--text-primary)' }}>{w.title}</span>
                    <span className="badge">{w.duration} мин</span>
                    <span className="badge">+{w.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-ghost btn-ghost-sm" style={{ marginTop: '20px', width: '100%' }} onClick={() => setSelectedDate(null)}>ЗАКРЫТЬ</button>
          </div>
        </div>
      )}
    </div>
  );
}
