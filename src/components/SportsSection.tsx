import { useState, useMemo } from 'react';
import type { Workout } from '../types';

interface Props {
  workouts: Workout[];
  onAdd: (w: Omit<Workout, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Workout>) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onRenameWorkoutType: (oldName: string, newName: string) => void;
}

interface WorkoutTypeDef {
  icon: string;
  name: string;
  color: string;
}

const BUILT_IN_WORKOUT_TYPES: WorkoutTypeDef[] = [
  { icon: '🏃', name: 'Бег', color: '#ff6b6b' },
  { icon: '🏋️', name: 'Силовая', color: '#ff9f43' },
  { icon: '🏊', name: 'Плавание', color: '#54a0ff' },
  { icon: '🚴', name: 'Вело', color: '#5f27cd' },
  { icon: '🧘', name: 'Растяжка', color: '#a29bfe' },
  { icon: '🥊', name: 'Единоборства', color: '#e056a0' },
  { icon: '🎾', name: 'Игровые', color: '#ffd700' },
  { icon: '🏔️', name: 'Поход', color: '#00b894' },
  { icon: '💪', name: 'Фитнес', color: '#e17055' },
  { icon: '⚽', name: 'Футбол', color: '#74b9ff' },
  { icon: '🏀', name: 'Баскетбол', color: '#fd9644' },
  { icon: '📋', name: 'Другое', color: '#b2bec3' },
];

const XP_BY_DURATION = [5, 10, 15, 20, 25, 30];
const CUSTOM_TYPES_KEY = 'tasktrecker-custom-workout-types';
const DELETED_TYPES_KEY = 'tasktrecker-deleted-workout-types';

function loadDeletedTypes(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_TYPES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveDeletedTypes(set: Set<string>) {
  localStorage.setItem(DELETED_TYPES_KEY, JSON.stringify([...set]));
}

const SPORTS_EMOJI_LIST = [
  '🏃','🏋️','🏊','🚴','🧘','🥊','🎾','🏔️','💪','⚽','🏀','🏈','⚾','🏐','🏓','🏸','🥋','⛸️','🎿','🛹',
  '🏄','🚣','🤸','⛹️','🤾','🏌️','🧗','🚵','🤼','🎯','🥏','🏑','🏒','🥍','🏹','🛼','🎽','🤿','🪂','🏇',
  '🎳','🥌','🤺','🏋','⛷️','🛶','🏊‍♀️','🏃‍♀️','🧘‍♂️','⭐','🔥','💥','⚡','🎖️','🏅',
];

function loadCustomTypes(): WorkoutTypeDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TYPES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        const migrated = (parsed as string[]).map((name: string) => ({ icon: '⭐', name, color: '#3b82c4' }));
        saveCustomTypes(migrated);
        return migrated;
      }
      return parsed;
    }
  } catch {}
  return [];
}

function saveCustomTypes(types: WorkoutTypeDef[]) { localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(types)); }

const INITIAL_FORM = { title: '', workoutType: 'Силовая', date: '', duration: 60, notes: '' };

type SortMode = 'date' | 'time' | 'date+time' | 'category';

function EmojiPicker({ emoji, onSelect, onClose }: { emoji: string; onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 40,
      background: 'var(--bg-secondary)', border: '1px solid var(--hairline)',
      borderRadius: '8px', padding: '8px', marginTop: '4px', width: '280px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
        {SPORTS_EMOJI_LIST.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => { onSelect(e); onClose(); }}
            style={{
              background: emoji === e ? 'var(--ghost-hover)' : 'transparent',
              border: emoji === e ? '1px solid var(--text-primary)' : '1px solid transparent',
              borderRadius: '4px', padding: '4px', cursor: 'pointer',
              fontSize: '18px', textAlign: 'center', lineHeight: 1,
            }}
          >{e}</button>
        ))}
      </div>
    </div>
  );
}

export default function SportsSection({ workouts, onAdd, onUpdate, onDelete, onComplete, onUncomplete, onRenameWorkoutType }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [customType, setCustomType] = useState('');
  const [savedCustomTypes, setSavedCustomTypes] = useState<WorkoutTypeDef[]>(loadCustomTypes);
  const [subtab, setSubtab] = useState<'workouts' | 'categories'>('workouts');
  const [showTypeManager, setShowTypeManager] = useState(false);

  // Category editor states
  const [editingTypeName, setEditingTypeName] = useState('');
  const [editingTypeValue, setEditingTypeValue] = useState('');
  const [editingTypeIcon, setEditingTypeIcon] = useState('⭐');
  const [editingTypeColor, setEditingTypeColor] = useState('#3b82c4');
  const [showInlineEmojiPicker, setShowInlineEmojiPicker] = useState(false);

  // New type form states
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeIcon, setNewTypeIcon] = useState('⭐');
  const [newTypeColor, setNewTypeColor] = useState('#3b82c4');
  const [showNewEmojiPicker, setShowNewEmojiPicker] = useState(false);

  // Sort & filter
  const [sortBy, setSortBy] = useState<SortMode>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deletedBuiltIn, setDeletedBuiltIn] = useState<Set<string>>(loadDeletedTypes);
  const [selectedTypeForModal, setSelectedTypeForModal] = useState<string | null>(null);

  // Custom workout form ("Своё...")
  const [formCustomIcon, setFormCustomIcon] = useState('⭐');
  const [formCustomColor, setFormCustomColor] = useState('#3b82c4');
  const [showSportsEmoji, setShowSportsEmoji] = useState(false);

  const visibleBuiltInTypes = useMemo(() =>
    BUILT_IN_WORKOUT_TYPES.filter(wt => !deletedBuiltIn.has(wt.name)),
  [deletedBuiltIn]);

  const allWorkoutTypes = useMemo(() => {
    const custom = savedCustomTypes.filter(t => !visibleBuiltInTypes.some(wt => wt.name === t.name));
    return [...visibleBuiltInTypes, ...custom];
  }, [savedCustomTypes, visibleBuiltInTypes]);

  const today = new Date().toISOString().slice(0, 10);

  const sortedWorkouts = useMemo(() => {
    const filtered = workouts.filter(w => {
      if (filter === 'upcoming') return !w.completed;
      if (filter === 'completed') return w.completed;
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'category') return dir * a.workoutType.localeCompare(b.workoutType, 'ru');
      if (sortBy === 'date') return dir * a.date.localeCompare(b.date);
      if (sortBy === 'time') return dir * (a.duration - b.duration);
      const dateCmp = dir * a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return dir * (a.duration - b.duration);
    });
  }, [workouts, filter, sortBy, sortDir]);

  const groupedByDate = useMemo(() => {
    if (sortBy !== 'date' && sortBy !== 'date+time') return null;
    const groups: Record<string, Workout[]> = {};
    sortedWorkouts.forEach(w => {
      if (!groups[w.date]) groups[w.date] = [];
      groups[w.date].push(w);
    });
    return Object.entries(groups);
  }, [sortedWorkouts, sortBy]);

  const typeIcon = (name: string) => allWorkoutTypes.find(t => t.name === name)?.icon || '📋';
  const typeColor = (name: string) => allWorkoutTypes.find(t => t.name === name)?.color || '#b2bec3';

  function handleSubmit() {
    if (!form.title.trim() || !form.date) return;
    const xp = XP_BY_DURATION[Math.min(Math.floor(form.duration / 10), XP_BY_DURATION.length - 1)];
    const finalType = form.workoutType === 'custom' ? customType.trim() : form.workoutType;
    if (!finalType) return;

    if (form.workoutType === 'custom' && finalType && !allWorkoutTypes.some(t => t.name === finalType)) {
      const updated = [...savedCustomTypes, { icon: formCustomIcon, name: finalType, color: formCustomColor }];
      setSavedCustomTypes(updated);
      saveCustomTypes(updated);
    }

    if (editingId) {
      onUpdate(editingId, { ...form, workoutType: finalType, xp });
      setEditingId(null);
    } else {
      onAdd({ ...form, workoutType: finalType, completed: false, xp });
    }
    setForm(INITIAL_FORM);
    setCustomType('');
    setFormCustomIcon('⭐');
    setFormCustomColor('#3b82c4');
  }

  const isBuiltInType = (name: string) => BUILT_IN_WORKOUT_TYPES.some(wt => wt.name === name);

  function startEdit(w: Workout) {
    setEditingId(w.id);
    const isKnownType = allWorkoutTypes.some(t => t.name === w.workoutType);
    if (isKnownType) {
      setForm({ title: w.title, workoutType: w.workoutType, date: w.date, duration: w.duration, notes: w.notes });
      setCustomType('');
    } else {
      setForm({ title: w.title, workoutType: 'custom', date: w.date, duration: w.duration, notes: w.notes });
      setCustomType(w.workoutType);
      setFormCustomIcon('⭐');
      setFormCustomColor('#3b82c4');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setCustomType('');
    setFormCustomIcon('⭐');
    setFormCustomColor('#3b82c4');
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'long' });
  }

  function toggleNotes(id: string) {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function removeBuiltInType(name: string) {
    setDeletedBuiltIn(prev => {
      const next = new Set(prev);
      next.add(name);
      saveDeletedTypes(next);
      return next;
    });
  }

  function handleDeleteType(name: string) {
    if (isBuiltInType(name)) {
      removeBuiltInType(name);
    } else {
      const updated = savedCustomTypes.filter(t => t.name !== name);
      setSavedCustomTypes(updated);
      saveCustomTypes(updated);
    }
  }

  function startRenameType(def: WorkoutTypeDef) {
    setEditingTypeName(def.name);
    setEditingTypeValue(def.name);
    setEditingTypeIcon(def.icon);
    setEditingTypeColor(def.color);
    setShowInlineEmojiPicker(false);
  }

  function handleRenameType() {
    const trimmed = editingTypeValue.trim();
    if (!trimmed) { setEditingTypeName(''); return; }

    if (isBuiltInType(editingTypeName)) {
      removeBuiltInType(editingTypeName);
      const updated = [...savedCustomTypes, { icon: editingTypeIcon, name: trimmed, color: editingTypeColor }];
      setSavedCustomTypes(updated);
      saveCustomTypes(updated);
      if (trimmed !== editingTypeName) {
        onRenameWorkoutType(editingTypeName, trimmed);
      }
    } else {
      const updated = savedCustomTypes.map(t =>
        t.name === editingTypeName ? { ...t, name: trimmed, icon: editingTypeIcon, color: editingTypeColor } : t
      );
      setSavedCustomTypes(updated);
      saveCustomTypes(updated);
      if (trimmed !== editingTypeName) {
        onRenameWorkoutType(editingTypeName, trimmed);
      }
    }
    setEditingTypeName('');
    setShowInlineEmojiPicker(false);
  }

  const onlyCustomTypes = savedCustomTypes.filter(t => !visibleBuiltInTypes.some(wt => wt.name === t.name));

  const totalWorkouts = workouts.length;
  const completedWorkouts = workouts.filter(w => w.completed).length;
  const totalXP = workouts.filter(w => w.completed).reduce((s, w) => s + w.xp, 0);

  return (
    <div id="sports-section" style={{ marginTop: '48px' }}>
      <div className="section-divider" style={{ marginBottom: '32px' }} />
      <h3 className="section-heading" style={{ fontSize: '28px', marginBottom: '8px' }}>🏋️ СПОРТ</h3>
      <p className="micro-cap" style={{ marginBottom: '24px' }}>ТРЕНИРОВКИ И АКТИВНОСТЬ</p>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
          <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{totalWorkouts}</div>
          <div className="micro-cap" style={{ marginTop: '4px' }}>Всего</div>
        </div>
        <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
          <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{completedWorkouts}</div>
          <div className="micro-cap" style={{ marginTop: '4px' }}>Выполнено</div>
        </div>
        <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
          <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{totalXP}</div>
          <div className="micro-cap" style={{ marginTop: '4px' }}>XP</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)', flexWrap: 'wrap' }}>
        {(['workouts','categories'] as const).map(t => (
          <button key={t} className={`tab-btn ${subtab === t ? 'active' : ''}`} onClick={() => setSubtab(t)}>
            {t === 'workouts' ? 'ТРЕНИРОВКИ' : 'КАТЕГОРИИ'}
          </button>
        ))}
      </div>

      {/* ===== CATEGORIES SUBTAB ===== */}
      {subtab === 'categories' && (
        <div className="card-panel" style={{ marginBottom: '32px' }}>
          <h4 className="micro-cap" style={{ marginBottom: '20px' }}>УПРАВЛЕНИЕ КАТЕГОРИЯМИ ТРЕНИРОВОК</h4>

          {/* Add new type */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ position: 'relative' }}>
              <label className="micro-cap" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Иконка</label>
              <button type="button" className="input-spacex"
                style={{ width: '60px', textAlign: 'center', cursor: 'pointer', fontSize: '20px' }}
                onClick={() => setShowNewEmojiPicker(!showNewEmojiPicker)}>
                {newTypeIcon}
              </button>
              {showNewEmojiPicker && (
                <EmojiPicker emoji={newTypeIcon} onSelect={e => setNewTypeIcon(e)} onClose={() => setShowNewEmojiPicker(false)} />
              )}
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <label className="micro-cap" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Название</label>
              <input className="input-spacex" value={newTypeName} onChange={e => setNewTypeName(e.target.value)}
                placeholder="Новая категория тренировок" />
            </div>
            <div>
              <label className="micro-cap" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Цвет</label>
              <input type="color" className="input-spacex" style={{ width: '46px', height: '46px', padding: '4px', cursor: 'pointer' }}
                value={newTypeColor} onChange={e => setNewTypeColor(e.target.value)} />
            </div>
            <button type="button" className="btn-ghost btn-ghost-sm" onClick={() => {
              const trimmed = newTypeName.trim();
              if (!trimmed) return;
              if (!allWorkoutTypes.some(t => t.name === trimmed)) {
                const updated = [...savedCustomTypes, { icon: newTypeIcon, name: trimmed, color: newTypeColor }];
                setSavedCustomTypes(updated);
                saveCustomTypes(updated);
              }
              setNewTypeName(''); setNewTypeIcon('⭐'); setNewTypeColor('#3b82c4');
            }}>ДОБАВИТЬ</button>
          </div>

          {/* Type list with inline editing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {allWorkoutTypes.map(type => {
              const typeWorkouts = workouts.filter(w => w.workoutType === type.name);
              const isEditing = editingTypeName === type.name;
              return (
                <div key={type.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-hover)', borderRadius: '4px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button type="button" className="input-spacex"
                          style={{ width: '46px', height: '46px', textAlign: 'center', cursor: 'pointer', padding: '4px', fontSize: '18px' }}
                          onClick={() => setShowInlineEmojiPicker(!showInlineEmojiPicker)}>
                          {editingTypeIcon}
                        </button>
                        {showInlineEmojiPicker && (
                          <EmojiPicker emoji={editingTypeIcon} onSelect={e => { setEditingTypeIcon(e); setShowInlineEmojiPicker(false); }} onClose={() => setShowInlineEmojiPicker(false)} />
                        )}
                      </div>
                      <input className="input-spacex" style={{ flex: 1, padding: '10px 12px', fontSize: '13px' }}
                        value={editingTypeValue}
                        onChange={e => setEditingTypeValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameType(); if (e.key === 'Escape') { setEditingTypeName(''); setShowInlineEmojiPicker(false); } }}
                        autoFocus
                      />
                      <input type="color" value={editingTypeColor} onChange={e => setEditingTypeColor(e.target.value)}
                        style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', background: 'transparent', padding: 0, flexShrink: 0 }} />
                      <button type="button" className="btn-ghost btn-ghost-xs" onClick={handleRenameType} title="Сохранить">✓</button>
                      <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => { setEditingTypeName(''); setShowInlineEmojiPicker(false); }} title="Отмена">✕</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '24px' }}>{type.icon}</span>
                      <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '4px', background: type.color, border: '1px solid var(--hairline)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '14px' }}>{type.name}</span>
                      <button type="button" className="badge" style={{ borderColor: type.color, color: type.color, cursor: 'pointer', background: 'transparent' }} onClick={() => setSelectedTypeForModal(type.name)}>
                        {typeWorkouts.length} тренировок
                      </button>
                      <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => startRenameType(type)} title="Редактировать">✎</button>
                      <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => handleDeleteType(type.name)}
                        style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }} title="Удалить">✕</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== WORKOUTS SUBTAB ===== */}
      {subtab === 'workouts' && (
      <>
      <div className="card-panel" style={{ marginBottom: '32px' }}>
        <h4 className="micro-cap" style={{ marginBottom: '16px' }}>
          {editingId ? 'РЕДАКТИРОВАТЬ ТРЕНИРОВКУ' : 'НОВАЯ ТРЕНИРОВКА'}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <input className="input-spacex" type="text" placeholder="Название" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <input className="input-spacex" type="date" value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <select className="input-spacex" value={form.workoutType}
              onChange={e => { setForm(f => ({ ...f, workoutType: e.target.value })); if (e.target.value !== 'custom') setCustomType(''); }}>
              {allWorkoutTypes.map(t => (
                <option key={t.name} value={t.name}>{t.icon} {t.name}</option>
              ))}
              <option value="custom">✏️ Своё...</option>
            </select>
            {form.workoutType === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input className="input-spacex" type="text" placeholder="Название активности" value={customType}
                  onChange={e => setCustomType(e.target.value)} autoFocus />
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <button type="button" className="input-spacex"
                      style={{ width: '46px', height: '46px', textAlign: 'center', cursor: 'pointer', padding: '4px', fontSize: '18px' }}
                      onClick={() => setShowSportsEmoji(!showSportsEmoji)} title="Выбрать иконку">
                      {formCustomIcon}
                    </button>
                    {showSportsEmoji && (
                      <EmojiPicker emoji={formCustomIcon} onSelect={e => { setFormCustomIcon(e); setShowSportsEmoji(false); }} onClose={() => setShowSportsEmoji(false)} />
                    )}
                  </div>
                  <input type="color" value={formCustomColor} onChange={e => setFormCustomColor(e.target.value)}
                    style={{ width: '38px', height: '38px', border: 'none', cursor: 'pointer', background: 'transparent', padding: 0 }} title="Цвет категории" />
                </div>
              </div>
            )}
          </div>
          <div className="spin-wrap">
            <input className="input-spacex spin-input" type="number" placeholder="Мин." min={5} max={300} step={5} value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: Math.max(5, Number(e.target.value)) }))} />
            <div className="spin-btns">
              <button type="button" className="spin-btn" onClick={() => setForm(f => ({ ...f, duration: Math.min(300, f.duration + 5) }))}>▲</button>
              <button type="button" className="spin-btn" onClick={() => setForm(f => ({ ...f, duration: Math.max(5, f.duration - 5) }))}>▼</button>
            </div>
          </div>
        </div>
        <textarea className="input-spacex" placeholder="Заметки к тренировке..." value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
          style={{ resize: 'vertical', marginBottom: '12px' }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn-ghost btn-ghost-sm" onClick={handleSubmit}>
            {editingId ? '💾 СОХРАНИТЬ' : '➕ ДОБАВИТЬ'}
          </button>
          {editingId && (
            <button type="button" className="btn-ghost btn-ghost-sm" onClick={cancelEdit}>✕ ОТМЕНА</button>
          )}
        </div>
      </div>

      {/* My Types — display only */}
      {onlyCustomTypes.length > 0 && (
        <div className="card-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowTypeManager(!showTypeManager)}>
            <h4 className="micro-cap" style={{ margin: 0, cursor: 'pointer' }}>⭐ МОИ ТИПЫ ТРЕНИРОВОК ({onlyCustomTypes.length})</h4>
            <button type="button" className="btn-ghost btn-ghost-xs">{showTypeManager ? '▲' : '▼'}</button>
          </div>
          {showTypeManager && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {onlyCustomTypes.map(type => (
                <div key={type.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '16px' }}>{type.icon}</span>
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: type.color, border: '1px solid var(--hairline)' }} />
                  <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{type.name}</span>
                  <button type="button" className="badge" style={{ fontSize: '10px', cursor: 'pointer', background: 'transparent' }} onClick={(e) => { e.stopPropagation(); setSelectedTypeForModal(type.name); }}>
                    {workouts.filter(w => w.workoutType === type.name).length} тренировок
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters & Sort */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([['all','ВСЕ'],['upcoming','АКТИВНЫЕ'],['completed','ЗАВЕРШЁННЫЕ']] as const).map(([key, label]) => (
            <button key={key} type="button" className={`tab-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 4px' }}>|</span>
        <span className="micro-cap" style={{ fontSize: '10px' }}>СОРТИРОВКА:</span>
        <select className="input-spacex" style={{ width: 'auto', padding: '6px 28px 6px 10px', fontSize: '12px' }}
          value={sortBy} onChange={e => setSortBy(e.target.value as SortMode)}>
          <option value="date">По дате</option>
          <option value="time">По длительности</option>
          <option value="date+time">По дате и длит.</option>
          <option value="category">По категории</option>
        </select>
        <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          title={sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}>
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
      </div>

      {/* Workout list */}
      {(sortBy === 'category' || sortBy === 'time') ? (
        sortedWorkouts.length === 0 ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</p>
            <p className="micro-cap" style={{ marginBottom: '4px' }}>НЕТ ТРЕНИРОВОК</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Добавьте первую тренировку через форму выше</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedWorkouts.map(w => (
              <div key={w.id} className="card-panel" style={{
                padding: '16px', opacity: w.completed ? 0.6 : 1,
                borderLeft: w.completed ? '3px solid #5aaa6f' : `3px solid ${typeColor(w.workoutType)}`,
                transition: 'all 0.2s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {w.completed && <span style={{ color: '#5aaa6f', fontSize: '16px' }}>✓</span>}
                      <span style={{ fontSize: '16px' }}>{typeIcon(w.workoutType)}</span>
                      <span style={{ fontSize: '16px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700,
                        textDecoration: w.completed ? 'line-through' : 'none', color: 'var(--text-primary)' }}>{w.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', marginLeft: '28px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '32px', border: `1px solid ${typeColor(w.workoutType)}`,
                        fontSize: '11px', letterSpacing: '0.8px', color: typeColor(w.workoutType) }}>{typeIcon(w.workoutType)} {w.workoutType}</span>
                      <span>📅 {new Date(w.date + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'short' })}</span>
                      <span>⏱ {w.duration} мин</span>
                      <span>⚡ +{w.xp} XP</span>
                    </div>
                    {w.notes && (
                      <div style={{ marginTop: '8px', marginLeft: '28px' }}>
                        <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => toggleNotes(w.id)}
                          style={{ fontSize: '10px', letterSpacing: '0.8px' }}>
                          {expandedNotes.has(w.id) ? '📝 СКРЫТЬ ЗАМЕТКИ' : '📝 ЗАМЕТКИ'}
                        </button>
                        {expandedNotes.has(w.id) && (
                          <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-soft)', whiteSpace: 'pre-wrap',
                            padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: '4px', borderLeft: '2px solid var(--hairline)' }}>{w.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    {w.completed ? (
                      <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => onUncomplete(w.id)} title="Отменить выполнение">↩</button>
                    ) : (
                      <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => onComplete(w.id)} title="Отметить выполненным"
                        style={{ color: '#5aaa6f', borderColor: '#5aaa6f' }}>✓</button>
                    )}
                    {!w.completed && (
                      <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => startEdit(w)} title="Редактировать">✎</button>
                    )}
                    <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => onDelete(w.id)} title="Удалить">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        groupedByDate && (groupedByDate.length === 0 ? (
          <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</p>
            <p className="micro-cap" style={{ marginBottom: '4px' }}>НЕТ ТРЕНИРОВОК</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Добавьте первую тренировку через форму выше</p>
          </div>
        ) : (
          groupedByDate.map(([date, dayWorkouts]) => (
            <div key={date} style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700,
                letterSpacing: '0.96px', textTransform: 'uppercase', color: date < today ? 'var(--text-muted)' : 'var(--text-soft)',
                marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--hairline)' }}>
                {formatDate(date)}
                {date === today && <span style={{ color: 'var(--text-primary)', marginLeft: '8px' }}>← СЕГОДНЯ</span>}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dayWorkouts.map(w => (
                  <div key={w.id} className="card-panel" style={{
                    padding: '16px', opacity: w.completed ? 0.6 : 1,
                    borderLeft: w.completed ? '3px solid #5aaa6f' : `3px solid ${typeColor(w.workoutType)}`,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          {w.completed && <span style={{ color: '#5aaa6f', fontSize: '16px' }}>✓</span>}
                          <span style={{ fontSize: '16px' }}>{typeIcon(w.workoutType)}</span>
                          <span style={{ fontSize: '16px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700,
                            textDecoration: w.completed ? 'line-through' : 'none', color: 'var(--text-primary)' }}>{w.title}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', marginLeft: '28px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '32px', border: `1px solid ${typeColor(w.workoutType)}`,
                            fontSize: '11px', letterSpacing: '0.8px', color: typeColor(w.workoutType) }}>{typeIcon(w.workoutType)} {w.workoutType}</span>
                          <span>⏱ {w.duration} мин</span>
                          <span>⚡ +{w.xp} XP</span>
                        </div>
                        {w.notes && (
                          <div style={{ marginTop: '8px', marginLeft: '28px' }}>
                            <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => toggleNotes(w.id)}
                              style={{ fontSize: '10px', letterSpacing: '0.8px' }}>
                              {expandedNotes.has(w.id) ? '📝 СКРЫТЬ ЗАМЕТКИ' : '📝 ЗАМЕТКИ'}
                            </button>
                            {expandedNotes.has(w.id) && (
                              <p style={{ marginTop: '6px', fontSize: '13px', color: 'var(--text-soft)', whiteSpace: 'pre-wrap',
                                padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: '4px', borderLeft: '2px solid var(--hairline)' }}>{w.notes}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                        {w.completed ? (
                          <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => onUncomplete(w.id)} title="Отменить выполнение">↩</button>
                        ) : (
                          <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => onComplete(w.id)} title="Отметить выполненным"
                            style={{ color: '#5aaa6f', borderColor: '#5aaa6f' }}>✓</button>
                        )}
                        {!w.completed && (
                          <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => startEdit(w)} title="Редактировать">✎</button>
                        )}
                        <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => onDelete(w.id)} title="Удалить">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ))
      )}
      </>
      )}

      {/* Modal for workout types */}
      {selectedTypeForModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelectedTypeForModal(null)}>
          <div className="card-panel" style={{ width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto', padding: '24px', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Тренировки: {selectedTypeForModal}</h3>
              <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => setSelectedTypeForModal(null)}>✕</button>
            </div>
            {workouts.filter(w => w.workoutType === selectedTypeForModal).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Нет тренировок этого типа.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {workouts.filter(w => w.workoutType === selectedTypeForModal).map(w => (
                  <div key={w.id} style={{ padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700 }}>{w.title}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(w.date + 'T12:00:00').toLocaleDateString('ru')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                      ⏱ {w.duration} мин | ⚡ +{w.xp} XP | {w.completed ? '✅ Завершено' : '⏳ В ожидании'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
