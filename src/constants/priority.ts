import type { Priority } from '../types';

export interface PriorityMeta {
  label: string;
  color: string;
  bg: string;
}

export const PRIORITY_META: Record<Priority, PriorityMeta> = {
  high: { label: 'ВЫСОКИЙ', color: '#ff6b6b', bg: 'rgba(255, 107, 107, 0.1)' },
  medium: { label: 'СРЕДНИЙ', color: '#ff9f43', bg: 'rgba(255, 159, 67, 0.1)' },
  low: { label: 'НИЗКИЙ', color: '#74b9ff', bg: 'rgba(116, 185, 255, 0.1)' },
};

export const PRIORITY_WEIGHTS: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function getPriorityWeight(priority: Priority | undefined): number {
  return PRIORITY_WEIGHTS[priority ?? 'medium'];
}

export function getPriorityMeta(priority: Priority | undefined): PriorityMeta {
  return PRIORITY_META[priority ?? 'medium'];
}
