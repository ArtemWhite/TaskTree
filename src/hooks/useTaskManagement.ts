import { useState, useMemo, useEffect } from 'react';
import type { Task, Category } from '../types';
import { TaskService } from '../services/TaskService';
import { PRIORITY_WEIGHTS } from '../constants/priority';
import type { TaskFormData } from '../components/tasks/TaskFormPanel';
import type { TaskSortBy } from '../components/tasks/TaskFilterBar';

interface UseTaskManagementOptions {
  tasks: Task[];
  completedTasks: Task[];
  categories: Category[];
  onAdd: (t: Omit<Task, 'id' | 'completed' | 'completedDate' | 'pomodoroCount' | 'createdAt'>) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  editingTask: Task | null;
  setEditingTask: (t: Task | null) => void;
  highlightTaskId?: string | null;
  onClearHighlight?: () => void;
}

const INITIAL_TASK_FORM: TaskFormData = {
  title: '',
  categoryId: '',
  difficulty: 'medium',
  priority: 'medium',
  xp: 50,
  deadlineDate: '',
  deadlineTime: '',
};

export function useTaskManagement({
  tasks,
  completedTasks,
  categories,
  onAdd,
  onUpdate,
  editingTask,
  setEditingTask,
  highlightTaskId,
  onClearHighlight,
}: UseTaskManagementOptions) {
  const [subtab, setSubtab] = useState<'active' | 'completed' | 'categories'>('active');
  const [showForm, setShowForm] = useState(false);

  // Task form state
  const [form, setForm] = useState<TaskFormData>({
    ...INITIAL_TASK_FORM,
    categoryId: categories[0]?.id || '',
  });

  // Filter and sort state
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortBy>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [groupByDate, setGroupByDate] = useState(true);
  const [groupByField, setGroupByField] = useState<'createdAt' | 'deadline'>('createdAt');
  const [groupSortDir, setGroupSortDir] = useState<'asc' | 'desc'>('desc');

  // Selected task for pomodoro history modal
  const [selectedPomodoroTask, setSelectedPomodoroTask] = useState<Task | null>(null);

  // Sync categoryId when categories load
  useEffect(() => {
    if (!form.categoryId && categories.length > 0) {
      setForm(f => ({ ...f, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  // Handle highlightTaskId URL navigation
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
        onClearHighlight?.();
      }, 100);
    }
  }, [highlightTaskId, onClearHighlight]);

  const categoryMap = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach(c => {
      m[c.id] = c;
    });
    return m;
  }, [categories]);

  const filteredTasks = useMemo(() => {
    let list = subtab === 'active' ? tasks : completedTasks;
    if (filterCategory !== 'all') list = list.filter(t => t.categoryId === filterCategory);
    if (filterDifficulty !== 'all') list = list.filter(t => t.difficulty === filterDifficulty);
    if (searchTerm) list = list.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sortBy === 'title') return dir * a.title.localeCompare(b.title, 'ru');
      const pA = PRIORITY_WEIGHTS[a.priority || 'medium'];
      const pB = PRIORITY_WEIGHTS[b.priority || 'medium'];
      if (pA !== pB) return dir * (pA - pB);
      return dir * a.createdAt.localeCompare(b.createdAt);
    });
  }, [tasks, completedTasks, filterCategory, filterDifficulty, searchTerm, subtab, sortBy, sortDir]);

  const groupedTasks = useMemo(() => {
    if (!groupByDate) return null;
    return TaskService.groupTasksByDate(filteredTasks, groupByField);
  }, [filteredTasks, groupByDate, groupByField]);

  const resetForm = () => {
    setForm({
      title: '',
      categoryId: categories[0]?.id || '',
      difficulty: 'medium',
      priority: 'medium',
      xp: 50,
      deadlineDate: '',
      deadlineTime: '',
    });
    setShowForm(false);
    setEditingTask(null);
  };

  const handleSubmitTask = () => {
    if (!form.title.trim()) return;
    const deadline = form.deadlineDate ? `${form.deadlineDate}T${form.deadlineTime || '23:59'}:00` : null;
    if (editingTask) {
      onUpdate(editingTask.id, {
        title: form.title.trim(),
        categoryId: form.categoryId,
        difficulty: form.difficulty,
        priority: form.priority,
        xp: form.xp,
        deadline,
      });
    } else {
      onAdd({
        title: form.title.trim(),
        categoryId: form.categoryId,
        difficulty: form.difficulty,
        priority: form.priority,
        xp: form.xp,
        deadline,
      });
    }
    resetForm();
  };

  const startEditTask = (t: Task) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      categoryId: t.categoryId,
      difficulty: t.difficulty,
      priority: t.priority || 'medium',
      xp: t.xp,
      deadlineDate: t.deadline ? t.deadline.slice(0, 10) : '',
      deadlineTime: t.deadline ? t.deadline.slice(11, 16) : '',
    });
    setShowForm(true);
  };

  return {
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
  };
}
