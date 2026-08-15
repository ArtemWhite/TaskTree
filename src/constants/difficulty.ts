import type { Difficulty } from '../types';

export interface DifficultyMeta {
  emoji: string;
  label: string;
  xp: number;
}

export const DIFFICULTY_META: Record<Difficulty, DifficultyMeta> = {
  easy: { emoji: '🟢', label: 'Лёгкая', xp: 20 },
  medium: { emoji: '🟡', label: 'Средняя', xp: 50 },
  hard: { emoji: '🔴', label: 'Сложная', xp: 100 },
};

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

export function getDifficultyMeta(difficulty: Difficulty): DifficultyMeta {
  return DIFFICULTY_META[difficulty];
}

export function getDifficultyLabel(difficulty: Difficulty): string {
  const meta = DIFFICULTY_META[difficulty];
  return `${meta.emoji} ${meta.label}`;
}
