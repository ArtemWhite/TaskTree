import React from 'react';
import type { Task, Category, Difficulty } from '../../types';

export const DIFFICULTY_XP: Record<Difficulty, number> = { easy: 20, medium: 50, hard: 100 };

export interface TaskFormData {
  title: string;
  categoryId: string;
  difficulty: Difficulty;
  priority: 'low' | 'medium' | 'high';
  xp: number;
  deadlineDate: string;
  deadlineTime: string;
}

interface Props {
  form: TaskFormData;
  editingTask: Task | null;
  categories: Category[];
  onChangeForm: (updater: (prev: TaskFormData) => TaskFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const TaskFormPanel: React.FC<Props> = ({
  form,
  editingTask,
  categories,
  onChangeForm,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className="card-panel" style={{ marginBottom: '32px' }}>
      <h4 className="micro-cap" style={{ marginBottom: '16px' }}>
        {editingTask ? 'РЕДАКТИРОВАТЬ ЗАДАЧУ' : 'СОЗДАТЬ ЗАДАЧУ'}
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <input
          className="input-spacex"
          type="text"
          placeholder="Название задачи..."
          value={form.title}
          onChange={e => onChangeForm(f => ({ ...f, title: e.target.value }))}
          autoFocus
        />

        <select
          className="input-spacex"
          value={form.categoryId}
          onChange={e => onChangeForm(f => ({ ...f, categoryId: e.target.value }))}
        >
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>

        <select
          className="input-spacex"
          value={form.priority}
          onChange={e => onChangeForm(f => ({ ...f, priority: e.target.value as any }))}
        >
          <option value="high">🔴 Высокий приоритет</option>
          <option value="medium">🟡 Средний приоритет</option>
          <option value="low">🔵 Низкий приоритет</option>
        </select>

        <select
          className="input-spacex"
          value={form.difficulty}
          onChange={e => {
            const diff = e.target.value as Difficulty;
            onChangeForm(f => ({ ...f, difficulty: diff, xp: DIFFICULTY_XP[diff] }));
          }}
        >
          <option value="easy">🟢 Лёгкая (20 XP)</option>
          <option value="medium">🟡 Средняя (50 XP)</option>
          <option value="hard">🔴 Сложная (100 XP)</option>
        </select>

        <input
          className="input-spacex"
          type="date"
          value={form.deadlineDate}
          onChange={e => onChangeForm(f => ({ ...f, deadlineDate: e.target.value }))}
        />
        <input
          className="input-spacex"
          type="time"
          value={form.deadlineTime}
          onChange={e => onChangeForm(f => ({ ...f, deadlineTime: e.target.value }))}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button className="btn-ghost btn-ghost-sm" onClick={onSubmit}>
          {editingTask ? '💾 СОХРАНИТЬ' : '➕ СОЗДАТЬ'}
        </button>
        <button className="btn-ghost btn-ghost-sm" onClick={onCancel}>
          ✕ ОТМЕНА
        </button>
      </div>
    </div>
  );
};
