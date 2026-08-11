import React from 'react';
import { createPortal } from 'react-dom';
import type { Workout } from '../../types';
import { WorkoutService } from '../../services/WorkoutService';

interface Props {
  typeName: string;
  workouts: Workout[];
  onClose: () => void;
}

export const WorkoutTypeModal: React.FC<Props> = ({ typeName, workouts, onClose }) => {
  const typeWorkouts = workouts.filter(w => w.workoutType === typeName);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px', outline: 'none' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="micro-cap" style={{ margin: 0, fontSize: '16px' }}>
            Тренировки: {typeName}
          </h3>
          <button type="button" className="btn-ghost btn-ghost-xs" onClick={onClose}>
            ✕
          </button>
        </div>

        {typeWorkouts.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Нет тренировок этого типа.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
            {typeWorkouts.map(w => (
              <div
                key={w.id}
                style={{
                  padding: '10px 14px',
                  background: 'var(--surface-hover)',
                  borderRadius: '6px',
                  borderLeft: `3px solid ${WorkoutService.getTypeColor(w.workoutType)}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>{w.title}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(w.date + 'T12:00:00').toLocaleDateString('ru')}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                  ⏱ {w.duration} мин | ⚡ +{w.xp} XP | {w.completed ? '✅ Завершено' : '⏳ В ожидании'}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="btn-ghost btn-ghost-sm" style={{ marginTop: '16px', width: '100%' }} onClick={onClose}>
          ЗАКРЫТЬ
        </button>
      </div>
    </div>,
    document.body
  );
};
