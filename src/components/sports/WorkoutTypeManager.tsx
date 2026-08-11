import React, { useState } from 'react';
import type { Workout, WorkoutTypeDef } from '../../types';
import { EmojiPicker } from './EmojiPicker';

interface Props {
  allWorkoutTypes: WorkoutTypeDef[];
  workouts: Workout[];
  onAddType: (name: string, icon: string, color: string) => void;
  onDeleteType: (typeName: string) => void;
  onRenameType: (oldName: string, newName: string, icon: string, color: string) => void;
  onSelectTypeForModal: (typeName: string) => void;
}

export const WorkoutTypeManager: React.FC<Props> = ({
  allWorkoutTypes,
  workouts,
  onAddType,
  onDeleteType,
  onRenameType,
  onSelectTypeForModal,
}) => {
  // New type form states
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('⭐');
  const [newTypeColor, setNewTypeColor] = useState('#3b82c4');
  const [showNewEmojiPicker, setShowNewEmojiPicker] = useState(false);

  // Category editor states
  const [editingTypeName, setEditingTypeName] = useState('');
  const [editingTypeValue, setEditingTypeValue] = useState('');
  const [editingTypeIcon, setEditingTypeIcon] = useState('⭐');
  const [editingTypeColor, setEditingTypeColor] = useState('#3b82c4');
  const [showInlineEmojiPicker, setShowInlineEmojiPicker] = useState(false);

  const handleAdd = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    onAddType(trimmed, newTypeIcon, newTypeColor);
    setNewTypeName('');
    setNewTypeIcon('⭐');
    setNewTypeColor('#3b82c4');
  };

  const startRename = (type: WorkoutTypeDef) => {
    setEditingTypeName(type.name);
    setEditingTypeValue(type.name);
    setEditingTypeIcon(type.icon);
    setEditingTypeColor(type.color);
  };

  const handleSaveEdit = (type: WorkoutTypeDef) => {
    const newName = editingTypeValue.trim();
    if (!newName) return;
    onRenameType(type.name, newName, editingTypeIcon, editingTypeColor);
    setEditingTypeName('');
  };

  return (
    <div className="card-panel" style={{ marginBottom: '32px' }}>
      <h4 className="micro-cap" style={{ marginBottom: '16px' }}>
        УПРАВЛЕНИЕ ТИПАМИ ТРЕНИРОВОК
      </h4>

      {/* New type form */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center',
          background: 'var(--surface-hover)',
          padding: '16px',
          borderRadius: '8px',
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="input-spacex"
            style={{ width: '46px', height: '46px', textAlign: 'center', cursor: 'pointer', padding: '4px', fontSize: '18px' }}
            onClick={() => setShowNewEmojiPicker(!showNewEmojiPicker)}
          >
            {newTypeIcon}
          </button>
          {showNewEmojiPicker && (
            <EmojiPicker
              emoji={newTypeIcon}
              onSelect={e => {
                setNewTypeIcon(e);
                setShowNewEmojiPicker(false);
              }}
              onClose={() => setShowNewEmojiPicker(false)}
            />
          )}
        </div>
        <input
          type="color"
          value={newTypeColor}
          onChange={e => setNewTypeColor(e.target.value)}
          style={{ width: '38px', height: '38px', border: 'none', cursor: 'pointer', background: 'transparent', padding: 0 }}
          title="Цвет типа"
        />
        <input
          className="input-spacex"
          type="text"
          placeholder="Название нового типа..."
          value={newTypeName}
          onChange={e => setNewTypeName(e.target.value)}
          style={{ flex: 1, minWidth: '180px' }}
        />
        <button type="button" className="btn-ghost btn-ghost-sm" onClick={handleAdd}>
          ➕ ДОБАВИТЬ ТИП
        </button>
      </div>

      {/* Grid of types */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {allWorkoutTypes.map(type => {
          const typeWorkouts = workouts.filter(w => w.workoutType === type.name);
          const isEditing = editingTypeName === type.name;

          return (
            <div
              key={type.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: 'var(--surface-hover)',
                borderRadius: '8px',
                borderLeft: `4px solid ${type.color}`,
                minWidth: 0,
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center', minWidth: 0 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="input-spacex"
                      style={{ width: '36px', height: '36px', padding: '2px', fontSize: '16px' }}
                      onClick={() => setShowInlineEmojiPicker(!showInlineEmojiPicker)}
                    >
                      {editingTypeIcon}
                    </button>
                    {showInlineEmojiPicker && (
                      <EmojiPicker
                        emoji={editingTypeIcon}
                        onSelect={e => {
                          setEditingTypeIcon(e);
                          setShowInlineEmojiPicker(false);
                        }}
                        onClose={() => setShowInlineEmojiPicker(false)}
                      />
                    )}
                  </div>
                  <input
                    type="color"
                    value={editingTypeColor}
                    onChange={e => setEditingTypeColor(e.target.value)}
                    style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', flexShrink: 0 }}
                  />
                  <input
                    className="input-spacex"
                    type="text"
                    value={editingTypeValue}
                    onChange={e => setEditingTypeValue(e.target.value)}
                    style={{ flex: 1, minWidth: '60px' }}
                  />
                  <button type="button" className="btn-ghost btn-ghost-xs" style={{ flexShrink: 0 }} onClick={() => handleSaveEdit(type)}>
                    ✓
                  </button>
                  <button type="button" className="btn-ghost btn-ghost-xs" style={{ flexShrink: 0 }} onClick={() => setEditingTypeName('')}>
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{type.icon}</span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '12px',
                      height: '12px',
                      borderRadius: '3px',
                      background: type.color,
                      border: '1px solid var(--hairline)',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}
                  >
                    {type.name}
                  </span>
                  <button
                    type="button"
                    className="badge"
                    style={{
                      borderColor: type.color,
                      color: type.color,
                      cursor: 'pointer',
                      background: 'transparent',
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                      fontSize: '11px',
                    }}
                    onClick={() => onSelectTypeForModal(type.name)}
                  >
                    {typeWorkouts.length} трен.
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-ghost-xs"
                    style={{ flexShrink: 0 }}
                    onClick={() => startRename(type)}
                    title="Редактировать"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-ghost-xs"
                    style={{ color: '#ff6b6b', borderColor: '#ff6b6b', flexShrink: 0 }}
                    onClick={() => onDeleteType(type.name)}
                    title="Удалить"
                  >
                    ✕
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
