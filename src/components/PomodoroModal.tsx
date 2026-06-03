import { useState, useEffect, useRef } from 'react';
import type { Task, AppSettings } from '../types';

interface Props {
  task: Task;
  settings: AppSettings;
  onClose: () => void;
  onComplete: (xp: number) => void;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  onSessionFinished?: (wasMinimized: boolean) => void;
  restoreSignal?: number;
}

export default function PomodoroModal({ task, settings, onClose, onComplete, onUpdateSettings, onSessionFinished, restoreSignal }: Props) {
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroWorkMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [customMin, setCustomMin] = useState(settings.pomodoroWorkMinutes);
  const [customXP, setCustomXP] = useState(settings.pomodoroBonusXP);
  const [minimized, setMinimized] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minimizedRef = useRef(minimized);
  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);
  useEffect(() => { setMinimized(false); }, [restoreSignal]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    }
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsFinished(true);
      onSessionFinished?.(minimizedRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft]);

  useEffect(() => {
    setTimeLeft(settings.pomodoroWorkMinutes * 60);
    setCustomMin(settings.pomodoroWorkMinutes);
  }, [settings.pomodoroWorkMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (settings.pomodoroWorkMinutes * 60);

  const handleComplete = () => {
    setMinimized(false);
    onComplete(settings.pomodoroBonusXP);
    setIsFinished(false);
    onClose();
  };

  const applyCustom = () => {
    onUpdateSettings({ pomodoroWorkMinutes: Math.max(1, Math.min(120, customMin)), pomodoroBonusXP: Math.max(1, Math.min(100, customXP)) });
  };

  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Minimized floating widget
  if (minimized && !isFinished) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 99,
        background: 'var(--bg-secondary)', border: '1px solid var(--hairline)',
        borderRadius: '32px', padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: '12px',
        cursor: 'pointer', animation: 'grow 0.3s ease-out',
      }} onClick={() => setMinimized(false)}>
        <span style={{ fontSize: '14px' }}>🍅</span>
        <span style={{
          fontSize: '20px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
          fontWeight: 700, letterSpacing: '1px', color: 'var(--text-primary)',
        }}>{timeDisplay}</span>
        <span style={{
          fontSize: '12px', color: 'var(--text-muted)', maxWidth: '120px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{task.title}</span>
        <button className="btn-ghost btn-ghost-xs"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          title="Завершить">✕</button>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={() => { if (isRunning && !isFinished) { setMinimized(true); } else { onClose(); } }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', minWidth: '380px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="micro-cap" style={{ margin: 0 }}>🍅 ПОМОДОРО</h3>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button className="btn-ghost btn-ghost-xs" onClick={() => setMinimized(true)} title="Свернуть">_</button>
            <button className="btn-ghost btn-ghost-xs" onClick={onClose}>✕</button>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '8px' }}>{task.title}</p>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          ПОМОДОРО-СЕССИЙ: {task.pomodoroCount}
        </div>

        {/* Timer circle */}
        <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px' }}>
          <svg viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="90" cy="90" r="80" fill="none" stroke="var(--hairline)" strokeWidth="4" />
            <circle cx="90" cy="90" r="80" fill="none" stroke="var(--text-primary)" strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress)}`}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '42px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '1px' }}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Time presets */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
          {[25, 15, 5].map(m => (
            <button key={m} className="btn-ghost btn-ghost-xs"
              style={{ background: settings.pomodoroWorkMinutes === m ? 'var(--ghost-hover)' : 'transparent' }}
              onClick={() => { onUpdateSettings({ pomodoroWorkMinutes: m }); setTimeLeft(m * 60); setIsRunning(false); }}>
              {m} МИН
            </button>
          ))}
          <button className="btn-ghost btn-ghost-xs" onClick={() => setEditMode(!editMode)}>
            {editMode ? 'СКРЫТЬ' : '⸬ НАСТРОЙКИ'}
          </button>
        </div>

        {/* Settings panel — always in DOM, just hidden */}
        <div style={{
          maxHeight: editMode ? '80px' : '0px', overflow: 'hidden',
          transition: 'max-height 0.3s ease, margin 0.3s ease',
          marginBottom: editMode ? '12px' : '0px'
        }}>
          <div style={{
            display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center',
            padding: '12px', background: 'var(--surface-hover)', borderRadius: '8px',
            border: '1px solid var(--hairline)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>Мин:</span>
              <div className="spin-wrap" style={{ width: '75px' }}>
                <input type="number" className="input-spacex spin-input" style={{ textAlign: 'center', padding: '8px 6px' }}
                  value={customMin} min={1} max={120}
                  onChange={e => setCustomMin(Number(e.target.value) || 1)} />
                <div className="spin-btns">
                  <button type="button" className="spin-btn" onClick={() => setCustomMin(m => Math.min(m + 1, 120))}>▲</button>
                  <button type="button" className="spin-btn" onClick={() => setCustomMin(m => Math.max(m - 1, 1))}>▼</button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>XP:</span>
              <div className="spin-wrap" style={{ width: '75px' }}>
                <input type="number" className="input-spacex spin-input" style={{ textAlign: 'center', padding: '8px 6px' }}
                  value={customXP} min={1} max={100}
                  onChange={e => setCustomXP(Number(e.target.value) || 1)} />
                <div className="spin-btns">
                  <button type="button" className="spin-btn" onClick={() => setCustomXP(x => Math.min(x + 1, 100))}>▲</button>
                  <button type="button" className="spin-btn" onClick={() => setCustomXP(x => Math.max(x - 1, 1))}>▼</button>
                </div>
              </div>
            </div>
            <button className="btn-ghost btn-ghost-xs" onClick={applyCustom} style={{ whiteSpace: 'nowrap' }}>ПРИМЕНИТЬ</button>
          </div>
        </div>

        {/* Controls */}
        {!isFinished ? (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {!isRunning ? (
              <button className="btn-ghost" onClick={() => setIsRunning(true)} disabled={timeLeft === 0}>
                {timeLeft === settings.pomodoroWorkMinutes * 60 ? 'СТАРТ' : 'ПРОДОЛЖИТЬ'}
              </button>
            ) : (
              <button className="btn-ghost" onClick={() => setIsRunning(false)}>ПАУЗА</button>
            )}
            <button className="btn-ghost" onClick={() => { setTimeLeft(settings.pomodoroWorkMinutes * 60); setIsRunning(false); }}>
              СБРОС
            </button>
          </div>
        ) : (
          <div style={{ animation: 'grow 0.6s ease-out' }}>
            <p style={{ fontSize: '18px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '16px', color: '#5aaa6f' }}>
              СЕССИЯ ЗАВЕРШЕНА!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '16px' }}>
              Фокус-сессия по задаче «{task.title}» завершена.
              <br />+{settings.pomodoroBonusXP} бонусного XP!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={handleComplete}>ЗАБРАТЬ XP</button>
              <button className="btn-ghost btn-ghost-sm" onClick={() => { setTimeLeft(settings.pomodoroWorkMinutes * 60); setIsFinished(false); setIsRunning(true); }}>
                ЕЩЁ СЕССИЯ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
