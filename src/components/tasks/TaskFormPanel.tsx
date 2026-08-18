import React from 'react';
import type { Task, Category, Difficulty } from '../../types';
import { DIFFICULTY_META, DIFFICULTY_ORDER } from '../../constants/difficulty';

export interface TaskFormData {
  title: string;
  categoryId: string;
  difficulty: Difficulty;
  priority: 'low' | 'medium' | 'high';
  xp: number;
  deadlineDate: string;
  deadlineTime: string;
  isBackdated: boolean;
  createdAtDate: string;
  completedAtDate: string;
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
          onChange={e => onChangeForm(f => ({ ...f, priority: e.target.value as TaskFormData['priority'] }))}
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
            onChangeForm(f => ({ ...f, difficulty: diff, xp: DIFFICULTY_META[diff].xp }));
          }}
        >
          {DIFFICULTY_ORDER.map(d => {
            const meta = DIFFICULTY_META[d];
            return (
              <option key={d} value={d}>
                {meta.emoji} {meta.label} ({meta.xp} XP)
              </option>
            );
          })}
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

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          color: 'var(--text-soft)',
        }}
      >
        <input
          className="checkbox-spacex"
          type="checkbox"
          checked={form.isBackdated}
          onChange={e => onChangeForm(f => ({ ...f, isBackdated: e.target.checked, createdAtDate: e.target.checked ? f.createdAtDate : '', completedAtDate: e.target.checked ? f.completedAtDate : '' }))}
        />
        ⏪ Задача из прошлого
      </label>

      {form.isBackdated && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '260px' }}>
            <label
              className="micro-cap"
              style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
            >
              Дата создания
            </label>
            <input
              className="input-spacex"
              type="date"
              value={form.createdAtDate}
              onChange={e => onChangeForm(f => ({ ...f, createdAtDate: e.target.value }))}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '260px' }}>
            <label
              className="micro-cap"
              style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}
            >
              Дата выполнения
            </label>
            <input
              className="input-spacex"
              type="date"
              value={form.completedAtDate}
              title="Необязательно — оставьте пустым, если задача ещё не выполнена"
              onChange={e => onChangeForm(f => ({ ...f, completedAtDate: e.target.value }))}
            />
          </div>
        </div>
      )}

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
