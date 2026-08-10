import React from 'react';
import type { Workout, WorkoutTypeDef } from '../../types';
import { WorkoutService } from '../../services/WorkoutService';

interface WorkoutCardProps {
  workout: Workout;
  allWorkoutTypes: WorkoutTypeDef[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onEdit: (workout: Workout) => void;
  onDelete: (id: string) => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = ({
  workout,
  allWorkoutTypes,
  isExpanded,
  onToggleExpand,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
}) => {
  const icon = WorkoutService.getTypeIcon(workout.workoutType, allWorkoutTypes);
  const color = WorkoutService.getTypeColor(workout.workoutType, allWorkoutTypes);

  return (
    <div
      className="card"
      style={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: `4px solid ${color}`,
        opacity: workout.completed ? 0.7 : 1,
        transition: 'all 0.2s ease',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '24px', flexShrink: 0 }}>{icon}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '16px', textDecoration: workout.completed ? 'line-through' : 'none', wordBreak: 'break-word' }}>
              {workout.title || workout.workoutType}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '2px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span>📅 {workout.date}</span>
              <span>⏱ {workout.duration} мин</span>
              <span style={{ color: '#5aaa6f', fontWeight: 600 }}>+{workout.xp} XP</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {workout.completed ? (
            <button className="btn-ghost btn-ghost-xs" onClick={() => onUncomplete(workout.id)}>
              ↩ ВЕРНУТЬ
            </button>
          ) : (
            <button className="btn-ghost btn-ghost-xs" style={{ color: '#5aaa6f', borderColor: '#5aaa6f' }} onClick={() => onComplete(workout.id)}>
              ✓ ВЫПОЛНИТЬ
            </button>
          )}
          <button className="btn-ghost btn-ghost-xs" onClick={() => onEdit(workout)}>
            ✏️
          </button>
          <button className="btn-ghost btn-ghost-xs" style={{ color: '#ff6b6b' }} onClick={() => onDelete(workout.id)}>
            🗑️
          </button>
        </div>
      </div>

      {workout.notes && (
        <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: '8px' }}>
          <button
            className="btn-ghost btn-ghost-xs"
            style={{ fontSize: '11px', color: 'var(--text-soft)' }}
            onClick={onToggleExpand}
          >
            {isExpanded ? '📝 ▲ Скрыть заметку' : '📝 ▼ Показать заметку'}
          </button>
          {isExpanded && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-soft)',
                marginTop: '8px',
                padding: '10px 14px',
                background: 'var(--surface-hover)',
                borderRadius: '8px',
                border: '1px solid var(--border-soft)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                fontStyle: 'italic',
                lineHeight: '1.5',
                boxSizing: 'border-box',
              }}
            >
              📝 {workout.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
