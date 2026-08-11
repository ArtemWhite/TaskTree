import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Task, AppSettings } from '../types';
import { usePomodoroTimer } from '../hooks/usePomodoroTimer';
import { PomodoroTimerRing } from './pomodoro/PomodoroTimerRing';
import { PomodoroSettingsPanel } from './pomodoro/PomodoroSettingsPanel';
import { PomodoroControls } from './pomodoro/PomodoroControls';
import { PomodoroWidget } from './pomodoro/PomodoroWidget';

interface Props {
  task: Task;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  onSessionFinished: (wasMinimized: boolean, xp: number, durationMinutes: number) => void;
}

export default function PomodoroModal({ task, settings, onClose, onUpdateSettings, onSessionFinished }: Props) {
  const [minimized, setMinimized] = useState(false);

  const {
    remainingMs,
    isRunning,
    isFinished,
    progress,
    timeDisplay,
    startTimer,
    startNewSession,
    pauseTimer,
    resetTimer,
    setIsFinished,
  } = usePomodoroTimer({
    task,
    settings,
    minimized,
    onSessionFinished,
  });

  const handleClose = () => {
    setMinimized(false);
    setIsFinished(false);
    onClose();
  };

  // Minimized floating widget
  if (minimized) {
    return (
      <PomodoroWidget
        task={task}
        timeDisplay={timeDisplay}
        isFinished={isFinished}
        onExpand={() => setMinimized(false)}
        onClose={handleClose}
      />
    );
  }

  return createPortal(
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isFinished) {
          setMinimized(true);
        } else {
          handleClose();
        }
      }}
    >
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', minWidth: '380px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="micro-cap" style={{ margin: 0 }}>
            🍅 ПОМОДОРО
          </h3>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button className="btn-ghost btn-ghost-xs" onClick={() => setMinimized(true)} title="Свернуть">
              _
            </button>
            <button className="btn-ghost btn-ghost-xs" onClick={handleClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Task Info */}
        <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '8px' }}>{task.title}</p>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginBottom: '24px',
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
          }}
        >
          ПОМОДОРО-СЕССИЙ: {task.pomodoroCount || 0}
        </div>

        {/* Timer SVG Ring */}
        <PomodoroTimerRing
          timeDisplay={timeDisplay}
          progress={progress}
          isRunning={isRunning}
          isFinished={isFinished}
        />

        {/* Settings Presets and Panel */}
        <PomodoroSettingsPanel
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onResetTimer={resetTimer}
        />

        {/* Control Buttons */}
        <PomodoroControls
          task={task}
          settings={settings}
          isRunning={isRunning}
          isFinished={isFinished}
          remainingMs={remainingMs}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          onClose={handleClose}
          onNewSession={startNewSession}
        />
      </div>
    </div>,
    document.body
  );
}
