import React from 'react';
import type { Book } from '../../types';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: 'reading' | 'planned' | 'completed') => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  return (
    <div
      style={{
        padding: '16px',
        borderBottom: '1px solid var(--hairline)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div style={{ flex: 1, minWidth: '200px' }}>
        <div style={{ fontWeight: 700, fontSize: '16px' }}>{book.title}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '2px' }}>
          {book.author && <span>{book.author} | </span>}
          <span>{book.totalPages} стр.</span>
          {book.status === 'completed' && book.xp > 0 && (
            <span style={{ color: '#5aaa6f', marginLeft: '8px', fontWeight: 600 }}>+{book.xp} XP</span>
          )}
        </div>
        {book.status === 'completed' && book.rating > 0 && (
          <div style={{ fontSize: '12px', marginTop: '4px' }}>{'⭐'.repeat(book.rating)}</div>
        )}
        {book.review && (
          <p
            style={{
              fontSize: '13px',
              fontStyle: 'italic',
              color: 'var(--text-soft)',
              marginTop: '6px',
              padding: '6px 10px',
              background: 'var(--surface-hover)',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
            }}
          >
            "{book.review}"
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <select
          className="input-spacex"
          style={{ width: 'auto', padding: '4px 8px', fontSize: '12px' }}
          value={book.status}
          onChange={e => onStatusChange(book.id, e.target.value as 'reading' | 'planned' | 'completed')}
        >
          <option value="planned">В планах</option>
          <option value="reading">Читаю</option>
          <option value="completed">Прочитано</option>
        </select>
        <button type="button" className="btn-ghost btn-ghost-xs" onClick={() => onEdit(book)}>
          ✏️
        </button>
        <button type="button" className="btn-ghost btn-ghost-xs" style={{ color: '#ff6b6b' }} onClick={() => onDelete(book.id)}>
          🗑️
        </button>
      </div>
    </div>
  );
};
