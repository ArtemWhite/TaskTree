import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CompletedDay } from '../../types';
import { CalendarService, type BaseCalendarCell } from '../../services/CalendarService';

interface Props {
  completedDays: CompletedDay[];
  onNavigateToTask?: (taskId: string) => void;
}

interface DayCell extends BaseCalendarCell { day: number; date: string; count: number; level: number; }

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

export default function CalendarHeatmap({ completedDays, onNavigateToTask }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<CompletedDay | null>(null);

  const months = useMemo(() => {
    const activityMap: Record<string, { count: number }> = {};
    completedDays.forEach(d => {
      activityMap[d.date] = { count: d.count };
    });

    return CalendarService.buildYearGrid<DayCell>(
      year,
      (day, dateStr) => {
        const info = activityMap[dateStr];
        const count = info ? info.count : 0;
        return { day, date: dateStr, count, level: CalendarService.getLevel(count) };
      },
      () => ({ day: 0, date: '', count: 0, level: -1 })
    );
  }, [year, completedDays]);

  return (
    <div className="card-panel">
      {/* Year switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 className="micro-cap" style={{ margin: 0, fontSize: '14px' }}>🔥 ИСТОРИЯ ВЫПОЛНЕНИЯ ЗАДАЧ ({year})</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setYear(y => y - 1)}>◀ {year - 1}</button>
          <button className="btn-ghost btn-ghost-xs" style={{ background: 'var(--ghost-hover)' }} onClick={() => setYear(new Date().getFullYear())}>ТЕКУЩИЙ ГОД</button>
          <button className="btn-ghost btn-ghost-xs" onClick={() => setYear(y => y + 1)}>{year + 1} ▶</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <span>Меньше</span>
        {[0, 1, 2, 3, 4].map(lvl => (
          <div key={lvl} style={{ width: '14px', height: '14px', borderRadius: '3px', ...getHeatmapStyle(lvl, false) }} />
        ))}
        <span>Больше задач</span>
      </div>

      {/* Months Grid (3 columns on desktop) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {months.map(m => (
          <div key={m.month} style={{ background: 'var(--surface-hover)', borderRadius: '8px', padding: '12px', border: '1px solid var(--hairline)' }}>
            <div style={{ fontWeight: 700, fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-soft)', marginBottom: '8px', letterSpacing: '0.8px' }}>
              {m.name}
            </div>

            {/* Weekday headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px', textAlign: 'center' }}>
              {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                <span key={d} style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>{d}</span>
              ))}
            </div>

            {/* 7-Column Days Grid */}
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

      {selectedDay && createPortal(
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
                    <div
                      key={t.id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--surface-hover)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-soft)', marginTop: '2px' }}>⚡ +{t.xp} XP</div>
                      </div>
                      {onNavigateToTask && (
                        <button
                          className="btn-ghost btn-ghost-xs"
                          style={{ color: '#5aaa6f', borderColor: '#5aaa6f', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            onNavigateToTask(t.id);
                            setSelectedDay(null);
                          }}
                          title="Перейти к этой задаче в списке"
                        >
                          🔗 ПЕРЕЙТИ
                        </button>
                      )}
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
