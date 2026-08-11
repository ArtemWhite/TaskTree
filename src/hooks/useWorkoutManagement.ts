import { useState, useMemo } from 'react';
import type { Workout, WorkoutTypeDef } from '../types';
import { WorkoutService } from '../services/WorkoutService';
import { StorageService } from '../services/StorageService';
import type { WorkoutFormData } from '../components/sports/WorkoutFormPanel';

export type SortMode = 'date' | 'time' | 'date+time' | 'category';

const DELETED_TYPES_KEY = 'tasktrecker-deleted-workout-types';

function loadDeletedTypes(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_TYPES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveDeletedTypes(set: Set<string>) {
  localStorage.setItem(DELETED_TYPES_KEY, JSON.stringify([...set]));
}

const INITIAL_FORM: WorkoutFormData = { title: '', workoutType: 'Силовая', date: '', duration: 60, notes: '' };

interface UseWorkoutManagementOptions {
  workouts: Workout[];
  onAdd: (w: Omit<Workout, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Workout>) => void;
  onRenameWorkoutType: (oldName: string, newName: string) => void;
}

export function useWorkoutManagement({
  workouts,
  onAdd,
  onUpdate,
  onRenameWorkoutType,
}: UseWorkoutManagementOptions) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<WorkoutFormData>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [customType, setCustomType] = useState('');
  const [savedCustomTypes, setSavedCustomTypes] = useState<WorkoutTypeDef[]>(StorageService.loadCustomWorkoutTypes);
  const [subtab, setSubtab] = useState<'workouts' | 'categories'>('workouts');
  const [sortBy, setSortBy] = useState<SortMode>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [deletedBuiltIn, setDeletedBuiltIn] = useState<Set<string>>(loadDeletedTypes);
  const [selectedTypeForModal, setSelectedTypeForModal] = useState<string | null>(null);

  const visibleBuiltInTypes = useMemo(
    () => WorkoutService.BUILT_IN_WORKOUT_TYPES.filter(wt => !deletedBuiltIn.has(wt.name)),
    [deletedBuiltIn]
  );

  const allWorkoutTypes = useMemo(() => {
    const custom = savedCustomTypes.filter(t => !visibleBuiltInTypes.some(wt => wt.name === t.name));
    return [...visibleBuiltInTypes, ...custom];
  }, [savedCustomTypes, visibleBuiltInTypes]);

  const onlyCustomTypes = useMemo(
    () => savedCustomTypes.filter(t => !visibleBuiltInTypes.some(wt => wt.name === t.name)),
    [savedCustomTypes, visibleBuiltInTypes]
  );

  const stats = useMemo(() => WorkoutService.calculateWorkoutStats(workouts), [workouts]);

  const filteredWorkouts = useMemo(() => {
    return workouts.filter(w => {
      if (filter === 'upcoming') return !w.completed;
      if (filter === 'completed') return w.completed;
      return true;
    });
  }, [workouts, filter]);

  const sortedWorkouts = useMemo(() => {
    const list = [...filteredWorkouts];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortBy === 'time') cmp = a.duration - b.duration;
      else if (sortBy === 'date+time') cmp = (a.date + a.duration).localeCompare(b.date + b.duration);
      else if (sortBy === 'category') cmp = a.workoutType.localeCompare(b.workoutType);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredWorkouts, sortBy, sortDir]);

  const groupedByDate = useMemo(() => {
    if (sortBy === 'category' || sortBy === 'time') return null;
    const map: Record<string, Workout[]> = {};
    sortedWorkouts.forEach(w => {
      if (!map[w.date]) map[w.date] = [];
      map[w.date].push(w);
    });
    return Object.entries(map).sort(([dA], [dB]) => (sortDir === 'asc' ? dA.localeCompare(dB) : dB.localeCompare(dA)));
  }, [sortedWorkouts, sortBy, sortDir]);

  const handleSubmit = (e: React.FormEvent, customIcon: string, customColor: string) => {
    e.preventDefault();
    let finalType = form.workoutType;

    if (form.workoutType === 'custom') {
      const trimmed = customType.trim();
      if (!trimmed) return;
      finalType = trimmed;

      if (!allWorkoutTypes.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
        const newDef: WorkoutTypeDef = { icon: customIcon, name: trimmed, color: customColor };
        const updated = [...savedCustomTypes, newDef];
        setSavedCustomTypes(updated);
        StorageService.saveCustomWorkoutTypes(updated);
      }
    }

    const calculatedXP = Math.round((form.duration / 30) * 10);
    const dateToUse = form.date || today;

    if (editingId) {
      onUpdate(editingId, {
        title: form.title || finalType,
        workoutType: finalType,
        date: dateToUse,
        duration: form.duration,
        notes: form.notes,
        xp: calculatedXP,
      });
      setEditingId(null);
    } else {
      onAdd({
        title: form.title || finalType,
        workoutType: finalType,
        date: dateToUse,
        duration: form.duration,
        notes: form.notes,
        completed: false,
        xp: calculatedXP,
      });
    }

    setForm(INITIAL_FORM);
    setCustomType('');
  };

  const startEdit = (w: Workout) => {
    setEditingId(w.id);
    const isKnown = allWorkoutTypes.some(t => t.name === w.workoutType);
    setForm({
      title: w.title,
      workoutType: isKnown ? w.workoutType : 'custom',
      date: w.date,
      duration: w.duration,
      notes: w.notes,
    });
    if (!isKnown) setCustomType(w.workoutType);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setCustomType('');
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddType = (name: string, icon: string, color: string) => {
    if (!savedCustomTypes.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      const updated = [...savedCustomTypes, { icon, name, color }];
      setSavedCustomTypes(updated);
      StorageService.saveCustomWorkoutTypes(updated);
    }
  };

  const handleDeleteType = (typeName: string) => {
    if (WorkoutService.BUILT_IN_WORKOUT_TYPES.some(wt => wt.name === typeName)) {
      const nextDeleted = new Set(deletedBuiltIn);
      nextDeleted.add(typeName);
      setDeletedBuiltIn(nextDeleted);
      saveDeletedTypes(nextDeleted);
    } else {
      const updated = savedCustomTypes.filter(t => t.name !== typeName);
      setSavedCustomTypes(updated);
      StorageService.saveCustomWorkoutTypes(updated);
    }
  };

  const handleRenameType = (oldName: string, newName: string, icon: string, color: string) => {
    if (newName !== oldName) {
      onRenameWorkoutType(oldName, newName);
    }

    const existsInCustom = savedCustomTypes.some(t => t.name === oldName);
    const updatedCustom = existsInCustom
      ? savedCustomTypes.map(t => (t.name === oldName ? { icon, name: newName, color } : t))
      : [...savedCustomTypes, { icon, name: newName, color }];

    setSavedCustomTypes(updatedCustom);
    StorageService.saveCustomWorkoutTypes(updatedCustom);
  };

  return {
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
  };
}
