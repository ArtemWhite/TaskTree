import React, { useState } from 'react';
import type { PomodoroSession } from '../../types';
import PomodoroHistoryModal from '../common/PomodoroHistoryModal';
import Modal from '../common/Modal';

export interface PopupItem {
  taskId?: string;
  title: string;
  date: string;
  xp: number;
  pomodoro: number;
  duration?: number;
}

export interface PopupData {
  emoji: string;
  name: string;
  color: string;
  xp: number;
  items: PopupItem[];
}

interface AnalyticsPopupModalProps {
  popupData: PopupData;
  pomodoroHistory?: PomodoroSession[];
  onClose: () => void;
}

export const AnalyticsPopupModal: React.FC<AnalyticsPopupModalProps> = ({ popupData, pomodoroHistory = [], onClose }) => {
  const [popupSort, setPopupSort] = useState<'date' | 'xp'>('date');
  const [popupSortDir, setPopupSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedPomodoroItem, setSelectedPomodoroItem] = useState<PopupItem | null>(null);

  const sortedItems = [...popupData.items].sort((a, b) => {
    const dir = popupSortDir === 'asc' ? 1 : -1;
    return popupSort === 'date' ? dir * a.date.localeCompare(b.date) : dir * (a.xp - b.xp);
  });

  return (
    <Modal onClose={onClose} contentStyle={{ maxWidth: '480px', outline: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 className="micro-cap" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{popupData.emoji}</span>
          <span style={{ color: popupData.color }}>{popupData.name}</span>
        </h3>
        <button className="btn-ghost btn-ghost-xs" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="card-panel" style={{ padding: '12px 16px', marginBottom: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, color: popupData.color }}>
          +{popupData.xp} XP
        </div>
        <div className="micro-cap" style={{ marginTop: '4px' }}>
          ОПЫТА
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-soft)' }}>
          Задач: <strong>{popupData.items.length}</strong>
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            className="btn-ghost btn-ghost-xs"
            style={{ background: popupSort === 'date' ? 'var(--ghost-hover)' : 'transparent', outline: 'none' }}
            onClick={() => setPopupSort('date')}
          >
            ПО ДАТЕ
          </button>
          <button
            className="btn-ghost btn-ghost-xs"
            style={{ background: popupSort === 'xp' ? 'var(--ghost-hover)' : 'transparent', outline: 'none' }}
            onClick={() => setPopupSort('xp')}
          >
            ПО XP
          </button>
          <button
            className="btn-ghost btn-ghost-xs"
            style={{ outline: 'none', fontSize: '14px', padding: '2px 6px' }}
            onClick={() => setPopupSortDir(d => (d === 'asc' ? 'desc' : 'asc'))}
            title={popupSortDir === 'asc' ? 'По возрастанию' : 'По убыванию'}
          >
            {popupSortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '260px', overflowY: 'auto' }}>
        {sortedItems.map((item, i) => (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              background: 'var(--surface-hover)',
              borderRadius: '4px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              borderLeft: `3px solid ${popupData.color}`,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{item.title}</div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-soft)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{new Date(item.date).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span>+{item.xp} XP</span>
              {item.pomodoro > 0 && (
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#ffb7c5',
                    fontWeight: 600,
                    background: 'rgba(255, 183, 197, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 183, 197, 0.2)',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setSelectedPomodoroItem(item)}
                  title="Посмотреть историю помодоро"
                >
                  🍅 ×{item.pomodoro}
                </span>
              )}
              {item.duration !== undefined && item.duration > 0 && <span>⏱ {item.duration} мин</span>}
            </div>
          </div>
        ))}
      </div>

      <button className="btn-ghost btn-ghost-sm" style={{ marginTop: '20px', width: '100%', outline: 'none' }} onClick={onClose}>
        ЗАКРЫТЬ
      </button>

      {selectedPomodoroItem && (
        <PomodoroHistoryModal
          title={selectedPomodoroItem.title}
          sessions={pomodoroHistory.filter(p =>
            selectedPomodoroItem.taskId ? p.taskId === selectedPomodoroItem.taskId : p.taskTitle === selectedPomodoroItem.title
          )}
          onClose={() => setSelectedPomodoroItem(null)}
        />
      )}
    </Modal>
  );
};
