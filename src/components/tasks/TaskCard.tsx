import React from 'react';
import type { Category, Task } from '../../types';

interface TaskCardProps {
  task: Task;
  category?: Category;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStartPomodoro: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
  onStartPomodoro,
}) => {
  const getPriorityStyle = (p?: 'low' | 'medium' | 'high') => {
    if (p === 'high') return { label: 'ВЫСОКИЙ', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)' };
    if (p === 'low') return { label: 'НИЗКИЙ', color: '#74b9ff', bg: 'rgba(116, 185, 255, 0.1)' };
    return { label: 'СРЕДНИЙ', color: '#ff9f43', bg: 'rgba(255, 159, 67, 0.1)' };
  };

  const prio = getPriorityStyle(task.priority);

  const getDifficultyLabel = (diff: Task['difficulty']) => {
    if (diff === 'easy') return '🟢 Лёгкая';
    if (diff === 'hard') return '🔴 Сложная';
    return '🟡 Средняя';
  };

  return (
    <div
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
            {task.deadline && (
              <span>⏳ {new Date(task.deadline).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {task.pomodoroCount > 0 && <span>🍅 ×{task.pomodoroCount}</span>}
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
