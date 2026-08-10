import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  Task, Category, AppData, PomodoroSession, TreeStage, AppSettings, CompletedDay, Workout, Book
} from './types';
import CalendarHeatmap from './components/CalendarHeatmap';
import TaskSection from './components/TaskSection';
import ProgressSection, { STAGE_NAMES } from './components/ProgressSection';
import RandomTask from './components/RandomTask';
import PomodoroModal from './components/PomodoroModal';
import Analytics from './components/Analytics';
import DataIO from './components/DataIO';
import SummaryTables from './components/SummaryTables';
import SportsSection from './components/SportsSection';
import WorkoutCalendar from './components/WorkoutCalendar';
import TaskCalendar from './components/TaskCalendar';
import BooksSection from './components/BooksSection';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Работа', emoji: '🧠', color: '#ffffff' },
  { id: 'cat-2', name: 'Учёба', emoji: '📚', color: '#a0a0ff' },
];

const DEFAULT_SETTINGS: AppSettings = { pomodoroWorkMinutes: 25, pomodoroBonusXP: 5 };

const STORAGE_KEY = 'tasktrecker-data';

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tasks: [], categories: DEFAULT_CATEGORIES, pomodoroHistory: [], settings: DEFAULT_SETTINGS, workouts: [], books: [] };
}

function saveData(data: AppData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

function getLevelThresholds(): number[] {
  const thresholds: number[] = [];
  let threshold = 0;
  let step = 100;
  for (let i = 0; i < 50; i++) {
    thresholds.push(threshold);
    threshold += step;
    step = Math.round(step * 1.2);
  }
  return thresholds;
}
const LEVEL_THRESHOLDS = getLevelThresholds();

function getTreeStage(level: number): TreeStage {
  return Math.min(level - 1, 49);
}

function getXPForLevel(xp: number): { current: number; next: number; level: number } {
  if (xp === 0) return { current: 0, next: 100, level: 1 };
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (xp < LEVEL_THRESHOLDS[i + 1]) {
      return {
        level: i + 1,
        current: xp - LEVEL_THRESHOLDS[i],
        next: LEVEL_THRESHOLDS[i + 1] - LEVEL_THRESHOLDS[i]
      };
    }
  }
  const lvl = LEVEL_THRESHOLDS.length;
  return { level: lvl, current: 0, next: 0 };
}

function getInitialTheme(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem('tasktrecker-theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

function getStoredLevel(): number {
  const d = loadData();
  const tXP = d.tasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0);
  const pXP = d.pomodoroHistory.reduce((s, p) => s + p.xpEarned, 0);
  const wXP = (d.workouts || []).filter(w => w.completed).reduce((s, w) => s + w.xp, 0);
  const bXP = (d.books || []).filter(b => b.status === 'completed').reduce((s, b) => s + b.xp, 0);
  return getXPForLevel(tXP + pXP + wXP + bXP).level;
}

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [activeTab, setActiveTab] = useState('tasks');
  const [pomodoroTask, setPomodoroTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [levelUpToast, setLevelUpToast] = useState<{ level: number; stage: number } | null>(null);
  const [toastProgress, setToastProgress] = useState(100);
  const prevLevelRef = useRef(getStoredLevel());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pomodoroCompleteToast, setPomodoroCompleteToast] = useState<{ taskId: string; taskTitle: string; xp: number } | null>(null);
  const [pomodoroRestoreSignal, setPomodoroRestoreSignal] = useState(0);
  const [calendarView, setCalendarView] = useState<'heatmap' | 'tasks' | 'workouts'>('heatmap');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tasktrecker-theme', theme);
  }, [theme]);

  useEffect(() => { saveData(data); }, [data]);

  const totalXP = useMemo(() => {
    const taskXP = data.tasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0);
    const pomoXP = data.pomodoroHistory.reduce((s, p) => s + p.xpEarned, 0);
    const workoutXP = (data.workouts || []).filter(w => w.completed).reduce((s, w) => s + w.xp, 0);
    const bookXP = (data.books || []).filter(b => b.status === 'completed').reduce((s, b) => s + b.xp, 0);
    return taskXP + pomoXP + workoutXP + bookXP;
  }, [data]);

  const levelInfo = getXPForLevel(totalXP);
  const treeStage = getTreeStage(levelInfo.level);

  // Detect level-up
  useEffect(() => {
    if (levelInfo.level > prevLevelRef.current && prevLevelRef.current > 0) {
      const stage = getTreeStage(levelInfo.level);
      setLevelUpToast({ level: levelInfo.level, stage });
      setToastProgress(100);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastProgressRef.current) clearInterval(toastProgressRef.current);
      toastTimerRef.current = setTimeout(() => setLevelUpToast(null), 10000);
      const startTime = Date.now();
      toastProgressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.max(0, 100 - (elapsed / 10000) * 100);
        setToastProgress(pct);
        if (pct <= 0) { if (toastProgressRef.current) clearInterval(toastProgressRef.current); }
      }, 80);
    }
    prevLevelRef.current = levelInfo.level;
  }, [levelInfo.level]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastProgressRef.current) clearInterval(toastProgressRef.current);
    };
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'completed' | 'completedDate' | 'pomodoroCount' | 'createdAt'>) => {
    const newTask: Task = {
      ...task, id: generateId(), completed: false,
      completedDate: null, pomodoroCount: 0, createdAt: new Date().toISOString(), deadline: task.deadline || null
    };
    setData(d => ({ ...d, tasks: [...d.tasks, newTask] }));
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setData(d => ({ ...d, tasks: d.tasks.map(t => t.id === id ? { ...t, ...updates } : t) }));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setData(d => ({ ...d, tasks: d.tasks.filter(t => t.id !== id) }));
  }, []);

  const completeTask = useCallback((id: string) => {
    setData(d => ({
      ...d, tasks: d.tasks.map(t =>
        t.id === id ? { ...t, completed: true, completedDate: new Date().toISOString() } : t
      )
    }));
  }, []);

  const uncompleteTask = useCallback((id: string) => {
    setData(d => ({
      ...d, tasks: d.tasks.map(t =>
        t.id === id ? { ...t, completed: false, completedDate: null } : t
      )
    }));
  }, []);

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    setData(d => ({ ...d, categories: [...d.categories, { ...cat, id: generateId() }] }));
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setData(d => ({ ...d, categories: d.categories.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData(d => ({
      ...d,
      categories: d.categories.filter(c => c.id !== id),
      tasks: d.tasks.map(t => t.categoryId === id ? { ...t, categoryId: d.categories[0]?.id || '' } : t)
    }));
  }, []);

  const addPomodoroSession = useCallback((taskId: string, taskTitle: string, xpEarned: number) => {
    const session: PomodoroSession = {
      id: generateId(), taskId, taskTitle, completedAt: new Date().toISOString(), xpEarned
    };
    setData(d => ({
      ...d,
      pomodoroHistory: [...d.pomodoroHistory, session],
      tasks: d.tasks.map(t => t.id === taskId ? { ...t, pomodoroCount: t.pomodoroCount + 1 } : t)
    }));
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...s } }));
  }, []);

  const addWorkout = useCallback((workout: Omit<Workout, 'id' | 'createdAt'>) => {
    const newWorkout: Workout = { ...workout, id: generateId(), createdAt: new Date().toISOString() };
    setData(d => ({ ...d, workouts: [...(d.workouts || []), newWorkout] }));
  }, []);

  const updateWorkout = useCallback((id: string, updates: Partial<Workout>) => {
    setData(d => ({ ...d, workouts: (d.workouts || []).map(w => w.id === id ? { ...w, ...updates } : w) }));
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setData(d => ({ ...d, workouts: (d.workouts || []).filter(w => w.id !== id) }));
  }, []);

  const completeWorkout = useCallback((id: string) => {
    setData(d => ({
      ...d, workouts: (d.workouts || []).map(w => w.id === id ? { ...w, completed: true } : w)
    }));
  }, []);

  const uncompleteWorkout = useCallback((id: string) => {
    setData(d => ({
      ...d, workouts: (d.workouts || []).map(w => w.id === id ? { ...w, completed: false } : w)
    }));
  }, []);

  const renameWorkoutType = useCallback((oldName: string, newName: string) => {
    setData(d => ({
      ...d, workouts: (d.workouts || []).map(w => w.workoutType === oldName ? { ...w, workoutType: newName } : w)
    }));
  }, []);

  const addBook = useCallback((book: Omit<Book, 'id' | 'createdAt' | 'completedAt' | 'xp'>) => {
    const xp = Math.floor(book.totalPages / 10); // Example: 1 XP per 10 pages
    const newBook: Book = {
      ...book, id: generateId(), createdAt: new Date().toISOString(), completedAt: book.status === 'completed' ? new Date().toISOString() : null, xp
    };
    setData(d => ({ ...d, books: [...(d.books || []), newBook] }));
  }, []);

  const updateBook = useCallback((id: string, updates: Partial<Book>) => {
    setData(d => ({
      ...d, books: (d.books || []).map(b => {
        if (b.id !== id) return b;
        const newStatus = updates.status || b.status;
        const completedAt = (newStatus === 'completed' && b.status !== 'completed') ? new Date().toISOString() : b.completedAt;
        const totalPages = updates.totalPages ?? b.totalPages;
        const xp = Math.floor(totalPages / 10);
        return { ...b, ...updates, completedAt, xp };
      })
    }));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setData(d => ({ ...d, books: (d.books || []).filter(b => b.id !== id) }));
  }, []);

  const importData = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.tasks && parsed.categories) {
        setData({ ...DEFAULT_SETTINGS, ...parsed, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } });
        return true;
      }
    } catch {}
    return false;
  }, []);

  const completedDays: CompletedDay[] = useMemo(() => {
    const map: Record<string, Task[]> = {};
    data.tasks.filter(t => t.completed && t.completedDate).forEach(t => {
      const d = t.completedDate!.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    data.pomodoroHistory.forEach(p => {
      const d = p.completedAt.slice(0, 10);
      if (!map[d]) map[d] = [];
    });
    (data.workouts || []).filter(w => w.completed).forEach(w => {
      const d = w.date;
      if (!map[d]) map[d] = [];
    });
    return Object.entries(map).map(([date, tasks]) => ({ date, count: tasks.length, tasks }));
  }, [data]);

  const activeTasks = data.tasks.filter(t => !t.completed);
  const completedTasks = data.tasks.filter(t => t.completed);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, background: 'var(--nav-bg)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--hairline)',
        padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            🌱 TaskTracker
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="micro-cap" style={{ fontSize: '12px', letterSpacing: '0.96px', textTransform: 'uppercase' }}>
              LVL {levelInfo.level}
            </span>
            <div className="progress-bar" style={{ width: '140px' }}>
              <div className="progress-bar-fill" style={{ width: `${(levelInfo.current / levelInfo.next) * 100}%` }} />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>{totalXP} XP</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['tasks','sports','books','progress','calendar','analytics','tables'] as const).map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'tasks' ? 'ЗАДАЧИ' : tab === 'sports' ? 'СПОРТ' : tab === 'books' ? 'КНИГИ' : tab === 'progress' ? 'ПРОГРЕСС' : tab === 'calendar' ? 'КАЛЕНДАРЬ' : tab === 'analytics' ? 'АНАЛИТИКА' : 'ТАБЛИЦЫ'}
              </button>
            ))}
          </div>
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <DataIO data={data} onImport={importData} />
        </div>
      </nav>

      {/* HERO with starfield */}
      <section style={{ textAlign: 'center', padding: '64px 24px 48px', borderBottom: '1px solid var(--hairline)', position: 'relative', overflow: 'hidden' }}>
        <div className="starfield" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p className="micro-cap" style={{ marginBottom: '16px' }}>ТРЕКЕР ЗАДАЧ И ПРИВЫЧЕК</p>
          <h1 className="section-heading" style={{ marginBottom: '16px' }}>ПЛАНИРУЙ И ОТСЛЕЖИВАЙ<br />СВОИ РЕЗУЛЬТАТЫ</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: '16px', letterSpacing: '0.32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Задачи, спорт и помодоро-таймер в одном месте. Выполняй цели, зарабатывай опыт и следи за прогрессом.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => setActiveTab('tasks')}>ДОБАВИТЬ ЗАДАЧУ</button>
            <RandomTask tasks={activeTasks} onActivate={() => setActiveTab('tasks')} />
            <button className="btn-ghost" onClick={() => setActiveTab('sports')}>🏋️ СПОРТ</button>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div key={activeTab} className="tab-fade-in">
          {activeTab === 'tasks' && (
            <TaskSection
              tasks={activeTasks}
              completedTasks={completedTasks}
              categories={data.categories}
              onAdd={addTask}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onComplete={completeTask}
              onUncomplete={uncompleteTask}
              onAddCategory={addCategory}
              onUpdateCategory={updateCategory}
              onDeleteCategory={deleteCategory}
              onStartPomodoro={setPomodoroTask}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
            />
          )}
          {activeTab === 'sports' && (
            <SportsSection
              workouts={data.workouts || []}
              onAdd={addWorkout}
              onUpdate={updateWorkout}
              onDelete={deleteWorkout}
              onComplete={completeWorkout}
              onUncomplete={uncompleteWorkout}
              onRenameWorkoutType={renameWorkoutType}
            />
          )}
          {activeTab === 'books' && (
            <BooksSection
              books={data.books || []}
              onAdd={addBook}
              onUpdate={updateBook}
              onDelete={deleteBook}
            />
          )}
          {activeTab === 'progress' && (
            <section>
              <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>ПРОГРЕСС</h2>
              <ProgressSection
                totalXP={totalXP} treeStage={treeStage} levelInfo={levelInfo}
                activeCount={activeTasks.length} completedCount={completedTasks.length}
                pomodoroSessions={data.pomodoroHistory.length}
                workoutsCount={(data.workouts || []).filter(w => w.completed).length}
                workoutsDuration={(data.workouts || []).filter(w => w.completed).reduce((s, w) => s + w.duration, 0)}
                booksCount={(data.books || []).filter(b => b.status === 'completed').length}
                booksPages={(data.books || []).filter(b => b.status === 'completed').reduce((s, b) => s + b.totalPages, 0)}
                large sideLayout treeSize={480} zoom={1}
              />
            </section>
          )}
          {activeTab === 'calendar' && (
            <section>
              <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>КАЛЕНДАРЬ</h2>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)', flexWrap: 'wrap' }}>
                <button className={`tab-btn ${calendarView === 'heatmap' ? 'active' : ''}`} onClick={() => setCalendarView('heatmap')}>🔥 ИСТОРИЯ</button>
                <button className={`tab-btn ${calendarView === 'tasks' ? 'active' : ''}`} onClick={() => setCalendarView('tasks')}>📋 ЗАДАЧИ</button>
                <button className={`tab-btn ${calendarView === 'workouts' ? 'active' : ''}`} onClick={() => setCalendarView('workouts')}>🏋️ ТРЕНИРОВКИ</button>
              </div>
              {calendarView === 'heatmap' && <CalendarHeatmap completedDays={completedDays} />}
              {calendarView === 'tasks' && (
                <TaskCalendar
                  tasks={activeTasks}
                  completedTasks={completedTasks}
                  categories={data.categories}
                  onComplete={completeTask}
                  onDelete={deleteTask}
                  onStartPomodoro={setPomodoroTask}
                />
              )}
              {calendarView === 'workouts' && <WorkoutCalendar workouts={data.workouts || []} />}
            </section>
          )}
          {activeTab === 'analytics' && (
            <Analytics
              tasks={data.tasks}
              pomodoroHistory={data.pomodoroHistory}
              categories={data.categories}
              workouts={data.workouts || []}
            />
          )}
          {activeTab === 'tables' && (
            <SummaryTables
              tasks={data.tasks}
              categories={data.categories}
              pomodoroHistory={data.pomodoroHistory}
              workouts={data.workouts || []}
            />
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--hairline)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', letterSpacing: '0.32px', color: 'var(--text-muted)' }}>
          TASKTRACKER — ТРЕКЕР ЗАДАЧ И ПРИВЫЧЕК
        </p>
      </footer>

      {pomodoroTask && (
        <PomodoroModal
          task={data.tasks.find(t => t.id === pomodoroTask.id) || pomodoroTask}
          settings={data.settings}
          onClose={() => { setPomodoroTask(null); setPomodoroCompleteToast(null); }}
          onUpdateSettings={updateSettings}
          onSessionFinished={(wasMinimized: boolean, xp: number) => {
            addPomodoroSession(pomodoroTask.id, pomodoroTask.title, xp);
            if (wasMinimized) {
              setPomodoroCompleteToast({ taskId: pomodoroTask.id, taskTitle: pomodoroTask.title, xp });
            }
          }}
          restoreSignal={pomodoroRestoreSignal}
        />
      )}

      {/* Level-up toast */}
      {levelUpToast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 100,
          background: 'var(--bg-secondary)', border: '1px solid var(--hairline)',
          borderRadius: '12px', padding: '16px 20px', maxWidth: '320px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)', cursor: 'pointer',
          animation: 'grow 0.4s ease-out'
        }} onClick={() => { setActiveTab('progress'); setLevelUpToast(null); }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                🌱 ДЕРЕВО ВЫРОСЛО!
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-soft)', margin: 0 }}>
                {STAGE_NAMES[levelUpToast.stage]} &middot; Стадия {levelUpToast.stage + 1}/50 &middot; Уровень {levelUpToast.level}
              </p>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
                Нажмите, чтобы посмотреть
              </p>
            </div>
            <button className="btn-ghost btn-ghost-xs" style={{ flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); setLevelUpToast(null); }}
              title="Закрыть">✕</button>
          </div>
          {/* Progress bar */}
          <div style={{ marginTop: '10px', height: '3px', background: 'var(--progress-bar-bg)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: '#5aaa6f', borderRadius: '2px',
              width: `${toastProgress}%`, transition: 'width 0.08s linear'
            }} />
          </div>
        </div>
      )}
      {/* Pomodoro completion toast — persistent, no auto-dismiss */}
      {pomodoroCompleteToast && (
        <div style={{
          position: 'fixed', bottom: '120px', right: '24px', zIndex: 101,
          background: 'var(--bg-secondary)', border: '1px solid var(--hairline)',
          borderRadius: '12px', padding: '16px 20px', maxWidth: '320px',
          cursor: 'pointer', animation: 'grow 0.4s ease-out',
        }} onClick={() => {
          if (!pomodoroTask) {
            const t = data.tasks.find(t => t.id === pomodoroCompleteToast.taskId);
            if (t) setPomodoroTask(t);
          }
          setPomodoroRestoreSignal(s => s + 1);
          setPomodoroCompleteToast(null);
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '4px' }}>
                🍅 СЕССИЯ ЗАВЕРШЕНА!
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-soft)', margin: 0 }}>
                {pomodoroCompleteToast.taskTitle}
              </p>
              <p style={{ fontSize: '11px', color: '#5aaa6f', marginTop: '4px', marginBottom: 0 }}>
                +{pomodoroCompleteToast.xp} XP
              </p>
            </div>
            <button className="btn-ghost btn-ghost-xs" style={{ flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); setPomodoroCompleteToast(null); }}
              title="Закрыть">✕</button>
          </div>
        </div>
      )}

    </div>
  );
}
