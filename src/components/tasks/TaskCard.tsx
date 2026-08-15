import React from 'react';
import type { Category, Task } from '../../types';
import { getDifficultyLabel } from '../../constants/difficulty';
import { getPriorityMeta } from '../../constants/priority';

interface TaskCardProps {
  task: Task;
  category?: Category;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStartPomodoro: (task: Task) => void;
  onShowPomodoroHistory?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
  onStartPomodoro,
  onShowPomodoroHistory,
}) => {
  const prio = getPriorityMeta(task.priority);

  return (
    <div
      id={`task-card-${task.id}`}
      className="card-panel"
      style={{
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        borderLeft: `4px solid ${category?.color || '#ffffff'}`,
        opacity: task.completed ? 0.7 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => (task.completed ? onUncomplete(task.id) : onComplete(task.id))}
          style={{ width: '20px', height: '20px', cursor: 'pointer' }}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '16px', textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.title}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                color: prio.color,
                background: prio.bg,
                border: `1px solid ${prio.color}`,
              }}
            >
              {prio.label}
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span>{category?.emoji || '📝'} {category?.name || 'Без категории'}</span>
            <span>{getDifficultyLabel(task.difficulty)}</span>
            <span>⚡ +{task.xp} XP</span>
            {task.deadline && (() => {
              const isOverdue = !task.completed && new Date(task.deadline).getTime() < Date.now();
              return (
                <span
                  style={{
                    color: isOverdue ? '#ff6b6b' : 'var(--text-soft)',
                    fontWeight: isOverdue ? 700 : 400,
                    background: isOverdue ? 'rgba(255, 107, 107, 0.12)' : 'transparent',
                    padding: isOverdue ? '2px 6px' : '0',
                    borderRadius: '4px',
                    border: isOverdue ? '1px solid rgba(255, 107, 107, 0.3)' : 'none',
                  }}
                >
                  {isOverdue ? '⚠️ ' : '⏳ '}
                  {new Date(task.deadline).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {isOverdue ? ' (Просрочено)' : ''}
                </span>
              );
            })()}
            {task.completed && (task.completedDate || task.createdAt) && (
              <span style={{ color: '#5aaa6f', fontWeight: 600 }}>
                ✅ {new Date(task.completedDate || task.createdAt).toLocaleString('ru', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {task.pomodoroCount > 0 && (
              <span
                style={{
                  cursor: 'pointer',
                  color: '#ffb7c5',
                  fontWeight: 600,
                  background: 'rgba(255, 183, 197, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 183, 197, 0.2)',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => onShowPomodoroHistory?.(task)}
                title="Нажмите, чтобы просмотреть историю помодоро"
              >
                🍅 ×{task.pomodoroCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {!task.completed && (
          <button className="btn-ghost btn-ghost-xs" style={{ color: '#ffb7c5', borderColor: '#ffb7c5' }} onClick={() => onStartPomodoro(task)}>
            🍅 ПОМОДОРО
          </button>
        )}
        <button className="btn-ghost btn-ghost-xs" onClick={() => onEdit(task)}>
          ✏️
        </button>
        <button className="btn-ghost btn-ghost-xs" style={{ color: '#ff6b6b' }} onClick={() => onDelete(task.id)}>
          🗑️
        </button>
      </div>
    </div>
  );
};
