import type { BookStatus } from './enums';

export interface Book {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  readPages: number;
  status: BookStatus;
  rating: number; // 0 to 5
  review: string;
  createdAt: string;
  completedAt: string | null;
  xp: number;
}

export interface BookStats {
  total: number;
  completed: number;
  inProgress: number;
  planned: number;
  totalPagesRead: number;
  totalXP: number;
}
