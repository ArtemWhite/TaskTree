import React, { useState } from 'react';
import type { WorkoutTypeDef } from '../../types';
import { EmojiPicker } from './EmojiPicker';

export interface WorkoutFormData {
  title: string;
  workoutType: string;
  date: string;
  duration: number;
  notes: string;
}

interface Props {
  form: WorkoutFormData;
  editingId: string | null;
  allWorkoutTypes: WorkoutTypeDef[];
  customType: string;
  onChangeForm: (updater: (prev: WorkoutFormData) => WorkoutFormData) => void;
  onChangeCustomType: (val: string) => void;
  onSubmit: (e: React.FormEvent, customIcon: string, customColor: string) => void;
  onCancelEdit: () => void;
}

export const WorkoutFormPanel: React.FC<Props> = ({
  form,
  editingId,
  allWorkoutTypes,
  customType,
  onChangeForm,
  onChangeCustomType,
  onSubmit,
  onCancelEdit,
}) => {
  const [formCustomIcon, setFormCustomIcon] = useState('⭐');
  const [formCustomColor, setFormCustomColor] = useState('#3b82c4');
  const [showSportsEmoji, setShowSportsEmoji] = useState(false);

  return (
    <div className="card-panel" style={{ marginBottom: '32px' }}>
      <h4 className="micro-cap" style={{ marginBottom: '16px' }}>
        {editingId ? 'РЕДАКТИРОВАТЬ ТРЕНИРОВКУ' : 'НОВАЯ ТРЕНИРОВКА'}
      </h4>
      <form onSubmit={e => onSubmit(e, formCustomIcon, formCustomColor)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <input
            className="input-spacex"
            type="text"
            placeholder="Название"
            value={form.title}
            onChange={e => onChangeForm(f => ({ ...f, title: e.target.value }))}
          />
          <input
            className="input-spacex"
            type="date"
            value={form.date}
            onChange={e => onChangeForm(f => ({ ...f, date: e.target.value }))}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <select
              className="input-spacex"
              value={form.workoutType}
              onChange={e => {
                onChangeForm(f => ({ ...f, workoutType: e.target.value }));
                if (e.target.value !== 'custom') onChangeCustomType('');
              }}
            >
              {allWorkoutTypes.map(t => (
                <option key={t.name} value={t.name}>
                  {t.icon} {t.name}
                </option>
              ))}
              <option value="custom">✏️ Своё...</option>
            </select>
            {form.workoutType === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  className="input-spacex"
                  type="text"
                  placeholder="Название активности"
                  value={customType}
                  onChange={e => onChangeCustomType(e.target.value)}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="input-spacex"
                      style={{ width: '46px', height: '46px', textAlign: 'center', cursor: 'pointer', padding: '4px', fontSize: '18px' }}
                      onClick={() => setShowSportsEmoji(!showSportsEmoji)}
                      title="Выбрать иконку"
                    >
                      {formCustomIcon}
                    </button>
                    {showSportsEmoji && (
                      <EmojiPicker
                        emoji={formCustomIcon}
                        onSelect={e => {
                          setFormCustomIcon(e);
                          setShowSportsEmoji(false);
                        }}
                        onClose={() => setShowSportsEmoji(false)}
                      />
                    )}
                  </div>
                  <input
                    type="color"
                    value={formCustomColor}
                    onChange={e => setFormCustomColor(e.target.value)}
                    style={{ width: '38px', height: '38px', border: 'none', cursor: 'pointer', background: 'transparent', padding: 0 }}
                    title="Цвет категории"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="spin-wrap">
            <input
              className="input-spacex spin-input"
              type="number"
              placeholder="Мин."
              min={1}
              max={1440}
              step={1}
              value={form.duration || ''}
              onChange={e => {
                const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                onChangeForm(f => ({ ...f, duration: val }));
              }}
            />
            <div className="spin-btns">
              <button
                type="button"
                className="spin-btn"
                onClick={() => onChangeForm(f => ({ ...f, duration: Math.min(1440, (f.duration || 0) + 1) }))}
              >
                ▲
              </button>
              <button
                type="button"
                className="spin-btn"
                onClick={() => onChangeForm(f => ({ ...f, duration: Math.max(1, (f.duration || 0) - 1) }))}
              >
                ▼
              </button>
            </div>
          </div>
        </div>
        <textarea
          className="input-spacex"
          placeholder="📝 Заметки к тренировке..."
          value={form.notes}
          onChange={e => onChangeForm(f => ({ ...f, notes: e.target.value }))}
          rows={2}
          style={{ resize: 'vertical', marginBottom: '12px' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" className="btn-ghost btn-ghost-sm">
            {editingId ? '💾 СОХРАНИТЬ' : '➕ ДОБАВИТЬ'}
          </button>
          {editingId && (
            <button type="button" className="btn-ghost btn-ghost-sm" onClick={onCancelEdit}>
              ✕ ОТМЕНА
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
