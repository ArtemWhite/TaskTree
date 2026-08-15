import type { Task, Category, PomodoroSession } from '../types';
import { useTaskManagement } from '../hooks/useTaskManagement';
import { TaskCard } from './tasks/TaskCard';
import { TaskFormPanel } from './tasks/TaskFormPanel';
import { TaskFilterBar } from './tasks/TaskFilterBar';
import { TaskCategoryManager } from './tasks/TaskCategoryManager';
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

export default function TaskSection({
  tasks,
  completedTasks,
  categories,
  pomodoroHistory,
  onAdd,
  onUpdate,
  onDelete,
  onComplete,
  onUncomplete,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onStartPomodoro,
  editingTask,
  setEditingTask,
  highlightTaskId,
  onClearHighlight,
}: Props) {
  const {
    subtab,
    setSubtab,
    showForm,
    setShowForm,
    form,
    setForm,
    filterCategory,
    setFilterCategory,
    filterDifficulty,
    setFilterDifficulty,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    groupByDate,
    setGroupByDate,
    groupByField,
    setGroupByField,
    groupSortDir,
    setGroupSortDir,
    selectedPomodoroTask,
    setSelectedPomodoroTask,
    categoryMap,
    filteredTasks,
    groupedTasks,
    resetForm,
    handleSubmitTask,
    startEditTask,
  } = useTaskManagement({
    tasks,
    completedTasks,
    categories,
    onAdd,
    onUpdate,
    editingTask,
    setEditingTask,
    highlightTaskId,
    onClearHighlight,
  });

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>
        ЗАДАЧИ
      </h2>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)', flexWrap: 'wrap' }}>
        {(['active', 'completed', 'categories'] as const).map(t => (
          <button key={t} className={`tab-btn ${subtab === t ? 'active' : ''}`} onClick={() => setSubtab(t)}>
            {t === 'active'
              ? `АКТИВНЫЕ (${tasks.length})`
              : t === 'completed'
              ? `ВЫПОЛНЕННЫЕ (${completedTasks.length})`
              : `КАТЕГОРИИ (${categories.length})`}
          </button>
        ))}
      </div>

      {subtab === 'categories' ? (
        <TaskCategoryManager
          categories={categories}
          onAddCategory={onAddCategory}
          onUpdateCategory={onUpdateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      ) : (
        <div>
          {/* Action & Filter Bar */}
          <TaskFilterBar
            showForm={showForm}
            searchTerm={searchTerm}
            filterCategory={filterCategory}
            filterDifficulty={filterDifficulty}
            sortBy={sortBy}
            sortDir={sortDir}
            groupByDate={groupByDate}
            groupByField={groupByField}
            categories={categories}
            onToggleForm={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            onSearchChange={setSearchTerm}
            onFilterCategoryChange={setFilterCategory}
            onFilterDifficultyChange={setFilterDifficulty}
            onSortByChange={setSortBy}
            onToggleSortDir={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
            onToggleGroupByDate={() => setGroupByDate(g => !g)}
            onGroupByFieldChange={setGroupByField}
            groupSortDir={groupSortDir}
            onToggleGroupSortDir={() => setGroupSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
          />

          {/* Form */}
          {showForm && (
            <TaskFormPanel
              form={form}
              editingTask={editingTask}
              categories={categories}
              onChangeForm={setForm}
              onSubmit={handleSubmitTask}
              onCancel={resetForm}
            />
          )}

          {/* List */}
          {filteredTasks.length === 0 ? (
            <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>📋</p>
              <p className="micro-cap" style={{ marginBottom: '4px' }}>
                НЕТ ЗАДАЧ
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Добавьте новую задачу выше</p>
            </div>
          ) : groupByDate && groupedTasks ? (
            Object.entries(groupedTasks)
              .sort(([dateA], [dateB]) => {
                if (dateA === 'Без дедлайна') return 1;
                if (dateB === 'Без дедлайна') return -1;
                const dir = groupSortDir === 'asc' ? 1 : -1;
                return dir * dateA.localeCompare(dateB);
              })
              .map(([date, group]) => (
                <div key={date} style={{ marginBottom: '24px' }}>
                  <h4
                    className="micro-cap"
                    style={{ marginBottom: '12px', borderBottom: '1px solid var(--hairline)', paddingBottom: '4px' }}
                  >
                    📅{' '}
                    {date === 'Без дедлайна'
                      ? 'БЕЗ ДЕДЛАЙНА'
                      : new Date(date + 'T12:00:00').toLocaleDateString('ru', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {group.map(t => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        category={categoryMap[t.categoryId]}
                        onComplete={onComplete}
                        onUncomplete={onUncomplete}
                        onEdit={startEditTask}
                        onDelete={onDelete}
                        onStartPomodoro={onStartPomodoro}
                        onShowPomodoroHistory={task => setSelectedPomodoroTask(task)}
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
                  onEdit={startEditTask}
                  onDelete={onDelete}
                  onStartPomodoro={onStartPomodoro}
                  onShowPomodoroHistory={task => setSelectedPomodoroTask(task)}
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
