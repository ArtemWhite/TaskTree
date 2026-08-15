import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../../types';

interface Props {
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  onResetTimer: () => void;
}

export const PomodoroSettingsPanel: React.FC<Props> = ({ settings, onUpdateSettings, onResetTimer }) => {
  const [editMode, setEditMode] = useState(false);
  const [customMin, setCustomMin] = useState(settings.pomodoroWorkMinutes);

  useEffect(() => {
    setCustomMin(settings.pomodoroWorkMinutes);
  }, [settings.pomodoroWorkMinutes]);

  const applyCustom = () => {
    onUpdateSettings({
      pomodoroWorkMinutes: Math.max(1, Math.min(120, customMin)),
    });
  };

  return (
    <>
      {/* Time presets */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
        {[25, 15, 5].map(m => (
          <button
            key={m}
            className="btn-ghost btn-ghost-xs"
            style={{ background: settings.pomodoroWorkMinutes === m ? 'var(--ghost-hover)' : 'transparent' }}
            onClick={() => {
              onUpdateSettings({ pomodoroWorkMinutes: m });
              onResetTimer();
            }}
          >
            {m} МИН
          </button>
        ))}
        <button className="btn-ghost btn-ghost-xs" onClick={() => setEditMode(!editMode)}>
          {editMode ? 'СКРЫТЬ' : '⸬ НАСТРОЙКИ'}
        </button>
      </div>

      {/* Collapsible Settings panel */}
      <div
        style={{
          maxHeight: editMode ? '80px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease, margin 0.3s ease',
          marginBottom: editMode ? '12px' : '0px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            background: 'var(--surface-hover)',
            borderRadius: '8px',
            border: '1px solid var(--hairline)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                whiteSpace: 'nowrap',
              }}
            >
              Мин:
            </span>
            <div className="spin-wrap" style={{ width: '75px' }}>
              <input
                type="number"
                className="input-spacex spin-input"
                style={{ textAlign: 'center', padding: '8px 6px' }}
                value={customMin}
                min={1}
                max={120}
                onChange={e => setCustomMin(Number(e.target.value) || 1)}
              />
              <div className="spin-btns">
                <button type="button" className="spin-btn" onClick={() => setCustomMin(m => Math.min(m + 1, 120))}>
                  ▲
                </button>
                <button type="button" className="spin-btn" onClick={() => setCustomMin(m => Math.max(m - 1, 1))}>
                  ▼
                </button>
              </div>
            </div>
          </div>

          <button className="btn-ghost btn-ghost-xs" onClick={applyCustom} style={{ whiteSpace: 'nowrap' }}>
            ПРИМЕНИТЬ
          </button>
        </div>
      </div>
    </>
  );
};
