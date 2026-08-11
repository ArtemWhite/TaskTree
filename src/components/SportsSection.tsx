import type { Workout } from '../types';
import { useWorkoutManagement, type SortMode } from '../hooks/useWorkoutManagement';
import { WorkoutStatsCards } from './sports/WorkoutStatsCards';
import { WorkoutFormPanel } from './sports/WorkoutFormPanel';
import { WorkoutTypeManager } from './sports/WorkoutTypeManager';
import { MyWorkoutTypesList } from './sports/MyWorkoutTypesList';
import { WorkoutCard } from './sports/WorkoutCard';
import { WorkoutTypeModal } from './sports/WorkoutTypeModal';

interface SportsSectionProps {
  workouts: Workout[];
  onAdd: (w: Omit<Workout, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Workout>) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onRenameWorkoutType: (oldName: string, newName: string) => void;
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
  const {
    today,
    subtab,
    setSubtab,
    form,
    setForm,
    editingId,
    customType,
    setCustomType,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    expandedNotes,
    toggleNotes,
    stats,
    allWorkoutTypes,
    onlyCustomTypes,
    sortedWorkouts,
    groupedByDate,
    selectedTypeForModal,
    setSelectedTypeForModal,
    handleSubmit,
    startEdit,
    cancelEdit,
    handleAddType,
    handleDeleteType,
    handleRenameType,
  } = useWorkoutManagement({
    workouts,
    onAdd,
    onUpdate,
    onRenameWorkoutType,
  });

  const formatDate = (dStr: string) => {
    const d = new Date(dStr + 'T12:00:00');
    return d.toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  };

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>
        СПОРТ И ТРЕНИРОВКИ
      </h2>

      <WorkoutStatsCards stats={stats} />

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)' }}>
        <button
          type="button"
          className={`tab-btn ${subtab === 'workouts' ? 'active' : ''}`}
          onClick={() => setSubtab('workouts')}
        >
          🏋️ ТРЕНИРОВКИ
        </button>
        <button
          type="button"
          className={`tab-btn ${subtab === 'categories' ? 'active' : ''}`}
          onClick={() => setSubtab('categories')}
        >
          ⚙️ НАСТРОЙКА ТИПОВ ({allWorkoutTypes.length})
        </button>
      </div>

      {subtab === 'categories' && (
        <WorkoutTypeManager
          allWorkoutTypes={allWorkoutTypes}
          workouts={workouts}
          onAddType={handleAddType}
          onDeleteType={handleDeleteType}
          onRenameType={handleRenameType}
          onSelectTypeForModal={setSelectedTypeForModal}
        />
      )}

      {subtab === 'workouts' && (
        <>
          <WorkoutFormPanel
            form={form}
            editingId={editingId}
            allWorkoutTypes={allWorkoutTypes}
            customType={customType}
            onChangeForm={setForm}
            onChangeCustomType={setCustomType}
            onSubmit={handleSubmit}
            onCancelEdit={cancelEdit}
          />

          <MyWorkoutTypesList
            onlyCustomTypes={onlyCustomTypes}
            workouts={workouts}
            onSelectTypeForModal={setSelectedTypeForModal}
          />

          {/* Controls: filters & sorting */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(
                [
                  ['all', 'ВСЕ'],
                  ['upcoming', 'АКТИВНЫЕ'],
                  ['completed', 'ЗАВЕРШЁННЫЕ'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`tab-btn ${filter === key ? 'active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 4px' }}>|</span>
            <span className="micro-cap" style={{ fontSize: '10px' }}>
              СОРТИРОВКА:
            </span>
            <select
              className="input-spacex"
              style={{ width: 'auto', padding: '6px 28px 6px 10px', fontSize: '12px' }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortMode)}
            >
              <option value="date">По дате</option>
              <option value="time">По длительности</option>
              <option value="date+time">По дате и длит.</option>
              <option value="category">По категории</option>
            </select>
            <button
              type="button"
              className="btn-ghost btn-ghost-xs"
              onClick={() => setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
              title={sortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* List display */}
          {sortBy === 'category' || sortBy === 'time' ? (
            sortedWorkouts.length === 0 ? (
              <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</p>
                <p className="micro-cap" style={{ marginBottom: '4px' }}>
                  НЕТ ТРЕНИРОВОК
                </p>
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
            groupedByDate &&
            (groupedByDate.length === 0 ? (
              <div className="card-panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontSize: '48px', marginBottom: '12px' }}>🏋️</p>
                <p className="micro-cap" style={{ marginBottom: '4px' }}>
                  НЕТ ТРЕНИРОВОК
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Добавьте первую тренировку через форму выше</p>
              </div>
            ) : (
              groupedByDate.map(([date, dayWorkouts]) => (
                <div key={date} style={{ marginBottom: '24px' }}>
                  <h4
                    style={{
                      fontSize: '14px',
                      fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
                      fontWeight: 700,
                      letterSpacing: '0.96px',
                      textTransform: 'uppercase',
                      color: date < today ? 'var(--text-muted)' : 'var(--text-soft)',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--hairline)',
                    }}
                  >
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
        <WorkoutTypeModal
          typeName={selectedTypeForModal}
          workouts={workouts}
          onClose={() => setSelectedTypeForModal(null)}
        />
      )}
    </section>
  );
}
