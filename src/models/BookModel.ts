import type { Book, BookStatus } from '../types';

export class BookModel {
  public static calculateXP(totalPages: number, status: BookStatus): number {
    return status === 'completed' ? Math.round(totalPages * 0.5) : 0;
  }

  public static getReadPercentage(readPages: number, totalPages: number): number {
    if (totalPages <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((readPages / totalPages) * 100)));
  }

  public static getStatusMeta(status: BookStatus): { label: string; color: string; icon: string } {
    switch (status) {
      case 'completed':
        return { label: 'ПРОЧИТАНО', color: '#5aaa6f', icon: '✅' };
      case 'reading':
        return { label: 'ЧИТАЮ', color: '#60a5fa', icon: '📖' };
      case 'planned':
      default:
        return { label: 'В ПЛАНАХ', color: '#ff9f43', icon: '📌' };
    }
  }

  public static updateBookState(book: Book, updates: Partial<Book>): Book {
    const nextStatus = updates.status !== undefined ? updates.status : book.status;
    const nextTotalPages = updates.totalPages !== undefined ? updates.totalPages : book.totalPages;
    const wasCompleted = book.status === 'completed';
    const isCompleted = nextStatus === 'completed';

    let xp = book.xp;
    let completedAt = book.completedAt;

    if (!wasCompleted && isCompleted) {
      xp = Math.round(nextTotalPages * 0.5);
      completedAt = new Date().toISOString();
    } else if (wasCompleted && !isCompleted) {
      xp = 0;
      completedAt = null;
    } else if (isCompleted && updates.totalPages !== undefined) {
      xp = Math.round(nextTotalPages * 0.5);
    }

    return {
      ...book,
      ...updates,
      xp,
      completedAt,
    };
  }
}
