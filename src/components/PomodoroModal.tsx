import { useState, useEffect, useRef } from 'react';
import type { Task, AppSettings } from '../types';

interface Props {
  task: Task;
  settings: AppSettings;
  onClose: () => void;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  onSessionFinished: (wasMinimized: boolean, xp: number) => void;
  restoreSignal?: number;
}

export default function PomodoroModal({ task, settings, onClose, onUpdateSettings, onSessionFinished, restoreSignal }: Props) {
  const totalMs = settings.pomodoroWorkMinutes * 60 * 1000;
  const [endTime, setEndTime] = useState<number | null>(null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState(totalMs);
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [customMin, setCustomMin] = useState(settings.pomodoroWorkMinutes);
  const [customXP, setCustomXP] = useState(settings.pomodoroBonusXP);
  const [minimized, setMinimized] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minimizedRef = useRef(minimized);
  const finishedRef = useRef(false);

  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);
  useEffect(() => { setMinimized(false); }, [restoreSignal]);

  // Timestamp-based high-frequency timer (50ms update rate) for silky smooth ring movement
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const currentEndTime = endTime ?? now;
      const left = Math.max(0, currentEndTime - now);
      setRemainingMs(left);

      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        setIsRunning(false);
        setIsFinished(true);
        setEndTime(null);
        setPausedRemainingMs(0);
        onSessionFinished(minimizedRef.current, settings.pomodoroBonusXP);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }
    }, 50);

    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isRunning, endTime, settings.pomodoroBonusXP, onSessionFinished]);

  const isRunningRef = useRef(isRunning);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  useEffect(() => {
    setCustomMin(settings.pomodoroWorkMinutes);
    if (isRunningRef.current) return;
    const ms = settings.pomodoroWorkMinutes * 60 * 1000;
    setPausedRemainingMs(ms);
    setRemainingMs(ms);
    setEndTime(null);
    finishedRef.current = false;
  }, [settings.pomodoroWorkMinutes]);

  const startTimer = () => {
    const ms = (pausedRemainingMs > 0 && pausedRemainingMs < settings.pomodoroWorkMinutes * 60 * 1000)
      ? pausedRemainingMs
      : settings.pomodoroWorkMinutes * 60 * 1000;

    finishedRef.current = false;
    setIsFinished(false);
    setPausedRemainingMs(ms);
    setRemainingMs(ms);
    setEndTime(Date.now() + ms);
    setIsRunning(true);
  };

  const startNewSession = () => {
    const ms = settings.pomodoroWorkMinutes * 60 * 1000;
    finishedRef.current = false;
    setIsFinished(false);
    setPausedRemainingMs(ms);
    setRemainingMs(ms);
    setEndTime(Date.now() + ms);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setPausedRemainingMs(remainingMs);
    setEndTime(null);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    finishedRef.current = false;
    const ms = settings.pomodoroWorkMinutes * 60 * 1000;
    setPausedRemainingMs(ms);
    setRemainingMs(ms);
    setEndTime(null);
  };

  const displaySec = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(displaySec / 60);
  const seconds = displaySec % 60;
  const progress = isFinished ? 1 : Math.min(1, Math.max(0, 1 - remainingMs / totalMs));

  const handleClose = () => {
    setMinimized(false);
    setIsFinished(false);
    finishedRef.current = false;
    onClose();
  };

  const applyCustom = () => {
    onUpdateSettings({ pomodoroWorkMinutes: Math.max(1, Math.min(120, customMin)), pomodoroBonusXP: Math.max(1, Math.min(100, customXP)) });
  };

  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Minimized floating widget
  if (minimized) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 99,
        background: 'var(--bg-secondary)', border: `1px solid ${isFinished ? '#5aaa6f' : 'var(--hairline)'}`,
        borderRadius: '32px', padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: '12px',
        cursor: 'pointer', animation: 'grow 0.3s ease-out',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }} onClick={() => setMinimized(false)}>
        <span style={{ fontSize: '14px' }}>🍅</span>
        <span style={{
          fontSize: '20px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
          fontWeight: 700, letterSpacing: '1px', color: isFinished ? '#5aaa6f' : 'var(--text-primary)',
        }}>{isFinished ? 'ГОТОВО!' : timeDisplay}</span>
        <span style={{
          fontSize: '12px', color: 'var(--text-muted)', maxWidth: '120px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{task.title}</span>
        <button className="btn-ghost btn-ghost-xs"
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
          title="Завершить">✕</button>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={() => { if (!isFinished) { setMinimized(true); } else { handleClose(); } }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', minWidth: '380px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 className="micro-cap" style={{ margin: 0 }}>🍅 ПОМОДОРО</h3>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button className="btn-ghost btn-ghost-xs" onClick={() => setMinimized(true)} title="Свернуть">_</button>
            <button className="btn-ghost btn-ghost-xs" onClick={handleClose}>✕</button>
          </div>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '8px' }}>{task.title}</p>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '24px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
          ПОМОДОРО-СЕССИЙ: {task.pomodoroCount || 0}
        </div>

        {/* Timer circle with silky smooth continuous 50ms animation */}
        <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 24px' }}>
          <svg viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="90" cy="90" r="80" fill="none" stroke="var(--hairline)" strokeWidth="4" />
            <circle cx="90" cy="90" r="80" fill="none" stroke={isFinished ? '#5aaa6f' : 'var(--text-primary)'} strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - progress)}`}
              style={{ transition: isRunning ? 'stroke-dashoffset 0.06s linear' : 'stroke-dashoffset 0.3s ease-out' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: '42px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '1px' }}>
              {timeDisplay}
            </span>
          </div>
        </div>

        {/* Time presets */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
          {[25, 15, 5].map(m => (
            <button key={m} className="btn-ghost btn-ghost-xs"
              style={{ background: settings.pomodoroWorkMinutes === m ? 'var(--ghost-hover)' : 'transparent' }}
              onClick={() => { onUpdateSettings({ pomodoroWorkMinutes: m }); resetTimer(); }}>
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
              <button className="btn-ghost" onClick={startTimer} disabled={remainingMs === 0}>
                {remainingMs === settings.pomodoroWorkMinutes * 60 * 1000 ? 'СТАРТ' : 'ПРОДОЛЖИТЬ'}
              </button>
            ) : (
              <button className="btn-ghost" onClick={pauseTimer}>ПАУЗА</button>
            )}
            <button className="btn-ghost" onClick={resetTimer}>
              СБРОС
            </button>
          </div>
        ) : (
          <div style={{ animation: 'grow 0.6s ease-out' }}>
            <p style={{ fontSize: '18px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '16px', color: '#5aaa6f' }}>
              🎉 СЕССИЯ ЗАВЕРШЕНА!
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginBottom: '16px' }}>
              Фокус-сессия по задаче «{task.title}» завершена.
              <br />+{settings.pomodoroBonusXP} бонусного XP!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={handleClose}>ЗАБРАТЬ XP</button>
              <button className="btn-ghost btn-ghost-sm" onClick={startNewSession}>
                ЕЩЁ СЕССИЯ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
