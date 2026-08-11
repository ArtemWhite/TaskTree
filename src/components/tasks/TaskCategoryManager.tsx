import React, { useState } from 'react';
import type { Category } from '../../types';

export const EMOJI_LIST = [
  '🧠', '🏋️', '📚', '💻', '🎨', '🎵', '🍳', '🏃', '🧘', '💼', '📝', '🎯', '🌟', '🔥', '💡', '🎮', '📖', '✍️', '🎓', '🏆',
  '💪', '🧹', '🛒', '📞', '✈️', '🚗', '🏠', '💰', '🎁', '🌈', '🐾', '🍕',
];

interface Props {
  categories: Category[];
  onAddCategory: (c: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

export const TaskCategoryManager: React.FC<Props> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  // New category form state
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('📝');
  const [catColor, setCatColor] = useState('#ffffff');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Edit category state
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('#ffffff');

  const handleAdd = () => {
    if (!catName.trim()) return;
    onAddCategory({ name: catName.trim(), emoji: catEmoji, color: catColor });
    setCatName('');
    setCatEmoji('📝');
    setCatColor('#ffffff');
  };

  const handleSaveEdit = (id: string) => {
    if (editCatName.trim()) {
      onUpdateCategory(id, { name: editCatName.trim(), color: editCatColor });
    }
    setEditCatId(null);
  };

  return (
    <div>
      <div className="card-panel" style={{ marginBottom: '24px' }}>
        <h4 className="micro-cap" style={{ marginBottom: '16px' }}>
          НОВАЯ КАТЕГОРИЯ
        </h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{ fontSize: '20px' }}
            >
              {catEmoji}
            </button>
            {showEmojiPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 10,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '8px',
                  maxWidth: '280px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                {EMOJI_LIST.map(e => (
                  <button
                    key={e}
                    type="button"
                    className="btn-ghost btn-ghost-xs"
                    onClick={() => {
                      setCatEmoji(e);
                      setShowEmojiPicker(false);
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="color"
            value={catColor}
            onChange={e => setCatColor(e.target.value)}
            style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            title="Цвет категории"
          />
          <input
            className="input-spacex"
            type="text"
            placeholder="Название категории..."
            value={catName}
            onChange={e => setCatName(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <button className="btn-ghost btn-ghost-sm" onClick={handleAdd}>
            ➕ СОЗДАТЬ
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {categories.map(c => (
          <div
            key={c.id}
            className="card-panel"
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderLeft: `4px solid ${c.color}`,
            }}
          >
            {editCatId === c.id ? (
              <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                <input
                  className="input-spacex"
                  type="text"
                  value={editCatName}
                  onChange={e => setEditCatName(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }}
                  autoFocus
                />
                <input
                  type="color"
                  value={editCatColor}
                  onChange={e => setEditCatColor(e.target.value)}
                  style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  title="Изменить цвет"
                />
                <button className="btn-ghost btn-ghost-xs" onClick={() => handleSaveEdit(c.id)}>
                  💾
                </button>
                <button className="btn-ghost btn-ghost-xs" onClick={() => setEditCatId(null)}>
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{c.emoji}</span>
                  <span style={{ fontWeight: 700 }}>{c.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn-ghost btn-ghost-xs"
                    onClick={() => {
                      setEditCatId(c.id);
                      setEditCatName(c.name);
                      setEditCatColor(c.color || '#ffffff');
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-ghost btn-ghost-xs"
                    style={{ color: '#ff6b6b' }}
                    onClick={() => onDeleteCategory(c.id)}
                  >
                    🗑️
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
