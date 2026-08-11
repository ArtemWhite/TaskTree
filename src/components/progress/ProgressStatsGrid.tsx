import React from 'react';

interface StatBoxProps {
  label: string;
  value: number;
  suffix?: string;
  onClick?: () => void;
  title?: string;
}

export const StatBox: React.FC<StatBoxProps> = ({ label, value, suffix, onClick, title }) => (
  <div
    style={{
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.15s ease',
    }}
    onClick={onClick}
    title={title}
  >
    <div className="micro-cap" style={{ marginBottom: '4px' }}>
      {label}
    </div>
    <div
      style={{
        fontSize: '24px',
        fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
        fontWeight: 700,
        color: onClick ? '#ffb7c5' : 'inherit',
      }}
    >
      {value} {suffix && <span style={{ fontSize: '14px', color: 'var(--text-soft)', fontWeight: 400 }}>{suffix}</span>}
    </div>
  </div>
);

interface ProgressStatsGridProps {
  activeCount: number;
  completedCount: number;
  pomodoroSessions: number;
  workoutsCount: number;
  workoutsDuration: number;
  booksCount: number;
  booksPages: number;
  onShowPomodoroHistory?: () => void;
}

export const ProgressStatsGrid: React.FC<ProgressStatsGridProps> = ({
  activeCount,
  completedCount,
  pomodoroSessions,
  workoutsCount,
  workoutsDuration,
  booksCount,
  booksPages,
  onShowPomodoroHistory,
}) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', marginTop: '24px' }}>
      <StatBox label="АКТИВНЫХ ЗАДАЧ" value={activeCount} />
      <StatBox label="ВЫПОЛНЕННЫХ ЗАДАЧ" value={completedCount} />
      <StatBox
        label="ПОМОДОРО-СЕССИЙ"
        value={pomodoroSessions}
        onClick={onShowPomodoroHistory}
        title={onShowPomodoroHistory ? 'Нажмите, чтобы посмотреть историю помодоро' : undefined}
      />
      <StatBox label="ТРЕНИРОВОК" value={workoutsCount} />
      <StatBox label="ВРЕМЯ ТРЕНИРОВОК" value={workoutsDuration} suffix="мин" />
      <StatBox label="КНИГ ПРОЧИТАНО" value={booksCount} />
      <StatBox label="СТРАНИЦ ПРОЧИТАНО" value={booksPages} />
    </div>
  );
};
