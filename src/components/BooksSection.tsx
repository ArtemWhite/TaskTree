import { useState, useMemo } from 'react';
import type { Book } from '../types';
import { BookCard } from './books/BookCard';
import Modal from './common/Modal';

interface Props {
  books: Book[];
  onAdd: (b: Omit<Book, 'id' | 'createdAt' | 'completedAt' | 'xp'>) => void;
  onUpdate: (id: string, updates: Partial<Book>) => void;
  onDelete: (id: string) => void;
}

const INITIAL_FORM = {
  title: '',
  author: '',
  totalPages: 0,
  status: 'planned' as 'planned' | 'reading' | 'completed',
  rating: 0,
  review: ''
};

export default function BooksSection({ books, onAdd, onUpdate, onDelete }: Props) {
  const [subtab, setSubtab] = useState<'reading' | 'completed' | 'planned'>('reading');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    return books.filter(b => b.status === subtab).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [books, subtab]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (b: Book) => {
    setEditingId(b.id);
    setForm({
      title: b.title,
      author: b.author,
      totalPages: b.totalPages,
      status: b.status,
      rating: b.rating,
      review: b.review
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    if (editingId) {
      onUpdate(editingId, { ...form, readPages: form.totalPages });
    } else {
      onAdd({ ...form, readPages: form.totalPages });
    }
    resetForm();
  };

  const completedBooks = books.filter(b => b.status === 'completed');
  const totalReadPages = completedBooks.reduce((s, b) => s + b.totalPages, 0);
  const completedBooksCount = completedBooks.length;

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>📚 КНИГИ</h2>
      <p className="micro-cap" style={{ marginBottom: '24px' }}>ДНЕВНИК ЧТЕНИЯ</p>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
          <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{books.length}</div>
          <div className="micro-cap" style={{ marginTop: '4px' }}>Всего книг</div>
        </div>
        <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
          <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{completedBooksCount}</div>
          <div className="micro-cap" style={{ marginTop: '4px' }}>Прочитано</div>
        </div>
        <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
          <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{totalReadPages}</div>
          <div className="micro-cap" style={{ marginTop: '4px' }}>Страниц прочитано</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)', flexWrap: 'wrap' }}>
        {(['reading', 'planned', 'completed'] as const).map(t => (
          <button key={t} className={`tab-btn ${subtab === t ? 'active' : ''}`} onClick={() => setSubtab(t)}>
            {t === 'reading' ? `ЧИТАЮ (${books.filter(b => b.status === 'reading').length})` :
             t === 'planned' ? `В ПЛАНАХ (${books.filter(b => b.status === 'planned').length})` :
             `ПРОЧИТАНО (${books.filter(b => b.status === 'completed').length})`}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <button className="btn-ghost" onClick={() => { resetForm(); setShowForm(true); }}>
          + ДОБАВИТЬ КНИГУ
        </button>
      </div>

      {showForm && (
        <Modal onClose={resetForm}>
          <h3 className="micro-cap" style={{ marginBottom: '20px' }}>
            {editingId ? 'РЕДАКТИРОВАТЬ КНИГУ' : 'НОВАЯ КНИГА'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input className="input-spacex" placeholder="Название книги" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            <input className="input-spacex" placeholder="Автор" value={form.author}
              onChange={e => setForm(f => ({ ...f, author: e.target.value }))} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <select className="input-spacex" style={{ flex: 1 }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'reading' | 'planned' | 'completed' }))}>
                <option value="planned">В планах</option>
                <option value="reading">Читаю</option>
                <option value="completed">Прочитано</option>
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="micro-cap">Страницы</label>
                <input className="input-spacex" type="number" style={{ width: '80px', textAlign: 'center' }} value={form.totalPages}
                  onChange={e => setForm(f => ({ ...f, totalPages: Number(e.target.value) || 0 }))} placeholder="Всего" />
              </div>
            </div>

            {form.status === 'completed' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label className="micro-cap">Оценка (1-5)</label>
                  <input type="range" min="0" max="5" step="1" value={form.rating}
                    onChange={e => setForm(f => ({ ...f, rating: Number(e.target.value) }))} />
                  <span>{form.rating > 0 ? '⭐'.repeat(form.rating) : 'Без оценки'}</span>
                </div>
                <textarea className="input-spacex" placeholder="Ваш отзыв или заметки..." value={form.review}
                  onChange={e => setForm(f => ({ ...f, review: e.target.value }))} rows={3} style={{ resize: 'vertical' }} />
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button className="btn-ghost" onClick={handleSubmit}>
              {editingId ? 'СОХРАНИТЬ' : 'ДОБАВИТЬ'}
            </button>
            <button className="btn-ghost btn-ghost-sm" onClick={resetForm}>ОТМЕНА</button>
          </div>
        </Modal>
      )}

      <div className="card-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredBooks.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '48px', marginBottom: '12px' }}>📚</p>
            <p className="micro-cap" style={{ marginBottom: '4px' }}>НЕТ КНИГ В ЭТОМ РАЗДЕЛЕ</p>
          </div>
        ) : (
          filteredBooks.map(b => (
            <BookCard
              key={b.id}
              book={b}
              onEdit={startEdit}
              onDelete={onDelete}
              onStatusChange={(id, status) => onUpdate(id, { status, completedAt: status === 'completed' ? new Date().toISOString() : null })}
            />
          ))
        )}
      </div>
    </section>
  );
}
