import { useMemo, useState } from 'react';
import type { CompletedDay } from '../../types';

interface Props { completedDays: CompletedDay[]; }

interface DayCell { day: number; date: string; count: number; level: number; }
interface MonthGrid { name: string; month: number; rows: DayCell[][]; }

const LEVEL_COLORS = ['var(--level-0-cell)', '#1e3a2f', '#2d5a3f', '#3d7a4f', '#5aaa6f'];
const MONTH_NAMES = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

function getLevel(count: number): number {
  if (count >= 5) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

function buildYearGrid(year: number, dayMap: Record<string, CompletedDay>): MonthGrid[] {
  return Array.from({ length: 12 }, (_, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: DayCell[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
      const cd = dayMap[dateStr];
      const count = cd ? cd.count : 0;
      cells.push({ day, date: dateStr, count, level: getLevel(count) });
    }

    const rows: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 4) {
      rows.push(cells.slice(i, i + 4));
    }
    const lastRow = rows[rows.length - 1];
    while (lastRow.length < 4) {
      lastRow.push({ day: 0, date: '', count: 0, level: -1 });
    }

    return { name: MONTH_NAMES[month], month, rows };
  });
}

export default function CalendarHeatmap({ completedDays }: Props) {
  const [selectedDay, setSelectedDay] = useState<CompletedDay | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const months = useMemo(() => {
    const dayMap: Record<string, CompletedDay> = {};
    completedDays.forEach(cd => { dayMap[cd.date] = cd; });
    return buildYearGrid(viewYear, dayMap);
  }, [completedDays, viewYear]);

  const cellSize = 26;
  const cellGap = 2;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0 }}>ИСТОРИЯ ВЫПОЛНЕНИЯ ЗАДАЧ ({viewYear})</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setViewYear(y => y - 1)}>◀ {viewYear - 1}</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setViewYear(new Date().getFullYear())}>ТЕКУЩИЙ ГОД</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setViewYear(y => y + 1)}>{viewYear + 1} ▶</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {months.map(m => (
          <div key={m.month} className="card-panel" style={{ padding: '16px' }}>
            <div className="micro-cap" style={{ marginBottom: '12px', fontSize: '11px' }}>{m.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: `${cellGap}px` }}>
              {m.rows.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: `${cellGap}px` }}>
                  {row.map((cell, ci) => {
                    if (cell.level === -1) {
                      return <div key={ci} style={{ width: `${cellSize}px`, height: `${cellSize}px` }} />;
                    }
                    const cd = completedDays.find(d => d.date === cell.date);
                    return (
                      <div
                        key={ci}
                        title={`${cell.date}: ${cell.count} задач`}
                        onClick={() => setSelectedDay(cd || { date: cell.date, count: 0, tasks: [] })}
                        style={{
                          width: `${cellSize}px`, height: `${cellSize}px`,
                          borderRadius: '4px', background: LEVEL_COLORS[cell.level],
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', color: cell.level > 2 ? '#ffffff' : 'var(--text-soft)',
                          fontWeight: cell.count > 0 ? 700 : 400, transition: 'all 0.15s ease',
                          border: selectedDay?.date === cell.date ? '2px solid #5aaa6f' : 'none'
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
