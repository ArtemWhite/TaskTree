import React, { useState } from 'react';
import type { Workout, WorkoutTypeDef } from '../../types';

interface Props {
  onlyCustomTypes: WorkoutTypeDef[];
  workouts: Workout[];
  onSelectTypeForModal: (typeName: string) => void;
}

export const MyWorkoutTypesList: React.FC<Props> = ({ onlyCustomTypes, workouts, onSelectTypeForModal }) => {
  const [showTypeManager, setShowTypeManager] = useState(false);

  if (onlyCustomTypes.length === 0) return null;

  return (
    <div className="card-panel" style={{ marginBottom: '24px' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setShowTypeManager(!showTypeManager)}
      >
        <h4 className="micro-cap" style={{ margin: 0, cursor: 'pointer' }}>
          ⭐ МОИ ТИПЫ ТРЕНИРОВОК ({onlyCustomTypes.length})
        </h4>
        <button type="button" className="btn-ghost btn-ghost-xs">
          {showTypeManager ? '▲' : '▼'}
        </button>
      </div>
      {showTypeManager && (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {onlyCustomTypes.map(type => (
            <div
              key={type.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'var(--surface-hover)',
                borderRadius: '4px',
              }}
            >
              <span style={{ fontSize: '16px' }}>{type.icon}</span>
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  borderRadius: '3px',
                  background: type.color,
                  border: '1px solid var(--hairline)',
                }}
              />
              <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{type.name}</span>
              <button
                type="button"
                className="badge"
                style={{ fontSize: '10px', cursor: 'pointer', background: 'transparent' }}
                onClick={e => {
                  e.stopPropagation();
                  onSelectTypeForModal(type.name);
                }}
              >
                {workouts.filter(w => w.workoutType === type.name).length} тренировок
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
