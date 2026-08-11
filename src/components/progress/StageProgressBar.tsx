import React from 'react';

interface Props {
  levelInfo: { current: number; next: number; level: number };
  totalXP: number;
  sideLayout?: boolean;
}

export const StageProgressBar: React.FC<Props> = ({ levelInfo, totalXP, sideLayout }) => {
  const percent = levelInfo.next > 0 ? (levelInfo.current / levelInfo.next) * 100 : 100;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: sideLayout ? '300px' : '400px',
        margin: sideLayout ? '0 0 24px 0' : '0 auto 24px auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '12px',
          color: 'var(--text-soft)',
        }}
      >
        <span>Уровень {levelInfo.level}</span>
        <span>{totalXP} XP всего</span>
      </div>
      <div className="progress-bar" style={{ height: '4px' }}>
        <div className="progress-bar-fill" style={{ width: `${percent}%`, height: '100%' }} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '11px',
          color: 'var(--text-muted)',
          letterSpacing: '0.8px',
        }}
      >
        <span>{levelInfo.current} XP</span>
        <span>{levelInfo.next} XP</span>
      </div>
    </div>
  );
};
