import { useMemo, useState } from 'react';
import type { CompletedDay } from '../../types';

interface Props { completedDays: CompletedDay[]; }

interface DayCell { day: number; date: string; count: number; level: number; }
interface MonthGridData { name: string; month: number; cells: DayCell[]; }

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function getLevel(count: number): number {
  if (count >= 5) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

function getHeatmapStyle(level: number, isSelected: boolean) {
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

function build7ColumnYearGrid(year: number, dayMap: Record<string, CompletedDay>): MonthGridData[] {
  return Array.from({ length: 12 }, (_, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Monday = 0, Sunday = 6
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const cells: DayCell[] = [];

    // Empty offset cells before day 1
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ day: 0, date: '', count: 0, level: -1 });
    }

    // Actual days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const cd = dayMap[dateStr];
      const count = cd ? cd.count : 0;
      cells.push({ day, date: dateStr, count, level: getLevel(count) });
    }

    // Always pad to 42 cells (6 rows * 7 columns) for uniform card height
    while (cells.length < 42) {
      cells.push({ day: 0, date: '', count: 0, level: -1 });
    }

    return { name: MONTH_NAMES[month], month, cells };
  });
}

export default function CalendarHeatmap({ completedDays }: Props) {
  const [selectedDay, setSelectedDay] = useState<CompletedDay | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const months = useMemo(() => {
    const dayMap: Record<string, CompletedDay> = {};
    completedDays.forEach(cd => { dayMap[cd.date] = cd; });
    return build7ColumnYearGrid(viewYear, dayMap);
  }, [completedDays, viewYear]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0 }}>🔥 ИСТОРИЯ ВЫПОЛНЕНИЯ ЗАДАЧ ({viewYear})</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setViewYear(y => y - 1)}>◀ {viewYear - 1}</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setViewYear(new Date().getFullYear())}>ТЕКУЩИЙ ГОД</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setViewYear(y => y + 1)}>{viewYear + 1} ▶</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {months.map(m => (
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
                const cd = completedDays.find(d => d.date === cell.date);
                const isSelected = selectedDay?.date === cell.date;
                const cellStyle = getHeatmapStyle(cell.level, isSelected);

                return (
                  <div
                    key={ci}
                    title={cell.count > 0 ? `${cell.date}: ${cell.count} задач` : cell.date}
                    onClick={() => setSelectedDay(cd || { date: cell.date, count: 0, tasks: [] })}
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

      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="micro-cap" style={{ margin: 0 }}>
                📅 {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button className="btn-ghost btn-ghost-xs" onClick={() => setSelectedDay(null)}>✕</button>
            </div>

            {selectedDay.count === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>В этот день не было выполненных задач.</p>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-soft)', marginBottom: '12px' }}>
                  Выполнено задач: <strong>{selectedDay.count}</strong>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedDay.tasks.map(t => (
                    <div key={t.id} style={{ padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: '6px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 600 }}>{t.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-soft)', marginTop: '2px' }}>⚡ +{t.xp} XP</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button className="btn-ghost btn-ghost-sm" style={{ marginTop: '16px', width: '100%' }} onClick={() => setSelectedDay(null)}>
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
