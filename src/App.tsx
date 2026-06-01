import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  Task, Category, AppData, PomodoroSession, TreeStage, AppSettings, CompletedDay
} from './types';
import CalendarHeatmap from './components/CalendarHeatmap';
import TaskSection from './components/TaskSection';
import ProgressSection, { STAGE_NAMES } from './components/ProgressSection';
import RandomTask from './components/RandomTask';
import PomodoroModal from './components/PomodoroModal';
import Analytics from './components/Analytics';
import DataIO from './components/DataIO';
import SummaryTables from './components/SummaryTables';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Работа', emoji: '🧠', color: '#ffffff' },
  { id: 'cat-2', name: 'Спорт', emoji: '🏋️', color: '#f0f0fa' },
  { id: 'cat-3', name: 'Учёба', emoji: '📚', color: '#a0a0ff' },
];

const DEFAULT_SETTINGS: AppSettings = { pomodoroWorkMinutes: 25, pomodoroBonusXP: 5 };

const STORAGE_KEY = 'tasktrecker-data';

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tasks: [], categories: DEFAULT_CATEGORIES, pomodoroHistory: [], settings: DEFAULT_SETTINGS };
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

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [activeTab, setActiveTab] = useState('tasks');
  const [pomodoroTask, setPomodoroTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [levelUpToast, setLevelUpToast] = useState<{ level: number; stage: number } | null>(null);
  const prevLevelRef = useRef(1);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('tasktrecker-theme', theme);
  }, [theme]);

  useEffect(() => { saveData(data); }, [data]);

  const totalXP = useMemo(() => {
    const taskXP = data.tasks.filter(t => t.completed).reduce((s, t) => s + t.xp, 0);
    const pomoXP = data.pomodoroHistory.reduce((s, p) => s + p.xpEarned, 0);
    return taskXP + pomoXP;
  }, [data]);

  const levelInfo = getXPForLevel(totalXP);
  const treeStage = getTreeStage(levelInfo.level);

  // Detect level-up
  useEffect(() => {
    if (levelInfo.level > prevLevelRef.current && prevLevelRef.current > 0) {
      const stage = getTreeStage(levelInfo.level);
      setLevelUpToast({ level: levelInfo.level, stage });
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setLevelUpToast(null), 10000);
    }
    prevLevelRef.current = levelInfo.level;
  }, [levelInfo.level]);

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
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
            {(['tasks','progress','calendar','analytics','tables'] as const).map(tab => (
              <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'tasks' ? 'ЗАДАЧИ' : tab === 'progress' ? 'ПРОГРЕСС' : tab === 'calendar' ? 'КАЛЕНДАРЬ' : tab === 'analytics' ? 'АНАЛИТИКА' : 'ТАБЛИЦЫ'}
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
          <p className="micro-cap" style={{ marginBottom: '16px' }}>ПЕРСОНАЛЬНЫЙ ТРЕКЕР ПРОДУКТИВНОСТИ</p>
          <h1 className="section-heading" style={{ marginBottom: '16px' }}>ДОСТИГАЙ БОЛЬШЕГО<br />С ГЕЙМИФИКАЦИЕЙ</h1>
          <p style={{ color: 'var(--text-soft)', fontSize: '16px', letterSpacing: '0.32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            Отслеживай привычки, выполняй задачи, расти дерево прогресса и соревнуйся с собой.
            Каждое действие приносит опыт — преврати продуктивность в игру.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={() => setActiveTab('tasks')}>ДОБАВИТЬ ЗАДАЧУ</button>
            <RandomTask tasks={activeTasks} onActivate={() => setActiveTab('tasks')} />
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
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
        {activeTab === 'progress' && (
          <section>
            <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>ПРОГРЕСС</h2>
            <ProgressSection
              totalXP={totalXP} treeStage={treeStage} levelInfo={levelInfo}
              activeCount={activeTasks.length} completedCount={completedTasks.length}
              pomodoroSessions={data.pomodoroHistory.length}
              large sideLayout treeSize={480} zoom={1}
            />
          </section>
        )}
        {activeTab === 'calendar' && (
          <section>
            <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>КАЛЕНДАРЬ</h2>
            <CalendarHeatmap completedDays={completedDays} />
          </section>
        )}
        {activeTab === 'analytics' && (
          <Analytics
            tasks={data.tasks}
            pomodoroHistory={data.pomodoroHistory}
            categories={data.categories}
          />
        )}
        {activeTab === 'tables' && (
          <SummaryTables
            tasks={data.tasks}
            categories={data.categories}
            pomodoroHistory={data.pomodoroHistory}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--hairline)', padding: '32px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', letterSpacing: '0.32px', color: 'var(--text-muted)' }}>
          TASKTRACKER — ПЕРСОНАЛЬНЫЙ ТРЕКЕР ЗАДАЧ С ГЕЙМИФИКАЦИЕЙ
        </p>
      </footer>

      {pomodoroTask && (
        <PomodoroModal
          task={pomodoroTask}
          settings={data.settings}
          onClose={() => setPomodoroTask(null)}
          onComplete={(xp) => { addPomodoroSession(pomodoroTask.id, pomodoroTask.title, xp); setPomodoroTask(null); }}
          onUpdateSettings={updateSettings}
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
        </div>
      )}
    </div>
  );
}
