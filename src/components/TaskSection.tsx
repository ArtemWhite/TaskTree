import { useState, useMemo, useEffect } from 'react';
import type { Task, Category, Difficulty, PomodoroSession } from '../types';
import { TaskService } from '../services/TaskService';
import { TaskCard } from './tasks/TaskCard';
import PomodoroHistoryModal from './common/PomodoroHistoryModal';

interface Props {
  tasks: Task[];
  completedTasks: Task[];
  categories: Category[];
  pomodoroHistory: PomodoroSession[];
  onAdd: (t: Omit<Task, 'id' | 'completed' | 'completedDate' | 'pomodoroCount' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onAddCategory: (c: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onStartPomodoro: (t: Task) => void;
  editingTask: Task | null;
  setEditingTask: (t: Task | null) => void;
  highlightTaskId?: string | null;
  onClearHighlight?: () => void;
}

const DIFFICULTY_XP: Record<Difficulty, number> = { easy: 20, medium: 50, hard: 100 };
const EMOJI_LIST = ['🧠','🏋️','📚','💻','🎨','🎵','🍳','🏃','🧘','💼','📝','🎯','🌟','🔥','💡','🎮','📖','✍️','🎓','🏆','💪','🧹','🛒','📞','✈️','🚗','🏠','💰','🎁','🌈','🐾','🍕'];

export default function TaskSection({
  tasks, completedTasks, categories, pomodoroHistory, onAdd, onUpdate, onDelete, onComplete, onUncomplete,
  onAddCategory, onUpdateCategory, onDeleteCategory, onStartPomodoro, editingTask, setEditingTask,
  highlightTaskId, onClearHighlight
}: Props) {
  const [subtab, setSubtab] = useState<'active' | 'completed' | 'categories'>('active');
  const [showForm, setShowForm] = useState(false);
  const [selectedPomodoroTask, setSelectedPomodoroTask] = useState<Task | null>(null);

  // New task form state
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [xp, setXp] = useState(50);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');

  // New category form state
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('📝');
  const [catColor, setCatColor] = useState('#ffffff');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatColor, setEditCatColor] = useState('#ffffff');

  // Filter state
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'completedDate' | 'deadline' | 'title' | 'createdAt+deadline' | 'priority'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [groupByDate, setGroupByDate] = useState(true);

  useEffect(() => {
    if (highlightTaskId) {
      setSubtab('completed');
      setTimeout(() => {
        const el = document.getElementById(`task-card-${highlightTaskId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-pulse');
          setTimeout(() => el.classList.remove('highlight-pulse'), 2500);
        }
        // Clear highlight so it doesn't re-trigger on next tab switch
        onClearHighlight?.();
      }, 100);
    }
  }, [highlightTaskId, onClearHighlight]);

  const filteredTasks = useMemo(() => {
    let list = subtab === 'active' ? tasks : completedTasks;
    if (filterCategory !== 'all') list = list.filter(t => t.categoryId === filterCategory);
    if (filterDifficulty !== 'all') list = list.filter(t => t.difficulty === filterDifficulty);
    if (searchTerm) list = list.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title, 'ru');
      if (sortBy === 'completedDate') {
        const dA = a.completedDate || a.createdAt;
        const dB = b.completedDate || b.createdAt;
        return dir * dA.localeCompare(dB);
      }
      if (sortBy === 'deadline') {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return dir * a.deadline.localeCompare(b.deadline);
      }
      if (sortBy === 'createdAt+deadline') {
        const aDL = a.deadline || '9999-99-99';
        const bDL = b.deadline || '9999-99-99';
        const dlCmp = dir * aDL.localeCompare(bDL);
        if (dlCmp !== 0) return dlCmp;
        return dir * a.createdAt.localeCompare(b.createdAt);
      }
      if (sortBy === 'priority') {
        const pMap = { low: 1, medium: 2, high: 3 };
        const pA = pMap[a.priority || 'medium'];
        const pB = pMap[b.priority || 'medium'];
        if (pA !== pB) return dir * (pA - pB);
        return dir * a.createdAt.localeCompare(b.createdAt);
      }
      return dir * a.createdAt.localeCompare(b.createdAt);
    });
  }, [tasks, completedTasks, filterCategory, filterDifficulty, searchTerm, subtab, sortBy, sortDir]);

  const resetForm = () => {
    setTitle('');
    setCategoryId(categories[0]?.id || '');
    setDifficulty('medium');
    setPriority('medium');
    setXp(50);
    setDeadlineDate('');
    setDeadlineTime('');
    setShowForm(false);
    setEditingTask(null);
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const deadline = deadlineDate ? `${deadlineDate}T${deadlineTime || '23:59'}:00` : null;
    if (editingTask) {
      onUpdate(editingTask.id, { title: title.trim(), categoryId, difficulty, priority, xp, deadline });
    } else {
      onAdd({ title: title.trim(), categoryId, difficulty, priority, xp, deadline });
    }
    resetForm();
  };

  const startEdit = (t: Task) => {
    setEditingTask(t);
    setTitle(t.title);
    setCategoryId(t.categoryId);
    setDifficulty(t.difficulty);
    setPriority(t.priority || 'medium');
    setXp(t.xp);
    if (t.deadline) {
      setDeadlineDate(t.deadline.slice(0, 10));
      setDeadlineTime(t.deadline.slice(11, 16));
    } else {
      setDeadlineDate('');
      setDeadlineTime('');
    }
    setShowForm(true);
  };

  const handleAddCategory = () => {
    if (!catName.trim()) return;
    onAddCategory({ name: catName.trim(), emoji: catEmoji, color: catColor });
    setCatName('');
    setCatEmoji('📝');
    setCatColor('#ffffff');
  };

  const [groupByField, setGroupByField] = useState<'createdAt' | 'deadline'>('createdAt');

  const categoryMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);

  const groupedTasks = useMemo(() => {
    if (!groupByDate) return null;
    return TaskService.groupTasksByDate(filteredTasks, groupByField);
  }, [filteredTasks, groupByDate, groupByField]);

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>ЗАДАЧИ</h2>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)', flexWrap: 'wrap' }}>
        {(['active','completed','categories'] as const).map(t => (
          <button key={t} className={`tab-btn ${subtab === t ? 'active' : ''}`} onClick={() => setSubtab(t)}>
            {t === 'active' ? `АКТИВНЫЕ (${tasks.length})` : t === 'completed' ? `ВЫПОЛНЕННЫЕ (${completedTasks.length})` : `КАТЕГОРИИ (${categories.length})`}
          </button>
        ))}
      </div>

      {subtab === 'categories' ? (
        <div>
          <div className="card-panel" style={{ marginBottom: '24px' }}>
            <h4 className="micro-cap" style={{ marginBottom: '16px' }}>НОВАЯ КАТЕГОРИЯ</h4>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <button type="button" className="btn-ghost" onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ fontSize: '20px' }}>
                  {catEmoji}
                </button>
                {showEmojiPicker && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, zIndex: 10,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-soft)',
                    borderRadius: '12px', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '8px', maxWidth: '280px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                  }}>
                    {EMOJI_LIST.map(e => (
                      <button key={e} type="button" className="btn-ghost btn-ghost-xs" onClick={() => { setCatEmoji(e); setShowEmojiPicker(false); }}>
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} style={{ width: '40px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }} title="Цвет категории" />
              <input className="input-spacex" type="text" placeholder="Название категории..." value={catName} onChange={e => setCatName(e.target.value)} style={{ flex: 1, minWidth: '200px' }} />
              <button className="btn-ghost btn-ghost-sm" onClick={handleAddCategory}>➕ СОЗДАТЬ</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {categories.map(c => (
              <div key={c.id} className="card-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${c.color}` }}>
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
                    <button
                      className="btn-ghost btn-ghost-xs"
                      onClick={() => {
                        if (editCatName.trim()) {
                          onUpdateCategory(c.id, { name: editCatName.trim(), color: editCatColor });
                        }
                        setEditCatId(null);
                      }}
                    >
                      💾
                    </button>
                    <button className="btn-ghost btn-ghost-xs" onClick={() => setEditCatId(null)}>✕</button>
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
                      <button className="btn-ghost btn-ghost-xs" style={{ color: '#ff6b6b' }} onClick={() => onDeleteCategory(c.id)}>🗑️</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          {/* Action bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <button className="btn-ghost" onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}>
              {showForm ? '✕ ЗАКРЫТЬ' : '➕ НОВАЯ ЗАДАЧА'}
            </button>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input className="input-spacex" type="text" placeholder="🔍 Поиск задач..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }} />

              <select className="input-spacex" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">Все категории</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
              </select>

              <select className="input-spacex" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }} value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                <option value="all">Вся сложность</option>
                <option value="easy">Лёгкая (20 XP)</option>
                <option value="medium">Средняя (50 XP)</option>
                <option value="hard">Сложная (100 XP)</option>
              </select>

              <select className="input-spacex" style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }} value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                <option value="createdAt">По дате создания</option>
                <option value="completedDate">По дате выполнения</option>
                <option value="priority">По приоритету</option>
                <option value="deadline">По дедлайну</option>
                <option value="title">По алфавиту</option>
              </select>

              <button className="btn-ghost btn-ghost-xs" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                {sortDir === 'asc' ? '↑' : '↓'}
              </button>

              <button className={`btn-ghost btn-ghost-xs ${groupByDate ? 'active' : ''}`} style={{ background: groupByDate ? 'var(--ghost-hover)' : 'transparent' }} onClick={() => setGroupByDate(g => !g)}>
                📅 ГРУППИРОВКА
              </button>

              {groupByDate && (
                <select className="input-spacex" style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }} value={groupByField} onChange={e => setGroupByField(e.target.value as any)}>
                  <option value="createdAt">По дате создания</option>
                  <option value="deadline">По дедлайну</option>
                </select>
              )}
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="card-panel" style={{ marginBottom: '32px' }}>
              <h4 className="micro-cap" style={{ marginBottom: '16px' }}>{editingTask ? 'РЕДАКТИРОВАТЬ ЗАДАЧУ' : 'СОЗДАТЬ ЗАДАЧУ'}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <input className="input-spacex" type="text" placeholder="Название задачи..." value={title} onChange={e => setTitle(e.target.value)} autoFocus />

                <select className="input-spacex" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>

                <select className="input-spacex" value={priority} onChange={e => setPriority(e.target.value as any)}>
                  <option value="high">🔴 Высокий приоритет</option>
                  <option value="medium">🟡 Средний приоритет</option>
                  <option value="low">🔵 Низкий приоритет</option>
                </select>

                <select className="input-spacex" value={difficulty} onChange={e => {
                  const diff = e.target.value as Difficulty;
                  setDifficulty(diff);
                  setXp(DIFFICULTY_XP[diff]);
                }}>
                  <option value="easy">🟢 Лёгкая (20 XP)</option>
                  <option value="medium">🟡 Средняя (50 XP)</option>
                  <option value="hard">🔴 Сложная (100 XP)</option>
                </select>

                <input className="input-spacex" type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} />
                <input className="input-spacex" type="time" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-ghost btn-ghost-sm" onClick={handleSubmit}>
                  {editingTask ? '💾 СОХРАНИТЬ' : '➕ СОЗДАТЬ'}
                </button>
                <button className="btn-ghost btn-ghost-sm" onClick={resetForm}>✕ ОТМЕНА</button>
              </div>
            </div>
          )}

          {/* List */}
          {filteredTasks.length === 0 ? (
            <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>📋</p>
              <p className="micro-cap" style={{ marginBottom: '4px' }}>НЕТ ЗАДАЧ</p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Добавьте новую задачу выше</p>
            </div>
          ) : groupByDate && groupedTasks ? (
            Object.entries(groupedTasks)
              .sort(([dateA], [dateB]) => {
                if (dateA === 'Без дедлайна') return 1;
                if (dateB === 'Без дедлайна') return -1;
                const dir = sortDir === 'asc' ? 1 : -1;
                return dir * dateA.localeCompare(dateB);
              })
              .map(([date, group]) => (
              <div key={date} style={{ marginBottom: '24px' }}>
                <h4 className="micro-cap" style={{ marginBottom: '12px', borderBottom: '1px solid var(--hairline)', paddingBottom: '4px' }}>
                  📅 {date === 'Без дедлайна' ? 'БЕЗ ДЕДЛАЙНА' : new Date(date + 'T12:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {group.map(t => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      category={categoryMap[t.categoryId]}
                      onComplete={onComplete}
                      onUncomplete={onUncomplete}
                      onEdit={startEdit}
                      onDelete={onDelete}
                      onStartPomodoro={onStartPomodoro}
                      onShowPomodoroHistory={t => setSelectedPomodoroTask(t)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredTasks.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  category={categoryMap[t.categoryId]}
                  onComplete={onComplete}
                  onUncomplete={onUncomplete}
                  onEdit={startEdit}
                  onDelete={onDelete}
                  onStartPomodoro={onStartPomodoro}
                  onShowPomodoroHistory={t => setSelectedPomodoroTask(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {selectedPomodoroTask && (
        <PomodoroHistoryModal
          title={selectedPomodoroTask.title}
          sessions={pomodoroHistory.filter(p => p.taskId === selectedPomodoroTask.id)}
          onClose={() => setSelectedPomodoroTask(null)}
        />
      )}
    </section>
  );
}
