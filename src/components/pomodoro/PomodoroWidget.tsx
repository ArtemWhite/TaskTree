import React from 'react';
import type { Task } from '../../types';

interface Props {
  task: Task;
  timeDisplay: string;
  isFinished: boolean;
  onExpand: () => void;
  onClose: () => void;
}

export const PomodoroWidget: React.FC<Props> = ({ task, timeDisplay, isFinished, onExpand, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 99,
        background: 'var(--bg-secondary)',
        border: `1px solid ${isFinished ? '#5aaa6f' : 'var(--hairline)'}`,
        borderRadius: '32px',
        padding: '10px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        animation: 'grow 0.3s ease-out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
      onClick={onExpand}
    >
      <span style={{ fontSize: '14px' }}>🍅</span>
      <span
        style={{
          fontSize: '20px',
          fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
          fontWeight: 700,
          letterSpacing: '1px',
          color: isFinished ? '#5aaa6f' : 'var(--text-primary)',
        }}
      >
        {isFinished ? 'ГОТОВО!' : timeDisplay}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          maxWidth: '120px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {task.title}
      </span>
      <button
        className="btn-ghost btn-ghost-xs"
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
        title="Завершить"
      >
        ✕
      </button>
    </div>
  );
};
