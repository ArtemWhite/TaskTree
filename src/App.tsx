import { useState, useEffect } from 'react';
import type { Task } from './types';
import { StorageService } from './services/StorageService';
import { useAppData } from './hooks/useAppData';
import { useLevelUp } from './hooks/useLevelUp';
import Navbar from './components/layout/Navbar';
import HeroSection from './components/layout/HeroSection';
import Footer from './components/layout/Footer';
import ToastContainer from './components/layout/ToastContainer';
import CalendarHeatmap from './components/calendar/CalendarHeatmap';
import TaskSection from './components/TaskSection';
import ProgressSection from './components/ProgressSection';
import PomodoroModal from './components/PomodoroModal';
import Analytics from './components/Analytics';
import SummaryTables from './components/tables/SummaryTables';
import SportsSection from './components/SportsSection';
import WorkoutCalendar from './components/calendar/WorkoutCalendar';
import TaskCalendar from './components/calendar/TaskCalendar';
import BooksSection from './components/BooksSection';

export default function App() {
  const {
    data,
    totalXP,
    levelInfo,
    treeStage,
    activeTasks,
    completedTasks,
    completedDays,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    addCategory,
    updateCategory,
    deleteCategory,
    completePomodoro,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    completeWorkout,
    uncompleteWorkout,
    renameWorkoutType,
    addBook,
    updateBook,
    deleteBook,
    importData,
    updateSettings,
  } = useAppData();

  const { levelUpToast, toastProgress, dismissLevelUpToast } = useLevelUp(levelInfo.level);

  const [activeTab, setActiveTab] = useState('tasks');
  const [pomodoroTask, setPomodoroTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(StorageService.getTheme);
  const [pomodoroCompleteToast, setPomodoroCompleteToast] = useState<{ taskId: string; taskTitle: string; xp: number } | null>(null);
  const [calendarView, setCalendarView] = useState<'heatmap' | 'tasks' | 'workouts'>('heatmap');

  const handleNavigateToTask = (taskId: string) => {
    setActiveTab('tasks');
    setHighlightTaskId(taskId);
  };

  useEffect(() => {
    StorageService.setTheme(theme);
  }, [theme]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <Navbar
        level={levelInfo.level}
        currentXP={levelInfo.current}
        nextLevelXP={levelInfo.next}
        totalXP={totalXP}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onThemeToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        data={data}
        onImport={importData}
      />

      <HeroSection activeTasks={activeTasks} onNavigateTab={setActiveTab} />

      <main style={{ maxWidth: activeTab === 'tables' ? '1600px' : '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div key={activeTab} className="tab-fade-in">
          {activeTab === 'tasks' && (
            <TaskSection
              tasks={activeTasks}
              completedTasks={completedTasks}
              categories={data.categories}
              pomodoroHistory={data.pomodoroHistory}
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
              highlightTaskId={highlightTaskId}
              onClearHighlight={() => setHighlightTaskId(null)}
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
              {calendarView === 'heatmap' && (
                <CalendarHeatmap
                  completedDays={completedDays}
                  onNavigateToTask={handleNavigateToTask}
                />
              )}
              {calendarView === 'tasks' && (
                <TaskCalendar
                  tasks={activeTasks}
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

      <Footer />

      {pomodoroTask && (
        <PomodoroModal
          task={pomodoroTask}
          settings={data.settings}
          onClose={() => setPomodoroTask(null)}
          onUpdateSettings={updateSettings}
          onSessionFinished={(_wasMinimized, xp, duration) => {
            completePomodoro(pomodoroTask.id, xp, duration);
            setPomodoroCompleteToast({ taskId: pomodoroTask.id, taskTitle: pomodoroTask.title, xp });
            setPomodoroTask(null);
          }}
        />
      )}

      <ToastContainer
        levelUpToast={levelUpToast}
        toastProgress={toastProgress}
        onDismissLevelUp={dismissLevelUpToast}
        pomodoroCompleteToast={pomodoroCompleteToast}
        onPomodoroToastClick={() => {
          if (pomodoroCompleteToast) {
            const t = data.tasks.find(tk => tk.id === pomodoroCompleteToast.taskId);
            if (t) setPomodoroTask(t);
            setPomodoroCompleteToast(null);
          }
        }}
        onDismissPomodoroToast={() => setPomodoroCompleteToast(null)}
      />
    </div>
  );
}
