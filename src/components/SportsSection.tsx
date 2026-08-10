import React, { useState, useMemo } from 'react';
import type { Workout, WorkoutTypeDef } from '../types';
import { WorkoutService } from '../services/WorkoutService';
import { StorageService } from '../services/StorageService';
import { WorkoutCard } from './sports/WorkoutCard';
import { WorkoutStatsCards } from './sports/WorkoutStatsCards';

interface SportsSectionProps {
  workouts: Workout[];
  onAdd: (w: Omit<Workout, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Workout>) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onRenameWorkoutType: (oldName: string, newName: string) => void;
}

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
  ' bowling','🥌','🤺','🏋','⛷️','🛶','🏊‍♀️','🏃‍♀️','🧘‍♂️','⭐','🔥','💥','⚡','🎖️','🏅',
];

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

export default function SportsSection({
  workouts,
  onAdd,
  onUpdate,
  onDelete,
  onComplete,
  onUncomplete,
  onRenameWorkoutType,
}: SportsSectionProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [customType, setCustomType] = useState('');
  const [savedCustomTypes, setSavedCustomTypes] = useState<WorkoutTypeDef[]>(StorageService.loadCustomWorkoutTypes);
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
    WorkoutService.BUILT_IN_WORKOUT_TYPES.filter(wt => !deletedBuiltIn.has(wt.name)),
  [deletedBuiltIn]);

  const allWorkoutTypes = useMemo(() => {
    const custom = savedCustomTypes.filter(t => !visibleBuiltInTypes.some(wt => wt.name === t.name));
    return [...visibleBuiltInTypes, ...custom];
  }, [savedCustomTypes, visibleBuiltInTypes]);

  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => WorkoutService.calculateWorkoutStats(workouts), [workouts]);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => {
      if (filter === 'upcoming') return !w.completed;
      if (filter === 'completed') return w.completed;
      return true;
    });
  }, [workouts, filter]);

  const sortedWorkouts = useMemo(() => {
    const list = [...filteredWorkouts];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortBy === 'time') cmp = a.duration - b.duration;
      else if (sortBy === 'date+time') cmp = (a.date + a.duration).localeCompare(b.date + b.duration);
      else if (sortBy === 'category') cmp = a.workoutType.localeCompare(b.workoutType);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredWorkouts, sortBy, sortDir]);

  const groupedByDate = useMemo(() => {
    if (sortBy === 'category' || sortBy === 'time') return null;
    const map: Record<string, Workout[]> = {};
    sortedWorkouts.forEach(w => {
      if (!map[w.date]) map[w.date] = [];
      map[w.date].push(w);
    });
    return Object.entries(map).sort(([dA], [dB]) => sortDir === 'asc' ? dA.localeCompare(dB) : dB.localeCompare(dA));
  }, [sortedWorkouts, sortBy, sortDir]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalType = form.workoutType;

    if (form.workoutType === 'custom') {
      const trimmed = customType.trim();
      if (!trimmed) return;
      finalType = trimmed;

      if (!allWorkoutTypes.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
        const newDef: WorkoutTypeDef = { icon: formCustomIcon, name: trimmed, color: formCustomColor };
        const updated = [...savedCustomTypes, newDef];
        setSavedCustomTypes(updated);
        StorageService.saveCustomWorkoutTypes(updated);
      }
    }

    const calculatedXP = Math.round((form.duration / 30) * 10);
    const dateToUse = form.date || today;

    if (editingId) {
      onUpdate(editingId, {
        title: form.title || finalType,
        workoutType: finalType,
        date: dateToUse,
        duration: form.duration,
        notes: form.notes,
        xp: calculatedXP,
      });
      setEditingId(null);
    } else {
      onAdd({
        title: form.title || finalType,
        workoutType: finalType,
        date: dateToUse,
        duration: form.duration,
        notes: form.notes,
        completed: false,
        xp: calculatedXP,
      });
    }

    setForm(INITIAL_FORM);
    setCustomType('');
  };

  const startEdit = (w: Workout) => {
    setEditingId(w.id);
    const isKnown = allWorkoutTypes.some(t => t.name === w.workoutType);
    setForm({
      title: w.title,
      workoutType: isKnown ? w.workoutType : 'custom',
      date: w.date,
      duration: w.duration,
      notes: w.notes,
    });
    if (!isKnown) setCustomType(w.workoutType);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setCustomType('');
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onlyCustomTypes = useMemo(() =>
    savedCustomTypes.filter(t => !visibleBuiltInTypes.some(wt => wt.name === t.name)),
  [savedCustomTypes, visibleBuiltInTypes]);

  const handleAddType = () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;

    if (!savedCustomTypes.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...savedCustomTypes, { icon: newTypeIcon, name: trimmed, color: newTypeColor }];
      setSavedCustomTypes(updated);
      StorageService.saveCustomWorkoutTypes(updated);
    }

    setNewTypeName('');
    setNewTypeIcon('⭐');
    setNewTypeColor('#3b82c4');
  };

  const handleDeleteType = (typeName: string) => {
    if (WorkoutService.BUILT_IN_WORKOUT_TYPES.some(wt => wt.name === typeName)) {
      const nextDeleted = new Set(deletedBuiltIn);
      nextDeleted.add(typeName);
      setDeletedBuiltIn(nextDeleted);
      saveDeletedTypes(nextDeleted);
    } else {
      const updated = savedCustomTypes.filter(t => t.name !== typeName);
      setSavedCustomTypes(updated);
      StorageService.saveCustomWorkoutTypes(updated);
    }
  };

  const startRenameType = (type: WorkoutTypeDef) => {
    setEditingTypeName(type.name);
    setEditingTypeValue(type.name);
    setEditingTypeIcon(type.icon);
    setEditingTypeColor(type.color);
  };

  const handleSaveTypeEdit = (type: WorkoutTypeDef) => {
    const newName = editingTypeValue.trim();
    if (!newName) return;

    if (newName !== type.name) {
      onRenameWorkoutType(type.name, newName);
    }

    const updatedCustom = savedCustomTypes.filter(t => t.name !== type.name);
    updatedCustom.push({ icon: editingTypeIcon, name: newName, color: editingTypeColor });
    setSavedCustomTypes(updatedCustom);
    StorageService.saveCustomWorkoutTypes(updatedCustom);

    setEditingTypeName('');
  };

  const formatDate = (dStr: string) => {
    const d = new Date(dStr + 'T12:00:00');
    return d.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  };

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>СПОРТ И ТРЕНИРОВКИ</h2>

      <WorkoutStatsCards stats={stats} />

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)' }}>
        <button type="button" className={`tab-btn ${subtab === 'workouts' ? 'active' : ''}`} onClick={() => setSubtab('workouts')}>
          🏋️ ТРЕНИРОВКИ
        </button>
        <button type="button" className={`tab-btn ${subtab === 'categories' ? 'active' : ''}`} onClick={() => setSubtab('categories')}>
          ⚙️ НАСТРОЙКА ТИПОВ ({allWorkoutTypes.length})
        </button>
      </div>

      {subtab === 'categories' && (
        <div className="card-panel" style={{ marginBottom: '32px' }}>
          <h4 className="micro-cap" style={{ marginBottom: '16px' }}>УПРАВЛЕНИЕ ТИПАМИ ТРЕНИРОВОК</h4>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px' }}>
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
                <EmojiPicker emoji={newTypeIcon} onSelect={e => { setNewTypeIcon(e); setShowNewEmojiPicker(false); }} onClose={() => setShowNewEmojiPicker(false)} />
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
            <button type="button" className="btn-ghost btn-ghost-sm" onClick={handleAddType}>
              ➕ ДОБАВИТЬ ТИП
            </button>
          </div>

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
                        <button type="button" className="input-spacex" style={{ width: '36px', height: '36px', padding: '2px', fontSize: '16px' }} onClick={() => setShowInlineEmojiPicker(!showInlineEmojiPicker)}>
                          {editingTypeIcon}
                        </button>
                        {showInlineEmojiPicker && (
                          <EmojiPicker emoji={editingTypeIcon} onSelect={e => { setEditingTypeIcon(e); setShowInlineEmojiPicker(false); }} onClose={() => setShowInlineEmojiPicker(false)} />
                        )}
                      </div>
                      <input type="color" value={editingTypeColor} onChange={e => setEditingTypeColor(e.target.value)} style={{ width: '32px', height: '32px', border: 'none', background: 'transparent', flexShrink: 0 }} />
                      <input className="input-spacex" type="text" value={editingTypeValue} onChange={e => setEditingTypeValue(e.target.value)} style={{ flex: 1, minWidth: '60px' }} />
                      <button type="button" className="btn-ghost btn-ghost-xs" style={{ flexShrink: 0 }} onClick={() => handleSaveTypeEdit(type)}>✓</button>
                      <button type="button" className="btn-ghost btn-ghost-xs" style={{ flexShrink: 0 }} onClick={() => setEditingTypeName('')}>✕</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>{type.icon}</span>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: type.color, border: '1px solid var(--hairline)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{type.name}</span>
                      <button type="button" className="badge" style={{ borderColor: type.color, color: type.color, cursor: 'pointer', background: 'transparent', flexShrink: 0, whiteSpace: 'nowrap', fontSize: '11px' }} onClick={() => setSelectedTypeForModal(type.name)}>
                        {typeWorkouts.length} трен.
                      </button>
                      <button type="button" className="btn-ghost btn-ghost-xs" style={{ flexShrink: 0 }} onClick={() => startRenameType(type)} title="Редактировать">✎</button>
                      <button type="button" className="btn-ghost btn-ghost-xs" style={{ color: '#ff6b6b', borderColor: '#ff6b6b', flexShrink: 0 }} onClick={() => handleDeleteType(type.name)} title="Удалить">✕</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subtab === 'workouts' && (
        <>
          <div className="card-panel" style={{ marginBottom: '32px' }}>
            <h4 className="micro-cap" style={{ marginBottom: '16px' }}>
              {editingId ? 'РЕДАКТИРОВАТЬ ТРЕНИРОВКУ' : 'НОВАЯ ТРЕНИРОВКА'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <input className="input-spacex" type="text" placeholder="Название" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <input className="input-spacex" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <select className="input-spacex" value={form.workoutType} onChange={e => { setForm(f => ({ ...f, workoutType: e.target.value })); if (e.target.value !== 'custom') setCustomType(''); }}>
                  {allWorkoutTypes.map(t => (
                    <option key={t.name} value={t.name}>{t.icon} {t.name}</option>
                  ))}
                  <option value="custom">✏️ Своё...</option>
                </select>
                {form.workoutType === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input className="input-spacex" type="text" placeholder="Название активности" value={customType} onChange={e => setCustomType(e.target.value)} autoFocus />
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        <button type="button" className="input-spacex" style={{ width: '46px', height: '46px', textAlign: 'center', cursor: 'pointer', padding: '4px', fontSize: '18px' }} onClick={() => setShowSportsEmoji(!showSportsEmoji)} title="Выбрать иконку">
                          {formCustomIcon}
                        </button>
                        {showSportsEmoji && (
                          <EmojiPicker emoji={formCustomIcon} onSelect={e => { setFormCustomIcon(e); setShowSportsEmoji(false); }} onClose={() => setShowSportsEmoji(false)} />
                        )}
                      </div>
                      <input type="color" value={formCustomColor} onChange={e => setFormCustomColor(e.target.value)} style={{ width: '38px', height: '38px', border: 'none', cursor: 'pointer', background: 'transparent', padding: 0 }} title="Цвет категории" />
                    </div>
                  </div>
                )}
              </div>
              <div className="spin-wrap">
                <input className="input-spacex spin-input" type="number" placeholder="Мин." min={5} max={300} step={5} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Math.max(5, Number(e.target.value)) }))} />
                <div className="spin-btns">
                  <button type="button" className="spin-btn" onClick={() => setForm(f => ({ ...f, duration: Math.min(300, f.duration + 5) }))}>▲</button>
                  <button type="button" className="spin-btn" onClick={() => setForm(f => ({ ...f, duration: Math.max(5, f.duration - 5) }))}>▼</button>
                </div>
              </div>
            </div>
            <textarea className="input-spacex" placeholder="📝 Заметки к тренировке..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ resize: 'vertical', marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn-ghost btn-ghost-sm" onClick={handleSubmit}>
                {editingId ? '💾 СОХРАНИТЬ' : '➕ ДОБАВИТЬ'}
              </button>
              {editingId && (
                <button type="button" className="btn-ghost btn-ghost-sm" onClick={cancelEdit}>✕ ОТМЕНА</button>
              )}
            </div>
          </div>

          {onlyCustomTypes.length > 0 && (
            <div className="card-panel" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowTypeManager(!showTypeManager)}>
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

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {([['all','ВСЕ'],['upcoming','АКТИВНЫЕ'],['completed','ЗАВЕРШЁННЫЕ']] as const).map(([key, label]) => (
                <button key={key} type="button" className={`tab-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
              ))}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 4px' }}>|</span>
            <span className="micro-cap" style={{ fontSize: '10px' }}>СОРТИРОВКА:</span>
            <select className="input-spacex" style={{ width: 'auto', padding: '6px 28px 6px 10px', fontSize: '12px' }} value={sortBy} onChange={e => setSortBy(e.target.value as SortMode)}>
              <option value="date">По дате</option>
              <option value="time">По длительности</option>
              <option value="date+time">По дате и длит.</option>
              <option value="category">По категории</option>
            </select>
            <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} title={sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}>
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>

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
                  <WorkoutCard
                    key={w.id}
                    workout={w}
                    allWorkoutTypes={allWorkoutTypes}
                    isExpanded={expandedNotes.has(w.id)}
                    onToggleExpand={() => toggleNotes(w.id)}
                    onComplete={onComplete}
                    onUncomplete={onUncomplete}
                    onEdit={startEdit}
                    onDelete={onDelete}
                  />
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
                  <h4 style={{ fontSize: '14px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.96px', textTransform: 'uppercase', color: date < today ? 'var(--text-muted)' : 'var(--text-soft)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--hairline)' }}>
                    {formatDate(date)}
                    {date === today && <span style={{ color: 'var(--text-primary)', marginLeft: '8px' }}>← СЕГОДНЯ</span>}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {dayWorkouts.map(w => (
                      <WorkoutCard
                        key={w.id}
                        workout={w}
                        allWorkoutTypes={allWorkoutTypes}
                        isExpanded={expandedNotes.has(w.id)}
                        onToggleExpand={() => toggleNotes(w.id)}
                        onComplete={onComplete}
                        onUncomplete={onUncomplete}
                        onEdit={startEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </div>
              ))
            ))
          )}
        </>
      )}

      {selectedTypeForModal && (
        <div className="modal-overlay" onClick={() => setSelectedTypeForModal(null)}>
          <div className="modal-content" style={{ maxWidth: '440px', outline: 'none' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="micro-cap" style={{ margin: 0, fontSize: '16px' }}>Тренировки: {selectedTypeForModal}</h3>
              <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => setSelectedTypeForModal(null)}>✕</button>
            </div>
            {workouts.filter(w => w.workoutType === selectedTypeForModal).length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Нет тренировок этого типа.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                {workouts.filter(w => w.workoutType === selectedTypeForModal).map(w => (
                  <div key={w.id} style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '6px', borderLeft: `3px solid ${WorkoutService.getTypeColor(w.workoutType)}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{w.title}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(w.date + 'T12:00:00').toLocaleDateString('ru')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>
                      ⏱ {w.duration} мин | ⚡ +{w.xp} XP | {w.completed ? '✅ Завершено' : '⏳ В ожидании'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className="btn-ghost btn-ghost-sm" style={{ marginTop: '16px', width: '100%' }} onClick={() => setSelectedTypeForModal(null)}>
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
