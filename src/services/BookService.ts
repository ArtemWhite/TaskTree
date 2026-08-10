import type { Book, BookStats } from '../types';

export class BookService {
  public static calculateBookStats(books: Book[]): BookStats {
    const completedBooks = books.filter(b => b.status === 'completed');
    const inProgressBooks = books.filter(b => b.status === 'reading');
    const plannedBooks = books.filter(b => b.status === 'planned');

    return {
      total: books.length,
      completed: completedBooks.length,
      inProgress: inProgressBooks.length,
      planned: plannedBooks.length,
      totalPagesRead: completedBooks.reduce((sum, b) => sum + b.totalPages, 0) + inProgressBooks.reduce((sum, b) => sum + (b.readPages || 0), 0),
      totalXP: completedBooks.reduce((sum, b) => sum + b.xp, 0),
    };
  }

  public static sortBooks(books: Book[]): Book[] {
    const priority = { reading: 0, planned: 1, completed: 2 };
    return [...books].sort((a, b) => {
      const pDiff = priority[a.status] - priority[b.status];
      if (pDiff !== 0) return pDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}
