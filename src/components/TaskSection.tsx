import { useState, useMemo } from 'react';
import type { Task, Category, Difficulty } from '../types';

interface Props {
  tasks: Task[];
  completedTasks: Task[];
  categories: Category[];
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
}

const DIFFICULTY_XP: Record<Difficulty, number> = { easy: 20, medium: 50, hard: 100 };

const EMOJI_LIST = ['🧠','🏋️','📚','💻','🎨','🎵','🍳','🏃','🧘','💼','📝','🎯','🌟','🔥','💡','🎮','📖','✍️','🎓','🏆','💪','🧹','🛒','📞','✈️','🚗','🏠','💰','🎁','🌈','🐾','🍕'];

export default function TaskSection({
  tasks, completedTasks, categories, onAdd, onUpdate, onDelete, onComplete, onUncomplete,
  onAddCategory, onUpdateCategory, onDeleteCategory, onStartPomodoro, editingTask, setEditingTask
}: Props) {
  const [subtab, setSubtab] = useState<'active' | 'completed' | 'categories'>('active');
  const [showForm, setShowForm] = useState(false);

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

  // Filter state
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'deadline' | 'title' | 'createdAt+deadline' | 'priority'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [groupByDate, setGroupByDate] = useState(false);

  const filteredTasks = useMemo(() => {
    let list = subtab === 'active' ? tasks : completedTasks;
    if (filterCategory !== 'all') list = list.filter(t => t.categoryId === filterCategory);
    if (filterDifficulty !== 'all') list = list.filter(t => t.difficulty === filterDifficulty);
    if (searchTerm) list = list.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title, 'ru');
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

  const categoryMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => { m[c.id] = c; });
    return m;
  }, [categories]);

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>ЗАДАЧИ</h2>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)', flexWrap: 'wrap' }}>
        {(['active','completed','categories'] as const).map(t => (
          <button key={t} className={`tab-btn ${subtab === t ? 'active' : ''}`} onClick={() => setSubtab(t)}>
            {t === 'active' ? `АКТИВНЫЕ (${tasks.length})` : t === 'completed' ? `ВЫПОЛНЕННЫЕ (${completedTasks.length})` : 'КАТЕГОРИИ'}
          </button>
        ))}
      </div>

      {/* CATEGORIES SUBTAB */}
      {subtab === 'categories' && (
        <div className="card-panel" style={{ marginBottom: '24px' }}>
          <h3 className="micro-cap" style={{ marginBottom: '20px' }}>УПРАВЛЕНИЕ КАТЕГОРИЯМИ</h3>

          {/* Add category form */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label className="micro-cap" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Название</label>
              <input className="input-spacex" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Новая категория" />
            </div>
            <div style={{ position: 'relative' }}>
              <label className="micro-cap" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Эмодзи</label>
              <button className="input-spacex" style={{ width: '60px', textAlign: 'center', cursor: 'pointer' }}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                {catEmoji}
              </button>
              {showEmojiPicker && (
                <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 20, background: 'var(--bg-secondary)', border: '1px solid var(--hairline)', borderRadius: '8px', padding: '8px', marginTop: '4px' }}>
                  <div className="emoji-grid">
                    {EMOJI_LIST.map(e => (
                      <button key={e} className={`emoji-option ${catEmoji === e ? 'selected' : ''}`}
                        onClick={() => { setCatEmoji(e); setShowEmojiPicker(false); }}>{e}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="micro-cap" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Цвет</label>
              <input type="color" className="input-spacex" style={{ width: '50px', height: '46px', padding: '4px', cursor: 'pointer' }}
                value={catColor} onChange={e => setCatColor(e.target.value)} />
            </div>
            <button className="btn-ghost btn-ghost-sm" onClick={handleAddCategory}>ДОБАВИТЬ</button>
          </div>

          {/* Category list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-hover)', borderRadius: '4px' }}>
                {editCatId === cat.id ? (
                  <>
                    <input className="input-spacex" style={{ flex: 1 }} value={catName} onChange={e => setCatName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { onUpdateCategory(cat.id, { name: catName, emoji: catEmoji, color: catColor }); setEditCatId(null); } }} />
                    <button className="emoji-option" style={{ fontSize: '20px' }} onClick={() => setShowEmojiPicker(!showEmojiPicker)}>{catEmoji}</button>
                    {showEmojiPicker && (
                      <div style={{ position: 'absolute', zIndex: 20, background: 'var(--bg-secondary)', border: '1px solid var(--hairline)', borderRadius: '8px', padding: '8px' }}>
                        <div className="emoji-grid">
                          {EMOJI_LIST.map(e => (
                            <button key={e} className={`emoji-option ${catEmoji === e ? 'selected' : ''}`}
                              onClick={() => { setCatEmoji(e); setShowEmojiPicker(false); }}>{e}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} style={{ width: '36px', height: '36px' }} />
                    <button className="btn-ghost btn-ghost-xs" onClick={() => { onUpdateCategory(cat.id, { name: catName, emoji: catEmoji, color: catColor }); setEditCatId(null); }}>✓</button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '24px' }}>{cat.emoji}</span>
                    <span style={{ flex: 1, fontSize: '14px' }}>{cat.name}</span>
                    <span className="badge" style={{ borderColor: cat.color, color: cat.color }}>
                      {tasks.filter(t => t.categoryId === cat.id && !t.completed).length} активных
                    </span>
                    <button className="btn-ghost btn-ghost-xs" onClick={() => {
                      setEditCatId(cat.id); setCatName(cat.name); setCatEmoji(cat.emoji); setCatColor(cat.color);
                    }}>РЕД</button>
                    <button className="btn-ghost btn-ghost-xs" onClick={() => onDeleteCategory(cat.id)}
                      disabled={categories.length <= 1}>УДЛ</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE / COMPLETED SUBTABS */}
      {subtab !== 'categories' && (
        <>
          {/* Filters & Add button */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="input-spacex" style={{ flex: '1 1 200px', minWidth: '180px' }}
              placeholder="Поиск задач..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select className="input-spacex" style={{ width: 'auto' }} value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">Все категории</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
            <select className="input-spacex" style={{ width: 'auto' }} value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}>
              <option value="all">Все сложности</option>
              <option value="easy">Лёгкая</option>
              <option value="medium">Средняя</option>
              <option value="hard">Сложная</option>
            </select>
            <select className="input-spacex" style={{ width: 'auto' }} value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}>
              <option value="createdAt">По созданию</option>
              <option value="deadline">По дедлайну</option>
              <option value="title">По названию</option>
              <option value="priority">По приоритету</option>
              <option value="createdAt+deadline">По дедлайну и дате</option>
            </select>
            <button className="btn-ghost btn-ghost-xs" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              title={sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}>
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
            <button className={`btn-ghost btn-ghost-xs ${groupByDate ? 'active' : ''}`} onClick={() => setGroupByDate(!groupByDate)}>
              ГРУППИРОВКА: {groupByDate ? 'ПО ДНЯМ' : 'НЕТ'}
            </button>
            {subtab === 'active' && (
              <button className="btn-ghost" onClick={() => { resetForm(); setShowForm(true); }}>
                + ДОБАВИТЬ
              </button>
            )}
          </div>

          {/* Task Form Modal */}
          {showForm && (
            <div className="modal-overlay" onClick={resetForm}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <h3 className="micro-cap" style={{ marginBottom: '20px' }}>
                  {editingTask ? 'РЕДАКТИРОВАТЬ ЗАДАЧУ' : 'НОВАЯ ЗАДАЧА'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input className="input-spacex" placeholder="Название задачи" value={title}
                    onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }} autoFocus />
                  <select className="input-spacex" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <select className="input-spacex" value={difficulty} onChange={e => {
                      const d = e.target.value as Difficulty;
                      setDifficulty(d);
                      setXp(DIFFICULTY_XP[d]);
                    }}>
                      <option value="easy">Лёгкая (20 XP)</option>
                      <option value="medium">Средняя (50 XP)</option>
                      <option value="hard">Сложная (100 XP)</option>
                    </select>
                    <select className="input-spacex" value={priority} onChange={e => setPriority(e.target.value as 'low'|'medium'|'high')}>
                      <option value="low">Приоритет: Низкий</option>
                      <option value="medium">Приоритет: Средний</option>
                      <option value="high">Приоритет: Высокий</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label className="micro-cap" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Дедлайн (дата)</label>
                      <input type="date" className="input-spacex" value={deadlineDate}
                        onChange={e => setDeadlineDate(e.target.value)} />
                    </div>
                    <div style={{ width: '120px' }}>
                      <label className="micro-cap" style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>Время</label>
                      <input type="time" className="input-spacex" value={deadlineTime}
                        onChange={e => setDeadlineTime(e.target.value)} />
                    </div>
                    <button className="btn-ghost btn-ghost-xs" style={{ alignSelf: 'flex-end', marginBottom: '2px' }}
                      onClick={() => { setDeadlineDate(''); setDeadlineTime(''); }}
                      title="Очистить дедлайн">ОЧИСТ</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button className="btn-ghost" onClick={handleSubmit}>
                    {editingTask ? 'СОХРАНИТЬ' : 'ДОБАВИТЬ'}
                  </button>
                  <button className="btn-ghost btn-ghost-sm" onClick={resetForm}>ОТМЕНА</button>
                </div>
              </div>
            </div>
          )}

          {/* Task list */}
          <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
            {filteredTasks.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {subtab === 'active' ? 'Нет активных задач. Добавьте новую!' : 'Нет выполненных задач.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(() => {
                  const renderTask = (task: Task) => {
                    const cat = categoryMap[task.categoryId];
                    return (
                      <div key={task.id} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px',
                        borderBottom: '1px solid var(--hairline)', flexWrap: 'wrap', opacity: task.completed ? 0.5 : 1,
                        transition: 'opacity 0.3s'
                      }}>
                        {!task.completed ? (
                          <button className="checkbox-spacex" onClick={() => onComplete(task.id)}
                            title="Отметить выполненной" />
                        ) : (
                          <button className="checkbox-spacex" style={{ background: '#ffffff' }}
                            onClick={() => onUncomplete(task.id)} title="Вернуть в активные">
                            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', fontSize: '12px' }}>✓</span>
                          </button>
                        )}
  
                        <span style={{ fontSize: '20px' }}>{cat?.emoji || '📝'}</span>
  
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <div style={{ fontSize: '14px', textDecoration: task.completed ? 'line-through' : 'none' }}>
                            {task.title}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                            <span className="badge">{cat?.name || '—'}</span>
                            <span className="badge">
                              {task.difficulty === 'easy' ? 'ЛЁГКАЯ' : task.difficulty === 'medium' ? 'СРЕДНЯЯ' : 'СЛОЖНАЯ'}
                            </span>
                            {task.priority && (
                              <span className="badge" style={{
                                borderColor: task.priority === 'high' ? '#ff6b6b' : task.priority === 'medium' ? '#ffd700' : '#a29bfe',
                                color: task.priority === 'high' ? '#ff6b6b' : task.priority === 'medium' ? '#ffd700' : '#a29bfe'
                              }}>
                                {task.priority === 'high' ? '🔥 ВЫСОКИЙ' : task.priority === 'medium' ? '⭐ СРЕДНИЙ' : '🔽 НИЗКИЙ'}
                              </span>
                            )}
                            <span className="badge">+{task.xp} XP</span>
                            {task.pomodoroCount > 0 && (
                              <span className="badge">🍅 ×{task.pomodoroCount}</span>
                            )}
                            {task.deadline && (
                              <span className="badge" style={(() => {
                                const deadlineDate = new Date(task.deadline);
                                const now = new Date();
                                if (task.completed && task.completedDate) {
                                  const completedDate = new Date(task.completedDate);
                                  const onTime = completedDate <= deadlineDate;
                                  return { borderColor: onTime ? '#5aaa6f' : '#ff6b6b', color: onTime ? '#5aaa6f' : '#ff6b6b' };
                                }
                                const overdue = deadlineDate < now;
                                return { borderColor: overdue ? '#ff6b6b' : '#5aaa6f', color: overdue ? '#ff6b6b' : '#5aaa6f' };
                              })()}>
                                ⏰ {new Date(task.deadline).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                                {task.deadline.includes('T') && task.deadline.slice(11, 16) !== '23:59' ? ` ${task.deadline.slice(11, 16)}` : ''}
                              </span>
                            )}
                            {task.completed && task.completedDate && (
                              <span className="badge">
                                ✓ {new Date(task.completedDate).toLocaleDateString('ru')}
                              </span>
                            )}
                          </div>
                        </div>
  
                        {!task.completed && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn-ghost btn-ghost-xs" onClick={() => onStartPomodoro(task)} title="Помодоро-таймер">
                              🍅
                            </button>
                            <button className="btn-ghost btn-ghost-xs" onClick={() => startEdit(task)}>РЕД</button>
                            <button className="btn-ghost btn-ghost-xs" onClick={() => onDelete(task.id)}>УДЛ</button>
                          </div>
                        )}
                        {task.completed && (
                          <button className="btn-ghost btn-ghost-xs" onClick={() => onDelete(task.id)}>УДЛ</button>
                        )}
                      </div>
                    );
                  };

                  if (groupByDate) {
                    const groups: Record<string, Task[]> = {};
                    const noDateTasks: Task[] = [];
                    
                    filteredTasks.forEach(t => {
                      const dateField = subtab === 'active' ? t.deadline : t.completedDate;
                      if (!dateField) {
                        noDateTasks.push(t);
                      } else {
                        const dateStr = dateField.slice(0, 10);
                        if (!groups[dateStr]) groups[dateStr] = [];
                        groups[dateStr].push(t);
                      }
                    });

                    const sortedDates = Object.keys(groups).sort((a, b) => sortDir === 'asc' ? a.localeCompare(b) : b.localeCompare(a));
                    
                    return (
                      <>
                        {sortedDates.map(date => (
                          <div key={date}>
                            <div style={{ padding: '8px 24px', background: 'var(--surface-hover)', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid var(--hairline)' }}>
                              {new Date(date).toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'long' })}
                            </div>
                            {groups[date].map(renderTask)}
                          </div>
                        ))}
                        {noDateTasks.length > 0 && (
                          <div>
                            <div style={{ padding: '8px 24px', background: 'var(--surface-hover)', fontSize: '13px', fontWeight: 'bold', borderBottom: '1px solid var(--hairline)' }}>
                              Без даты
                            </div>
                            {noDateTasks.map(renderTask)}
                          </div>
                        )}
                      </>
                    );
                  }

                  return filteredTasks.map(renderTask);
                })()}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
