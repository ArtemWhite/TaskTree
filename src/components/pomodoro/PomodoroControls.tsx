import React from 'react';
import type { Task, AppSettings } from '../../types';

interface Props {
  task: Task;
  settings: AppSettings;
  isRunning: boolean;
  isFinished: boolean;
  remainingMs: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onClose: () => void;
  onNewSession: () => void;
}

export const PomodoroControls: React.FC<Props> = ({
  task,
  settings,
  isRunning,
  isFinished,
  remainingMs,
  onStart,
  onPause,
  onReset,
  onClose,
  onNewSession,
}) => {
  if (isFinished) {
    return (
      <div style={{ animation: 'grow 0.6s ease-out' }}>
        <p
          style={{
            fontSize: '18px',
            fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            marginBottom: '16px',
            color: '#5aaa6f',
          }}
        >
          🎉 СЕССИЯ ЗАВЕРШЕНА!
        </p>
        <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '16px' }}>
          Фокус-сессия по задаче «{task.title}» завершена.
          <br />+{settings.pomodoroBonusXP} бонусного XP!
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn-ghost" onClick={onClose}>
            ЗАБРАТЬ XP
          </button>
          <button className="btn-ghost btn-ghost-sm" onClick={onNewSession}>
            ЕЩЁ СЕССИЯ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
      {!isRunning ? (
        <button className="btn-ghost" onClick={onStart} disabled={remainingMs === 0}>
          {remainingMs === settings.pomodoroWorkMinutes * 60 * 1000 ? 'СТАРТ' : 'ПРОДОЛЖИТЬ'}
        </button>
      ) : (
        <button className="btn-ghost" onClick={onPause}>
          ПАУЗА
        </button>
      )}
      <button className="btn-ghost" onClick={onReset}>
        СБРОС
      </button>
    </div>
  );
};
