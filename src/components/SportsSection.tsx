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

const WORKOUT_TYPES = [
  { icon: '🏃', name: 'Бег' },
  { icon: '🏋️', name: 'Силовая' },
  { icon: '🏊', name: 'Плавание' },
  { icon: '🚴', name: 'Вело' },
  { icon: '🧘', name: 'Растяжка' },
  { icon: '🥊', name: 'Единоборства' },
  { icon: '🎾', name: 'Игровые' },
  { icon: '🏔️', name: 'Поход' },
  { icon: '💪', name: 'Фитнес' },
  { icon: '⚽', name: 'Футбол' },
  { icon: '🏀', name: 'Баскетбол' },
  { icon: '📋', name: 'Другое' },
];

const XP_BY_DURATION = [5, 10, 15, 20, 25, 30];
const CUSTOM_TYPES_KEY = 'tasktrecker-custom-workout-types';

function loadCustomTypes(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TYPES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveCustomTypes(types: string[]) { localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(types)); }

const INITIAL_FORM = { title: '', workoutType: 'Силовая', date: '', duration: 60, notes: '' };

export default function SportsSection({ workouts, onAdd, onUpdate, onDelete, onComplete, onUncomplete, onRenameWorkoutType }: Props) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [customType, setCustomType] = useState('');
  const [savedCustomTypes, setSavedCustomTypes] = useState<string[]>(loadCustomTypes);
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [editingTypeValue, setEditingTypeValue] = useState('');

  const allWorkoutTypes = useMemo(() => {
    const custom = savedCustomTypes.filter(t => !WORKOUT_TYPES.some(wt => wt.name === t));
    return [...WORKOUT_TYPES, ...custom.map(t => ({ icon: '⭐', name: t }))];
  }, [savedCustomTypes]);

  const today = new Date().toISOString().slice(0, 10);

  const sortedWorkouts = useMemo(() => {
    const filtered = workouts.filter(w => {
      if (filter === 'upcoming') return !w.completed;
      if (filter === 'completed') return w.completed;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return a.date.localeCompare(b.date);
    });
  }, [workouts, filter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Workout[]> = {};
    sortedWorkouts.forEach(w => {
      if (!groups[w.date]) groups[w.date] = [];
      groups[w.date].push(w);
    });
    return Object.entries(groups);
  }, [sortedWorkouts]);

  const typeIcon = (name: string) => allWorkoutTypes.find(t => t.name === name)?.icon || '📋';

  function handleSubmit() {
    if (!form.title.trim() || !form.date) return;
    const xp = XP_BY_DURATION[Math.min(Math.floor(form.duration / 10), XP_BY_DURATION.length - 1)];
    const finalType = form.workoutType === 'custom' ? customType.trim() : form.workoutType;
    if (!finalType) return;

    // Save custom type permanently
    if (form.workoutType === 'custom' && finalType && !savedCustomTypes.includes(finalType)) {
      const updated = [...savedCustomTypes, finalType];
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
  }

  const isCustomType = (type: string) => !allWorkoutTypes.some(t => t.name === type);

  function startEdit(w: Workout) {
    setEditingId(w.id);
    if (isCustomType(w.workoutType)) {
      setForm({ title: w.title, workoutType: 'custom', date: w.date, duration: w.duration, notes: w.notes });
      setCustomType(w.workoutType);
    } else {
      setForm({ title: w.title, workoutType: w.workoutType, date: w.date, duration: w.duration, notes: w.notes });
      setCustomType('');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setCustomType('');
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

  function handleDeleteCustomType(name: string) {
    const updated = savedCustomTypes.filter(t => t !== name);
    setSavedCustomTypes(updated);
    saveCustomTypes(updated);
  }

  function startRenameType(name: string) {
    setEditingTypeName(name);
    setEditingTypeValue(name);
  }

  function handleRenameType() {
    const trimmed = editingTypeValue.trim();
    if (!trimmed || trimmed === editingTypeName) {
      setEditingTypeName('');
      return;
    }
    const updated = savedCustomTypes.map(t => t === editingTypeName ? trimmed : t);
    setSavedCustomTypes(updated);
    saveCustomTypes(updated);
    onRenameWorkoutType(editingTypeName, trimmed);
    setEditingTypeName('');
  }

  const onlyCustomTypes = savedCustomTypes.filter(t => !WORKOUT_TYPES.some(wt => wt.name === t));

  const totalWorkouts = workouts.length;
  const completedWorkouts = workouts.filter(w => w.completed).length;
  const totalXP = workouts.filter(w => w.completed).reduce((s, w) => s + w.xp, 0);

  return (
    <div id="sports-section" style={{ marginTop: '48px' }}>
      {/* Header */}
      <div className="section-divider" style={{ marginBottom: '32px' }} />
      <h3 className="section-heading" style={{ fontSize: '28px', marginBottom: '8px' }}>🏋️ СПОРТ</h3>
      <p className="micro-cap" style={{ marginBottom: '24px' }}>ТРЕНИРОВКИ И АКТИВНОСТЬ</p>

      {/* Stats */}
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

      {/* Add/Edit Form */}
      <div className="card-panel" style={{ marginBottom: '32px' }}>
        <h4 className="micro-cap" style={{ marginBottom: '16px' }}>
          {editingId ? 'РЕДАКТИРОВАТЬ ТРЕНИРОВКУ' : 'НОВАЯ ТРЕНИРОВКА'}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <input
            className="input-spacex"
            type="text"
            placeholder="Название"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <input
            className="input-spacex"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <select
              className="input-spacex"
              value={form.workoutType}
              onChange={e => {
                setForm(f => ({ ...f, workoutType: e.target.value }));
                if (e.target.value !== 'custom') setCustomType('');
              }}
            >
              {allWorkoutTypes.map(t => (
                <option key={t.name} value={t.name}>{t.icon} {t.name}</option>
              ))}
              <option value="custom">✏️ Своё...</option>
            </select>
            {form.workoutType === 'custom' && (
              <input
                className="input-spacex"
                type="text"
                placeholder="Название активности"
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                autoFocus
              />
            )}
          </div>
          <div className="spin-wrap">
            <input
              className="input-spacex spin-input"
              type="number"
              placeholder="Мин."
              min={5}
              max={300}
              step={5}
              value={form.duration}
              onChange={e => setForm(f => ({ ...f, duration: Math.max(5, Number(e.target.value)) }))}
            />
            <div className="spin-btns">
              <button className="spin-btn" onClick={() => setForm(f => ({ ...f, duration: Math.min(300, f.duration + 5) }))}>▲</button>
              <button className="spin-btn" onClick={() => setForm(f => ({ ...f, duration: Math.max(5, f.duration - 5) }))}>▼</button>
            </div>
          </div>
        </div>
        <textarea
          className="input-spacex"
          placeholder="Заметки к тренировке..."
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          rows={2}
          style={{ resize: 'vertical', marginBottom: '12px' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-ghost btn-ghost-sm" onClick={handleSubmit}>
            {editingId ? '💾 СОХРАНИТЬ' : '➕ ДОБАВИТЬ'}
          </button>
          {editingId && (
            <button className="btn-ghost btn-ghost-sm" onClick={cancelEdit}>✕ ОТМЕНА</button>
          )}
        </div>
      </div>

      {/* Custom Type Manager */}
      {onlyCustomTypes.length > 0 && (
        <div className="card-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => setShowTypeManager(!showTypeManager)}>
            <h4 className="micro-cap" style={{ margin: 0, cursor: 'pointer' }}>
              ⭐ МОИ ТИПЫ ТРЕНИРОВОК ({onlyCustomTypes.length})
            </h4>
            <button className="btn-ghost btn-ghost-xs">{showTypeManager ? '▲' : '▼'}</button>
          </div>
          {showTypeManager && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {onlyCustomTypes.map(type => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--surface-hover)', borderRadius: '4px' }}>
                  {editingTypeName === type ? (
                    <>
                      <input
                        className="input-spacex"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }}
                        value={editingTypeValue}
                        onChange={e => setEditingTypeValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameType(); if (e.key === 'Escape') setEditingTypeName(''); }}
                        autoFocus
                      />
                      <button className="btn-ghost btn-ghost-xs" onClick={handleRenameType} title="Сохранить">✓</button>
                      <button className="btn-ghost btn-ghost-xs" onClick={() => setEditingTypeName('')} title="Отмена">✕</button>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '16px' }}>⭐</span>
                      <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)' }}>{type}</span>
                      <span className="badge" style={{ fontSize: '10px' }}>
                        {workouts.filter(w => w.workoutType === type).length} тренировок
                      </span>
                      <button className="btn-ghost btn-ghost-xs" onClick={() => startRenameType(type)} title="Переименовать">✎</button>
                      <button className="btn-ghost btn-ghost-xs" onClick={() => handleDeleteCustomType(type)} title="Удалить">✕</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {([
          ['all', 'ВСЕ'],
          ['upcoming', 'ПРЕДСТОЯЩИЕ'],
          ['completed', 'ВЫПОЛНЕННЫЕ'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >{label}</button>
        ))}
      </div>

      {/* Workout list grouped by date */}
      {groupedByDate.length === 0 && (
        <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</p>
          <p className="micro-cap" style={{ marginBottom: '4px' }}>НЕТ ТРЕНИРОВОК</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Добавьте первую тренировку через форму выше</p>
        </div>
      )}
      {groupedByDate.map(([date, dayWorkouts]) => (
        <div key={date} style={{ marginBottom: '24px' }}>
          <h4 style={{
            fontSize: '14px',
            fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
            fontWeight: 700,
            letterSpacing: '0.96px',
            textTransform: 'uppercase',
            color: date < today ? 'var(--text-muted)' : 'var(--text-soft)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--hairline)',
          }}>
            {formatDate(date)}
            {date === today && <span style={{ color: 'var(--text-primary)', marginLeft: '8px' }}>← СЕГОДНЯ</span>}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dayWorkouts.map(w => (
              <div
                key={w.id}
                className="card-panel"
                style={{
                  padding: '16px',
                  opacity: w.completed ? 0.6 : 1,
                  borderLeft: w.completed ? '3px solid #5aaa6f' : '3px solid var(--hairline)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {w.completed && <span style={{ color: '#5aaa6f', fontSize: '16px' }}>✓</span>}
                      <span style={{ fontSize: '16px' }}>{typeIcon(w.workoutType)}</span>
                      <span style={{
                        fontSize: '16px',
                        fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
                        fontWeight: 700,
                        textDecoration: w.completed ? 'line-through' : 'none',
                        color: 'var(--text-primary)',
                      }}>{w.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)', marginLeft: '28px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '32px',
                        border: '1px solid var(--hairline)',
                        fontSize: '11px',
                        letterSpacing: '0.8px',
                      }}>{typeIcon(w.workoutType)} {w.workoutType}</span>
                      <span>⏱ {w.duration} мин</span>
                      <span>⚡ +{w.xp} XP</span>
                    </div>
                    {w.notes && (
                      <div style={{ marginTop: '8px', marginLeft: '28px' }}>
                        <button
                          className="btn-ghost btn-ghost-xs"
                          onClick={() => toggleNotes(w.id)}
                          style={{ fontSize: '10px', letterSpacing: '0.8px' }}
                        >
                          {expandedNotes.has(w.id) ? '📝 СКРЫТЬ ЗАМЕТКИ' : '📝 ЗАМЕТКИ'}
                        </button>
                        {expandedNotes.has(w.id) && (
                          <p style={{
                            marginTop: '6px',
                            fontSize: '13px',
                            color: 'var(--text-soft)',
                            whiteSpace: 'pre-wrap',
                            padding: '8px 12px',
                            background: 'var(--surface-hover)',
                            borderRadius: '4px',
                            borderLeft: '2px solid var(--hairline)',
                          }}>{w.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                    {w.completed ? (
                      <button className="btn-ghost btn-ghost-xs" onClick={() => onUncomplete(w.id)} title="Отменить выполнение">↩</button>
                    ) : (
                      <button className="btn-ghost btn-ghost-xs" onClick={() => onComplete(w.id)} title="Отметить выполненным" style={{ color: '#5aaa6f', borderColor: '#5aaa6f' }}>✓</button>
                    )}
                    {!w.completed && (
                      <button className="btn-ghost btn-ghost-xs" onClick={() => startEdit(w)} title="Редактировать">✎</button>
                    )}
                    <button className="btn-ghost btn-ghost-xs" onClick={() => onDelete(w.id)} title="Удалить">✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
