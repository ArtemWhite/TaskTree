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
