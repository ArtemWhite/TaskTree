import React from 'react';

interface Props {
  timeDisplay: string;
  progress: number;
  isRunning: boolean;
  isFinished: boolean;
}

export const PomodoroTimerRing: React.FC<Props> = ({ timeDisplay, progress, isRunning, isFinished }) => {
  const strokeDashoffset = 2 * Math.PI * 80 * (1 - progress);

  return (
    <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px' }}>
      <svg viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="90" cy="90" r="80" fill="none" stroke="var(--hairline)" strokeWidth="4" />
        <circle
          cx="90"
          cy="90"
          r="80"
          fill="none"
          stroke={isFinished ? '#5aaa6f' : 'var(--text-primary)'}
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 80}`}
          strokeDashoffset={`${strokeDashoffset}`}
          style={{ transition: isRunning ? 'stroke-dashoffset 0.06s linear' : 'stroke-dashoffset 0.3s ease-out' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: '42px',
            fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
            fontWeight: 700,
            letterSpacing: '1px',
          }}
        >
          {timeDisplay}
        </span>
      </div>
    </div>
  );
};
