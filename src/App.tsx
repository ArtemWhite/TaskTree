import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  Task, Category, AppData, PomodoroSession, CompletedDay, Workout, Book
} from './types';
import { StorageService } from './services/StorageService';
import { XPService } from './services/XPService';
import { TaskService } from './services/TaskService';
import CalendarHeatmap from './components/calendar/CalendarHeatmap';
import TaskSection from './components/TaskSection';
import ProgressSection, { STAGE_NAMES } from './components/ProgressSection';
import RandomTask from './components/RandomTask';
import PomodoroModal from './components/PomodoroModal';
import Analytics from './components/Analytics';
import DataIO from './components/DataIO';
import SummaryTables from './components/tables/SummaryTables';
import SportsSection from './components/SportsSection';
import WorkoutCalendar from './components/calendar/WorkoutCalendar';
import TaskCalendar from './components/calendar/TaskCalendar';
import BooksSection from './components/BooksSection';

function getStoredLevel(): number {
  const data = StorageService.loadAppData();
  const totalXP = XPService.calculateTotalXP(data);
  return XPService.getLevelInfo(totalXP).level;
}

export default function App() {
  const [data, setData] = useState<AppData>(StorageService.loadAppData);
  const [activeTab, setActiveTab] = useState('tasks');
  const [pomodoroTask, setPomodoroTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(StorageService.getTheme);
  const [levelUpToast, setLevelUpToast] = useState<{ level: number; stage: number } | null>(null);
  const [toastProgress, setToastProgress] = useState(100);
  const prevLevelRef = useRef(getStoredLevel());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pomodoroCompleteToast, setPomodoroCompleteToast] = useState<{ taskId: string; taskTitle: string; xp: number } | null>(null);
  const [calendarView, setCalendarView] = useState<'heatmap' | 'tasks' | 'workouts'>('heatmap');

  useEffect(() => {
    StorageService.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    StorageService.saveAppData(data);
  }, [data]);

  const totalXP = useMemo(() => XPService.calculateTotalXP(data), [data]);
  const levelInfo = useMemo(() => XPService.getLevelInfo(totalXP), [totalXP]);
  const treeStage = useMemo(() => XPService.getTreeStage(levelInfo.level), [levelInfo.level]);

  // Detect level-up
  useEffect(() => {
    if (levelInfo.level > prevLevelRef.current && prevLevelRef.current > 0) {
      const stage = XPService.getTreeStage(levelInfo.level);
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
      ...task, id: TaskService.generateId(), completed: false,
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
    const newCat: Category = { ...cat, id: 'cat-' + TaskService.generateId() };
    setData(d => ({ ...d, categories: [...d.categories, newCat] }));
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

  const completePomodoro = useCallback((taskId: string, xpEarned: number) => {
    setPomodoroTask(prev => prev && prev.id === taskId ? { ...prev, pomodoroCount: (prev.pomodoroCount || 0) + 1 } : prev);
    setData(d => {
      const task = d.tasks.find(t => t.id === taskId);
      const taskTitle = task ? task.title : 'Задача';
      const newSession: PomodoroSession = {
        id: TaskService.generateId(), taskId, taskTitle,
        completedAt: new Date().toISOString(), xpEarned
      };
      return {
        ...d,
        pomodoroHistory: [...d.pomodoroHistory, newSession],
        tasks: d.tasks.map(t => t.id === taskId ? { ...t, pomodoroCount: (t.pomodoroCount || 0) + 1 } : t)
      };
    });
  }, []);

  const addWorkout = useCallback((workout: Omit<Workout, 'id' | 'createdAt'>) => {
    const newW: Workout = {
      ...workout, id: 'w-' + TaskService.generateId(), createdAt: new Date().toISOString()
    };
    setData(d => ({ ...d, workouts: [...(d.workouts || []), newW] }));
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
      ...d,
      workouts: (d.workouts || []).map(w => w.workoutType === oldName ? { ...w, workoutType: newName } : w)
    }));
  }, []);

  const addBook = useCallback((book: Omit<Book, 'id' | 'createdAt' | 'completedAt' | 'xp'>) => {
    const xpEarned = book.status === 'completed' ? Math.round(book.totalPages * 0.5) : 0;
    const newB: Book = {
      ...book,
      id: 'b-' + TaskService.generateId(),
      createdAt: new Date().toISOString(),
      completedAt: book.status === 'completed' ? new Date().toISOString() : null,
      xp: xpEarned
    };
    setData(d => ({ ...d, books: [...(d.books || []), newB] }));
  }, []);

  const updateBook = useCallback((id: string, updates: Partial<Book>) => {
    setData(d => ({
      ...d,
      books: (d.books || []).map(b => {
        if (b.id !== id) return b;
        const nextStatus = updates.status !== undefined ? updates.status : b.status;
        const nextPages = updates.totalPages !== undefined ? updates.totalPages : b.totalPages;
        const wasCompleted = b.status === 'completed';
        const isCompleted = nextStatus === 'completed';
        let xp = b.xp;
        let completedAt = b.completedAt;
        if (!wasCompleted && isCompleted) {
          xp = Math.round(nextPages * 0.5);
          completedAt = new Date().toISOString();
        } else if (wasCompleted && !isCompleted) {
          xp = 0;
          completedAt = null;
        } else if (isCompleted && updates.totalPages !== undefined) {
          xp = Math.round(nextPages * 0.5);
        }
        return { ...b, ...updates, xp, completedAt };
      })
    }));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setData(d => ({ ...d, books: (d.books || []).filter(b => b.id !== id) }));
  }, []);

  const importData = useCallback((json: string): boolean => {
    try {
      const newData: AppData = JSON.parse(json);
      setData({
        tasks: newData.tasks || [],
        categories: newData.categories || StorageService.DEFAULT_CATEGORIES,
        pomodoroHistory: newData.pomodoroHistory || [],
        settings: newData.settings || StorageService.DEFAULT_SETTINGS,
        workouts: newData.workouts || [],
        books: newData.books || []
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const activeTasks = useMemo(() => data.tasks.filter(t => !t.completed), [data.tasks]);
  const completedTasks = useMemo(() => data.tasks.filter(t => t.completed), [data.tasks]);

  const completedDays = useMemo(() => {
    const map: Record<string, { count: number; tasks: Task[] }> = {};
    completedTasks.forEach(t => {
      const dateKey = (t.completedDate || t.createdAt).slice(0, 10);
      if (!map[dateKey]) map[dateKey] = { count: 0, tasks: [] };
      map[dateKey].count++;
      map[dateKey].tasks.push(t);
    });
    return Object.entries(map).map(([date, { count, tasks }]): CompletedDay => ({ date, count, tasks }));
  }, [completedTasks]);

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
          task={pomodoroTask}
          settings={data.settings}
          onClose={() => setPomodoroTask(null)}
          onUpdateSettings={s => setData(d => ({ ...d, settings: { ...d.settings, ...s } }))}
          onSessionFinished={(_wasMinimized, xp) => {
            completePomodoro(pomodoroTask.id, xp);
            setPomodoroCompleteToast({ taskId: pomodoroTask.id, taskTitle: pomodoroTask.title, xp });
            setPomodoroTask(null);
          }}
        />
      )}

      {levelUpToast && (
        <div style={{
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 200,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-soft)',
          borderRadius: '16px', padding: '20px 24px', maxWidth: '360px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)', overflow: 'hidden',
          animation: 'grow 0.4s ease-out'
        }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: 'linear-gradient(90deg, #5aaa6f, #ffd700)', width: `${toastProgress}%`, transition: 'width 0.08s linear' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '36px' }}>🎉</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#ffd700' }}>НОВЫЙ УРОВЕНЬ!</div>
              <div style={{ fontSize: '14px', marginTop: '2px' }}>Вы достигли <strong>Уровня {levelUpToast.level}</strong></div>
              <div style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '2px' }}>Дерево: {STAGE_NAMES[levelUpToast.stage] || 'Выросло!'}</div>
            </div>
            <button className="btn-ghost btn-ghost-xs" style={{ marginLeft: 'auto', outline: 'none' }} onClick={() => setLevelUpToast(null)}>✕</button>
          </div>
        </div>
      )}

      {pomodoroCompleteToast && (
        <div
          style={{
            position: 'fixed', bottom: levelUpToast ? '140px' : '32px', right: '32px', zIndex: 200,
            background: 'var(--bg-secondary)', border: '1px solid #5aaa6f',
            borderRadius: '16px', padding: '20px 24px', maxWidth: '380px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)', cursor: 'pointer',
            animation: 'grow 0.4s ease-out'
          }}
          onClick={() => {
            const t = data.tasks.find(t => t.id === pomodoroCompleteToast.taskId);
            if (t) setPomodoroTask(t);
            setPomodoroCompleteToast(null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '36px' }}>🍅</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#5aaa6f' }}>ПОМОДОРО ЗАВЕРШЁН!</div>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>{pomodoroCompleteToast.taskTitle}</div>
              <div style={{ fontSize: '12px', color: '#5aaa6f', marginTop: '2px', fontWeight: 600 }}>+{pomodoroCompleteToast.xp} XP получено!</div>
            </div>
            <button className="btn-ghost btn-ghost-xs" style={{ marginLeft: 'auto', outline: 'none' }} onClick={(e) => { e.stopPropagation(); setPomodoroCompleteToast(null); }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
