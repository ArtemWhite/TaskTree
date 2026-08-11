import React from 'react';
import type { Category } from '../../types';

export type TaskSortBy = 'createdAt' | 'completedDate' | 'deadline' | 'title' | 'createdAt+deadline' | 'priority';

interface Props {
  showForm: boolean;
  searchTerm: string;
  filterCategory: string;
  filterDifficulty: string;
  sortBy: TaskSortBy;
  sortDir: 'asc' | 'desc';
  groupByDate: boolean;
  groupByField: 'createdAt' | 'deadline';
  categories: Category[];
  onToggleForm: () => void;
  onSearchChange: (val: string) => void;
  onFilterCategoryChange: (val: string) => void;
  onFilterDifficultyChange: (val: string) => void;
  onSortByChange: (val: TaskSortBy) => void;
  onToggleSortDir: () => void;
  onToggleGroupByDate: () => void;
  onGroupByFieldChange: (val: 'createdAt' | 'deadline') => void;
}

export const TaskFilterBar: React.FC<Props> = ({
  showForm,
  searchTerm,
  filterCategory,
  filterDifficulty,
  sortBy,
  sortDir,
  groupByDate,
  groupByField,
  categories,
  onToggleForm,
  onSearchChange,
  onFilterCategoryChange,
  onFilterDifficultyChange,
  onSortByChange,
  onToggleSortDir,
  onToggleGroupByDate,
  onGroupByFieldChange,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <button className="btn-ghost" onClick={onToggleForm}>
        {showForm ? '✕ ЗАКРЫТЬ' : '➕ НОВАЯ ЗАДАЧА'}
      </button>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="input-spacex"
          type="text"
          placeholder="🔍 Поиск задач..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
        />

        <select
          className="input-spacex"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
          value={filterCategory}
          onChange={e => onFilterCategoryChange(e.target.value)}
        >
          <option value="all">Все категории</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>

        <select
          className="input-spacex"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
          value={filterDifficulty}
          onChange={e => onFilterDifficultyChange(e.target.value)}
        >
          <option value="all">Вся сложность</option>
          <option value="easy">Лёгкая (20 XP)</option>
          <option value="medium">Средняя (50 XP)</option>
          <option value="hard">Сложная (100 XP)</option>
        </select>

        <select
          className="input-spacex"
          style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
          value={sortBy}
          onChange={e => onSortByChange(e.target.value as TaskSortBy)}
        >
          <option value="createdAt">По дате создания</option>
          <option value="completedDate">По дате выполнения</option>
          <option value="priority">По приоритету</option>
          <option value="deadline">По дедлайну</option>
          <option value="title">По алфавиту</option>
        </select>

        <button className="btn-ghost btn-ghost-xs" onClick={onToggleSortDir}>
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>

        <button
          className={`btn-ghost btn-ghost-xs ${groupByDate ? 'active' : ''}`}
          style={{ background: groupByDate ? 'var(--ghost-hover)' : 'transparent' }}
          onClick={onToggleGroupByDate}
        >
          📅 ГРУППИРОВКА
        </button>

        {groupByDate && (
          <select
            className="input-spacex"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
            value={groupByField}
            onChange={e => onGroupByFieldChange(e.target.value as 'createdAt' | 'deadline')}
          >
            <option value="createdAt">По дате создания</option>
            <option value="deadline">По дедлайну</option>
          </select>
        )}
      </div>
    </div>
  );
};
