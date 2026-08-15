import { useState } from 'react';
import type { Task, Category, PomodoroSession, Workout } from '../../types';
import TaskSummaryTable from './TaskSummaryTable';
import CategoryDetailTable from './CategoryDetailTable';
import DifficultyTable from './DifficultyTable';
import WorkoutSummaryTable from './WorkoutSummaryTable';
import PomodoroHistoryModal from '../common/PomodoroHistoryModal';

interface Props {
  tasks: Task[];
  categories: Category[];
  pomodoroHistory: PomodoroSession[];
  workouts: Workout[];
}

export default function SummaryTables({ tasks, categories, pomodoroHistory, workouts }: Props) {
  const [activeTable, setActiveTable] = useState<'tasks' | 'categories' | 'difficulty' | 'workouts'>('tasks');
  const [selectedCategorySessions, setSelectedCategorySessions] = useState<{ title: string; sessions: PomodoroSession[] } | null>(null);

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>СВОДНЫЕ ТАБЛИЦЫ</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid var(--hairline)' }}>
        {(['tasks','categories','difficulty','workouts'] as const).map(t => (
          <button key={t} className={`tab-btn ${activeTable === t ? 'active' : ''}`} onClick={() => setActiveTable(t)}>
            {t === 'tasks' ? 'ЗАДАЧИ' : t === 'categories' ? 'КАТЕГОРИИ' : t === 'difficulty' ? 'СЛОЖНОСТЬ' : 'ТРЕНИРОВКИ'}
          </button>
        ))}
      </div>

      {activeTable === 'tasks' && <TaskSummaryTable tasks={tasks} categories={categories} />}
      {activeTable === 'categories' && (
        <CategoryDetailTable
          tasks={tasks}
          categories={categories}
          pomodoroHistory={pomodoroHistory}
          onSelectCategorySessions={(title, sessions) => setSelectedCategorySessions({ title, sessions })}
        />
      )}
      {activeTable === 'difficulty' && <DifficultyTable tasks={tasks} />}
      {activeTable === 'workouts' && <WorkoutSummaryTable workouts={workouts} />}

      {selectedCategorySessions && (
        <PomodoroHistoryModal
          title={selectedCategorySessions.title}
          label="Категория"
          showTaskTitles
          sessions={selectedCategorySessions.sessions}
          onClose={() => setSelectedCategorySessions(null)}
        />
      )}
    </section>
  );
}
